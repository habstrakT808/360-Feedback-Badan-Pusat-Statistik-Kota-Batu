import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Helper: auth admin/supervisor via profile.id
async function requireAdminOrSupervisor() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return { ok: false, status: 401 }
  const prof = await prisma.profile.findUnique({ where: { email: session.user.email as string } })
  if (!prof?.id) return { ok: false, status: 401 }
  const role = await prisma.userRole.findFirst({ where: { user_id: prof.id } })
  if (role?.role === 'admin' || role?.role === 'supervisor') return { ok: true }
  return { ok: false, status: 403 }
}

export async function GET(request: Request) {
  try {
    // Public GET: anyone can read triwulan info

    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active') === '1'

    // Load all assessment periods
    const periods = await prisma.assessmentPeriod.findMany()

    // Helper: compute quarter key and aggregate info
    type Group = { id: string; year: number; quarter: number; start_date: Date; end_date: Date; is_active: boolean }
    const groups = new Map<string, Group>()

    for (const p of periods) {
      const q = Math.floor(((p.month || 1) - 1) / 3) + 1
      const key = `${p.year}-Q${q}`
      if (!groups.has(key)) {
        groups.set(key, {
          id: key,
          year: p.year || 0,
          quarter: q,
          start_date: p.start_date as any,
          end_date: p.end_date as any,
          is_active: false,
        })
      } else {
        const g = groups.get(key)!
        if ((p.start_date as any) < g.start_date) g.start_date = p.start_date as any
        if ((p.end_date as any) > g.end_date) g.end_date = p.end_date as any
      }
      // If any monthly is flagged active, mark the quarter active
      if (p.is_active) {
        const g = groups.get(key)!
        g.is_active = true
      }
    }

    // Also derive active by current date within triwulan date range
    const today = new Date()
    for (const g of groups.values()) {
      if (!g.is_active) {
        if (g.start_date <= today && today <= g.end_date) {
          g.is_active = true
        }
      }
    }

    const list = Array.from(groups.values()).sort((a, b) => b.year - a.year || b.quarter - a.quarter)

    if (activeOnly) {
      // Derive active triwulan from any active monthly period
      const active = list.find(g => g.is_active)
      return NextResponse.json({ data: active ? [active] : [] })
    }

    return NextResponse.json({ data: list })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to load' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminOrSupervisor()
    if (!auth.ok) return NextResponse.json({ error: 'Forbidden' }, { status: auth.status })
    const body = await request.json().catch(() => ({}))
    const { year, quarter, start_date, end_date } = body || {}
    if (!year || !quarter || !start_date || !end_date) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }
    // Create assessment periods covering the triwulan months
    const s = new Date(start_date)
    const e = new Date(end_date)
    const months: Array<{ y: number; m: number; sd: Date; ed: Date }> = []
    for (let d = new Date(Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), 1)); d <= e; d = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1))) {
      const y = d.getUTCFullYear()
      const m = d.getUTCMonth() + 1
      const sd = new Date(Date.UTC(y, d.getUTCMonth(), 1))
      const ed = new Date(Date.UTC(y, d.getUTCMonth() + 1, 0))
      months.push({ y, m, sd, ed })
    }
    for (const mm of months) {
      const exists = await prisma.assessmentPeriod.findFirst({ where: { year: mm.y, month: mm.m } })
      if (!exists) {
        await prisma.assessmentPeriod.create({ data: { year: mm.y, month: mm.m, start_date: mm.sd as any, end_date: mm.ed as any, is_active: false, is_completed: false } })
      }
    }
    const id = `${year}-Q${quarter}`
    return NextResponse.json({ data: { id, year: Number(year), quarter: Number(quarter), start_date: new Date(start_date), end_date: new Date(end_date) } })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to create' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAdminOrSupervisor()
    if (!auth.ok) return NextResponse.json({ error: 'Forbidden' }, { status: auth.status })
    const body = await request.json().catch(() => ({}))
    // For simplicity: delete existing quarter months and recreate based on updates
    const { id, year, quarter, start_date, end_date } = body || {}
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const [yrStr, qStr] = String(id).split('-Q')
    const oldYear = Number(yrStr)
    const oldQuarter = Number(qStr)
    const startMonth = (oldQuarter - 1) * 3 + 1
    const monthsOld = [startMonth, startMonth + 1, startMonth + 2]
    await prisma.assessmentPeriod.deleteMany({ where: { year: oldYear, month: { in: monthsOld } } })
    const y = Number(year) || oldYear
    const q = Number(quarter) || oldQuarter
    const s = start_date ? new Date(start_date) : new Date(Date.UTC(y, (q - 1) * 3, 1))
    const e = end_date ? new Date(end_date) : new Date(Date.UTC(y, (q - 1) * 3 + 3, 0))
    for (let m = (q - 1) * 3; m < (q - 1) * 3 + 3; m++) {
      const sd = new Date(Date.UTC(y, m, 1))
      const ed = new Date(Date.UTC(y, m + 1, 0))
      await prisma.assessmentPeriod.create({ data: { year: y, month: m + 1, start_date: sd as any, end_date: ed as any, is_active: false, is_completed: false } })
    }
    return NextResponse.json({ data: { id: `${y}-Q${q}`, year: y, quarter: q, start_date: s, end_date: e } })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdminOrSupervisor()
    if (!auth.ok) return NextResponse.json({ error: 'Forbidden' }, { status: auth.status })
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    // Delete all assessment periods within that quarter
    const [yrStr, qStr] = String(id).split('-Q')
    const y = Number(yrStr)
    const q = Number(qStr)
    const startMonth = (q - 1) * 3 + 1
    const months = [startMonth, startMonth + 1, startMonth + 2]
    await prisma.assessmentPeriod.deleteMany({ where: { year: y, month: { in: months } } })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to delete' }, { status: 500 })
  }
}


