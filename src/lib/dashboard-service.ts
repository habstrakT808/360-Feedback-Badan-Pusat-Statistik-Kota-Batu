// src/lib/dashboard-service.ts
import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']
type AssessmentAssignment = Database['public']['Tables']['assessment_assignments']['Row']
type AssessmentPeriod = Database['public']['Tables']['assessment_periods']['Row']
type FeedbackResponse = Database['public']['Tables']['feedback_responses']['Row']

export interface DashboardStats {
  totalEmployees: number
  completedAssessments: number
  pendingAssessments: number
  currentPeriod: string
  myProgress: number
  averageRating: number
  myAssignments: AssessmentAssignment[]
  currentPeriodData: AssessmentPeriod | null
}

export class DashboardService {
  static async getDashboardStats(userId: string): Promise<DashboardStats> {
    try {
      // Get current active period
      const { data: currentPeriod, error: periodError } = await supabase
        .from('assessment_periods')
        .select('*')
        .eq('is_active', true)
        .maybeSingle()

      if (periodError || !currentPeriod) {
        if (periodError) {
          console.error('Error fetching current period:', periodError)
        } else {
          console.log('No active period found - using default stats')
        }
        return this.getDefaultStats()
      }

      // Get total employees (profiles) excluding admin users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id')
        .neq('id', userId) // Exclude current user

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError)
        return this.getDefaultStats()
      }

      // Filter out admin users
      const { data: adminUsers, error: adminError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin')

      if (adminError) {
        console.error('Error fetching admin users:', adminError)
        return this.getDefaultStats()
      }

      const adminUserIds = adminUsers?.map(u => u.user_id) || []
      const nonAdminProfiles = profiles?.filter(p => !adminUserIds.includes(p.id)) || []
      const totalEmployees = nonAdminProfiles.length

      // Get my assignments for current period
      const { data: myAssignments, error: assignmentsError } = await supabase
        .from('assessment_assignments')
        .select(`
          *,
          assessee:profiles!assessment_assignments_assessee_id_fkey(
            id,
            full_name,
            username,
            position,
            department
          )
        `)
        .eq('assessor_id', userId)
        .eq('period_id', currentPeriod.id)

      if (assignmentsError) {
        console.error('Error fetching assignments:', assignmentsError)
        return this.getDefaultStats()
      }

      const completedAssessments = myAssignments?.filter(a => a.is_completed).length || 0
      const pendingAssessments = myAssignments?.filter(a => !a.is_completed).length || 0
      
      // Calculate progress based on actual assignments, not total employees
      const totalAssignments = myAssignments?.length || 0
      const myProgress = totalAssignments > 0 ? Math.round((completedAssessments / totalAssignments) * 100) : 0

      // Debug logging for progress calculation
      console.log('Progress Calculation Debug:', {
        totalEmployees,
        totalAssignments,
        completedAssessments,
        pendingAssessments,
        myProgress,
        userId,
        periodId: currentPeriod.id
      })

      // Get my average rating from feedback received
      const { data: myFeedback, error: feedbackError } = await supabase
        .from('feedback_responses')
        .select(`
          rating,
          assignment:assessment_assignments!inner(
            assessee_id,
            period_id
          )
        `)
        .eq('assignment.assessee_id', userId)
        .eq('assignment.period_id', currentPeriod.id)

      let averageRating = 0
      if (!feedbackError && myFeedback && myFeedback.length > 0) {
        const totalRating = myFeedback.reduce((sum, f) => sum + f.rating, 0)
        averageRating = Math.round((totalRating / myFeedback.length) * 10) / 10
      }

      // Format current period
      const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ]
      const currentPeriodText = `${monthNames[currentPeriod.month - 1]} ${currentPeriod.year}`

      return {
        totalEmployees,
        completedAssessments,
        pendingAssessments,
        currentPeriod: currentPeriodText,
        myProgress,
        averageRating,
        myAssignments: myAssignments || [],
        currentPeriodData: currentPeriod
      }
    } catch (error) {
      console.error('Error in getDashboardStats:', error instanceof Error ? error.message : 'Unknown error')
      return this.getDefaultStats()
    }
  }

  private static getDefaultStats(): DashboardStats {
    return {
      totalEmployees: 0,
      completedAssessments: 0,
      pendingAssessments: 0,
      currentPeriod: 'Tidak ada periode aktif',
      myProgress: 0,
      averageRating: 0,
      myAssignments: [],
      currentPeriodData: null
    }
  }

  static async getMyRecentActivity(userId: string) {
    try {
      const { data: currentPeriod, error: periodError } = await supabase
        .from('assessment_periods')
        .select('id')
        .eq('is_active', true)
        .maybeSingle()

      if (periodError || !currentPeriod) {
        if (periodError) {
          console.error('Error fetching period for recent activity:', periodError)
        } else {
          console.log('No active period found for recent activity')
        }
        return []
      }

      // Get recent feedback received
      const { data: recentFeedback } = await supabase
        .from('feedback_responses')
        .select(`
          created_at,
          assignment:assessment_assignments!inner(
            assessee_id,
            period_id,
            assessor:profiles!assessment_assignments_assessor_id_fkey(full_name)
          )
        `)
        .eq('assignment.assessee_id', userId)
        .eq('assignment.period_id', currentPeriod.id)
        .order('created_at', { ascending: false })
        .limit(5)

      // Get recent completed assessments
      const { data: recentCompleted } = await supabase
        .from('assessment_assignments')
        .select(`
          completed_at,
          assessee:profiles!assessment_assignments_assessee_id_fkey(full_name)
        `)
        .eq('assessor_id', userId)
        .eq('period_id', currentPeriod.id)
        .eq('is_completed', true)
        .order('completed_at', { ascending: false })
        .limit(5)

      const activities = []

      if (recentFeedback && recentFeedback.length > 0) {
        activities.push({
          type: 'feedback_received',
          message: 'Feedback dari rekan kerja diterima',
          timestamp: recentFeedback[0].created_at,
          priority: 'medium'
        })
      }

      if (recentCompleted && recentCompleted.length > 0) {
        activities.push({
          type: 'assessment_completed',
          message: `Penilaian untuk ${recentCompleted.length} orang selesai`,
          timestamp: recentCompleted[0].completed_at,
          priority: 'high'
        })
      }

      // Add reminder if there are pending assessments
      const { count: pendingCount } = await supabase
        .from('assessment_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('assessor_id', userId)
        .eq('period_id', currentPeriod.id)
        .eq('is_completed', false)

      if (pendingCount && pendingCount > 0) {
        activities.push({
          type: 'reminder',
          message: `Reminder: ${pendingCount} penilaian tersisa`,
          timestamp: new Date().toISOString(),
          priority: 'urgent'
        })
      }

      return activities.sort((a, b) => {
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0
        return timeB - timeA
      })
    } catch (error) {
      console.error('Error fetching recent activity:', error)
      return []
    }
  }
}
