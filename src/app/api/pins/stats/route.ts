import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
	try {
		const session = await getServerSession(authOptions)
		if (!session || !session.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const totalPins = await prisma.employeePin.count()

		// Date-based ranges (UTC boundaries) for current week (Mon-Sun) and current month
		const now = new Date()
		// Month range
		const monthStartUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
		const nextMonthStartUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
		// Week range (Monday as start)
		const utcDay = now.getUTCDay() // 0=Sun..6=Sat
		const daysSinceMonday = (utcDay + 6) % 7 // Mon=0, Sun=6
		const weekStartUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysSinceMonday))
		const nextWeekStartUtc = new Date(weekStartUtc.getTime() + 7 * 24 * 60 * 60 * 1000)

		const [thisWeekPins, thisMonthPins] = await Promise.all([
			prisma.employeePin.count({ where: { given_at: { gte: weekStartUtc, lt: nextWeekStartUtc } } }),
			prisma.employeePin.count({ where: { given_at: { gte: monthStartUtc, lt: nextMonthStartUtc } } })
		])

		return NextResponse.json({ success: true, stats: { totalPins, thisWeekPins, thisMonthPins } })
	} catch (error) {
		console.error('GET /api/pins/stats error', error)
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
	}
}


