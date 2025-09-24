import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json([], { status: 200 })
    const { searchParams } = new URL(request.url)
    const assesseeId = searchParams.get('assesseeId')
    const periodIdParam = searchParams.get('periodId')
    if (!assesseeId) return NextResponse.json([], { status: 200 })

    const me = await prisma.profile.findUnique({ where: { email: session.user.email as string } })
    if (!me?.id) return NextResponse.json([], { status: 200 })

    let periodId = periodIdParam || null
    if (!periodId) {
      const active = await prisma.assessmentPeriod.findFirst({ where: { is_active: true }, select: { id: true } })
      periodId = active?.id || null
    }
    if (!periodId) return NextResponse.json([], { status: 200 })

    const assignment = await prisma.assessmentAssignment.findFirst({
      where: { assessor_id: me.id, assessee_id: assesseeId, period_id: periodId },
      select: { id: true },
    })
    if (!assignment?.id) return NextResponse.json([], { status: 200 })

    const responses = await prisma.feedbackResponse.findMany({
      where: { assignment_id: assignment.id },
      orderBy: { created_at: 'asc' },
    })
    return NextResponse.json(responses)
  } catch (e: any) {
    console.error('Error in supervisor/existing:', e)
    return NextResponse.json([], { status: 200 })
  }
}


