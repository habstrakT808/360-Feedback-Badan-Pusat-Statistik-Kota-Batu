import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !('id' in session.user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Resolve actual profile ID: prefer profile by email, fallback to session.user.id
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

    const profiles = await prisma.profile.findMany({
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        full_name: true,
        email: true,
        username: true,
        position: true,
        department: true,
        created_at: true,
      },
    })
    const adminUsers = await prisma.userRole.findMany({ where: { role: 'admin' }, select: { user_id: true } })
    const adminIds = new Set(
      adminUsers.map((u: { user_id: string | null }) => u.user_id).filter((id: string | null): id is string => !!id)
    )
    const users = profiles.filter((p: any) => !adminIds.has(p.id as string))

    return NextResponse.json({ success: true, users })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to fetch users' }, { status: 500 })
  }
}


