const fs = require('fs')
const path = require('path')
const { parse } = require('csv-parse')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function readCsvIds(filePath) {
  const ids = []
  if (!fs.existsSync(filePath)) return ids
  await new Promise((resolve, reject) => {
    const s = fs.createReadStream(filePath).pipe(parse({ columns: true, skip_empty_lines: true }))
    s.on('data', (r) => ids.push(r.id))
    s.on('end', resolve)
    s.on('error', reject)
  })
  return ids
}

async function main() {
  const base = process.argv[2] || 'G:/Project/bps-feedback/Backup'
  const importMissing = process.argv.includes('--import-missing')
  const files = [
    'employee_pins_rows.csv',
    'employee_pins_backup_before_reimport_rows.csv',
    'employee_pins_backup_fulldelete_rows.csv',
  ]

  // Collect unique IDs from CSVs
  const csvIds = new Set()
  for (const f of files) {
    const p = path.join(base, f)
    const ids = await readCsvIds(p)
    ids.forEach((id) => csvIds.add(id))
  }

  // Fetch existing IDs from DB in chunks to avoid memory issues
  const existingIds = new Set()
  const total = await prisma.employeePin.count()
  const pageSize = 10000
  for (let skip = 0; skip < total; skip += pageSize) {
    const rows = await prisma.employeePin.findMany({ select: { id: true }, skip, take: pageSize })
    rows.forEach((r) => existingIds.add(r.id))
  }

  // Diff
  const missing = []
  csvIds.forEach((id) => {
    if (!existingIds.has(id)) missing.push(id)
  })

  console.log('CSV unique count:', csvIds.size)
  console.log('DB count:', total)
  console.log('Missing (in CSV but not in DB):', missing.length)

  if (!importMissing || missing.length === 0) {
    await prisma.$disconnect()
    return
  }

  // Optionally import missing rows from whichever CSV contains them
  const mapIdToRow = new Map()
  async function indexFile(fileName) {
    const p = path.join(base, fileName)
    if (!fs.existsSync(p)) return
    await new Promise((resolve, reject) => {
      const s = fs.createReadStream(p).pipe(parse({ columns: true, skip_empty_lines: true }))
      s.on('data', (r) => {
        if (missing.includes(r.id)) mapIdToRow.set(r.id, r)
      })
      s.on('end', resolve)
      s.on('error', reject)
    })
  }
  for (const f of files) await indexFile(f)

  let imported = 0
  for (const id of missing) {
    const r = mapIdToRow.get(id)
    if (!r) continue
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
    imported++
  }
  const newCount = await prisma.employeePin.count()
  console.log('Imported:', imported, 'New DB count:', newCount)

  await prisma.$disconnect()
}

main().catch(async (e) => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})


