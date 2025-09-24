import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Public endpoint to fetch basic profiles by ids
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const idsParam = searchParams.get('ids') || ''
    const ids = idsParam.split(',').map(s => s.trim()).filter(Boolean)
    if (ids.length === 0) return NextResponse.json({ profiles: [] })

    const profiles = await prisma.profile.findMany({
      where: { id: { in: ids } },
      select: { id: true, full_name: true, department: true, position: true, avatar_url: true }
    })
    return NextResponse.json({ profiles })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to load profiles' }, { status: 500 })
  }
}


