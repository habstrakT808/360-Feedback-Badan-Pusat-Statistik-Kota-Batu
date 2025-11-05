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
        .map((r: { user_id: string | null }) => r.user_id)
        .filter((v: string | null): v is string => !!v)
    )
    const supervisorIds = new Set(
      (await prisma.userRole.findMany({ where: { role: 'supervisor' }, select: { user_id: true } }))
        .map((r: { user_id: string | null }) => r.user_id)
        .filter((v: string | null): v is string => !!v)
    )
    const profiles: Array<{ id: string | null }> = await prisma.profile.findMany({ select: { id: true } })
    const eligible = profiles
      .map((p: { id: string | null }) => p.id)
      .filter((id): id is string => !!id && !adminIds.has(id) && !supervisorIds.has(id))

    if (eligible.length < 2) {
      return NextResponse.json({ success: false, error: 'Not enough eligible users to generate assignments' }, { status: 400 })
    }

    // Read existing assignments to avoid duplicates and compute current in-degree (received assessments)
    const existing = await prisma.assessmentAssignment.findMany({
      where: { period_id: targetPeriodId },
      select: { assessor_id: true, assessee_id: true }
    })
    const existingPairs = new Set(
      existing.map((e: { assessor_id: string | null; assessee_id: string | null }) => `${e.assessor_id}:${e.assessee_id}`)
    )
    const inCount = new Map<string, number>()
    for (const e of existing) {
      if (!e.assessee_id) continue
      inCount.set(e.assessee_id, (inCount.get(e.assessee_id) || 0) + 1)
    }

    // Balanced generation:
    // - Set target per assessor (max 5 or pool-1)
    // - Cap per assessee so setiap orang menerima ~target penilai
    const targetPerAssessor = Math.max(1, Math.min(5, eligible.length - 1))
    const capPerAssessee = targetPerAssessor

    const toCreate: Array<{ assessor_id: string, assessee_id: string, period_id: string }> = []

    // Helper to pick candidates sorted by current received count (lowest first), with random tie-breaker
    function sortedCandidates(base: string[]): string[] {
      const arr = base.slice()
      return arr.sort((a: string, b: string) => {
        const ca = inCount.get(a) || 0
        const cb = inCount.get(b) || 0
        if (ca !== cb) return ca - cb
        return Math.random() - 0.5
      })
    }

    // First pass: respect capPerAssessee to even out distribution
    for (const assessor of eligible) {
      const pool = sortedCandidates(eligible.filter((id) => id !== assessor))
      let added = 0
      for (const assessee of pool) {
        if (added >= targetPerAssessor) break
        const key = `${assessor}:${assessee}`
        if (existingPairs.has(key)) continue
        const current = inCount.get(assessee) || 0
        if (current >= capPerAssessee) continue
        existingPairs.add(key)
        inCount.set(assessee, current + 1)
        toCreate.push({ assessor_id: assessor, assessee_id: assessee, period_id: targetPeriodId! })
        added++
      }
    }

    // Second pass: if ada assessor yang belum mencapai target karena cap, isi sisa tanpa cap (tetap hindari duplikasi)
    for (const assessor of eligible) {
      // Count what we've already added for this assessor in the new batch + existing
      let already = existing.filter(e => e.assessor_id === assessor).length +
        toCreate.filter(t => t.assessor_id === assessor).length
      if (already >= targetPerAssessor) continue
      const pool = sortedCandidates(eligible.filter((id) => id !== assessor))
      for (const assessee of pool) {
        if (already >= targetPerAssessor) break
        const key = `${assessor}:${assessee}`
        if (existingPairs.has(key)) continue
        existingPairs.add(key)
        inCount.set(assessee, (inCount.get(assessee) || 0) + 1)
        toCreate.push({ assessor_id: assessor, assessee_id: assessee, period_id: targetPeriodId! })
        already++
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
