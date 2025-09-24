import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user || !('id' in session.user)) return NextResponse.json({ role: 'guest' })

  // Resolve profile by email first, then map to user_roles.user_id (profiles.id)
  let profileId: string | null = null
  if (session.user.email) {
    const profile = await prisma.profile.findUnique({ where: { email: session.user.email } })
    if (profile) profileId = profile.id
  }

  // Fallback: some environments might use same id between User and Profile
  const lookupId = profileId || session.user.id as string

  const ur = await prisma.userRole.findFirst({ where: { user_id: lookupId } })
  return NextResponse.json({ role: ur?.role || 'user' })
}


