import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { SupervisorService } from '@/lib/supervisor-service'
import { RolesService } from '@/lib/roles-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const periodId = searchParams.get('periodId') || undefined

    // Resolve target period
    let targetPeriodId = periodId
    if (!targetPeriodId) {
      const { data: activePeriod } = await supabaseAdmin
        .from('assessment_periods')
        .select('id')
        .eq('is_active', true)
        .single()
      if (!activePeriod) {
        return NextResponse.json({ success: false, error: 'No active period found' }, { status: 400 })
      }
      targetPeriodId = activePeriod.id
    }

    // Roles lookup with env overrides
    const { supervisorIds: allSupervisorIds, adminIds } = await RolesService.getRoleUserIds()
    const allRestrictedIds = Array.from(new Set([...allSupervisorIds, ...adminIds]))

    // Fetch feedback responses with joins using admin client (bypass RLS)
    const { data: feedbackData, error: feedbackError } = await supabaseAdmin
      .from('feedback_responses')
      .select(`
        *,
        assignment:assessment_assignments!inner(
          id,
          assessor_id,
          assessee_id,
          period_id,
          is_completed,
          assessor:profiles!assessment_assignments_assessor_id_fkey(
            id,
            full_name,
            email,
            position,
            department,
            avatar_url
          ),
          assessee:profiles!assessment_assignments_assessee_id_fkey(
            id,
            full_name,
            email,
            position,
            department,
            avatar_url
          )
        )
      `)
      .eq('assignment.period_id', targetPeriodId)

    if (feedbackError) {
      return NextResponse.json({ success: false, error: feedbackError.message }, { status: 500 })
    }

    const results = SupervisorService.processFeedbackData(
      feedbackData || [],
      allSupervisorIds,
      allRestrictedIds
    )

    return NextResponse.json({ success: true, results })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch team results' }, { status: 500 })
  }
}
