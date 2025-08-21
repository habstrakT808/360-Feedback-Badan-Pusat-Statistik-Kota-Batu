import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { SupervisorService } from '@/lib/supervisor-service'

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

    // Roles lookup
    const { data: userRoles } = await supabaseAdmin
      .from('user_roles')
      .select('user_id, role')

    const supervisorIds = (userRoles || [])
      .filter(r => r.role === 'supervisor')
      .map(r => r.user_id)
      .filter((id): id is string => !!id)

    const adminIds = (userRoles || [])
      .filter(r => r.role === 'admin')
      .map(r => r.user_id)
      .filter((id): id is string => !!id)

    // Fallback known IDs if roles are empty
    const allSupervisorIds = supervisorIds.length > 0 ? supervisorIds : ['678ad9e9-cc08-4101-b735-6d2e1feaab3a']
    const allRestrictedIds = Array.from(new Set([...allSupervisorIds, ...adminIds, 'dccdb786-d7e7-44a8-a4d0-e446623c19b9']))

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
            department
          ),
          assessee:profiles!assessment_assignments_assessee_id_fkey(
            id,
            full_name,
            email,
            position,
            department
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
