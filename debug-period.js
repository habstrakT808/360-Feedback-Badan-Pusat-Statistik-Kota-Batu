const { PrismaClient } = require('@prisma/client');

async function checkPeriods() {
  const prisma = new PrismaClient();
  
  try {
    console.log('=== Checking Assessment Periods ===');
    
    // Get all periods
    const allPeriods = await prisma.assessmentPeriod.findMany({
      orderBy: [{ year: 'desc' }, { month: 'desc' }]
    });
    
    console.log('\nAll Assessment Periods:');
    allPeriods.forEach(period => {
      console.log(`- ${period.month}/${period.year}: Active=${period.is_active}, Completed=${period.is_completed}`);
    });
    
    // Get active period
    const activePeriod = await prisma.assessmentPeriod.findFirst({
      where: { is_active: true }
    });
    
    console.log('\nActive Period:');
    if (activePeriod) {
      console.log(`Found: ${activePeriod.month}/${activePeriod.year}`);
    } else {
      console.log('No active period found!');
    }
    
    // Check September 2025 specifically
    const septPeriod = await prisma.assessmentPeriod.findFirst({
      where: { 
        month: 9, 
        year: 2025 
      }
    });
    
    console.log('\nSeptember 2025 Period:');
    if (septPeriod) {
      console.log(`Found: Active=${septPeriod.is_active}, Completed=${septPeriod.is_completed}`);
      console.log(`ID: ${septPeriod.id}`);
    } else {
      console.log('September 2025 period not found!');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPeriods();