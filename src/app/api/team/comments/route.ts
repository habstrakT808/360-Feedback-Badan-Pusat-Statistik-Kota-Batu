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

    type ResponseWithAssessor = {
      id: string
      comment: string | null
      created_at: Date
      assignment: { assessor: { id: string | null; full_name: string | null; avatar_url: string | null } | null }
    }
    
    // Group comments by assessor to avoid duplicates
    const commentsByAssessor = new Map<string, {
      id: string
      text: string
      created_at: Date
      author: {
        id: string | null
        full_name: string | null
        avatar_url: string | null
      }
    }>()

    ;(responses as ResponseWithAssessor[])
      .filter((r: ResponseWithAssessor) => r.comment !== null && r.comment.trim().length > 0)
      .forEach((r: ResponseWithAssessor) => {
        const assessorId = r.assignment.assessor?.id || 'anonymous'
        const comment = r.comment as string
        
        // Only keep the latest comment from each assessor
        if (!commentsByAssessor.has(assessorId) || 
            commentsByAssessor.get(assessorId)!.created_at < r.created_at) {
          commentsByAssessor.set(assessorId, {
            id: r.id,
            text: comment,
            created_at: r.created_at,
            author: {
              id: r.assignment.assessor?.id || null,
              full_name: r.assignment.assessor?.full_name || null,
              avatar_url: r.assignment.assessor?.avatar_url || null,
            }
          })
        }
      })

    const comments = Array.from(commentsByAssessor.values())
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())

    return NextResponse.json({ comments })
  } catch (e: any) {
    console.error('team comments error:', e)
    return NextResponse.json({ error: 'Failed to load comments' }, { status: 500 })
  }
}


