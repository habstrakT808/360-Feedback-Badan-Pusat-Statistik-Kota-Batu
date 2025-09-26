import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { RolesService } from '@/lib/roles-service'

export async function GET() {
  try {
    const { adminIds, supervisorIds } = await RolesService.getRoleUserIds()

    const activePeriod = await prisma.assessmentPeriod.findFirst({
      where: { is_active: true }
    })

    const allProfiles: Array<{ id: string | null }> = await prisma.profile.findMany({ select: { id: true } })
    const eligibleUserIds = allProfiles
      .map((p: { id: string | null }) => p.id)
      .filter((id): id is string => !!id && !adminIds.includes(id) && !supervisorIds.includes(id))

    const totalEligibleUsers = eligibleUserIds.length

    let periodAssignments: Array<{ assessor_id: string | null; assessee_id: string | null; is_completed: boolean | null }>
      = []
    if (activePeriod?.id) {
      periodAssignments = await prisma.assessmentAssignment.findMany({
        where: { period_id: activePeriod.id },
        select: { assessor_id: true, assessee_id: true, is_completed: true }
      })
    }

    const peerAssignments = periodAssignments.filter(
      (a) =>
        !!a.assessor_id &&
        !!a.assessee_id &&
        !adminIds.includes(a.assessor_id) &&
        !supervisorIds.includes(a.assessor_id) &&
        !adminIds.includes(a.assessee_id)
    )

    const assessorToCompletedCount = new Map<string, number>()
    for (const a of peerAssignments) {
      if (a.is_completed && a.assessor_id) {
        const prev = assessorToCompletedCount.get(a.assessor_id) || 0
        assessorToCompletedCount.set(a.assessor_id, prev + 1)
      }
    }

    const usersCompletedAllFive = eligibleUserIds.filter(
      (uid) => (assessorToCompletedCount.get(uid) || 0) >= 5
    ).length

    const pendingUsers = Math.max(0, totalEligibleUsers - usersCompletedAllFive)
    const completionRate = totalEligibleUsers > 0 ? Math.round((usersCompletedAllFive / totalEligibleUsers) * 100) : 0

    const totalUsers = await prisma.profile.count()
    const totalPeriods = await prisma.assessmentPeriod.count()

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers: totalUsers - adminIds.length,
        totalPeriods,
        totalAssignments: totalEligibleUsers,
        completedAssignments: usersCompletedAllFive,
        pendingAssignments: pendingUsers,
        completionRate
      }
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to load stats' },
      { status: 500 }
    )
  }
}


