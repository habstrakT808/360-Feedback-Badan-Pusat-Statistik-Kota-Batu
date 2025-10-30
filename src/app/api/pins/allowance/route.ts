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

  // Use active pin period; if none, fallback to current month but still compute by counting pins in month
  const active = await prisma.pinPeriod.findFirst({ where: { is_active: true } })

  // Compute date window
  const start = active ? new Date(active.start_date) : new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  const endPlusOne = active
    ? new Date(new Date(active.end_date).getTime() + 24*60*60*1000)
    : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)

  // Count pins given by this user in the window
  const used = await prisma.employeePin.count({
    where: {
      giver_id: profileId,
      given_at: { gte: start, lt: endPlusOne },
    },
  })

  const remaining = Math.max(0, 4 - used)

  const periodMonth = active?.month ?? nowMonthYear().month
  const periodYear = active?.year ?? nowMonthYear().year

  return NextResponse.json({
    allowance: {
      user_id: profileId,
      month: periodMonth,
      year: periodYear,
      pins_remaining: remaining,
      pins_used: used,
    },
  })
}


