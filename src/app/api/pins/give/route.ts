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

  // Ensure allowance exists
  const allowance = await prisma.monthlyPinAllowance.findFirst({
    where: { user_id: giverId, month: active.month ?? undefined, year: active.year ?? undefined },
  })

  const month = active.month ?? new Date().getMonth() + 1
  const year = active.year ?? new Date().getFullYear()

  try {
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      let current = allowance
      if (!current) {
        current = await tx.monthlyPinAllowance.create({
          data: { user_id: giverId, month, year, pins_remaining: 4, pins_used: 0 },
        })
      }
      if (current.pins_remaining <= 0) throw new Error('No pins remaining')

      await tx.employeePin.create({
        data: {
          giver_id: giverId,
          receiver_id: receiverId,
          week_number: getWeekNumber(new Date()),
          month,
          year,
        },
      })

      const updated = await tx.monthlyPinAllowance.update({
        where: { id: current.id },
        data: { pins_remaining: current.pins_remaining - 1, pins_used: current.pins_used + 1 },
      })
      return updated
    })

    return NextResponse.json({ success: true, allowance: { pins_remaining: result.pins_remaining, pins_used: result.pins_used } })
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


