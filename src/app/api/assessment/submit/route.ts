import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { assignmentId, responses, assesseeId } = await request.json()
  if (!Array.isArray(responses)) return NextResponse.json({ error: 'Bad request' }, { status: 400 })

  // Resolve current user profile id
  const prof = await prisma.profile.findUnique({ where: { email: session.user.email as string } })
  if (!prof?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // For supervisors, allow synthetic IDs and create assignment if needed
  const role = await prisma.userRole.findFirst({ where: { user_id: prof.id } })
  const isSupervisor = role?.role === 'supervisor'
  let realAssignmentId = assignmentId as string | null
  if (isSupervisor) {
    // Ensure we have a real assignment to attach feedback to
    const active = await prisma.assessmentPeriod.findFirst({ where: { is_active: true } })
    if (!active) return NextResponse.json({ error: 'No active period' }, { status: 400 })
    const targetId = assesseeId as string | undefined
    if (!targetId) return NextResponse.json({ error: 'Missing assesseeId' }, { status: 400 })
    const existing = await prisma.assessmentAssignment.findFirst({ where: { assessor_id: prof.id, assessee_id: targetId, period_id: active.id } })
    if (existing) realAssignmentId = existing.id
    else {
      const created = await prisma.assessmentAssignment.create({ data: { assessor_id: prof.id, assessee_id: targetId, period_id: active.id, is_completed: false } })
      realAssignmentId = created.id
    }
  }
  // Ensure ownership for non-supervisor (must match existing assignment)
  if (!isSupervisor) {
    const assignment = await prisma.assessmentAssignment.findUnique({ where: { id: assignmentId } })
    if (!assignment || assignment.assessor_id !== prof.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const targetAssignmentId = realAssignmentId || assignmentId
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.feedbackResponse.deleteMany({ where: { assignment_id: targetAssignmentId } })
    if (responses.length > 0) {
      await tx.feedbackResponse.createMany({
        data: responses.map((r: any) => ({ assignment_id: targetAssignmentId, aspect: r.aspect, indicator: r.indicator, rating: r.rating, comment: r.comment ?? null })),
      })
    }
    await tx.assessmentAssignment.update({ where: { id: targetAssignmentId as string }, data: { is_completed: true, completed_at: new Date() } })
  })

  return NextResponse.json({ success: true })
}


