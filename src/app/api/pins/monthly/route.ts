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

  const rankings = profiles.map((u) => ({
    user_id: u.id,
    full_name: u.full_name,
    avatar_url: u.avatar_url ?? undefined,
    pin_count: counts.get(u.id) || 0,
  }))
  rankings.sort((a, b) => b.pin_count - a.pin_count || a.full_name.localeCompare(b.full_name))
  const ranked = rankings.map((r, i) => ({ ...r, rank: i + 1 }))
  return NextResponse.json(ranked)
}


