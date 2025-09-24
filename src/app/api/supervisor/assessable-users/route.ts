import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Resolve current user profile
    const me = await prisma.profile.findUnique({ where: { email: session.user.email as string } })
    if (!me?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Require supervisor role
    const role = await prisma.userRole.findFirst({ where: { user_id: me.id } })
    if (role?.role !== 'supervisor') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Exclude admins and self
    const adminIds = (await prisma.userRole.findMany({ where: { role: 'admin' }, select: { user_id: true } }))
      .map(r => r.user_id).filter((v): v is string => !!v)

    const excluded = new Set<string>([...adminIds, me.id])

    const users = await prisma.profile.findMany({
      where: { id: { notIn: Array.from(excluded) } },
      select: { id: true, full_name: true, email: true, position: true, department: true, avatar_url: true },
      orderBy: { full_name: 'asc' },
    })

    return NextResponse.json({ users })
  } catch (e: any) {
    console.error('Error in assessable-users:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


