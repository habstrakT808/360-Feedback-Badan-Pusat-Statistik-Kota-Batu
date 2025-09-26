import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminUsers: Array<{ user_id: string | null }> = await prisma.userRole.findMany({ where: { role: 'admin' }, select: { user_id: true } })
    const adminUserIds = adminUsers
      .map((u: { user_id: string | null }) => u.user_id)
      .filter((id: string | null): id is string => !!id)

    const profiles = await prisma.profile.findMany({
      where: { id: { notIn: adminUserIds } },
      orderBy: [{ full_name: 'asc' }]
    })

    return NextResponse.json({ data: profiles })
  } catch (e: any) {
    console.error('team list error:', e)
    return NextResponse.json({ error: 'Failed to load team' }, { status: 500 })
  }
}


