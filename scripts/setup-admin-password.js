const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')

// Supabase configuration
const supabaseUrl = 'https://ltnuibppsxdrlbzrprtb.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0bnVpYnBwc3hkcmxienJwcnRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTE2MjI1NiwiZXhwIjoyMDcwNzM4MjU2fQ.lTlV9OBPW0KyPZYay0QlzbseOL5qFFG00mK8Hv3CukM'

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupAdminPassword() {
  try {
    console.log('🔐 Setting up admin password...\n')
    
    // Admin user details
    const adminEmail = 'jhodywiraputra@gmail.com'
    const adminPassword = 'admin123' // Default password
    const hashedPassword = await bcrypt.hash(adminPassword, 12)
    
    console.log('👤 Admin Details:')
    console.log(`  Email: ${adminEmail}`)
    console.log(`  Password: ${adminPassword}`)
    console.log(`  Hashed: ${hashedPassword.substring(0, 20)}...`)
    
    // Check if user exists in auth.users
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserByEmail(adminEmail)
    
    if (authError && authError.message.includes('User not found')) {
      console.log('\n📝 Creating new auth user...')
      
      // Create new user in auth.users
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true
      })
      
      if (createError) {
        console.error('❌ Error creating auth user:', createError.message)
        return
      }
      
      console.log('✅ Auth user created successfully')
      console.log(`  User ID: ${newUser.user.id}`)
      
    } else if (authUser) {
      console.log('\n📝 Updating existing auth user...')
      
      // Update existing user password
      const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
        authUser.user.id,
        { password: adminPassword }
      )
      
      if (updateError) {
        console.error('❌ Error updating auth user:', updateError.message)
        return
      }
      
      console.log('✅ Auth user password updated successfully')
      
    } else {
      console.error('❌ Error checking auth user:', authError.message)
      return
    }
    
    console.log('\n🎉 Admin setup completed!')
    console.log('\n📋 Login Credentials:')
    console.log(`  URL: https://feedback.bpskotabatu.com/login`)
    console.log(`  Email: ${adminEmail}`)
    console.log(`  Password: ${adminPassword}`)
    
    console.log('\n🔧 Additional Admin Users:')
    console.log('  Supervisor: herlina.sambodo@bps.go.id')
    console.log('  (Password needs to be set via Supabase Dashboard)')
    
  } catch (error) {
    console.error('❌ Error setting up admin password:', error.message)
    console.log('\nTroubleshooting:')
    console.log('1. Check your Supabase service role key')
    console.log('2. Ensure you have admin access to Supabase')
    console.log('3. Try setting password manually via Supabase Dashboard')
  }
}

setupAdminPassword()
