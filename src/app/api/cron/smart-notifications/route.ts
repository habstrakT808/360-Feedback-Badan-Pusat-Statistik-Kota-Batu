// src/app/api/cron/smart-notifications/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { SmartNotificationService } from '@/lib/smart-notification-service'

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await SmartNotificationService.generateNotificationsForAllUsers()
    
    return NextResponse.json({ 
      success: true, 
      message: 'Smart notifications generated successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Smart notification cron job failed:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate smart notifications', 
        details: error.message,
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    )
  }
}