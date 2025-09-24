const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

async function main() {
  const prisma = new PrismaClient()
  const email = process.env.EMAIL || process.argv[2]
  const password = process.env.PASSWORD || process.argv[3]
  if (!email || !password) {
    console.error('Usage: node scripts/set-user-password.js <email> <password>')
    process.exit(1)
  }

  const hash = await bcrypt.hash(password, 12)
  await prisma.user.upsert({
    where: { email },
    update: { password_hash: hash },
    create: { email, name: email.split('@')[0], password_hash: hash },
  })

  console.log('Password set for:', email)
  await prisma.$disconnect()
}

main().catch(async (e) => { console.error(e); process.exit(1) })


