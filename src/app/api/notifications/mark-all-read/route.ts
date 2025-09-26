import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const prof = await prisma.profile.findUnique({ where: { email: session.user.email as string } })
    if (!prof) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    await prisma.notification.updateMany({ where: { user_id: prof.id, is_read: false }, data: { is_read: true, updated_at: new Date() } })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}


