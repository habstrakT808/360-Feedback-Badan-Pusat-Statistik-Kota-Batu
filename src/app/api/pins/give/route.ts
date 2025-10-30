import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const prof = await prisma.profile.findUnique({ where: { email: session.user.email as string } })
  const giverId = prof?.id
  if (!giverId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { receiverId } = await request.json()
  if (!receiverId || typeof receiverId !== 'string') {
    return NextResponse.json({ error: 'receiverId required' }, { status: 400 })
  }

  // Find active pin period
  const active = await prisma.pinPeriod.findFirst({ where: { is_active: true } })
  if (!active) return NextResponse.json({ error: 'No active pin period' }, { status: 400 })

  const today = todayISO()
  if (!(today >= active.start_date.toISOString().slice(0, 10) && today <= active.end_date.toISOString().slice(0, 10))) {
    return NextResponse.json({ error: 'Out of active period range' }, { status: 400 })
  }

  // Enforce allowance per active period by counting existing given pins in window
  const start = new Date(active.start_date)
  const endPlusOne = new Date(new Date(active.end_date).getTime() + 24*60*60*1000)

  const alreadyUsed = await prisma.employeePin.count({
    where: {
      giver_id: giverId,
      given_at: { gte: start, lt: endPlusOne },
    },
  })

  if (alreadyUsed >= 4) {
    return NextResponse.json({ error: 'No pins remaining' }, { status: 400 })
  }

  const month = active.month ?? new Date().getMonth() + 1
  const year = active.year ?? new Date().getFullYear()

  try {
    await prisma.employeePin.create({
      data: {
        giver_id: giverId,
        receiver_id: receiverId,
        week_number: getWeekNumber(new Date()),
        month,
        year,
      },
    })

    const usedNow = alreadyUsed + 1
    return NextResponse.json({ success: true, allowance: { pins_remaining: Math.max(0, 4 - usedNow), pins_used: usedNow } })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to give pin' }, { status: 400 })
  }
}

function getWeekNumber(date: Date) {
  const startOfYear = new Date(date.getFullYear(), 0, 1)
  const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)) + 1
  const startDay = startOfYear.getDay()
  const adjustedStartDay = startDay === 0 ? 7 : startDay
  return Math.ceil((dayOfYear + adjustedStartDay - 2) / 7)
}


