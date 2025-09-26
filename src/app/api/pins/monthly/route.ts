import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const month = Number(searchParams.get('month')) || new Date().getMonth() + 1
  const year = Number(searchParams.get('year')) || new Date().getFullYear()

  // Use pin period for the given month/year if exists to filter by date range
  const period = await prisma.pinPeriod.findFirst({ where: { month, year } })

  let pins: { receiver_id: string | null }[] = []
  if (period) {
    pins = await prisma.employeePin.findMany({
      where: {
        created_at: {
          gte: period.start_date,
          lte: period.end_date,
        },
      },
      select: { receiver_id: true },
    })
  } else {
    // No period → return empty
    return NextResponse.json([])
  }

  const counts = new Map<string, number>()
  for (const p of pins) if (p.receiver_id) counts.set(p.receiver_id, (counts.get(p.receiver_id) || 0) + 1)

  if (counts.size === 0) return NextResponse.json([])
  const ids = Array.from(counts.keys())
  const profiles = await prisma.profile.findMany({ where: { id: { in: ids } }, select: { id: true, full_name: true, avatar_url: true } })

  type Ranking = { user_id: string; full_name: string | null; avatar_url?: string; pin_count: number }
  const rankings: Ranking[] = profiles.map((u: { id: string; full_name: string | null; avatar_url: string | null }) => ({
    user_id: u.id,
    full_name: u.full_name,
    avatar_url: u.avatar_url ?? undefined,
    pin_count: counts.get(u.id) || 0,
  }))
  rankings.sort((a: { pin_count: number; full_name: string | null }, b: { pin_count: number; full_name: string | null }) => {
    const diff = b.pin_count - a.pin_count
    if (diff !== 0) return diff
    const an = a.full_name || ''
    const bn = b.full_name || ''
    return an.localeCompare(bn)
  })
  const ranked = rankings.map((r: Ranking, i: number) => ({ ...r, rank: i + 1 }))
  return NextResponse.json(ranked)
}


