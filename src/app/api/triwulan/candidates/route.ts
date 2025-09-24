import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

async function tableExists(): Promise<boolean> {
  try {
    const rows = await prisma.$queryRaw<any[]>`
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'triwulan_monthly_deficiencies'
      LIMIT 1
    `
    return Array.isArray(rows) && rows.length > 0
  } catch {
    return false
  }
}

// GET /api/triwulan/candidates?periodId=YYYY-Qn
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const periodId = searchParams.get('periodId') || ''
    if (!periodId) return NextResponse.json({ candidates: [] })

    if (!(await tableExists())) {
      return NextResponse.json({ candidates: [] })
    }

    // Candidates are users whose total deficiency_hours for this triwulan period equals 0
    const rows = await prisma.$queryRaw<any[]>`
      SELECT user_id
      FROM public.triwulan_monthly_deficiencies
      WHERE period_id = ${periodId}
      GROUP BY user_id
      HAVING COALESCE(SUM(deficiency_hours), 0) = 0
    `

    const candidates = Array.isArray(rows)
      ? rows
          .map((r) => ({ user_id: r.user_id as string }))
          .filter((c) => !!c.user_id)
      : []

    return NextResponse.json({ candidates })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to load candidates' }, { status: 500 })
  }
}


