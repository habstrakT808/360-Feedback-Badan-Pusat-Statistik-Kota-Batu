import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const active = await prisma.pinPeriod.findFirst({ where: { is_active: true } })
    return NextResponse.json({ data: active })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load active pin period' }, { status: 500 })
  }
}


