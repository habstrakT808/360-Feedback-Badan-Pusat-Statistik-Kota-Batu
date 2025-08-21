// src/app/api/cleanup-duplicates/route.ts
import { NextResponse } from 'next/server'
import { SmartNotificationServiceImproved } from '@/lib/smart-notification-service'

export async function POST() {
  try {
    await SmartNotificationServiceImproved.removeDuplicates()
    
    return NextResponse.json({
      success: true,
      message: 'Duplicate notifications cleaned up successfully'
    })
  } catch (error: any) {
    console.error('Failed to cleanup duplicates:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}