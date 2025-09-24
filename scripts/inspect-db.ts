import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
	const [profiles, roles, ap, aa, pins, mpa, wpa, ep, notif, pref] = await Promise.all([
		prisma.profile.count(),
		prisma.userRole.count(),
		prisma.assessmentPeriod.count(),
		prisma.assessmentAssignment.count(),
		prisma.pinPeriod.count(),
		prisma.monthlyPinAllowance.count(),
		prisma.weeklyPinAllowance.count(),
		prisma.employeePin.count(),
		prisma.notification.count(),
		prisma.notificationPreference.count(),
	])

	console.log('COUNTS:', { profiles, roles, assessment_periods: ap, assessment_assignments: aa, pin_periods: pins, monthly_pin_allowance: mpa, weekly_pin_allowance: wpa, employee_pins: ep, notifications: notif, notification_preferences: pref })

	const periods = await prisma.assessmentPeriod.findMany({
		orderBy: [{ start_date: 'desc' }, { created_at: 'desc' }],
	})
	console.log('ASSESSMENT_PERIODS:', periods)

	const pinPeriods = await prisma.pinPeriod.findMany({
		orderBy: [{ start_date: 'desc' }, { created_at: 'desc' }],
	})
	console.log('PIN_PERIODS:', pinPeriods)

	// stats by date
	const now = new Date()
	const monthStartUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
	const nextMonthStartUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
	const utcDay = now.getUTCDay()
	const daysSinceMonday = (utcDay + 6) % 7
	const weekStartUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysSinceMonday))
	const nextWeekStartUtc = new Date(weekStartUtc.getTime() + 7 * 24 * 60 * 60 * 1000)

	const [totalPins, thisWeekPins, thisMonthPins] = await Promise.all([
		prisma.employeePin.count(),
		prisma.employeePin.count({ where: { given_at: { gte: weekStartUtc, lt: nextWeekStartUtc } } }),
		prisma.employeePin.count({ where: { given_at: { gte: monthStartUtc, lt: nextMonthStartUtc } } }),
	])
	console.log('PIN_STATS:', { totalPins, thisWeekPins, thisMonthPins })
}

main()
	.then(async () => { await prisma.$disconnect() })
	.catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1) })


