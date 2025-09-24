const { PrismaClient } = require('@prisma/client')

async function checkExistingUsers() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔍 Checking existing users in database...\n')
    
    // Check all profiles
    const profiles = await prisma.profile.findMany({
      select: {
        id: true,
        email: true,
        full_name: true,
        position: true,
        department: true,
        created_at: true
      },
      orderBy: { created_at: 'desc' }
    })
    
    console.log(`📊 Total profiles found: ${profiles.length}\n`)
    
    // Check user roles
    const roles = await prisma.userRole.findMany({
      select: {
        user_id: true,
        role: true
      }
    })
    
    console.log('👥 User Roles:')
    for (const role of roles) {
      const profile = profiles.find(p => p.id === role.user_id)
      if (profile) {
        console.log(`  - ${profile.full_name} (${profile.email}) - ${role.role}`)
      }
    }
    
    // Check NextAuth users table
    const nextAuthUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        password_hash: true
      }
    })
    
    console.log(`\n🔐 NextAuth users: ${nextAuthUsers.length}`)
    for (const user of nextAuthUsers) {
      console.log(`  - ${user.name} (${user.email}) - ${user.password_hash ? 'Has password' : 'No password'}`)
    }
    
    // Check for admin users specifically
    const adminRoles = roles.filter(r => r.role === 'admin')
    console.log(`\n👑 Admin users: ${adminRoles.length}`)
    
    for (const adminRole of adminRoles) {
      const profile = profiles.find(p => p.id === adminRole.user_id)
      const nextAuthUser = nextAuthUsers.find(u => u.email === profile?.email)
      
      if (profile) {
        console.log(`  - ${profile.full_name} (${profile.email})`)
        console.log(`    Profile ID: ${profile.id}`)
        console.log(`    NextAuth User: ${nextAuthUser ? 'Exists' : 'Missing'}`)
        console.log(`    Password Set: ${nextAuthUser?.password_hash ? 'Yes' : 'No'}`)
        console.log('')
      }
    }
    
    // Show first 10 profiles for reference
    console.log('\n📋 First 10 profiles:')
    profiles.slice(0, 10).forEach((profile, index) => {
      console.log(`  ${index + 1}. ${profile.full_name} (${profile.email}) - ${profile.position || 'No position'}`)
    })
    
    console.log('\n✅ Database check completed!')
    
  } catch (error) {
    console.error('❌ Error checking database:', error.message)
    console.log('\nTroubleshooting:')
    console.log('1. Check your DATABASE_URL in .env.local')
    console.log('2. Ensure your database is accessible')
    console.log('3. Verify Prisma schema is up to date')
  } finally {
    await prisma.$disconnect()
  }
}

checkExistingUsers()
