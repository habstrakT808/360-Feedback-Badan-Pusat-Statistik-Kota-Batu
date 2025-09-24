import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const month = Number(searchParams.get('month'))
  const year = Number(searchParams.get('year'))
  const receiverId = searchParams.get('receiverId') || undefined
  const startQs = searchParams.get('start') || undefined
  const endQs = searchParams.get('end') || undefined

  // Resolve current profile id
  const prof = await prisma.profile.findUnique({ where: { email: session.user.email as string } })
  const currentProfileId = prof?.id
  if (!currentProfileId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Determine date window
  let start: Date | undefined
  let endPlusOne: Date | undefined
  if (startQs && endQs) {
    start = new Date(startQs)
    endPlusOne = new Date(new Date(endQs).getTime() + 24*60*60*1000)
  } else if (!Number.isNaN(month) && !Number.isNaN(year)) {
    const period = await prisma.pinPeriod.findFirst({ where: { month, year } })
    if (period) {
      start = new Date(period.start_date)
      endPlusOne = new Date(new Date(period.end_date).getTime() + 24*60*60*1000)
    }
  } else {
    const active = await prisma.pinPeriod.findFirst({ where: { is_active: true } })
    if (active) {
      start = new Date(active.start_date)
      endPlusOne = new Date(new Date(active.end_date).getTime() + 24*60*60*1000)
    }
  }
  if (!start || !endPlusOne) return NextResponse.json({ pins: [] })

  // Decide whether to return pins given by current user or pins received by specific user
  const whereClause: any = {
    given_at: { gte: start, lt: endPlusOne },
  }
  if (receiverId) {
    whereClause.receiver_id = receiverId
  } else {
    whereClause.giver_id = currentProfileId
  }

  const pins = await prisma.employeePin.findMany({
    where: whereClause,
    orderBy: { given_at: 'desc' },
    select: {
      id: true,
      given_at: true,
      giver_id: true,
      receiver_id: true,
      giver: { select: { id: true, full_name: true, avatar_url: true } },
      receiver: { select: { id: true, full_name: true, avatar_url: true } },
    },
  })

  return NextResponse.json({ pins })
}


