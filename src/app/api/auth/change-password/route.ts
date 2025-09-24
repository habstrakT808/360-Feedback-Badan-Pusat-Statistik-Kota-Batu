import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { newPassword } = await request.json().catch(() => ({}))
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return NextResponse.json({ error: 'Password too short' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email as string }, select: { id: true } })
    if (!user?.id) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const hashedPassword = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({ where: { id: user.id }, data: { password_hash: hashedPassword } })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('change-password error:', e)
    return NextResponse.json({ error: 'Failed to change password' }, { status: 500 })
  }
}


