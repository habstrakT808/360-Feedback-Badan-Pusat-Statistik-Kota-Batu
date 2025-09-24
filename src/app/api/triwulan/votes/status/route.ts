import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const periodId = searchParams.get('periodId') || ''
    if (!periodId) return NextResponse.json({ requiredCount: 0, completedCount: 0, completedUserIds: [] })
    const rows = await prisma.$queryRaw<any[]>`
      SELECT voter_id FROM public.triwulan_vote_completion WHERE period_id = ${periodId}
    `
    const completedUserIds = rows.map(r => r.voter_id as string)
    const totalProfiles = await prisma.profile.count()
    const requiredCount = totalProfiles
    const completedCount = completedUserIds.length
    return NextResponse.json({ requiredCount, completedCount, completedUserIds })
  } catch (e: any) {
    return NextResponse.json({ requiredCount: 0, completedCount: 0, completedUserIds: [] })
  }
}


