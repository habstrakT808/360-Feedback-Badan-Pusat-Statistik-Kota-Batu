import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const prof = await prisma.profile.findUnique({ where: { email: session.user.email as string } })
    if (!prof) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const { searchParams } = new URL(request.url)
    const limit = Number(searchParams.get('limit') || '50')
    const data = await prisma.notification.findMany({ where: { user_id: prof.id }, orderBy: { created_at: 'desc' }, take: limit })
    return NextResponse.json({ data })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}


