import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !('id' in session.user)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const role = await prisma.userRole.findFirst({ where: { user_id: session.user.id as string } })
    if (role?.role !== 'admin' && role?.role !== 'supervisor') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // TODO: Implement triwulan period management when model is added to schema
    const list: any[] = []
    return NextResponse.json({ data: list })
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


