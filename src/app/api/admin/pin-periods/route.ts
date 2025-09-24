import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !('id' in session.user)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Resolve role using profile.id from email when available (align with /api/admin/periods)
    let lookupId: string | null = null
    const email = session.user.email as string | undefined
    if (email) {
      const prof = await prisma.profile.findUnique({ where: { email } })
      if (prof?.id) lookupId = prof.id
    }
    if (!lookupId) lookupId = session.user.id as string

    const role = await prisma.userRole.findFirst({ where: { user_id: lookupId } })
    if (role?.role !== 'admin' && role?.role !== 'supervisor') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active') === '1'
    if (activeOnly) {
      const active = await prisma.pinPeriod.findFirst({ where: { is_active: true } })
      return NextResponse.json({ data: active ? [active] : [] })
    }
    const list = await prisma.pinPeriod.findMany({ orderBy: [{ year: 'desc' }, { month: 'desc' }] })
    return NextResponse.json({ data: list })
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  // Align authorization with other admin routes: resolve role via profile.id from email
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let lookupId: string | null = null
  const email = session.user.email as string
  const prof = await prisma.profile.findUnique({ where: { email } })
  if (prof?.id) lookupId = prof.id
  if (!lookupId && 'id' in (session.user as any)) lookupId = (session.user as any).id as string

  if (!lookupId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = await prisma.userRole.findFirst({ where: { user_id: lookupId } })
  if (role?.role !== 'admin' && role?.role !== 'supervisor') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json().catch(() => ({} as any))
  const { start_date, end_date, month, year } = body || {}
  if (!start_date || !end_date) return NextResponse.json({ error: 'start_date and end_date required' }, { status: 400 })

  // Deactivate any currently active pin period
  await prisma.pinPeriod.updateMany({ where: { is_active: true }, data: { is_active: false } })

  const created = await prisma.pinPeriod.create({
    data: {
      start_date: new Date(start_date),
      end_date: new Date(end_date),
      month: typeof month === 'number' ? month : null,
      year: typeof year === 'number' ? year : null,
      is_active: true,
      is_completed: false,
    },
  })
  return NextResponse.json({ data: created })
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let lookupId: string | null = null
  const email = session.user.email as string
  const prof = await prisma.profile.findUnique({ where: { email } })
  if (prof?.id) lookupId = prof.id
  if (!lookupId && 'id' in (session.user as any)) lookupId = (session.user as any).id as string
  if (!lookupId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = await prisma.userRole.findFirst({ where: { user_id: lookupId } })
  if (role?.role !== 'admin' && role?.role !== 'supervisor') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { id, ...updates } = body || {}
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const data: any = {}
  if (updates.start_date) data.start_date = new Date(updates.start_date)
  if (updates.end_date) data.end_date = new Date(updates.end_date)
  if (typeof updates.month !== 'undefined') data.month = updates.month
  if (typeof updates.year !== 'undefined') data.year = updates.year
  if (typeof updates.is_active === 'boolean') data.is_active = updates.is_active
  if (typeof updates.is_completed === 'boolean') data.is_completed = updates.is_completed

  const updated = await prisma.pinPeriod.update({ where: { id }, data })
  return NextResponse.json({ data: updated })
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let lookupId: string | null = null
  const email = session.user.email as string
  const prof = await prisma.profile.findUnique({ where: { email } })
  if (prof?.id) lookupId = prof.id
  if (!lookupId && 'id' in (session.user as any)) lookupId = (session.user as any).id as string
  if (!lookupId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = await prisma.userRole.findFirst({ where: { user_id: lookupId } })
  if (role?.role !== 'admin' && role?.role !== 'supervisor') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  await prisma.pinPeriod.delete({ where: { id } })
  return NextResponse.json({ success: true })
}


