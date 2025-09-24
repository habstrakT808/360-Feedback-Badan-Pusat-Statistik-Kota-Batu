import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { RolesService } from '@/lib/roles-service'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json(null, { status: 200 })
    const { searchParams } = new URL(request.url)
    const userIdParam = searchParams.get('userId')

    let assesseeId = userIdParam || null
    if (!assesseeId) {
      const me = await prisma.profile.findUnique({ where: { email: session.user.email as string } })
      assesseeId = me?.id || null
    }
    if (!assesseeId) return NextResponse.json(null, { status: 200 })

    const feedbackData = await prisma.feedbackResponse.findMany({
      where: { assignment: { assessee_id: assesseeId } },
      include: { assignment: { include: { period: true } } },
      orderBy: { created_at: 'desc' },
    })
    if (!feedbackData || feedbackData.length === 0) return NextResponse.json(null, { status: 200 })

    const { supervisorIds } = await RolesService.getRoleUserIds()

    const aspectGroups = feedbackData.reduce((groups: any, item: any) => {
      const aspectId = item.aspect
      if (!groups[aspectId]) {
        groups[aspectId] = { supervisorRatings: [], peerRatings: [], allAssessors: new Set<string>() }
      }
      const assessorId: string = item?.assignment?.assessor_id
      groups[aspectId].allAssessors.add(assessorId)
      if (supervisorIds.includes(assessorId)) groups[aspectId].supervisorRatings.push(item.rating)
      else groups[aspectId].peerRatings.push(item.rating)
      return groups
    }, {} as Record<string, any>)

    const aspectResults = Object.entries(aspectGroups).map(([aspectId, data]: [string, any]) => {
      const supervisorAvg = data.supervisorRatings.length > 0 ? data.supervisorRatings.reduce((s: number, r: number) => s + r, 0) / data.supervisorRatings.length : null
      const peerAvg = data.peerRatings.length > 0 ? data.peerRatings.reduce((s: number, r: number) => s + r, 0) / data.peerRatings.length : null
      let finalScore = null as number | null
      if (supervisorAvg !== null || peerAvg !== null) finalScore = supervisorAvg !== null && peerAvg !== null ? supervisorAvg * 0.6 + peerAvg * 0.4 : (supervisorAvg ?? peerAvg)
      return { aspect: aspectId, supervisorAverage: supervisorAvg, peerAverage: peerAvg, finalScore, totalFeedback: (data.allAssessors as Set<string>).size, hasSupervisorAssessment: data.supervisorRatings.length > 0, hasPeerAssessment: data.peerRatings.length > 0 }
    })

    const valid = aspectResults.filter((a: any) => a.finalScore !== null)
    const overallScore = valid.length > 0 ? valid.reduce((sum: number, a: any) => sum + (a.finalScore || 0), 0) / valid.length : 0

    const supervisorIdsSet = new Set<string>()
    const peerIdsSet = new Set<string>()
    for (const f of feedbackData as any[]) {
      const assessorId: string = f?.assignment?.assessor_id
      if (supervisorIds.includes(assessorId)) supervisorIdsSet.add(assessorId)
      else peerIdsSet.add(assessorId)
    }

    return NextResponse.json({
      aspectResults,
      overallScore,
      totalFeedback: feedbackData.length,
      supervisorFeedbackCount: supervisorIdsSet.size,
      peerFeedbackCount: peerIdsSet.size,
      hasSupervisorAssessment: supervisorIdsSet.size > 0,
      hasPeerAssessment: peerIdsSet.size > 0,
      periodInfo: feedbackData[0]?.assignment?.period,
    })
  } catch (e: any) {
    return NextResponse.json(null, { status: 200 })
  }
}


