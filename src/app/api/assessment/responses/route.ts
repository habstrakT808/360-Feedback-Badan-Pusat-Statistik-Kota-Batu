import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json([], { status: 200 })
    }

    const { searchParams } = new URL(request.url)
    const assignmentId = searchParams.get('assignmentId')
    
    if (!assignmentId) {
      return NextResponse.json([], { status: 200 })
    }

    // Get current user profile
    const profile = await prisma.profile.findUnique({
      where: { email: session.user.email as string }
    })
    
    if (!profile?.id) {
      return NextResponse.json([], { status: 200 })
    }

    // Verify that the assignment belongs to the current user (as assessor)
    const assignment = await prisma.assessmentAssignment.findFirst({
      where: {
        id: assignmentId,
        assessor_id: profile.id
      }
    })

    if (!assignment) {
      return NextResponse.json([], { status: 200 })
    }

    // Get existing feedback responses for this assignment
    const responses = await prisma.feedbackResponse.findMany({
      where: {
        assignment_id: assignmentId
      },
      orderBy: {
        created_at: 'asc'
      }
    })

    return NextResponse.json(responses)
  } catch (error) {
    console.error('Error fetching existing responses:', error)
    return NextResponse.json([], { status: 200 })
  }
}