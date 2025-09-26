const { PrismaClient } = require('@prisma/client');

async function activateSeptemberPeriod() {
  const prisma = new PrismaClient();
  
  try {
    console.log('=== Activating September 2025 Period ===');
    
    // First, deactivate all currently active periods
    const deactivated = await prisma.assessmentPeriod.updateMany({
      where: { is_active: true },
      data: { is_active: false }
    });
    
    console.log(`Deactivated ${deactivated.count} periods`);
    
    // Then activate September 2025 period
    const activated = await prisma.assessmentPeriod.updateMany({
      where: { 
        month: 9, 
        year: 2025 
      },
      data: { is_active: true }
    });
    
    console.log(`Activated ${activated.count} periods`);
    
    // Verify the change
    const activePeriod = await prisma.assessmentPeriod.findFirst({
      where: { is_active: true }
    });
    
    if (activePeriod) {
      console.log(`✅ Success! Active period is now: ${activePeriod.month}/${activePeriod.year}`);
    } else {
      console.log('❌ Failed to activate period');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

activateSeptemberPeriod();