import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Resolve admin via profile.id from email
    const prof = await prisma.profile.findUnique({ where: { email: session.user.email as string } })
    const role = prof ? await prisma.userRole.findFirst({ where: { user_id: prof.id } }) : null

    if (role?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { id } = await request.json()
    if (!id) return new NextResponse('Missing id', { status: 400 })

    // Load period
    const period = await prisma.pinPeriod.findUnique({ where: { id } })
    if (!period) return new NextResponse('Pin period tidak ditemukan', { status: 404 })

    const targetMonth = period.month ?? new Date(period.start_date).getMonth() + 1
    const targetYear = period.year ?? new Date(period.start_date).getFullYear()

    // Half-open window: [start_date, end_date + 1 day)
    const start = new Date(period.start_date)
    const endPlusOne = new Date(new Date(period.end_date).getTime() + 24*60*60*1000)

    // Delete pins in the period
    const pinsDeleted = await prisma.employeePin.deleteMany({
      where: {
        given_at: {
          gte: start,
          lt: endPlusOne
        }
      }
    })

    // Reset allowances
    const allowancesReset = await prisma.monthlyPinAllowance.updateMany({
      where: {
        month: targetMonth,
        year: targetYear
      },
      data: {
        pins_remaining: 4,
        pins_used: 0
      }
    })

    return NextResponse.json({ 
      pins_deleted: pinsDeleted.count, 
      allowances_reset: allowancesReset.count 
    })
  } catch (e: any) {
    return new NextResponse(e?.message || 'Internal error', { status: 500 })
  }
}


