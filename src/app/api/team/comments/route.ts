import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || ''
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

    // Resolve requester
    const requester = await prisma.profile.findUnique({ where: { email: session.user.email as string } })
    const requesterRole = requester ? await prisma.userRole.findFirst({ where: { user_id: requester.id } }) : null
    const isAdmin = requesterRole?.role === 'admin'
    const isSupervisor = requesterRole?.role === 'supervisor'

    // Resolve target profile
    let profile = await prisma.profile.findUnique({ where: { id: userId } })
    if (!profile) {
      const user = await prisma.user.findUnique({ where: { id: userId } })
      if (user?.email) profile = await prisma.profile.findUnique({ where: { email: user.email } }) || null as any
    }
    if (!profile) return NextResponse.json({ error: 'Not Found' }, { status: 404 })

    const isSelf = requester?.id === profile.id
    const isPublic = !!profile.allow_public_view
    if (!isSelf && !isAdmin && !isSupervisor && !isPublic) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const currentPeriod = await prisma.assessmentPeriod.findFirst({ where: { is_active: true } })
    if (!currentPeriod) return NextResponse.json({ comments: [] })

    const responses = await prisma.feedbackResponse.findMany({
      where: { assignment: { assessee_id: profile.id, period_id: currentPeriod.id }, comment: { not: null } },
      orderBy: { created_at: 'desc' },
      include: { assignment: { select: { assessor: { select: { id: true, full_name: true, avatar_url: true } } } } }
    })

    const comments = responses
      .filter(r => r.comment && r.comment.trim().length > 0)
      .map(r => ({
        id: r.id,
        text: r.comment as string,
        created_at: r.created_at,
        author: {
          id: r.assignment.assessor?.id,
          full_name: r.assignment.assessor?.full_name,
          avatar_url: r.assignment.assessor?.avatar_url || null,
        }
      }))

    return NextResponse.json({ comments })
  } catch (e: any) {
    console.error('team comments error:', e)
    return NextResponse.json({ error: 'Failed to load comments' }, { status: 500 })
  }
}


