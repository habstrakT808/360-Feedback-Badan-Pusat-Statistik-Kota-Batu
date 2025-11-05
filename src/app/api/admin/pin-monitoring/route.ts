import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Return monitoring data for a selected PinPeriod (active or past)
// Query params:
// - periodId (optional): UUID of pin_periods.id. If omitted and status=active, use active period.
// - status (optional): 'active' | 'completed' | 'all' (default: 'active' when periodId not provided). Only used to help UI list periods; this endpoint focuses on data for one period.
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !('id' in session.user)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Only admins/supervisors may access
    const email = session.user.email as string | undefined
    let lookupId: string | null = null
    if (email) {
      const prof = await prisma.profile.findUnique({ where: { email } })
      if (prof?.id) lookupId = prof.id
    }
    if (!lookupId && 'id' in (session.user as any)) lookupId = (session.user as any).id as string
    const role = lookupId ? await prisma.userRole.findFirst({ where: { user_id: lookupId } }) : null
    if (role?.role !== 'admin' && role?.role !== 'supervisor') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const periodId = searchParams.get('periodId') || ''

    // Resolve period
    let period = null as any
    if (periodId) {
      period = await prisma.pinPeriod.findUnique({ where: { id: periodId } })
    } else {
      period = await prisma.pinPeriod.findFirst({ where: { is_active: true } })
    }
    if (!period) return NextResponse.json({ error: 'Pin period not found' }, { status: 404 })

    // Compute date window (half-open [start, end+1day))
    const start = new Date(period.start_date)
    const endPlusOne = new Date(new Date(period.end_date).getTime() + 24 * 60 * 60 * 1000)

    // Fetch all profiles (employees)
    const profiles = await prisma.profile.findMany({
      select: { id: true, full_name: true, email: true, position: true, department: true, avatar_url: true }
    })

    const ids = profiles.map((p) => p.id)

    // Count pins given per user within date window (giver perspective = sudah mengisi)
    const pinsGiven = await prisma.employeePin.groupBy({
      by: ['giver_id'],
      where: {
        giver_id: { in: ids },
        given_at: { gte: start, lt: endPlusOne }
      },
      _count: { giver_id: true }
    })
    const givenMap = new Map<string, number>()
    pinsGiven.forEach((r: any) => {
      if (r.giver_id) givenMap.set(r.giver_id, Number(r._count?.giver_id || 0))
    })

    // Compose rows
    const rows = profiles.map((p) => {
      const usedCalculated = givenMap.get(p.id) ?? 0
      const used = usedCalculated
      const remaining = Math.max(0, 4 - usedCalculated)
      const hasSubmitted = (used ?? 0) > 0
      return {
        user_id: p.id,
        full_name: p.full_name,
        email: p.email,
        position: p.position,
        department: p.department,
        avatar_url: p.avatar_url,
        pins_used: used,
        pins_remaining: remaining,
        has_submitted: hasSubmitted
      }
    })

    // Sort: not submitted first, then by lowest remaining, then by name
    rows.sort((a, b) => {
      if (a.has_submitted !== b.has_submitted) return a.has_submitted ? 1 : -1
      if (a.pins_remaining !== b.pins_remaining) return a.pins_remaining - b.pins_remaining
      return (a.full_name || '').localeCompare(b.full_name || '')
    })

    return NextResponse.json({
      data: rows,
      meta: {
        period: { id: period.id, month: period.month, year: period.year, start_date: period.start_date, end_date: period.end_date, is_active: period.is_active, is_completed: period.is_completed }
      }
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal server error' }, { status: 500 })
  }
}


