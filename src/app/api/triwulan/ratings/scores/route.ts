import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const periodId = searchParams.get('periodId') || ''
    if (!periodId) return NextResponse.json({ scores: [] })

    const rows = await prisma.$queryRaw<any[]>`
      SELECT candidate_id,
             AVG(x)::float AS avg_score,
             COUNT(*) AS num_raters,
             SUM(x)::float AS total
      FROM (
        SELECT candidate_id, unnest(scores)::numeric AS x
        FROM public.triwulan_ratings
        WHERE period_id = ${periodId}
      ) s
      GROUP BY candidate_id
    `

    const scores = rows.map((r: { candidate_id: string; total?: number; num_raters?: number; avg_score?: number }) => ({
      candidate_id: r.candidate_id as string,
      total_score: Number(r.total || 0),
      num_raters: Number(r.num_raters || 0),
      score_percent: Math.max(0, Math.min(100, Number(r.avg_score || 0) / 5 * 100))
    }))

    return NextResponse.json({ scores })
  } catch (e: any) {
    return NextResponse.json({ scores: [] })
  }
}


