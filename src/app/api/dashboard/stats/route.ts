import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { RolesService } from '@/lib/roles-service'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    // Resolve current user's profile id via email
    const me = await prisma.profile.findUnique({ where: { email: session.user.email as string } })
    const userId = me?.id as string
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const currentPeriod = await prisma.assessmentPeriod.findFirst({ where: { is_active: true } })
    const { adminIds, supervisorIds } = await RolesService.getRoleUserIds()
    const isSupervisor = supervisorIds.includes(userId)
    const maxAssignments = isSupervisor ? 999 : 5

    const profiles: Array<{ id: string | null }> = await prisma.profile.findMany({ where: { id: { not: userId } }, select: { id: true } })
    const totalEmployees = profiles.filter((p: { id: string | null }) => !adminIds.includes(p.id as string)).length

    if (!currentPeriod) {
      return NextResponse.json({
        success: true,
        stats: {
          totalEmployees,
          completedAssessments: 0,
          pendingAssessments: isSupervisor ? totalEmployees : maxAssignments,
          currentPeriod: 'Tidak ada periode aktif',
          myProgress: 0,
          averageRating: 0,
          myAssignments: [],
          currentPeriodData: null,
          isSupervisor,
          maxAssignments
        }
      })
    }

    const myAssignments: Array<{ assessee_id: string; is_completed: boolean } & { assessee: { id: string; full_name: string | null; username: string | null; position: string | null; department: string | null } }> = await prisma.assessmentAssignment.findMany({
      where: { assessor_id: userId, period_id: currentPeriod.id },
      include: { assessee: { select: { id: true, full_name: true, username: true, position: true, department: true } } }
    })
    const validAssignments = myAssignments.filter((a: { assessee_id: string }) => !adminIds.includes(a.assessee_id))
    const completedAssessments = validAssignments.filter((a: { is_completed: boolean }) => a.is_completed).length
    const pendingAssessments = isSupervisor ? totalEmployees - completedAssessments : Math.max(0, maxAssignments - completedAssessments)
    const totalAssignments = isSupervisor ? totalEmployees : maxAssignments
    const myProgress = totalAssignments > 0 ? Math.round((completedAssessments / totalAssignments) * 100) : 0

    const myFeedback: Array<{ rating: number }> = await prisma.feedbackResponse.findMany({
      where: { assignment: { assessee_id: userId, period_id: currentPeriod.id } },
      select: { rating: true }
    })
    let averageRating = 0
    if (myFeedback.length > 0) {
      const totalRating = myFeedback.reduce((sum: number, f: { rating: number }) => sum + f.rating, 0)
      averageRating = Math.round((totalRating / myFeedback.length) * 10) / 10
    }

    const monthNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']
    const currentPeriodText = `${monthNames[currentPeriod.month - 1]} ${currentPeriod.year}`

    return NextResponse.json({
      success: true,
      stats: {
        totalEmployees,
        completedAssessments,
        pendingAssessments,
        currentPeriod: currentPeriodText,
        myProgress,
        averageRating,
        myAssignments: validAssignments,
        currentPeriodData: currentPeriod,
        isSupervisor,
        maxAssignments
      }
    })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Failed to load dashboard stats' }, { status: 500 })
  }
}


