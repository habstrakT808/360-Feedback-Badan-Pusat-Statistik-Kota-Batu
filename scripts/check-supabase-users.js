const { createClient } = require('@supabase/supabase-js')

// Supabase configuration
const supabaseUrl = 'https://ltnuibppsxdrlbzrprtb.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0bnVpYnBwc3hkcmxienJwcnRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTE2MjI1NiwiZXhwIjoyMDcwNzM4MjU2fQ.lTlV9OBPW0KyPZYay0QlzbseOL5qFFG00mK8Hv3CukM'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSupabaseUsers() {
  try {
    console.log('🔍 Checking users in Supabase database...\n')
    
    // Check profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError.message)
      return
    }
    
    console.log(`📊 Total profiles found: ${profiles?.length || 0}\n`)
    
    // Check user roles
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*')
    
    if (rolesError) {
      console.error('❌ Error fetching roles:', rolesError.message)
      return
    }
    
    console.log('👥 User Roles:')
    for (const role of roles || []) {
      const profile = profiles?.find(p => p.id === role.user_id)
      if (profile) {
        console.log(`  - ${profile.full_name} (${profile.email}) - ${role.role}`)
      }
    }
    
    // Check for admin users specifically
    const adminRoles = roles?.filter(r => r.role === 'admin') || []
    console.log(`\n👑 Admin users: ${adminRoles.length}`)
    
    for (const adminRole of adminRoles) {
      const profile = profiles?.find(p => p.id === adminRole.user_id)
      if (profile) {
        console.log(`  - ${profile.full_name} (${profile.email})`)
        console.log(`    Profile ID: ${profile.id}`)
        console.log(`    Position: ${profile.position || 'No position'}`)
        console.log(`    Department: ${profile.department || 'No department'}`)
        console.log('')
      }
    }
    
    // Check for supervisor users
    const supervisorRoles = roles?.filter(r => r.role === 'supervisor') || []
    console.log(`👨‍💼 Supervisor users: ${supervisorRoles.length}`)
    
    for (const supervisorRole of supervisorRoles) {
      const profile = profiles?.find(p => p.id === supervisorRole.user_id)
      if (profile) {
        console.log(`  - ${profile.full_name} (${profile.email})`)
        console.log(`    Profile ID: ${profile.id}`)
        console.log(`    Position: ${profile.position || 'No position'}`)
        console.log(`    Department: ${profile.department || 'No department'}`)
        console.log('')
      }
    }
    
    // Show first 10 profiles for reference
    console.log('\n📋 First 10 profiles:')
    profiles?.slice(0, 10).forEach((profile, index) => {
      console.log(`  ${index + 1}. ${profile.full_name} (${profile.email}) - ${profile.position || 'No position'}`)
    })
    
    // Check if there are any users with specific IDs mentioned in code
    const knownIds = [
      'dccdb786-d7e7-44a8-a4d0-e446623c19b9', // Hafiyan (admin)
      '678ad9e9-cc08-4101-b735-6d2e1feaab3a'  // Herlina (supervisor)
    ]
    
    console.log('\n🔍 Known user IDs from code:')
    for (const id of knownIds) {
      const profile = profiles?.find(p => p.id === id)
      if (profile) {
        console.log(`  ✅ ${profile.full_name} (${profile.email}) - ID: ${id}`)
      } else {
        console.log(`  ❌ User with ID ${id} not found`)
      }
    }
    
    console.log('\n✅ Supabase check completed!')
    console.log('\n📝 Untuk login, gunakan email dari user admin/supervisor di atas.')
    console.log('🔐 Password bisa di-reset via Supabase Dashboard jika lupa.')
    
  } catch (error) {
    console.error('❌ Error checking Supabase:', error.message)
    console.log('\nTroubleshooting:')
    console.log('1. Check your Supabase credentials')
    console.log('2. Ensure your database is accessible')
    console.log('3. Verify your service role key is correct')
  }
}

checkSupabaseUsers()
