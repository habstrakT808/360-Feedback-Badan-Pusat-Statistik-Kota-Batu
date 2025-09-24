import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { pinId } = await request.json().catch(() => ({}))
    if (!pinId || typeof pinId !== 'string') {
      return NextResponse.json({ error: 'pinId required' }, { status: 400 })
    }

    const prof = await prisma.profile.findUnique({ where: { email: session.user.email as string } })
    if (!prof?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const pin = await prisma.employeePin.findUnique({ where: { id: pinId } })
    if (!pin) return NextResponse.json({ error: 'Pin not found' }, { status: 404 })
    if (pin.giver_id !== prof.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const givenAt = new Date(pin.given_at)

    // Determine month/year for allowance: prefer configured period that covers the given date; fallback to calendar month
    const coveringPeriod = await prisma.pinPeriod.findFirst({
      where: {
        start_date: { lte: givenAt },
        end_date: { gte: givenAt },
      },
    })
    const month = coveringPeriod?.month ?? (givenAt.getUTCMonth() + 1)
    const year = coveringPeriod?.year ?? givenAt.getUTCFullYear()

    const result = await prisma.$transaction(async (tx) => {
      await tx.employeePin.delete({ where: { id: pinId } })

      // Ensure allowance row
      const existing = await tx.monthlyPinAllowance.findFirst({
        where: { user_id: prof.id, month, year },
      })
      if (!existing) {
        const created = await tx.monthlyPinAllowance.create({
          data: { user_id: prof.id, month, year, pins_remaining: 5, pins_used: 0 },
        })
        return { pins_remaining: created.pins_remaining }
      }

      const updated = await tx.monthlyPinAllowance.update({
        where: { id: existing.id },
        data: { pins_remaining: Math.max(0, existing.pins_remaining + 1), pins_used: Math.max(0, existing.pins_used - 1) },
      })
      return { pins_remaining: updated.pins_remaining }
    })

    return NextResponse.json({ success: true, allowance: { pins_remaining: result.pins_remaining } })
  } catch (e: any) {
    console.error('cancel pin error:', e)
    return NextResponse.json({ error: 'Failed to cancel pin' }, { status: 500 })
  }
}


