// src/app/api/daily-reminders/route.ts
import { NextResponse } from 'next/server'
import { SmartNotificationServiceImproved } from '@/lib/smart-notification-service'
import { prisma } from '@/lib/prisma'


export async function POST() {
  try {
    console.log('🔔 Starting comprehensive daily reminders...')
    
    // Use the new comprehensive daily reminder system
    await SmartNotificationServiceImproved.sendComprehensiveDailyReminders()
    
    return NextResponse.json({
      success: true,
      message: 'Comprehensive daily reminders sent successfully'
    })
  } catch (error: any) {
    console.error('Failed to send daily reminders:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

// GET method for manual trigger and status check
export async function GET() {
  try {
    console.log('🔍 Checking daily reminder status...')
    
    // Get current active periods
    const activePeriods = await prisma.assessmentPeriod.findMany({
      where: { is_active: true }
    })

    const activePinPeriods = await prisma.pinPeriod.findMany({
      where: { is_active: true }
    })

    // Note: triwulan_periods model is not available in current schema
    // const activeTriwulanPeriods = await prisma.triwulanPeriod.findMany({
    //   where: { is_active: true }
    // })

    return NextResponse.json({
      success: true,
      message: 'Daily reminder system status',
      active_periods: {
        assessment: activePeriods?.length || 0,
        pin: activePinPeriods?.length || 0,
        triwulan: 0 // TODO: Implement when triwulan model is available
      },
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Failed to check daily reminder status:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}