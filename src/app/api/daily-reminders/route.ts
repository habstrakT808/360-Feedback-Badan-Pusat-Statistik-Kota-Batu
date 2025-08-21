// src/app/api/daily-reminders/route.ts
import { NextResponse } from 'next/server'
import { SmartNotificationServiceImproved } from '@/lib/smart-notification-service'

export async function POST() {
  try {
    await SmartNotificationServiceImproved.sendDailyReminders()
    
    return NextResponse.json({
      success: true,
      message: 'Daily reminders sent successfully'
    })
  } catch (error: any) {
    console.error('Failed to send daily reminders:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}