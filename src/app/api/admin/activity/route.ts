import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !('id' in session.user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Resolve profile by email first, fallback to session id
    let lookupId: string | null = null
    const email = session.user.email as string | undefined
    if (email) {
      const prof = await prisma.profile.findUnique({ where: { email } })
      if (prof?.id) lookupId = prof.id
    }
    if (!lookupId) lookupId = session.user.id as string

    const role = await prisma.userRole.findFirst({ where: { user_id: lookupId } })
    if (role?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Number(searchParams.get('limit') || 50)

    const activities = await prisma.assessmentAssignment.findMany({
      take: limit,
      orderBy: { created_at: 'desc' },
      include: {
        assessor: { select: { id: true, full_name: true } },
        assessee: { select: { id: true, full_name: true } },
        period: { select: { id: true, month: true, year: true } }
      }
    })

    const adminUsers = await prisma.userRole.findMany({ where: { role: 'admin' }, select: { user_id: true } })
    const adminIds = new Set(
      adminUsers
        .map((u: { user_id: string | null }) => u.user_id)
        .filter((id: string | null): id is string => typeof id === 'string' && id.length > 0)
    )

    const filtered = activities.filter(
      (a: any) => a.assessor && a.assessee && a.period && !adminIds.has(a.assessor.id) && !adminIds.has(a.assessee.id)
    )

    return NextResponse.json({ success: true, activities: filtered })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Failed to fetch activity' }, { status: 500 })
  }
}


