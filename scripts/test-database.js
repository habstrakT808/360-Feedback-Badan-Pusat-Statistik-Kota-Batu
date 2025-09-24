const { PrismaClient } = require('@prisma/client');

async function testDatabaseConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Testing database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test if tables exist
    const tableCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log(`📊 Found ${tableCount[0].count} tables in database`);
    
    // Test specific tables
    const tables = ['Profile', 'AssessmentPeriod', 'AssessmentAssignment', 'FeedbackResponse'];
    
    for (const table of tables) {
      try {
        const count = await prisma[table].count();
        console.log(`✅ Table ${table}: ${count} records`);
      } catch (error) {
        console.log(`❌ Table ${table}: Not found or error - ${error.message}`);
      }
    }
    
    console.log('\n🎉 Database test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Check your DATABASE_URL in .env.local');
    console.log('2. Ensure your database is running');
    console.log('3. Verify your database credentials');
    console.log('4. Check if the database exists');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseConnection();
