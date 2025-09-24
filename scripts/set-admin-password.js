const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

async function main() {
  const prisma = new PrismaClient()
  try {
    // Find first admin from user_roles
    const adminRole = await prisma.userRole.findFirst({ where: { role: 'admin' } })
    if (!adminRole?.user_id) {
      console.error('No admin found in user_roles.')
      process.exit(1)
    }
    const profile = await prisma.profile.findUnique({ where: { id: adminRole.user_id } })
    if (!profile?.email) {
      console.error('Admin profile not found or has no email.')
      process.exit(1)
    }

    const email = profile.email
    const password = process.env.PASSWORD || `Temp#${Math.random().toString(36).slice(2, 10)}!`
    const hash = await bcrypt.hash(password, 12)

    // Upsert into User table used by NextAuth
    await prisma.user.upsert({
      where: { email },
      update: { password_hash: hash },
      create: { email, name: profile.full_name || 'Admin', password_hash: hash },
    })

    console.log('Admin credentials set:')
    console.log('Email:', email)
    console.log('Password:', password)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})


