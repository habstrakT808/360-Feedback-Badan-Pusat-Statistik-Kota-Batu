import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

async function ensureTables() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS public.triwulan_ratings (
      period_id text NOT NULL,
      rater_id uuid NOT NULL,
      candidate_id uuid NOT NULL,
      scores numeric[] NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT triwulan_ratings_pkey PRIMARY KEY (period_id, rater_id, candidate_id)
    );
  `)
  await prisma.$executeRawUnsafe(`
    CREATE OR REPLACE FUNCTION public.set_updated_at()
    RETURNS trigger AS $$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END; $$ LANGUAGE plpgsql;
  `)
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON c.oid = t.tgrelid
        WHERE t.tgname = 'tr_set_updated_at' AND c.relname = 'triwulan_ratings'
      ) THEN
        CREATE TRIGGER tr_set_updated_at
        BEFORE UPDATE ON public.triwulan_ratings
        FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
      END IF;
    END$$;
  `)
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const periodId = searchParams.get('periodId') || ''
    const raterId = searchParams.get('raterId') || ''
    const candidateId = searchParams.get('candidateId') || ''
    const map = searchParams.get('map') === '1'

    await ensureTables()

    if (map && periodId && raterId) {
      const rows = await prisma.$queryRaw<any[]>`
        SELECT candidate_id, scores FROM public.triwulan_ratings
        WHERE period_id = ${periodId} AND rater_id = ${raterId}::uuid
      `
      const obj: Record<string, number[]> = {}
      rows.forEach((r: { candidate_id: string; scores: number[] }) => {
        obj[r.candidate_id] = r.scores as any
      })
      return NextResponse.json({ map: obj })
    }

    if (periodId && raterId && candidateId) {
      const rows = await prisma.$queryRaw<any[]>`
        SELECT scores FROM public.triwulan_ratings
        WHERE period_id = ${periodId} AND rater_id = ${raterId}::uuid AND candidate_id = ${candidateId}::uuid
        LIMIT 1
      `
      return NextResponse.json({ scores: rows?.[0]?.scores || null })
    }
    return NextResponse.json({})
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { periodId, raterId, candidateId, scores } = await request.json()
    if (!periodId || !raterId || !candidateId || !Array.isArray(scores) || scores.length !== 13) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }
    await ensureTables()
    await prisma.$executeRawUnsafe(`
      INSERT INTO public.triwulan_ratings (period_id, rater_id, candidate_id, scores)
      VALUES ($1, $2::uuid, $3::uuid, $4)
      ON CONFLICT (period_id, rater_id, candidate_id)
      DO UPDATE SET scores = EXCLUDED.scores, updated_at = now();
    `, periodId, raterId, candidateId, scores)
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to save ratings' }, { status: 500 })
  }
}


