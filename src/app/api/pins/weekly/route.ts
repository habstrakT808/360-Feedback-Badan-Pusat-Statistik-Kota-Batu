import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function getWeekNumber(date: Date) {
  const startOfYear = new Date(date.getFullYear(), 0, 1)
  const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)) + 1
  const startDay = startOfYear.getDay()
  const adjustedStartDay = startDay === 0 ? 7 : startDay
  return Math.ceil((dayOfYear + adjustedStartDay - 2) / 7)
}

export async function GET() {
  const now = new Date()
  const week = getWeekNumber(now)
  const year = now.getFullYear()

  const pins = await prisma.employeePin.findMany({
    where: { week_number: week, year },
    select: { receiver_id: true },
  })

  if (pins.length === 0) return NextResponse.json([])

  const counts = new Map<string, number>()
  for (const p of pins) counts.set(p.receiver_id!, (counts.get(p.receiver_id!) || 0) + 1)

  const receiverIds = Array.from(counts.keys())
  const profiles = await prisma.profile.findMany({
    where: { id: { in: receiverIds } },
    select: { id: true, full_name: true, avatar_url: true },
  })

  const rankings = profiles.map((u: { id: string; full_name: string | null; avatar_url: string | null }) => ({
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
  const ranked = rankings.map((r: { user_id: string; full_name: string | null; avatar_url?: string; pin_count: number }, i: number) => ({ ...r, rank: i + 1 }))
  return NextResponse.json(ranked)
}


