import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || ''
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

    // Resolve requester profile
    const requester = await prisma.profile.findUnique({ where: { email: session.user.email as string } })
    const requesterRole = requester
      ? await prisma.userRole.findFirst({ where: { user_id: requester.id } })
      : null
    const isAdmin = requesterRole?.role === 'admin'
    const isSupervisor = requesterRole?.role === 'supervisor'

    // Resolve target profile (supports Profile.id or User.id)
    let profile = await prisma.profile.findUnique({ where: { id: userId } })
    if (!profile) {
      const user = await prisma.user.findUnique({ where: { id: userId } })
      if (user?.email) profile = await prisma.profile.findUnique({ where: { email: user.email } }) || null as any
    }
    if (!profile) return NextResponse.json({ error: 'Not Found' }, { status: 404 })

    const isSelf = requester?.id === profile.id
    const isPublic = !!profile.allow_public_view
    if (!isSelf && !isAdmin && !isSupervisor && !isPublic) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Determine target period (active)
    const currentPeriod = await prisma.assessmentPeriod.findFirst({ where: { is_active: true } })
    if (!currentPeriod) return NextResponse.json({ performance: null })

    // Feedback responses for this assessee in current period
    const feedbackData = await prisma.feedbackResponse.findMany({
      where: { assignment: { assessee_id: profile.id, period_id: currentPeriod.id } },
      include: { assignment: { select: { assessor_id: true } } },
    })

    // Distinct assessors who provided any feedback
    type FeedbackWithAssessor = { rating: number; assignment: { assessor_id: string | null } }
    const assessorIds = Array.from(
      new Set(
        (feedbackData as FeedbackWithAssessor[])
          .map((f: FeedbackWithAssessor) => f.assignment.assessor_id)
          .filter((id: string | null): id is string => !!id)
      )
    )

    // Lookup roles for these assessors to separate supervisor vs peer
    const assessorRoles: Array<{ user_id: string | null; role: string | null }> = await prisma.userRole.findMany({ where: { user_id: { in: assessorIds } } })
    const supervisorSet = new Set(
      assessorRoles.filter((r: { role: string | null }) => r.role === 'supervisor').map((r: { user_id: string | null }) => r.user_id as string)
    )

    const supervisorRatings = (feedbackData as FeedbackWithAssessor[])
      .filter((f: FeedbackWithAssessor) => supervisorSet.has(f.assignment.assessor_id as string))
      .map((f: FeedbackWithAssessor) => f.rating)
    const peerRatings = (feedbackData as FeedbackWithAssessor[])
      .filter((f: FeedbackWithAssessor) => !supervisorSet.has(f.assignment.assessor_id as string))
      .map((f: FeedbackWithAssessor) => f.rating)

    const supAvg = supervisorRatings.length > 0 ? supervisorRatings.reduce((s, r) => s + r, 0) / supervisorRatings.length : 0
    const peerAvg = peerRatings.length > 0 ? peerRatings.reduce((s, r) => s + r, 0) / peerRatings.length : 0
    const averageRating = (0.6 * supAvg) + (0.4 * peerAvg)
    const totalFeedback = assessorIds.length

    // Assignments where profile is assessor in period
    const assessorAssignments: Array<{ is_completed: boolean }> = await prisma.assessmentAssignment.findMany({
      where: { assessor_id: profile.id, period_id: currentPeriod.id },
      select: { is_completed: true },
    })
    const completedAssessments = assessorAssignments.filter((a: { is_completed: boolean }) => a.is_completed).length
    const maxAssignments = assessorAssignments.length
    const periodProgress = maxAssignments > 0 ? (completedAssessments / maxAssignments) * 100 : 0

    // Total employees (exclude admins)
    const adminIds = (await prisma.userRole.findMany({ where: { role: 'admin' }, select: { user_id: true } }))
      .map((r: { user_id: string | null }) => r.user_id)
      .filter((id: string | null): id is string => !!id)
    const totalEmployees = await prisma.profile.count({ where: { id: { notIn: adminIds } } })

    const monthNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']
    const recentScores = [{ period: monthNames[currentPeriod.month - 1], score: averageRating }]

    return NextResponse.json({
      performance: {
        averageRating,
        totalFeedback,
        totalEmployees,
        maxAssignments,
        completedAssessments,
        pendingAssessments: Math.max(0, maxAssignments - completedAssessments),
        periodProgress,
        recentScores,
        strengths: [],
        areasForImprovement: [],
      }
    })
  } catch (e: any) {
    console.error('team performance error:', e)
    return NextResponse.json({ error: 'Failed to load performance' }, { status: 500 })
  }
}


