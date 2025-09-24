import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json([], { status: 200 })
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    // Resolve target assessee id; if none, use current user profile id
    let assesseeId = userId || null
    if (!assesseeId) {
      const me = await prisma.profile.findUnique({ where: { email: session.user.email as string } })
      assesseeId = me?.id || null
    }
    if (!assesseeId) return NextResponse.json([])

    const feedbackData = await prisma.feedbackResponse.findMany({
      where: { assignment: { assessee_id: assesseeId } },
      include: {
        assignment: {
          include: {
            period: true,
            assessor: { select: { id: true, full_name: true, email: true, position: true, department: true, avatar_url: true } },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    })

    return NextResponse.json(feedbackData)
  } catch (e: any) {
    return NextResponse.json([], { status: 200 })
  }
}


