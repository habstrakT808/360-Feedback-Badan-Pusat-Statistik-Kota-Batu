import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

async function ensureTables() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS public.triwulan_votes (
      period_id text NOT NULL,
      voter_id uuid NOT NULL,
      candidate_id uuid NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT triwulan_votes_pkey PRIMARY KEY (period_id, voter_id, candidate_id)
    );
  `)
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS public.triwulan_vote_completion (
      period_id text NOT NULL,
      voter_id uuid NOT NULL,
      completed_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT triwulan_vote_completion_pkey PRIMARY KEY (period_id, voter_id)
    );
  `)
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const periodId = searchParams.get('periodId') || ''
    const voterId = searchParams.get('voterId') || ''
    const check = searchParams.get('check') === '1'
    await ensureTables()
    if (check && periodId && voterId) {
      const rows = await prisma.$queryRaw<any[]>`
        SELECT 1 FROM public.triwulan_vote_completion
        WHERE period_id = ${periodId} AND voter_id = ${voterId}::uuid
        LIMIT 1
      `
      return NextResponse.json({ completed: rows.length > 0 })
    }
    if (periodId && voterId) {
      const rows = await prisma.$queryRaw<any[]>`
        SELECT candidate_id FROM public.triwulan_votes
        WHERE period_id = ${periodId} AND voter_id = ${voterId}::uuid
      `
      return NextResponse.json({ votes: rows.map(r => r.candidate_id) })
    }
    return NextResponse.json({ votes: [] })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const complete = searchParams.get('complete') === '1'
    const body = await request.json()
    await ensureTables()
    if (complete) {
      const { periodId, voterId } = body || {}
      if (!periodId || !voterId) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
      await prisma.$executeRawUnsafe(`
        INSERT INTO public.triwulan_vote_completion (period_id, voter_id)
        VALUES ($1, $2::uuid)
        ON CONFLICT (period_id, voter_id) DO NOTHING;
      `, body.periodId, body.voterId)
      return NextResponse.json({ success: true })
    }
    const { periodId, voterId, candidateIds } = body || {}
    if (!periodId || !voterId || !Array.isArray(candidateIds) || candidateIds.length === 0) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }
    // Clear previous votes then insert
    await prisma.$executeRawUnsafe(`
      DELETE FROM public.triwulan_votes WHERE period_id = $1 AND voter_id = $2::uuid;
    `, periodId, voterId)
    for (const cid of candidateIds) {
      await prisma.$executeRawUnsafe(`
        INSERT INTO public.triwulan_votes (period_id, voter_id, candidate_id)
        VALUES ($1, $2::uuid, $3::uuid)
        ON CONFLICT (period_id, voter_id, candidate_id) DO NOTHING;
      `, periodId, voterId, cid)
    }
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to save votes' }, { status: 500 })
  }
}


