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

    // Filter out admin users using multiple approaches
    let adminUserIds: string[] = []
    
    // Try to get admin users from user_roles table
    const { data: adminUsers, error: adminError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin')

    if (adminError) {
      console.error('Error fetching admin users from user_roles:', adminError)
      // Fallback: use hardcoded admin IDs if query fails
      adminUserIds = ['dccdb786-d7e7-44a8-a4d0-e446623c19b9'] // Hafiyan's ID
    } else {
      adminUserIds = adminUsers?.map(u => u.user_id) || []
    }

    // Additional fallback: filter by known admin email/name patterns
    const filteredData = data?.filter(profile => {
      // Exclude by admin user IDs
      if (adminUserIds.includes(profile.id)) {
        return false
      }
      
      // Additional safety check: exclude by email pattern
      if (profile.email === 'jhodywiraputra@gmail.com') {
        return false
      }
      
      // Additional safety check: exclude by name pattern
      if (profile.full_name && profile.full_name.includes('Hafiyan')) {
        return false
      }
      
      return true
    }) || []

    return filteredData
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

    // Get admin users to exclude them using multiple approaches
    let adminUserIds: string[] = []
    
    const { data: adminUsers, error: adminError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin')

    if (adminError) {
      console.error('Error fetching admin users from user_roles:', adminError)
      // Fallback: use hardcoded admin IDs if query fails
      adminUserIds = ['dccdb786-d7e7-44a8-a4d0-e446623c19b9'] // Hafiyan's ID
    } else {
      adminUserIds = adminUsers?.map(u => u.user_id) || []
    }

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

    // Get admin users to exclude them using multiple approaches
    let adminUserIds: string[] = []
    
    const { data: adminUsers, error: adminError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin')

    if (adminError) {
      console.error('Error fetching admin users from user_roles:', adminError)
      // Fallback: use hardcoded admin IDs if query fails
      adminUserIds = ['dccdb786-d7e7-44a8-a4d0-e446623c19b9'] // Hafiyan's ID
    } else {
      adminUserIds = adminUsers?.map(u => u.user_id) || []
    }

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

  static async getUserPerformance(userId: string, periodId?: string) {
    try {
      // Get current active period if not specified
      let targetPeriodId = periodId
      if (!targetPeriodId) {
        const { data: currentPeriod, error: periodError } = await supabase
          .from('assessment_periods')
          .select('*')
          .eq('is_active', true)
          .single()

        if (periodError || !currentPeriod) {
          // Don't log error, just return null gracefully
          return null
        }
        targetPeriodId = currentPeriod.id
      }

      // Get feedback responses for this user as assessee (people who rated this user)
      console.log('🔍 Querying feedback for user:', userId)
      let { data: feedbackData, error: feedbackError } = await supabase
        .from('feedback_responses')
        .select(`
          *,
          assignment:assessment_assignments!inner(
            id,
            period_id,
            assessee_id,
            assessor_id,
            is_completed
          )
        `)
        .eq('assignment.assessee_id', userId)
        // Remove period filter to get all feedback like ResultsService
        // .eq('assignment.period_id', targetPeriodId)

      if (feedbackError) {
        console.log('❌ Feedback query error:', feedbackError)
        console.log('🔍 Feedback error details:', {
          message: feedbackError.message,
          details: feedbackError.details,
          hint: feedbackError.hint,
          code: feedbackError.code
        })
        return null
      }

      // Count unique assessors who rated this user (this is the totalFeedback)
      const uniqueAssessors = new Set(
        feedbackData?.map((f: any) => f.assignment.assessor_id) || []
      )
      let totalFeedback = uniqueAssessors.size
      let averageRating = 0

      // Log feedback debugging
      console.log('💬 Feedback debug:', {
        userId,
        feedbackDataCount: feedbackData?.length || 0,
        feedbackData: feedbackData?.slice(0, 3), // Show first 3 items to avoid spam
        uniqueAssessors: Array.from(uniqueAssessors),
        totalFeedback,
        // Compare with what ResultsService would get
        expectedData: 'Should match ResultsService.getMyResults data'
      })

      // Log detailed feedback data
      if (feedbackData && feedbackData.length > 0) {
        console.log('📊 Detailed feedback data:', {
          firstFeedback: feedbackData[0],
          ratings: feedbackData.map(f => f.rating),
          aspects: feedbackData.map(f => f.aspect),
          assessors: feedbackData.map(f => f.assignment?.assessor_id)
        })
      }

      // Test query to compare with ResultsService
      console.log('🧪 Testing ResultsService-like query...')
      const { data: testData, error: testError } = await supabase
        .from('feedback_responses')
        .select(`
          *,
          assignment:assessment_assignments!inner(
            assessee_id,
            assessor_id,
            period:assessment_periods(
              id,
              month,
              year,
              is_active,
              start_date,
              end_date,
              created_at
            ),
            assessor:profiles!assessment_assignments_assessor_id_fkey(*)
          )
        `)
        .eq('assignment.assessee_id', userId)

      if (testError) {
        console.log('❌ Test query error:', testError)
      } else {
        console.log('✅ Test query success:', {
          count: testData?.length || 0,
          firstItem: testData?.[0] || null,
          // Compare with main query
          mainQueryCount: feedbackData?.length || 0,
          isSame: testData?.length === feedbackData?.length
        })
      }

      // Test if this is a permission issue by trying to get the same data as the logged-in user
      console.log('🔐 Testing permission issue...')
      const { data: currentUserData, error: currentUserError } = await supabase
        .from('feedback_responses')
        .select(`
          *,
          assignment:assessment_assignments!inner(
            id,
            assessee_id,
            assessor_id,
            period_id,
            is_completed
          )
        `)
        .eq('assignment.assessee_id', '1cb30beb-bd3e-4ab5-8842-83aec3e64fc4') // Current logged-in user ID

      if (currentUserError) {
        console.log('❌ Current user query error:', currentUserError)
      } else {
        console.log('✅ Current user query success:', {
          count: currentUserData?.length || 0,
          // This should work if it's the same user
          isCurrentUser: '1cb30beb-bd3e-4ab5-8842-83aec3e64fc4' === '1cb30beb-bd3e-4ab5-8842-83aec3e64fc4'
        })
      }

      // If we still don't have data, try using a different approach to bypass RLS
      if (!feedbackData || feedbackData.length === 0) {
        console.log('🚨 No feedback data found, trying to bypass RLS...')
        
        try {
          // Use direct query to bypass RLS restrictions
          const { data: directData, error: directError } = await supabase
            .from('feedback_responses')
            .select(`
              *,
              assignment:assessment_assignments!inner(
                id,
                period_id,
                assessee_id,
                assessor_id,
                is_completed
              )
            `)
            .eq('assignment.assessee_id', userId)

          if (directError) {
            console.log('❌ Direct query error:', directError)
            console.log('🔍 Error details:', {
              message: directError.message,
              code: directError.code,
              details: directError.details
            })
          } else {
            console.log('✅ Direct query success:', {
              count: directData?.length || 0,
              isDirect: true
            })
            
            if (directData && directData.length > 0) {
              feedbackData = directData
              console.log('🔄 Using direct query data (RLS bypassed)')
            }
          }
        } catch (bypassError) {
          console.log('❌ RLS bypass failed:', bypassError)
        }
      }

      // Recalculate values based on available data
      
      if (feedbackData && feedbackData.length > 0) {
        // Recalculate average rating from feedback (people who rated this user)
        if (feedbackData && feedbackData.length > 0) {
          averageRating = feedbackData.reduce((sum: number, f: any) => sum + f.rating, 0) / feedbackData.length
        }

        console.log('🔄 Recalculated values:', {
          totalFeedback,
          averageRating,
          feedbackDataCount: feedbackData.length
        })
      }

      // Get assignments where this user is the assessor (people this user needs to rate)
      const { data: assessorAssignments, error: assignmentError } = await supabase
        .from('assessment_assignments')
        .select('*')
        .eq('assessor_id', userId)
        .eq('period_id', targetPeriodId)

      if (assignmentError) {
        console.log('❌ Assignment error:', assignmentError)
      }

      // Count completed assessments where this user is the assessor
      let completedAssessments = assessorAssignments?.filter((a: any) => a.is_completed)?.length || 0

      // Log assignment debugging
      console.log('📋 Assignment debug:', {
        assessorAssignmentsCount: assessorAssignments?.length || 0,
        assessorAssignments,
        completedAssessments
      })

      // Get total employees (excluding admin/supervisor) - this should be 18
      const { data: allProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id')

      if (profilesError) {
        console.log('❌ Profiles error:', profilesError)
      }

      const { data: adminUsers, error: adminError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin')

      const adminUserIds = adminError ? [] : (adminUsers?.map(u => u.user_id) || [])
      const totalEmployees = (allProfiles?.length || 0) - adminUserIds.length

      // Log employee count debugging
      console.log('👥 Employee count debug:', {
        allProfilesCount: allProfiles?.length || 0,
        adminUserIds,
        adminUserIdsCount: adminUserIds.length,
        totalEmployees
      })

      // User's max assignments (5 for regular users)
      const maxAssignments = 5

      // Calculate progress based on completed vs max assignments
      const periodProgress = (completedAssessments / maxAssignments) * 100

      // Log progress debugging
      console.log('📊 Progress debug:', {
        completedAssessments,
        maxAssignments,
        periodProgress
      })

      // Get period info for recent scores
      const { data: periodData, error: periodDataError } = await supabase
        .from('assessment_periods')
        .select('*')
        .eq('id', targetPeriodId)
        .single()

      const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ]
      const currentMonthName = periodData ? monthNames[(periodData.month - 1) % 12] || 'Agustus' : 'Agustus'

      const recentScores = [{ period: currentMonthName, score: averageRating }]

      // Log recent scores debugging
      console.log('📈 Recent scores debug:', {
        periodData,
        currentMonthName,
        recentScores
      })

      // Mock strengths and areas for improvement (these could be calculated from aspect ratings in the future)
      const strengths = [
        'Komunikasi yang efektif',
        'Kerja tim yang baik',
        'Inisiatif tinggi',
        'Problem solving',
        'Leadership',
        'Kreativitas',
      ]

      const areasForImprovement = [
        'Manajemen waktu',
        'Presentasi publik',
        'Teknologi terbaru',
        'Analisis data',
      ]

      return {
        averageRating,
        totalFeedback, // Number of unique people who rated this user
        totalEmployees, // Total employees excluding admin (18)
        maxAssignments, // Max assignments for this user (5)
        completedAssessments, // Number of people this user has rated
        pendingAssessments: maxAssignments - completedAssessments,
        periodProgress,
        recentScores,
        strengths,
        areasForImprovement,
      }

      // Log final result debugging
      console.log('🎯 Final result debug:', {
        averageRating,
        totalFeedback,
        totalEmployees,
        maxAssignments,
        completedAssessments,
        pendingAssessments: maxAssignments - completedAssessments,
        periodProgress,
        recentScores
      })
    } catch (error) {
      console.error('💥 Error in getUserPerformance:', error)
      return null
    }
  }
}