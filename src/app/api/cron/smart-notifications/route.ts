// src/app/api/cron/smart-notifications/route.ts
import { NextResponse } from 'next/server'
import { SmartNotificationServiceImproved } from '@/lib/smart-notification-service'

export async function GET() {
  try {
    console.log('🔄 Starting smart notification generation...')
    
    // Generate notifications for all users
    await SmartNotificationServiceImproved.generateSimpleNotifications()
    
    console.log('✅ Smart notifications generated successfully')
    
    return NextResponse.json({
      success: true,
      message: 'Smart notifications generated successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('❌ Failed to generate smart notifications:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}