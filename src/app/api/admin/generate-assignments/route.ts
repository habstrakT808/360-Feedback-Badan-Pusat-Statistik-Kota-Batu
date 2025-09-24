import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Resolve admin by profile id from email
    const prof = await prisma.profile.findUnique({ where: { email: session.user.email as string } })
    const isAdmin = prof ? await prisma.userRole.findFirst({ where: { user_id: prof.id, role: 'admin' } }) : null
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }

    const { periodId } = await request.json()

    let targetPeriodId = periodId as string | undefined
    if (!targetPeriodId) {
      const active = await prisma.assessmentPeriod.findFirst({
        where: { is_active: true },
        select: { id: true }
      })
      if (!active) {
        return NextResponse.json({ success: false, error: 'No active period found' }, { status: 400 })
      }
      targetPeriodId = active.id
    }

    // Build eligible users (exclude admins/supervisors)
    const adminIds = new Set(
      (await prisma.userRole.findMany({ where: { role: 'admin' }, select: { user_id: true } }))
        .map(r => r.user_id).filter((v): v is string => !!v)
    )
    const supervisorIds = new Set(
      (await prisma.userRole.findMany({ where: { role: 'supervisor' }, select: { user_id: true } }))
        .map(r => r.user_id).filter((v): v is string => !!v)
    )
    const profiles = await prisma.profile.findMany({ select: { id: true } })
    const eligible = profiles
      .map(p => p.id)
      .filter((id): id is string => !!id && !adminIds.has(id) && !supervisorIds.has(id))

    if (eligible.length < 2) {
      return NextResponse.json({ success: false, error: 'Not enough eligible users to generate assignments' }, { status: 400 })
    }

    // Read existing assignments to avoid duplicates
    const existing = await prisma.assessmentAssignment.findMany({
      where: { period_id: targetPeriodId },
      select: { assessor_id: true, assessee_id: true }
    })
    const existingPairs = new Set(existing.map(e => `${e.assessor_id}:${e.assessee_id}`))

    // For each assessor, pick up to 5 unique assessees (not self), avoiding duplicates
    const toCreate: Array<{ assessor_id: string, assessee_id: string, period_id: string }> = []
    for (const assessor of eligible) {
      // shuffle a copy
      const pool = eligible.filter(id => id !== assessor)
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        const tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp
      }
      let added = 0
      for (const assessee of pool) {
        if (added >= 5) break
        const key = `${assessor}:${assessee}`
        if (existingPairs.has(key)) continue
        existingPairs.add(key)
        toCreate.push({ assessor_id: assessor, assessee_id: assessee, period_id: targetPeriodId! })
        added++
      }
    }

    if (toCreate.length > 0) {
      await prisma.assessmentAssignment.createMany({ data: toCreate, skipDuplicates: true })
    }

    const totalForPeriod = await prisma.assessmentAssignment.count({ where: { period_id: targetPeriodId } })
    return NextResponse.json({ success: true, created: toCreate.length, totalForPeriod })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || 'Failed to generate assignments' }, { status: 500 })
  }
}
