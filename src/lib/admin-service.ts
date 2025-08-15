// src/lib/admin-service.ts
import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']
type AssessmentPeriod = Database['public']['Tables']['assessment_periods']['Row']

export class AdminService {
  // User Management
  static async getAllUsers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

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
    return data?.filter(user => !adminUserIds.includes(user.id)) || []
  }

  static async createUser(userData: {
    email: string
    password: string
    full_name: string
    position: string
    department: string
  }) {
    // Note: This requires admin privileges and should be done server-side
    // For now, return a placeholder response
    console.warn('createUser should be implemented server-side')
    return { id: 'placeholder', email: userData.email }
  }

  static async updateUser(userId: string, updates: Partial<Profile>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async deleteUser(userId: string) {
    // Note: This requires admin privileges and should be done server-side
    console.warn('deleteUser should be implemented server-side')
    return true
  }

  static async resetUserPassword(userId: string) {
    // Note: This requires admin privileges and should be done server-side
    console.warn('resetUserPassword should be implemented server-side')
    return { url: 'placeholder' }
  }

  // Period Management
  static async getAllPeriods() {
    const { data, error } = await supabase
      .from('assessment_periods')
      .select(`
        *,
        assigned_count:assessment_assignments(count),
        completed_count:assessment_assignments(count)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    
    // Process the data to get actual counts
    const processedData = await Promise.all(
      (data || []).map(async (period) => {
        // Get assigned count
        const { count: assignedCount } = await supabase
          .from('assessment_assignments')
          .select('*', { count: 'exact', head: true })
          .eq('period_id', period.id)

        // Get completed count
        const { count: completedCount } = await supabase
          .from('assessment_assignments')
          .select('*', { count: 'exact', head: true })
          .eq('period_id', period.id)
          .eq('is_completed', true)

        return {
          ...period,
          assigned_count: assignedCount || 0,
          completed_count: completedCount || 0
        }
      })
    )

    return processedData
  }

  static async createPeriod(periodData: {
    month: number
    year: number
    start_date: string
    end_date: string
  }) {
    // Deactivate current active period
    await supabase
      .from('assessment_periods')
      .update({ is_active: false })
      .eq('is_active', true)

    // Create new period
    const { data, error } = await supabase
      .from('assessment_periods')
      .insert({
        ...periodData,
        is_active: true
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async updatePeriod(periodId: string, updates: Partial<AssessmentPeriod>) {
    const { data, error } = await supabase
      .from('assessment_periods')
      .update(updates)
      .eq('id', periodId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async deletePeriod(periodId: string) {
    const { error } = await supabase
      .from('assessment_periods')
      .delete()
      .eq('id', periodId)

    if (error) throw error
  }

  static async generateAssignments(periodId: string) {
    const { data, error } = await supabase.rpc('generate_random_assignments', {
      period_uuid: periodId
    })

    if (error) throw error
    return data
  }

  static async completeAllAssignments(periodId: string) {
    try {
      // Use the database function to mark period as completed
      const { error } = await supabase.rpc('mark_period_completed', {
        period_uuid: periodId
      })

      if (error) {
        // Fallback: manually update the database
        console.log('RPC failed, using manual update...');
        return await this.manuallyCompletePeriod(periodId);
      }

      return { success: true }
    } catch (error) {
      console.error('Error in completeAllAssignments:', error);
      // Fallback to manual method
      return await this.manuallyCompletePeriod(periodId);
    }
  }

  private static async ensureCompletionFieldsExist() {
    // This function will be implemented when database is properly migrated
    console.log('Completion fields check skipped - manual migration required');
  }

  private static async manuallyCompletePeriod(periodId: string) {
    try {
      // Update period to mark as completed
      const { error: periodError } = await supabase
        .from('assessment_periods')
        .update({
          is_active: false,
          end_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', periodId)

      if (periodError) {
        console.error('Error updating period:', periodError);
        throw periodError;
      }

      // Mark all assignments as completed
      const { error: assignmentError } = await supabase
        .from('assessment_assignments')
        .update({
          is_completed: true,
          completed_at: new Date().toISOString()
        })
        .eq('period_id', periodId)
        .eq('is_completed', false)

      if (assignmentError) {
        console.error('Error updating assignments:', assignmentError);
        throw assignmentError;
      }

      return { success: true }
    } catch (error) {
      console.error('Error in manual completion:', error);
      throw error;
    }
  }

  // Analytics & Reports
  static async getSystemStats() {
    try {
      // Get admin users to exclude them from stats
      const { data: adminUsers, error: adminError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin')

      const adminUserIds = adminError ? [] : (adminUsers?.map(u => u.user_id) || [])

      const [
        { count: totalUsers },
        { count: totalPeriods },
        { count: totalAssignments },
        { count: completedAssignments }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('assessment_periods').select('*', { count: 'exact', head: true }),
        supabase.from('assessment_assignments').select('*', { count: 'exact', head: true }),
        supabase.from('assessment_assignments').select('*', { count: 'exact', head: true }).eq('is_completed', true)
      ])

      // Filter assignments to exclude admin users
      const { data: allAssignments, error: assignmentsError } = await supabase
        .from('assessment_assignments')
        .select('assessor_id, assessee_id, is_completed')

      if (assignmentsError) {
        console.error('Error fetching assignments for filtering:', assignmentsError)
      }

      const filteredAssignments = allAssignments?.filter(assignment => 
        !adminUserIds.includes(assignment.assessor_id) && 
        !adminUserIds.includes(assignment.assessee_id)
      ) || []

      const actualTotalAssignments = filteredAssignments.length
      const actualCompletedAssignments = filteredAssignments.filter(a => a.is_completed).length
      const actualPendingAssignments = actualTotalAssignments - actualCompletedAssignments
      const actualTotalUsers = (totalUsers || 0) - adminUserIds.length

      const completionRate = actualTotalAssignments > 0 ? (actualCompletedAssignments / actualTotalAssignments) * 100 : 0

      return {
        totalUsers: actualTotalUsers,
        totalPeriods,
        totalAssignments: actualTotalAssignments,
        completedAssignments: actualCompletedAssignments,
        pendingAssignments: actualPendingAssignments,
        completionRate: Math.round(completionRate)
      }
    } catch (error) {
      console.error('Error getting system stats:', error)
      return {
        totalUsers: 0,
        totalPeriods: 0,
        totalAssignments: 0,
        completedAssignments: 0,
        pendingAssignments: 0,
        completionRate: 0
      }
    }
  }

  static async getActivityLogs(limit = 50) {
    try {
      // Get recent assignments with proper error handling
      const { data: recentActivity, error } = await supabase
        .from('assessment_assignments')
        .select(`
          id,
          created_at,
          is_completed,
          completed_at,
          assessor:profiles!assessment_assignments_assessor_id_fkey(
            id,
            full_name
          ),
          assessee:profiles!assessment_assignments_assessee_id_fkey(
            id,
            full_name
          ),
          period:assessment_periods(
            id,
            month,
            year
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching activity logs:', error)
        // Return empty array instead of throwing error
        return []
      }

      // Get admin users to exclude them
      const { data: adminUsers, error: adminError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin')

      const adminUserIds = adminError ? [] : (adminUsers?.map(u => u.user_id) || [])

      // Filter out any entries with missing required data and admin users
      const validActivities = recentActivity?.filter(activity => 
        activity.assessor && 
        activity.assessee && 
        activity.period &&
        !adminUserIds.includes(activity.assessor.id) &&
        !adminUserIds.includes(activity.assessee.id)
      ) || []

      return validActivities
    } catch (error) {
      console.error('Unexpected error in getActivityLogs:', error)
      return []
    }
  }

  // System Settings
  static async getSystemSettings() {
    // This would come from a settings table
    // For now, return default settings
    return {
      assessmentDuration: 30, // days
      reminderInterval: 7, // days
      maxAssignmentsPerUser: 5,
      allowSelfAssessment: false,
      requireComments: false,
      anonymousFeedback: true
    }
  }

  static async updateSystemSettings(settings: any) {
    // Update system settings
    // Implementation depends on your settings storage
    return settings
  }

  // Bulk Operations
  static async bulkImportUsers(users: any[]) {
    const results = []
    for (const user of users) {
      try {
        const result = await this.createUser(user)
        results.push({ success: true, user: result, email: user.email })
      } catch (error: any) {
        results.push({ success: false, error: error.message, email: user.email })
      }
    }
    return results
  }

  static async bulkDeleteUsers(userIds: string[]) {
    const results = []
    for (const userId of userIds) {
      try {
        await this.deleteUser(userId)
        results.push({ success: true, userId })
      } catch (error: any) {
        results.push({ success: false, error: error.message, userId })
      }
    }
    return results
  }
}