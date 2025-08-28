// src/app/api/daily-reminders/route.ts
import { NextResponse } from 'next/server'
import { SmartNotificationServiceImproved } from '@/lib/smart-notification-service'
import { supabase } from '@/lib/supabase'

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
    const { data: activePeriods } = await supabase
      .from('assessment_periods')
      .select('*')
      .eq('is_active', true)

    const { data: activePinPeriods } = await supabase
      .from('pin_periods')
      .select('*')
      .eq('is_active', true)

    const { data: activeTriwulanPeriods } = await supabase
      .from('triwulan_periods')
      .select('*')
      .eq('is_active', true)

    return NextResponse.json({
      success: true,
      message: 'Daily reminder system status',
      active_periods: {
        assessment: activePeriods?.length || 0,
        pin: activePinPeriods?.length || 0,
        triwulan: activeTriwulanPeriods?.length || 0
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