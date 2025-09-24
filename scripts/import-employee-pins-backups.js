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

async function main() {
  const base = process.argv[2] || 'G:/Project/bps-feedback/Backup'
  const files = [
    'employee_pins_backup_before_reimport_rows.csv',
    'employee_pins_backup_fulldelete_rows.csv',
  ]

  for (const f of files) {
    const p = path.join(base, f)
    await importCsv(p, async (r) => {
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
  }

  const c = await prisma.$queryRawUnsafe('select count(*)::int as c from employee_pins')
  console.log('employee_pins count:', c[0].c)
  await prisma.$disconnect()
}

main().catch(async (e) => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})


