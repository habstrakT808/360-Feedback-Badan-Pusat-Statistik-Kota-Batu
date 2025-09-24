import { NextRequest, NextResponse } from 'next/server'
import { SupervisorService } from '@/lib/supervisor-service'
import { RolesService } from '@/lib/roles-service'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const periodId = searchParams.get('periodId') || undefined

    // Resolve target period
    let targetPeriodId = periodId
    if (!targetPeriodId) {
      const activePeriod = await prisma.assessmentPeriod.findFirst({
        where: { is_active: true },
        select: { id: true }
      })
      if (!activePeriod) {
        return NextResponse.json({ success: false, error: 'No active period found' }, { status: 400 })
      }
      targetPeriodId = activePeriod.id
    }

    // Roles lookup with env overrides
    const { supervisorIds: allSupervisorIds, adminIds } = await RolesService.getRoleUserIds()
    const allRestrictedIds = Array.from(new Set([...allSupervisorIds, ...adminIds]))

    // Fetch feedback responses with joins using Prisma
    const feedbackData = await prisma.feedbackResponse.findMany({
      where: {
        assignment: {
          period_id: targetPeriodId
        }
      },
      include: {
        assignment: {
          include: {
            assessor: {
              select: {
                id: true,
                full_name: true,
                email: true,
                position: true,
                department: true,
                avatar_url: true
              }
            },
            assessee: {
              select: {
                id: true,
                full_name: true,
                email: true,
                position: true,
                department: true,
                avatar_url: true
              }
            }
          }
        }
      }
    })

    const results = SupervisorService.processFeedbackData(
      feedbackData || [],
      allSupervisorIds,
      allRestrictedIds
    )

    return NextResponse.json({ success: true, results })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch team results' }, { status: 500 })
  }
}
