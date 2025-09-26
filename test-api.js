const fetch = require('node-fetch');

async function testCurrentPeriodAPI() {
  try {
    console.log('=== Testing Current Period API ===');
    
    const response = await fetch('http://localhost:3001/api/assessment/current-period');
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('Response data:', JSON.stringify(data, null, 2));
      
      if (data && data.month && data.year) {
        console.log(`✅ API working! Current period: ${data.month}/${data.year}`);
      } else {
        console.log('❌ API returned unexpected data format');
      }
    } else {
      const errorText = await response.text();
      console.log('❌ API error:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

testCurrentPeriodAPI();