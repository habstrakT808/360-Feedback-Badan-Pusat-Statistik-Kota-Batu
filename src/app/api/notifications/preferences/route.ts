import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const prof = await prisma.profile.findUnique({ where: { email: session.user.email as string } })
    if (!prof) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    let prefs = await prisma.notificationPreference.findFirst({ where: { user_id: prof.id } })
    if (!prefs) {
      prefs = await prisma.notificationPreference.create({
        data: {
          user_id: prof.id,
          email_enabled: true,
          push_enabled: true,
          assessment_reminders: true,
          deadline_warnings: true,
          completion_notifications: true,
          system_notifications: true,
          reminder_frequency: 'daily',
          quiet_hours_start: new Date('1970-01-01T22:00:00Z'),
          quiet_hours_end: new Date('1970-01-01T08:00:00Z')
        }
      })
    }

    return NextResponse.json({ data: prefs })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const prof = await prisma.profile.findUnique({ where: { email: session.user.email as string } })
    if (!prof) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const { preferences } = await request.json().catch(() => ({ preferences: {} }))
    const existing = await prisma.notificationPreference.findFirst({ where: { user_id: prof.id } })
    let data
    if (existing) {
      data = await prisma.notificationPreference.update({ where: { id: existing.id }, data: { ...preferences, updated_at: new Date() } })
    } else {
      data = await prisma.notificationPreference.create({
        data: {
          user_id: prof.id,
          email_enabled: true,
          push_enabled: true,
          assessment_reminders: true,
          deadline_warnings: true,
          completion_notifications: true,
          system_notifications: true,
          reminder_frequency: 'daily',
          quiet_hours_start: new Date('1970-01-01T22:00:00Z'),
          quiet_hours_end: new Date('1970-01-01T08:00:00Z'),
          ...preferences,
        }
      })
    }
    return NextResponse.json({ data })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}


