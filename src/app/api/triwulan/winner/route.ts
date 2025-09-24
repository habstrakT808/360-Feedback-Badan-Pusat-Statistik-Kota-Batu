import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

async function ensureTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS public.triwulan_winners (
      period_id text PRIMARY KEY,
      winner_id uuid NOT NULL,
      total_score numeric NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `)
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const periodId = searchParams.get('periodId') || ''
    if (!periodId) return NextResponse.json({ winner: null })
    await ensureTable()
    const rows = await prisma.$queryRaw<any[]>`
      SELECT winner_id, total_score FROM public.triwulan_winners WHERE period_id = ${periodId} LIMIT 1
    `
    return NextResponse.json({ winner: rows?.[0] || null })
  } catch (e: any) {
    return NextResponse.json({ winner: null })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { periodId, winnerId, totalScore } = await request.json()
    if (!periodId || !winnerId) return NextResponse.json({ error: 'Invalid' }, { status: 400 })
    await ensureTable()
    await prisma.$executeRawUnsafe(`
      INSERT INTO public.triwulan_winners (period_id, winner_id, total_score)
      VALUES ($1, $2::uuid, $3)
      ON CONFLICT (period_id) DO UPDATE SET winner_id = EXCLUDED.winner_id, total_score = EXCLUDED.total_score;
    `, periodId, winnerId, totalScore ?? null)
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to set winner' }, { status: 500 })
  }
}


