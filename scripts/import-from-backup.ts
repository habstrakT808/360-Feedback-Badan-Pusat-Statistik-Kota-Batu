import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

type Row = Record<string, string>

async function importCsv(filePath: string, onRow: (row: Row) => Promise<void>) {
  if (!fs.existsSync(filePath)) return
  await new Promise<void>((resolve, reject) => {
    const stream = fs.createReadStream(filePath)
      .pipe(parse({ columns: true, skip_empty_lines: true }))
    stream.on('data', (row: Row) => {
      stream.pause()
      onRow(row)
        .then(() => stream.resume())
        .catch(reject)
    })
    stream.on('end', () => resolve())
    stream.on('error', reject)
  })
}

function toBool(v: string | undefined): boolean | undefined {
  if (v == null) return undefined
  if (v.toLowerCase() === 'true') return true
  if (v.toLowerCase() === 'false') return false
  return undefined
}

function pickExisting(base: string, candidates: string[]): string | null {
  for (const name of candidates) {
    const full = path.join(base, name)
    if (fs.existsSync(full)) return full
  }
  return null
}

async function main() {
  const base = process.argv[2] || 'G:/Project/bps-feedback/Backup'

  // 1) profiles
  const profilesCsv = pickExisting(base, ['profiles_rows.csv', 'profiles.csv'])
  if (profilesCsv) await importCsv(profilesCsv, async (r) => {
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
  const userRolesCsv = pickExisting(base, ['user_roles_rows.csv', 'user_roles.csv'])
  if (userRolesCsv) await importCsv(userRolesCsv, async (r) => {
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
  const pinPeriodsCsv = pickExisting(base, ['pin_periods_rows.csv', 'pin_periods.csv'])
  if (pinPeriodsCsv) await importCsv(pinPeriodsCsv, async (r) => {
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
  const monthlyAllowanceCsv = pickExisting(base, ['monthly_pin_allowance_rows.csv', 'monthly_pin_allowance.csv'])
  if (monthlyAllowanceCsv) await importCsv(monthlyAllowanceCsv, async (r) => {
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
  const employeePinsCsv = pickExisting(base, [
    'employee_pins_rows.csv',
    'employee_pins_backup_before_reimport_rows.csv',
    'employee_pins_backup_fulldelete_rows.csv',
    'employee_pins.csv'
  ])
  if (employeePinsCsv) await importCsv(employeePinsCsv, async (r) => {
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
  const notifPrefsCsv = pickExisting(base, ['notification_preferences_rows.csv', 'notification_preferences.csv'])
  if (notifPrefsCsv) await importCsv(notifPrefsCsv, async (r) => {
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
  const notificationsCsv = pickExisting(base, ['notifications_rows.csv', 'notifications.csv'])
  if (notificationsCsv) await importCsv(notificationsCsv, async (r) => {
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


