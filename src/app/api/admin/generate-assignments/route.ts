import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const { periodId } = await request.json()

    let targetPeriodId = periodId as string | undefined
    if (!targetPeriodId) {
      const { data: active } = await supabaseAdmin
        .from('assessment_periods')
        .select('id')
        .eq('is_active', true)
        .single()
      if (!active) {
        return NextResponse.json({ success: false, error: 'No active period found' }, { status: 400 })
      }
      targetPeriodId = active.id
    }

    const { error } = await supabaseAdmin.rpc('generate_random_assignments', { period_uuid: targetPeriodId })
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || 'Failed to generate assignments' }, { status: 500 })
  }
}
