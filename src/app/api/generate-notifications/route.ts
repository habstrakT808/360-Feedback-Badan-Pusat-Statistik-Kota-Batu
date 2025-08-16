// src/app/api/generate-notifications/route.ts
import { NextResponse } from 'next/server'
import { SmartNotificationService } from '@/lib/smart-notification-service'

export async function POST() {
  try {
    await SmartNotificationService.generateSimpleNotifications()
    
    return NextResponse.json({
      success: true,
      message: 'Simple notifications generated for all users'
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
    await SmartNotificationService.removeDuplicates()
    
    return NextResponse.json({
      success: true,
      message: 'Duplicate notifications cleaned up'
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}