import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ ids: [] }, { status: 200 })

    const { searchParams } = new URL(request.url)
    const periodIdParam = searchParams.get('periodId')

    const me = await prisma.profile.findUnique({ where: { email: session.user.email as string } })
    if (!me?.id) return NextResponse.json({ ids: [] }, { status: 200 })

    let periodId = periodIdParam || null
    if (!periodId) {
      const active = await prisma.assessmentPeriod.findFirst({ where: { is_active: true }, select: { id: true } })
      periodId = active?.id || null
    }
    if (!periodId) return NextResponse.json({ ids: [] }, { status: 200 })

    const assignments = await prisma.assessmentAssignment.findMany({
      where: { assessor_id: me.id, period_id: periodId as string },
      select: { id: true, assessee_id: true, is_completed: true },
    })

    const assignmentIds = assignments.map(a => a.id)
    let countsByAssignment = new Map<string, number>()
    if (assignmentIds.length > 0) {
      const grouped = await prisma.feedbackResponse.groupBy({
        by: ['assignment_id'],
        where: { assignment_id: { in: assignmentIds } },
        _count: { _all: true },
      })
      grouped.forEach(g => countsByAssignment.set(g.assignment_id as string, (g._count?._all as number) || 0))
    }

    const ids = assignments
      .filter(a => a.is_completed || (countsByAssignment.get(a.id) || 0) > 0)
      .map(a => a.assessee_id)
      .filter((v): v is string => !!v)
    return NextResponse.json({ ids })
  } catch (e: any) {
    console.error('Error in supervisor/assessed:', e)
    return NextResponse.json({ ids: [] }, { status: 200 })
  }
}


