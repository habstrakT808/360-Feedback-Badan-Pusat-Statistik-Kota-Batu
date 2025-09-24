const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up database for Hostinger deployment...\n');

// Check if .env.local exists
const envPath = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local file not found!');
  console.log('Please create .env.local file with your database configuration.');
  console.log('See env.example for reference.');
  process.exit(1);
}

try {
  // Generate Prisma client
  console.log('📦 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma client generated successfully\n');

  // Push schema to database
  console.log('🗄️ Pushing schema to database...');
  execSync('npx prisma db push', { stdio: 'inherit' });
  console.log('✅ Database schema pushed successfully\n');

  // Check if backup data exists
  const backupDir = path.join(__dirname, '..', 'Backup');
  if (fs.existsSync(backupDir)) {
    console.log('📁 Backup data found. You can import it using:');
    console.log('   node scripts/import-from-backup.js\n');
  }

  console.log('🎉 Database setup completed successfully!');
  console.log('\nNext steps:');
  console.log('1. Test your database connection');
  console.log('2. Build your project: npm run build');
  console.log('3. Deploy to Hostinger following the DEPLOYMENT_GUIDE.md');

} catch (error) {
  console.error('❌ Error setting up database:', error.message);
  console.log('\nTroubleshooting:');
  console.log('1. Check your DATABASE_URL in .env.local');
  console.log('2. Ensure your database is accessible');
  console.log('3. Verify your database credentials');
  process.exit(1);
}
