import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function requireAdminOrSupervisor() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return { ok: false, status: 401 }
  const prof = await prisma.profile.findUnique({ where: { email: session.user.email as string } })
  if (!prof?.id) return { ok: false, status: 401 }
  const role = await prisma.userRole.findFirst({ where: { user_id: prof.id } })
  if (role?.role === 'admin' || role?.role === 'supervisor') return { ok: true }
  return { ok: false, status: 403 }
}

async function deficienciesTableExists(): Promise<boolean> {
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

const DDL_HINT = `Tabel public.triwulan_monthly_deficiencies belum ada. Buat tabel ini terlebih dahulu:

CREATE TABLE IF NOT EXISTS public.triwulan_monthly_deficiencies (
  period_id text NOT NULL,
  user_id uuid NOT NULL,
  year integer NOT NULL,
  month integer NOT NULL,
  deficiency_hours numeric(10,2) NOT NULL DEFAULT 0,
  filled_by uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT triwulan_monthly_deficiencies_pkey PRIMARY KEY (period_id, user_id, year, month)
);

CREATE INDEX IF NOT EXISTS idx_tmd_user_year_month ON public.triwulan_monthly_deficiencies (user_id, year, month);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tmd_set_updated_at ON public.triwulan_monthly_deficiencies;
CREATE TRIGGER tmd_set_updated_at BEFORE UPDATE ON public.triwulan_monthly_deficiencies
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();`

async function ensureDeficienciesTable(): Promise<void> {
  const exists = await deficienciesTableExists()
  if (exists) {
    // Ensure period_id is text for triwulan keys like "2025-Q3"
    try {
      const col = await prisma.$queryRaw<any[]>`
        SELECT data_type FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'triwulan_monthly_deficiencies' AND column_name = 'period_id'
      `
      const type = col?.[0]?.data_type as string | undefined
      if (type && type.toLowerCase().includes('uuid')) {
        await prisma.$executeRawUnsafe(`
          ALTER TABLE public.triwulan_monthly_deficiencies
          ALTER COLUMN period_id TYPE text USING period_id::text;
        `)
      }
    } catch {}
    return
  }
  // Create table and related objects
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS public.triwulan_monthly_deficiencies (
      period_id text NOT NULL,
      user_id uuid NOT NULL,
      year integer NOT NULL,
      month integer NOT NULL,
      deficiency_hours numeric(10,2) NOT NULL DEFAULT 0,
      filled_by uuid NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT triwulan_monthly_deficiencies_pkey PRIMARY KEY (period_id, user_id, year, month)
    );
  `)
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_tmd_user_year_month
    ON public.triwulan_monthly_deficiencies (user_id, year, month);
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
    DROP TRIGGER IF EXISTS tmd_set_updated_at ON public.triwulan_monthly_deficiencies;
  `)
  await prisma.$executeRawUnsafe(`
    CREATE TRIGGER tmd_set_updated_at
    BEFORE UPDATE ON public.triwulan_monthly_deficiencies
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  `)
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminOrSupervisor()
    if (!auth.ok) return NextResponse.json({ error: 'Forbidden' }, { status: auth.status })
    const { searchParams } = new URL(request.url)
    const periodId = searchParams.get('periodId')
    if (!periodId) return NextResponse.json({ data: [] })
    await ensureDeficienciesTable()
    const rows = await prisma.$queryRaw<any[]>`
      SELECT period_id, user_id, year, month, deficiency_hours, filled_by
      FROM public.triwulan_monthly_deficiencies
      WHERE period_id = ${periodId}
    `
    return NextResponse.json({ data: rows })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to load' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminOrSupervisor()
    if (!auth.ok) return NextResponse.json({ error: 'Forbidden' }, { status: auth.status })
    await ensureDeficienciesTable()
    const body = await request.json().catch(() => ({}))
    const rowsInput = (body?.rows || body?.deficiencies || []) as Array<{ period_id: string; user_id: string; year: number; month: number; deficiency_hours: number; filled_by?: string | null }>
    if (!Array.isArray(rowsInput) || rowsInput.length === 0) return NextResponse.json({ success: true })
    // Upsert rows
    for (const r of rowsInput) {
      const filledBy = r.filled_by ?? null
      await prisma.$executeRaw`
        INSERT INTO public.triwulan_monthly_deficiencies (period_id, user_id, year, month, deficiency_hours, filled_by)
        VALUES (${r.period_id}, ${r.user_id}::uuid, ${r.year}, ${r.month}, ${r.deficiency_hours}, ${filledBy}::uuid)
        ON CONFLICT (period_id, user_id, year, month)
        DO UPDATE SET deficiency_hours = EXCLUDED.deficiency_hours, filled_by = EXCLUDED.filled_by
      `
    }
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to upsert' }, { status: 500 })
  }
}


