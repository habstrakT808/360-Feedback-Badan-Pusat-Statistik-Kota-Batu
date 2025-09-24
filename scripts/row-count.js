const { PrismaClient } = require('@prisma/client')

async function main() {
  const prisma = new PrismaClient()
  const tables = [
    'profiles',
    'user_roles',
    'pin_periods',
    'monthly_pin_allowance',
    'employee_pins',
    'notification_preferences',
    'notifications',
  ]
  const results = {}
  for (const t of tables) {
    const rows = await prisma.$queryRawUnsafe(`select count(*)::int as c from ${t}`)
    results[t] = rows[0].c
  }
  console.log(results)
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})


