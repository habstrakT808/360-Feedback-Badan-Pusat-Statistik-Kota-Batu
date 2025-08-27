// src/lib/assessment-service.ts (REPLACE COMPLETE FILE)
import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/database.types'

type AssessmentAssignment = Database['public']['Tables']['assessment_assignments']['Row']
type FeedbackResponse = Database['public']['Tables']['feedback_responses']['Insert']

export class AssessmentService {
  static async getCurrentPeriod() {
    const { data, error } = await supabase
      .from('assessment_periods')
      .select('*')
      .eq('is_active', true)
      .single()

    if (error || !data) {
      console.error('No active period found:', error || 'No data returned')
      return null
    }
    return data
  }

  static async getMyAssignments(userId: string) {
    try {
      // Check if user is admin or supervisor
      const { data: userRole, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single()

      if (roleError && roleError.code !== 'PGRST116') {
        console.error('Error checking user role:', roleError)
        throw roleError
      }

      console.log('User role check:', { userId, role: userRole?.role })

      // If user is admin or supervisor, return empty array (they don't have random assignments)
      if (userRole?.role === 'admin' || userRole?.role === 'supervisor') {
        console.log('User is admin or supervisor, returning empty assignments')
        return []
      }

      // For regular users, get their assignments for active period
      const { data: active } = await supabase
        .from('assessment_periods')
        .select('id')
        .eq('is_active', true)
        .single()

      // Ensure strong typing: only treat as string when it actually is one
      const activePeriodId: string | undefined =
        typeof active?.id === 'string' ? active.id : undefined

      let query = supabase
        .from('assessment_assignments')
        .select(`
          *,
          assessee:profiles!assessment_assignments_assessee_id_fkey(
            id,
            full_name,
            username,
            position,
            department,
            avatar_url
          ),
          period:assessment_periods(
            id,
            month,
            year,
            is_active,
            start_date,
            end_date,
            created_at
          )
        `)
        .eq('assessor_id', userId)
        // Include both completed and not completed assignments
        // but only for the current active period when available
      if (typeof activePeriodId === 'string') {
        query = query.eq('period_id', activePeriodId)
      }
      query = query.order('created_at', { ascending: false })

      const { data, error } = await query

      if (error) {
        console.error('Error fetching assignments:', error)
        throw error
      }

      // If no assignments for the active period, try to generate (server endpoint bypass RLS)
      if ((data || []).length === 0 && typeof activePeriodId === 'string') {
        try {
          await fetch('/api/admin/generate-assignments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ periodId: activePeriodId })
          })
          // Re-fetch after generation
          let retryQuery = supabase
            .from('assessment_assignments')
            .select(`
              *,
              assessee:profiles!assessment_assignments_assessee_id_fkey(
                id,
                full_name,
                username,
                position,
                department,
                avatar_url
              ),
              period:assessment_periods(
                id,
                month,
                year,
                is_active,
                start_date,
                end_date,
                created_at
              )
            `)
            .eq('assessor_id', userId)

          if (typeof activePeriodId === 'string') {
            retryQuery = retryQuery.eq('period_id', activePeriodId)
          }

          retryQuery = retryQuery.order('created_at', { ascending: false })

          const { data: retry } = await retryQuery

          console.log('Assignments after generation:', retry?.length || 0)
          return retry || []
        } catch (genErr) {
          console.warn('Assignment generation skipped:', genErr)
        }
      }

      console.log('Regular user assignments:', data?.length || 0)
      return data || []
    } catch (error) {
      console.error('Error in getMyAssignments:', error)
      throw error
    }
  }

  static async submitFeedback(
    assignmentId: string,
    responses: Array<{
      aspect: string
      indicator: string
      rating: number
      comment?: string
    }>
  ) {
    // Remove existing responses to allow editing
    const { error: deleteError } = await supabase
      .from('feedback_responses')
      .delete()
      .eq('assignment_id', assignmentId)

    if (deleteError) throw deleteError

    const { error: feedbackError } = await supabase
      .from('feedback_responses')
      .insert(
        responses.map(response => ({
          assignment_id: assignmentId,
          ...response
        }))
      )

    if (feedbackError) throw feedbackError

    const { error: assignmentError } = await supabase
      .from('assessment_assignments')
      .update({
        is_completed: true,
        completed_at: new Date().toISOString()
      })
      .eq('id', assignmentId)

    if (assignmentError) throw assignmentError
  }

  static async getExistingResponses(assignmentId: string) {
    const { data, error } = await supabase
      .from('feedback_responses')
      .select('*')
      .eq('assignment_id', assignmentId)

    if (error) throw error
    return data || []
  }

  static async getMyFeedback(userId: string) {
    const { data, error } = await supabase
      .from('feedback_responses')
      .select(`
        *,
        assignment:assessment_assignments!inner(
          assessee_id,
          period:assessment_periods(
            id,
            month,
            year,
            is_active,
            start_date,
            end_date,
            created_at
          )
        )
      `)
      .eq('assignment.assessee_id', userId)

    if (error) throw error
    return data
  }

  // Check if user is supervisor
  static async isSupervisor(userId: string) {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single()

    if (error) return false
    return data?.role === 'supervisor'
  }

  // Check if user is admin
  static async isAdmin(userId: string) {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single()

    if (error) return false
    return data?.role === 'admin'
  }
}