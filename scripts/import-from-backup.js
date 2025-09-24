const fs = require('fs')
const path = require('path')
const { parse } = require('csv-parse')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function importCsv(filePath, onRow) {
  if (!fs.existsSync(filePath)) return
  await new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath).pipe(parse({ columns: true, skip_empty_lines: true }))
    stream.on('data', (row) => {
      stream.pause()
      Promise.resolve(onRow(row)).then(() => stream.resume()).catch(reject)
    })
    stream.on('end', () => resolve())
    stream.on('error', reject)
  })
}

function resolveCsv(base, name) {
  const candidates = [
    path.join(base, `${name}.csv`),
    path.join(base, `${name}_rows.csv`),
  ]
  for (const p of candidates) {
    if (fs.existsSync(p)) return p
  }
  return null
}

function toBool(v) {
  if (v == null) return undefined
  const s = String(v).toLowerCase()
  if (s === 'true') return true
  if (s === 'false') return false
  return undefined
}

async function main() {
  const base = process.argv[2] || 'G:/Project/bps-feedback/Backup'

  // 1) profiles
  await importCsv(resolveCsv(base, 'profiles') || '', async (r) => {
    await prisma.profile.upsert({
      where: { id: r.id },
      update: {},
      create: {
        id: r.id,
        email: r.email,
        username: r.username,
        full_name: r.full_name,
        position: r.position || null,
        department: r.department || null,
        avatar_url: r.avatar_url || null,
        allow_public_view: toBool(r.allow_public_view) ?? false,
        created_at: new Date(r.created_at),
        updated_at: new Date(r.updated_at),
      },
    })
  })

  // 2) user_roles
  await importCsv(resolveCsv(base, 'user_roles') || '', async (r) => {
    await prisma.userRole.upsert({
      where: { user_id: r.user_id || undefined },
      update: { role: r.role },
      create: {
        id: r.id,
        user_id: r.user_id || null,
        role: r.role || 'user',
        created_at: r.created_at ? new Date(r.created_at) : new Date(),
        updated_at: r.updated_at ? new Date(r.updated_at) : new Date(),
      },
    })
  })

  // 3) pin_periods
  await importCsv(resolveCsv(base, 'pin_periods') || '', async (r) => {
    await prisma.pinPeriod.upsert({
      where: { id: r.id },
      update: {},
      create: {
        id: r.id,
        month: r.month ? Number(r.month) : null,
        year: r.year ? Number(r.year) : null,
        start_date: new Date(r.start_date),
        end_date: new Date(r.end_date),
        is_active: toBool(r.is_active) ?? false,
        is_completed: toBool(r.is_completed) ?? false,
        created_at: r.created_at ? new Date(r.created_at) : new Date(),
      },
    })
  })

  // 4) monthly_pin_allowance
  await importCsv(resolveCsv(base, 'monthly_pin_allowance') || '', async (r) => {
    await prisma.monthlyPinAllowance.upsert({
      where: { id: r.id },
      update: {},
      create: {
        id: r.id,
        user_id: r.user_id || null,
        month: Number(r.month),
        year: Number(r.year),
        pins_remaining: r.pins_remaining ? Number(r.pins_remaining) : 4,
        pins_used: r.pins_used ? Number(r.pins_used) : 0,
        created_at: r.created_at ? new Date(r.created_at) : new Date(),
      },
    })
  })

  // 5) employee_pins
  await importCsv(resolveCsv(base, 'employee_pins') || '', async (r) => {
    await prisma.employeePin.upsert({
      where: { id: r.id },
      update: {},
      create: {
        id: r.id,
        giver_id: r.giver_id || null,
        receiver_id: r.receiver_id || null,
        given_at: r.given_at ? new Date(r.given_at) : new Date(),
        week_number: Number(r.week_number),
        year: Number(r.year),
        month: Number(r.month),
        created_at: r.created_at ? new Date(r.created_at) : new Date(),
      },
    })
  })

  // 6) notification_preferences
  await importCsv(resolveCsv(base, 'notification_preferences') || '', async (r) => {
    await prisma.notificationPreference.upsert({
      where: { id: r.id },
      update: {},
      create: {
        id: r.id,
        user_id: r.user_id,
        email_enabled: toBool(r.email_enabled) ?? true,
        push_enabled: toBool(r.push_enabled) ?? true,
        assessment_reminders: toBool(r.assessment_reminders) ?? true,
        deadline_warnings: toBool(r.deadline_warnings) ?? true,
        completion_notifications: toBool(r.completion_notifications) ?? true,
        system_notifications: toBool(r.system_notifications) ?? true,
        reminder_frequency: r.reminder_frequency || 'weekly',
        quiet_hours_start: r.quiet_hours_start ? new Date(`1970-01-01T${r.quiet_hours_start}Z`) : new Date('1970-01-01T22:00:00Z'),
        quiet_hours_end: r.quiet_hours_end ? new Date(`1970-01-01T${r.quiet_hours_end}Z`) : new Date('1970-01-01T08:00:00Z'),
        created_at: new Date(r.created_at),
        updated_at: new Date(r.updated_at),
      },
    })
  })

  // 7) notifications
  await importCsv(resolveCsv(base, 'notifications') || '', async (r) => {
    await prisma.notification.upsert({
      where: { id: r.id },
      update: {},
      create: {
        id: r.id,
        user_id: r.user_id,
        title: r.title,
        message: r.message,
        type: r.type,
        priority: r.priority || 'medium',
        is_read: toBool(r.is_read) ?? false,
        action_url: r.action_url || null,
        action_label: r.action_label || null,
        metadata: r.metadata ? JSON.parse(r.metadata) : undefined,
        expires_at: r.expires_at ? new Date(r.expires_at) : null,
        created_at: new Date(r.created_at),
        updated_at: new Date(r.updated_at),
      },
    })
  })
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })


