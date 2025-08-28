// src/app/api/cron/daily-reminders/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { SmartNotificationServiceImproved } from '@/lib/smart-notification-service'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  // Verify cron secret (untuk keamanan)
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('🔔 Starting daily reminder cron job...')
    
    // Use the new comprehensive daily reminder system
    await SmartNotificationServiceImproved.sendComprehensiveDailyReminders()
    
    // Get analytics summary
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

    // Get today's reminder count
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const { data: todayReminders } = await supabase
      .from('notifications')
      .select('id, type, metadata')
      .eq('type', 'reminder')
      .gte('created_at', today.toISOString())

    const reminderStats = {
      total: todayReminders?.length || 0,
      assessment_360: todayReminders?.filter(r => typeof r.metadata === 'object' && r.metadata !== null && 'notification_type' in r.metadata && (r.metadata as any).notification_type === 'daily_reminder_360').length || 0,
      pin_system: todayReminders?.filter(r => typeof r.metadata === 'object' && r.metadata !== null && 'notification_type' in r.metadata && (r.metadata as any).notification_type === 'daily_reminder_pin').length || 0,
      triwulan: todayReminders?.filter(r => typeof r.metadata === 'object' && r.metadata !== null && 'notification_type' in r.metadata && (r.metadata as any).notification_type === 'daily_reminder_triwulan').length || 0
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Daily reminder cron job completed successfully',
      timestamp: new Date().toISOString(),
      active_periods: {
        assessment: activePeriods?.length || 0,
        pin: activePinPeriods?.length || 0,
        triwulan: activeTriwulanPeriods?.length || 0
      },
      reminders_sent_today: reminderStats
    })
  } catch (error: any) {
    console.error('Daily reminder cron job failed:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process daily reminders', 
        details: error.message,
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    )
  }
}

// POST method untuk manual trigger (untuk testing)
export async function POST(request: NextRequest) {
  try {
    console.log('🔔 Manual trigger of daily reminders...')
    
    // Use the new comprehensive daily reminder system
    await SmartNotificationServiceImproved.sendComprehensiveDailyReminders()
    
    return NextResponse.json({ 
      success: true, 
      message: 'Daily reminders manually triggered successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Manual daily reminder trigger failed:', error)
    return NextResponse.json(
      { 
        error: 'Failed to trigger daily reminders', 
        details: error.message,
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    )
  }
}