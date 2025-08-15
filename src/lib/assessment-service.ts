// src/lib/assessment-service.ts
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
    // Check if user is admin
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single()

    if (roleError && roleError.code !== 'PGRST116') {
      throw roleError
    }

    // If user is admin, return empty array
    if (userRole?.role === 'admin') {
      return []
    }

    const { data, error } = await supabase
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
        period:assessment_periods(*)
      `)
      .eq('assessor_id', userId)
      .eq('is_completed', false)

    if (error) throw error
    return data
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

  static async getMyFeedback(userId: string) {
    const { data, error } = await supabase
      .from('feedback_responses')
      .select(`
        *,
        assignment:assessment_assignments!inner(
          assessee_id,
          period:assessment_periods(*)
        )
      `)
      .eq('assignment.assessee_id', userId)

    if (error) throw error
    return data
  }
}