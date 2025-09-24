// src/app/api/admin/periods/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !('id' in session.user)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Resolve role using profile.id from email when available
    let lookupId: string | null = null
    const email = session.user.email as string | undefined
    if (email) {
      const prof = await prisma.profile.findUnique({ where: { email } })
      if (prof?.id) lookupId = prof.id
    }
    if (!lookupId) lookupId = session.user.id as string

    const role = await prisma.userRole.findFirst({ where: { user_id: lookupId } })
    if (role?.role !== 'admin' && role?.role !== 'supervisor') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const periods = await prisma.assessmentPeriod.findMany({ orderBy: [{ year: 'desc' }, { month: 'desc' }] })
    // augment with assigned/completed counts
    const ids = periods.map(p => p.id)
    const assignments = await prisma.assessmentAssignment.groupBy({
      by: ['period_id', 'is_completed'],
      where: { period_id: { in: ids } },
      _count: { _all: true },
    })
    const enriched = periods.map(p => {
      const a = assignments.filter(x => x.period_id === p.id)
      const assigned = a.reduce((sum, x) => sum + (x._count?._all ?? 0), 0)
      const completed = a.filter(x => x.is_completed === true).reduce((s, x) => s + (x._count?._all ?? 0), 0)
      return { ...p, assigned_count: assigned, completed_count: completed }
    })
    return NextResponse.json({ data: enriched })

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Resolve role using profile.id from email
    const prof = await prisma.profile.findUnique({ where: { email: session.user.email as string } })
    const isAdminOrSupervisor = prof
      ? await prisma.userRole.findFirst({ where: { user_id: prof.id, role: { in: ['admin', 'supervisor'] } } })
      : null
    if (!isAdminOrSupervisor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json().catch(() => ({}))
    const { month, year, start_date, end_date } = body || {}

    if (!month || !year || !start_date || !end_date) {
      return NextResponse.json({ error: 'month, year, start_date, end_date are required' }, { status: 400 })
    }

    const start = new Date(start_date)
    const end = new Date(end_date)
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ error: 'Invalid dates' }, { status: 400 })
    }
    if (start >= end) {
      return NextResponse.json({ error: 'end_date must be after start_date' }, { status: 400 })
    }
    if (month < 1 || month > 12) {
      return NextResponse.json({ error: 'month must be 1..12' }, { status: 400 })
    }

    const created = await prisma.assessmentPeriod.create({
      data: {
        month,
        year,
        start_date: start,
        end_date: end,
        is_active: true,
      },
    })

    return NextResponse.json({ success: true, period: created })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Resolve role using profile.id from email
    const prof = await prisma.profile.findUnique({ where: { email: session.user.email as string } })
    const isAdminOrSupervisor = prof
      ? await prisma.userRole.findFirst({ where: { user_id: prof.id, role: { in: ['admin', 'supervisor'] } } })
      : null
    if (!isAdminOrSupervisor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json().catch(() => ({}))
    const { id } = body || {}
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    // Hapus data terkait dalam transaksi berurutan agar tidak melanggar FK
    await prisma.$transaction(async (tx) => {
      const assignments = await tx.assessmentAssignment.findMany({
        where: { period_id: id },
        select: { id: true },
      })
      const assignmentIds = assignments.map(a => a.id)
      if (assignmentIds.length > 0) {
        await tx.feedbackResponse.deleteMany({ where: { assignment_id: { in: assignmentIds } } })
      }
      await tx.assessmentAssignment.deleteMany({ where: { period_id: id } })
      await tx.assessmentPeriod.delete({ where: { id } })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error (DELETE /admin/periods):', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const prof = await prisma.profile.findUnique({ where: { email: session.user.email as string } })
    const isAdminOrSupervisor = prof
      ? await prisma.userRole.findFirst({ where: { user_id: prof.id, role: { in: ['admin', 'supervisor'] } } })
      : null
    if (!isAdminOrSupervisor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json().catch(() => ({}))
    const { id, updates } = body || {}
    if (!id || !updates) return NextResponse.json({ error: 'id and updates are required' }, { status: 400 })

    const data: any = {}
    if (updates.month !== undefined) data.month = updates.month
    if (updates.year !== undefined) data.year = updates.year
    if (updates.start_date) data.start_date = new Date(updates.start_date)
    if (updates.end_date) data.end_date = new Date(updates.end_date)
    if (updates.is_active !== undefined) data.is_active = !!updates.is_active
    if (updates.is_completed !== undefined) data.is_completed = !!updates.is_completed

    const updated = await prisma.assessmentPeriod.update({ where: { id }, data })
    return NextResponse.json({ success: true, period: updated })
  } catch (error) {
    console.error('API error (PATCH /admin/periods):', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
