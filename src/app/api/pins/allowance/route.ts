import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function nowMonthYear() {
  const d = new Date()
  return { month: d.getMonth() + 1, year: d.getFullYear() }
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Resolve current user's profile.id via email (FKs reference profiles.id)
  const prof = await prisma.profile.findUnique({ where: { email: session.user.email as string } })
  const profileId = prof?.id
  if (!profileId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Resolve target month/year using active pin period if exists
  const active = await prisma.pinPeriod.findFirst({ where: { is_active: true } })
  const month = active?.month ?? nowMonthYear().month
  const year = active?.year ?? nowMonthYear().year

  // Upsert monthly allowance
  const existing = await prisma.monthlyPinAllowance.findFirst({
    where: { user_id: profileId, month, year },
  })

  if (!existing) {
    const created = await prisma.monthlyPinAllowance.create({
      data: {
        user_id: profileId,
        month,
        year,
        pins_remaining: 4,
        pins_used: 0,
      },
    })
    return NextResponse.json({ allowance: {
      user_id: created.user_id,
      month: created.month,
      year: created.year,
      pins_remaining: created.pins_remaining,
      pins_used: created.pins_used,
    }})
  }

  return NextResponse.json({ allowance: {
    user_id: existing.user_id,
    month: existing.month,
    year: existing.year,
    pins_remaining: existing.pins_remaining,
    pins_used: existing.pins_used,
  }})
}


