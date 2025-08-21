// src/app/api/generate-notifications/route.ts
import { NextResponse } from 'next/server'
import { SmartNotificationServiceImproved } from '@/lib/smart-notification-service'

export async function POST() {
  try {
    await SmartNotificationServiceImproved.generateSimpleNotifications()
    
    return NextResponse.json({
      success: true,
      message: 'Notifications generated successfully without duplicates'
    })
  } catch (error: any) {
    console.error('Failed to generate notifications:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    await SmartNotificationServiceImproved.removeDuplicates()
    
    return NextResponse.json({
      success: true,
      message: 'Duplicate notifications cleaned up successfully'
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}