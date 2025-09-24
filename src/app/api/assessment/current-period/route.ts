import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const period = await prisma.assessmentPeriod.findFirst({ where: { is_active: true } })
  return NextResponse.json(period || null)
}


