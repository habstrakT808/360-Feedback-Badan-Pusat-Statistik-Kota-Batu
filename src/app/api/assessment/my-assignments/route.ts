import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json([], { status: 200 })

  // Resolve profile.id by email
  const prof = await prisma.profile.findUnique({ where: { email: session.user.email as string } })
  if (!prof?.id) return NextResponse.json([], { status: 200 })

  const role = await prisma.userRole.findFirst({ where: { user_id: prof.id } })
  const isSupervisor = role?.role === 'supervisor'

  const active = await prisma.assessmentPeriod.findFirst({ where: { is_active: true } })
  if (!active) return NextResponse.json([])

  let list
  if (isSupervisor) {
    // Supervisor menilai semua (kecuali admin dan dirinya sendiri) tanpa perlu assignment eksplisit
    const excludedIds = new Set(
      (await prisma.userRole.findMany({ where: { role: 'admin' }, select: { user_id: true } }))
        .map((r: { user_id: string | null }) => r.user_id)
        .filter((v: string | null): v is string => !!v)
    )
    excludedIds.add(prof.id)
    const targets = await prisma.profile.findMany({
      where: { id: { notIn: Array.from(excludedIds) } },
      select: { id: true, full_name: true, username: true, position: true, department: true, avatar_url: true },
      orderBy: { full_name: 'asc' },
    })
    // Bentuk struktur mirip assignment agar UI tetap bekerja
    list = targets.map((t: { id: string }) => ({
      id: `supervisor-${t.id}`,
      period_id: active.id,
      assessor_id: prof.id,
      assessee_id: t.id,
      is_completed: null,
      completed_at: null,
      created_at: new Date(),
      period: active,
      assessee: t,
    }))
  } else {
    list = await prisma.assessmentAssignment.findMany({
      where: { assessor_id: prof.id, period_id: active.id },
      orderBy: { created_at: 'desc' },
      include: {
        period: true,
        assessee: { select: { id: true, full_name: true, username: true, position: true, department: true, avatar_url: true } },
      },
    })
  }

  return NextResponse.json(list)
}


