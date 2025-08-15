// src/app/api/cron/daily-reminders/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { ReminderService } from '@/lib/reminder-service'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  // Verify cron secret (untuk keamanan)
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get all active assessment periods
    const { data: activePeriods, error: periodsError } = await supabase
      .from('assessment_periods')
      .select('*')
      .eq('is_active', true)

    if (periodsError) {
      throw new Error(`Failed to fetch active periods: ${periodsError.message}`)
    }

    if (!activePeriods || activePeriods.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No active assessment periods found',
        timestamp: new Date().toISOString()
      })
    }

    // Process reminders for each active period
    const results = []
    for (const period of activePeriods) {
      try {
        await ReminderService.scheduleReminders(period.id)
        results.push({
          period_id: period.id,
          month: period.month,
          year: period.year,
          status: 'success',
          message: 'Reminders scheduled successfully'
        })
      } catch (error) {
        console.error(`Failed to schedule reminders for period ${period.id}:`, error)
        results.push({
          period_id: period.id,
          month: period.month,
          year: period.year,
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // Get analytics summary
    const analyticsSummary = await Promise.all(
      activePeriods.map(async (period) => {
        try {
          const analytics = await ReminderService.getReminderAnalytics(period.id)
          return {
            period_id: period.id,
            month: period.month,
            year: period.year,
            total_assignments: analytics.total_assignments,
            completed_assignments: analytics.completed_assignments,
            pending_assignments: analytics.pending_assignments,
            completion_rate: analytics.completion_rate.toFixed(2) + '%',
            deadline_proximity: analytics.deadline_proximity,
            recommendations: analytics.recommendations
          }
        } catch (error) {
          return {
            period_id: period.id,
            month: period.month,
            year: period.year,
            error: error instanceof Error ? error.message : 'Failed to get analytics'
          }
        }
      })
    )
    
    return NextResponse.json({ 
      success: true, 
      message: 'Daily reminders processed successfully',
      timestamp: new Date().toISOString(),
      periods_processed: activePeriods.length,
      results,
      analytics_summary: analyticsSummary
    })
  } catch (error: any) {
    console.error('Cron job failed:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process reminders', 
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
    const body = await request.json()
    const { period_id } = body

    if (!period_id) {
      return NextResponse.json({ error: 'period_id is required' }, { status: 400 })
    }

    // Schedule reminders for specific period
    await ReminderService.scheduleReminders(period_id)
    
    // Get analytics for the period
    const analytics = await ReminderService.getReminderAnalytics(period_id)
    
    return NextResponse.json({ 
      success: true, 
      message: `Reminders scheduled for period ${period_id}`,
      period_id,
      analytics,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Manual reminder trigger failed:', error)
    return NextResponse.json(
      { 
        error: 'Failed to schedule reminders', 
        details: error.message,
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    )
  }
}