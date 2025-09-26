import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const periodId = searchParams.get('periodId') || ''
    if (!periodId) return NextResponse.json({ requiredCount: 0, completedCount: 0, completedUserIds: [] })

    const ratingRows = await prisma.$queryRaw<any[]>`
      SELECT rater_id, COUNT(*) FILTER (WHERE array_length(scores, 1) = 13) AS cnt
      FROM public.triwulan_ratings
      WHERE period_id = ${periodId}
      GROUP BY rater_id
    `
    const completedUserIds = ratingRows
      .filter((r: { cnt: number; rater_id: string }) => Number(r.cnt) > 0)
      .map((r: { rater_id: string }) => r.rater_id as string)
    // requiredCount: total employees minus admins (approximate via profiles count)
    const totalProfiles = await prisma.profile.count()
    const requiredCount = totalProfiles
    const completedCount = completedUserIds.length
    return NextResponse.json({ requiredCount, completedCount, completedUserIds })
  } catch (e: any) {
    return NextResponse.json({ requiredCount: 0, completedCount: 0, completedUserIds: [] })
  }
}


