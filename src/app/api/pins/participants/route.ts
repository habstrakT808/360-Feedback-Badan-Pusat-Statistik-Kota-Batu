import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Everyone logged-in can read participants
    const adminIds = new Set(
      (await prisma.userRole.findMany({ where: { role: 'admin' }, select: { user_id: true } }))
        .map((r) => r.user_id)
        .filter(Boolean) as string[]
    )

    const participants = await prisma.profile.findMany({
      where: { id: { notIn: Array.from(adminIds) } },
      select: { id: true, full_name: true, email: true, avatar_url: true },
      orderBy: { full_name: 'asc' },
    })

    return NextResponse.json({ data: participants })
  } catch (e) {
    console.error('participants error:', e)
    return NextResponse.json({ error: 'Failed to load participants' }, { status: 500 })
  }
}


