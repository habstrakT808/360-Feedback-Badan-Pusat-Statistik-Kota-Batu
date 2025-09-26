import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { RolesService } from '@/lib/roles-service'

export async function GET(request: Request) {
	try {
		const session = await getServerSession(authOptions)
		if (!session || !session.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

  const { searchParams } = new URL(request.url)
  const limitParam = searchParams.get('limit')
  const limit = limitParam ? Math.max(1, Math.min(100, parseInt(limitParam))) : 10
  const periodFilter = searchParams.get('period') // 'active' | 'month:YYYY-MM' | 'range:YYYY-MM-DD,YYYY-MM-DD'

		const { adminIds } = await RolesService.getRoleUserIds()

  // Build date filter based on period
  let dateWhere: any = undefined
  if (periodFilter === 'active') {
    const active = await prisma.pinPeriod.findFirst({ where: { is_active: true } })
    if (active) {
      dateWhere = {
        gte: new Date(active.start_date),
        lt: new Date(new Date(active.end_date).getTime() + 24*60*60*1000),
      }
    }
  } else if (periodFilter?.startsWith('month:')) {
    const [y, m] = periodFilter.replace('month:', '').split('-').map(Number)
    if (y && m) {
      // If a configured pin period exists for this month/year, use its exact start/end
      const configured = await prisma.pinPeriod.findFirst({ where: { month: m, year: y } })
      if (configured) {
        dateWhere = {
          gte: new Date(configured.start_date),
          lt: new Date(new Date(configured.end_date).getTime() + 24*60*60*1000),
        }
      } else {
        // Fallback: full calendar month
        const start = new Date(Date.UTC(y, m - 1, 1))
        const endPlusOne = new Date(Date.UTC(y, m, 1))
        dateWhere = { gte: start, lt: endPlusOne }
      }
    }
  } else if (periodFilter?.startsWith('range:')) {
    const [s, e] = periodFilter.replace('range:', '').split(',')
    if (s && e) {
      const start = new Date(s)
      const endPlusOne = new Date(new Date(e).getTime() + 24*60*60*1000)
      dateWhere = { gte: start, lt: endPlusOne }
    }
  }

  const pinCounts = await prisma.employeePin.groupBy({
    by: ['receiver_id'],
    where: {
      receiver_id: { notIn: adminIds },
      ...(dateWhere ? { given_at: dateWhere } : {}),
    },
    _count: { receiver_id: true }
  })

		const userIds = pinCounts
			.map((p: { receiver_id: string | null }) => p.receiver_id)
			.filter((id: string | null): id is string => !!id)
		type UserLite = { id: string; full_name: string | null; avatar_url: string | null }
		const users: UserLite[] = await prisma.profile.findMany({
			where: { id: { in: userIds } },
			select: { id: true, full_name: true, avatar_url: true }
		})
		const userMap: Map<string, UserLite> = new Map(users.map((u: UserLite) => [u.id, u]))

		const rankings = pinCounts
			.map((p: { receiver_id: string | null; _count: { receiver_id: number } }) => {
				if (!p.receiver_id) return null
				const u = userMap.get(p.receiver_id)
				if (!u) return null
				return {
					user_id: p.receiver_id,
					full_name: u.full_name,
					avatar_url: (u.avatar_url ?? undefined),
					pin_count: p._count.receiver_id
				}
			})
			.filter(Boolean)
			.sort((a: any, b: any) => b.pin_count - a.pin_count)
			.slice(0, limit)
			.map((r: any, idx: number) => ({ ...r, rank: idx + 1 }))

		return NextResponse.json({ success: true, rankings })
	} catch (error) {
		console.error('GET /api/pins/rankings error', error)
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
	}
}


