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
    if (!year || !quarter) {
      return NextResponse.json({ error: 'Missing fields: year and quarter required' }, { status: 400 })
    }

    // Respect custom start/end dates if provided; otherwise default to exact quarter bounds
    const s = start_date ? new Date(start_date) : new Date(Date.UTC(Number(year), (Number(quarter) - 1) * 3, 1))
    const e = end_date ? new Date(end_date) : new Date(Date.UTC(Number(year), (Number(quarter) - 1) * 3 + 3, 0))

    for (
      let d = new Date(Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), 1));
      d <= e;
      d = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1))
    ) {
      const yy = d.getUTCFullYear()
      const mm = d.getUTCMonth() + 1
      const isFirst = yy === s.getUTCFullYear() && mm === s.getUTCMonth() + 1
      const isLast = yy === e.getUTCFullYear() && mm === e.getUTCMonth() + 1
      const sd = isFirst ? s : new Date(Date.UTC(yy, mm - 1, 1))
      const ed = isLast ? e : new Date(Date.UTC(yy, mm, 0))

      const exists = await prisma.assessmentPeriod.findFirst({ where: { year: yy, month: mm } })
      if (!exists) {
        await prisma.assessmentPeriod.create({ data: { year: yy, month: mm, start_date: sd as any, end_date: ed as any, is_active: false, is_completed: false } })
      } else {
        await prisma.assessmentPeriod.update({ where: { id: exists.id }, data: { start_date: sd as any, end_date: ed as any } })
      }
    }

    const id = `${year}-Q${quarter}`
    return NextResponse.json({ data: { id, year: Number(year), quarter: Number(quarter), start_date: s, end_date: e } })
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
    // Gather existing period IDs for the old quarter
    const oldPeriods = await prisma.assessmentPeriod.findMany({
      where: { year: oldYear, month: { in: monthsOld } },
      select: { id: true },
    })
    const oldPeriodIds = oldPeriods.map((p: { id: string }) => p.id)

    if (oldPeriodIds.length > 0) {
      // Delete dependents referencing the old periods
      const oldAssignments = await prisma.assessmentAssignment.findMany({
        where: { period_id: { in: oldPeriodIds } },
        select: { id: true },
      })
      const oldAssignmentIds = oldAssignments.map((a: { id: string }) => a.id)
      if (oldAssignmentIds.length > 0) {
        await prisma.feedbackResponse.deleteMany({ where: { assignment_id: { in: oldAssignmentIds } } })
        await prisma.assessmentAssignment.deleteMany({ where: { id: { in: oldAssignmentIds } } })
      }
      await prisma.reminderLog.deleteMany({ where: { period_id: { in: oldPeriodIds } } })
      await prisma.assessmentHistory.deleteMany({ where: { period_id: { in: oldPeriodIds } } })
      await prisma.assessmentPeriod.deleteMany({ where: { id: { in: oldPeriodIds } } })
    }
    const y = Number(year) || oldYear
    const q = Number(quarter) || oldQuarter

    // Determine desired start/end dates. If custom dates supplied, honor them.
    const s = start_date ? new Date(start_date) : new Date(Date.UTC(y, (q - 1) * 3, 1))
    const e = end_date ? new Date(end_date) : new Date(Date.UTC(y, (q - 1) * 3 + 3, 0))

    // Recreate monthly periods covering [s, e]
    for (
      let d = new Date(Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), 1));
      d <= e;
      d = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1))
    ) {
      const mmY = d.getUTCFullYear()
      const mmM = d.getUTCMonth() + 1

      // For first and last month, keep exact s/e if inside the month; otherwise use month bounds
      const isFirstMonth = mmY === s.getUTCFullYear() && mmM === s.getUTCMonth() + 1
      const isLastMonth = mmY === e.getUTCFullYear() && mmM === e.getUTCMonth() + 1

      const monthStart = isFirstMonth ? s : new Date(Date.UTC(mmY, mmM - 1, 1))
      const monthEnd = isLastMonth ? e : new Date(Date.UTC(mmY, mmM, 0))

      await prisma.assessmentPeriod.create({
        data: {
          year: mmY,
          month: mmM,
          start_date: monthStart as any,
          end_date: monthEnd as any,
          is_active: false,
          is_completed: false,
        },
      })
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
    // Resolve quarter months and gather affected period IDs
    const [yrStr, qStr] = String(id).split('-Q')
    const y = Number(yrStr)
    const q = Number(qStr)
    const startMonth = (q - 1) * 3 + 1
    const months = [startMonth, startMonth + 1, startMonth + 2]

    const periods = await prisma.assessmentPeriod.findMany({
      where: { year: y, month: { in: months } },
      select: { id: true },
    })
    const periodIds = periods.map((p: { id: string }) => p.id)

    if (periodIds.length === 0) {
      return NextResponse.json({ success: true })
    }

    // Delete dependent records in safe order
    const assignments = await prisma.assessmentAssignment.findMany({
      where: { period_id: { in: periodIds } },
      select: { id: true },
    })
    const assignmentIds = assignments.map((a: { id: string }) => a.id)

    if (assignmentIds.length > 0) {
      await prisma.feedbackResponse.deleteMany({ where: { assignment_id: { in: assignmentIds } } })
      await prisma.assessmentAssignment.deleteMany({ where: { id: { in: assignmentIds } } })
    }

    // Other tables referencing period_id directly
    await prisma.reminderLog.deleteMany({ where: { period_id: { in: periodIds } } })
    await prisma.assessmentHistory.deleteMany({ where: { period_id: { in: periodIds } } })

    // Finally delete periods
    await prisma.assessmentPeriod.deleteMany({ where: { id: { in: periodIds } } })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to delete' }, { status: 500 })
  }
}


