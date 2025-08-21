// src/lib/team-service.ts
import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

export class TeamService {
  static async getAllTeamMembers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name')

    if (error) throw error

    // Filter out admin users
    const { data: adminUsers, error: adminError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin')

    if (adminError) {
      console.error('Error fetching admin users:', adminError)
      return data || []
    }

    const adminUserIds = adminUsers?.map(u => u.user_id) || []
    return data?.filter(profile => !adminUserIds.includes(profile.id)) || []
  }

  static async getTeamPerformance(periodId?: string) {
    let query = supabase
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
          ),
          assessee:profiles!assessment_assignments_assessee_id_fkey(*)
        )
      `)

    if (periodId) {
      query = query.eq('assignment.period_id', periodId)
    }

    const { data, error } = await query

    if (error) throw error

    // Get admin users to exclude them
    const { data: adminUsers, error: adminError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin')

    const adminUserIds = adminError ? [] : (adminUsers?.map(u => u.user_id) || [])

    // Group by employee
    const employeePerformance = new Map()

    data?.forEach((response: any) => {
      const employeeId = response.assignment.assessee_id
      const employee = response.assignment.assessee

      // Skip admin users
      if (adminUserIds.includes(employeeId)) {
        return
      }

      if (!employeePerformance.has(employeeId)) {
        employeePerformance.set(employeeId, {
          employee,
          ratings: [],
          totalFeedback: 0,
          averageRating: 0,
          aspectRatings: new Map()
        })
      }

      const empData = employeePerformance.get(employeeId)
      empData.ratings.push(response.rating)
      empData.totalFeedback++

      // Group by aspect
      if (!empData.aspectRatings.has(response.aspect)) {
        empData.aspectRatings.set(response.aspect, [])
      }
      empData.aspectRatings.get(response.aspect).push(response.rating)
    })

    // Calculate averages
    const result = Array.from(employeePerformance.values()).map(emp => {
      emp.averageRating = emp.ratings.length > 0 
        ? emp.ratings.reduce((sum: number, r: number) => sum + r, 0) / emp.ratings.length 
        : 0

      // Calculate aspect averages
      const aspectAverages: { [key: string]: number } = {}
      emp.aspectRatings.forEach((ratings: number[], aspect: string) => {
        aspectAverages[aspect] = ratings.reduce((sum, r) => sum + r, 0) / ratings.length
      })
      emp.aspectAverages = aspectAverages

      return emp
    })

    return result.sort((a: any, b: any) => b.averageRating - a.averageRating)
  }

  static async updateProfile(userId: string, updates: Partial<Profile>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async deleteProfile(userId: string) {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (error) throw error
  }

  static async getAssignmentStats(periodId?: string) {
    let query = supabase
      .from('assessment_assignments')
      .select(`
        *,
        period:assessment_periods(
          id,
          month,
          year,
          is_active,
          start_date,
          end_date,
          created_at
        ),
        assessor:profiles!assessment_assignments_assessor_id_fkey(*),
        assessee:profiles!assessment_assignments_assessee_id_fkey(*)
      `)

    if (periodId) {
      query = query.eq('period_id', periodId)
    }

    const { data, error } = await query

    if (error) throw error

    // Get admin users to exclude them
    const { data: adminUsers, error: adminError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin')

    const adminUserIds = adminError ? [] : (adminUsers?.map(u => u.user_id) || [])

    // Filter out assignments involving admin users
    const filteredAssignments = data?.filter((assignment: any) => 
      !adminUserIds.includes(assignment.assessor_id) && 
      !adminUserIds.includes(assignment.assessee_id)
    ) || []

    const stats = {
      total: filteredAssignments.length,
      completed: filteredAssignments.filter((a: any) => a.is_completed).length,
      pending: filteredAssignments.filter((a: any) => !a.is_completed).length,
      completionRate: 0
    }

    stats.completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0

    return { stats, assignments: filteredAssignments }
  }
}