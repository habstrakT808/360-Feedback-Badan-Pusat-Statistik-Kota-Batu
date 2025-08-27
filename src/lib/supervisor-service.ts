// src/lib/supervisor-service.ts (REPLACE METHOD getAllUsersWithResults - DATABASE VERSION)
import { supabase } from '@/lib/supabase'
import { RolesService } from '@/lib/roles-service'
import { Database } from '@/lib/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']
type FeedbackResponse = Database['public']['Tables']['feedback_responses']['Insert']

export class SupervisorService {
  // Get all non-admin, non-supervisor users for supervisor to assess
  static async getAllAssessableUsers() {
    try {
      console.log('🔍 SupervisorService.getAllAssessableUsers() called')
      
      // Step 1: Get all profiles first
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name')

      if (profilesError) {
        console.error('❌ Error fetching profiles:', profilesError)
        throw profilesError
      }

      console.log('📋 Total profiles found:', profiles?.length || 0)

      // Step 2: Get restricted users using roles service (with env overrides)
      const { adminIds, supervisorIds } = await RolesService.getRoleUserIds()
      const allRestrictedIds = [...new Set([...adminIds, ...supervisorIds])]
      
      console.log('🚫 Restricted user IDs:', allRestrictedIds)

      // Step 3: Filter out restricted users
      const assessableUsers = profiles?.filter(profile => {
        const isRestricted = allRestrictedIds.includes(profile.id)
        console.log(`👤 User ${profile.full_name} (${profile.email}) - ID: ${profile.id} - ${isRestricted ? '❌ RESTRICTED' : '✅ ALLOWED'}`)
        return !isRestricted
      }) || []

      console.log('✅ Final assessable users count:', assessableUsers.length)
      console.log('✅ Final assessable users:', assessableUsers.map(u => ({ name: u.full_name, email: u.email, id: u.id })))

      return assessableUsers
    } catch (error) {
      console.error('💥 Error in getAllAssessableUsers:', error)
      throw error
    }
  }

  // Submit supervisor assessment (1-100 scale)
  static async submitSupervisorAssessment(
    assesseeId: string,
    periodId: string,
    responses: Array<{
      aspect: string
      indicator: string
      rating: number // 1-100 scale
      comment?: string
    }>
  ) {
    try {
      console.log('🔍 Starting supervisor assessment submission...')
      console.log('📊 Assessee ID:', assesseeId)
      console.log('📅 Period ID:', periodId)
      console.log('📝 Responses count:', responses.length)
      
      const currentUser = await supabase.auth.getUser()
      if (!currentUser.data.user) {
        console.error('❌ User not authenticated')
        throw new Error('Not authenticated')
      }
      
      console.log('👤 Current user ID:', currentUser.data.user.id)

      // Check if supervisor assignment already exists
      console.log('🔍 Checking for existing assignment...')
      let { data: existingAssignment, error: checkError } = await supabase
        .from('assessment_assignments')
        .select('id')
        .eq('assessor_id', currentUser.data.user.id)
        .eq('assessee_id', assesseeId)
        .eq('period_id', periodId)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('❌ Error checking existing assignment:', checkError)
        throw checkError
      }

      // Create assignment if it doesn't exist
      if (!existingAssignment) {
        console.log('➕ Creating new assignment...')
        const { data: newAssignment, error: assignmentError } = await supabase
          .from('assessment_assignments')
          .insert({
            assessor_id: currentUser.data.user.id,
            assessee_id: assesseeId,
            period_id: periodId,
            is_completed: false
          })
          .select('id')
          .single()

        if (assignmentError) {
          console.error('❌ Error creating assignment:', assignmentError)
          throw assignmentError
        }
        existingAssignment = newAssignment
        console.log('✅ Assignment created with ID:', existingAssignment.id)
      } else {
        console.log('✅ Using existing assignment ID:', existingAssignment.id)
      }

      // Delete existing feedback responses for this assignment
      console.log('🗑️ Deleting existing feedback responses...')
      const { error: deleteError } = await supabase
        .from('feedback_responses')
        .delete()
        .eq('assignment_id', existingAssignment.id)

      if (deleteError) {
        console.error('❌ Error deleting existing responses:', deleteError)
        throw deleteError
      }

      // Prepare feedback responses data
      const feedbackData = responses.map(response => {
        // Ensure rating is within valid range for supervisor (1-100)
        const validRating = Math.max(1, Math.min(100, response.rating))
        
        console.log(`📊 Processing response: aspect=${response.aspect}, rating=${response.rating} -> ${validRating}`)
        
        return {
          assignment_id: existingAssignment.id,
          aspect: response.aspect,
          indicator: response.indicator,
          rating: validRating,
          comment: response.comment || null
        }
      })

      console.log('📝 Inserting feedback responses:', feedbackData.length, 'responses')
      console.log('📝 Sample feedback data:', feedbackData[0])

      // Submit new feedback responses
      const { data: insertedData, error: feedbackError } = await supabase
        .from('feedback_responses')
        .insert(feedbackData)
        .select()

      if (feedbackError) {
        console.error('❌ Error inserting feedback responses:', feedbackError)
        console.error('❌ Error details:', feedbackError.details)
        console.error('❌ Error hint:', feedbackError.hint)
        console.error('❌ Error code:', feedbackError.code)
        console.error('❌ Error message:', feedbackError.message)
        throw feedbackError
      }

      console.log('✅ Feedback responses inserted successfully')

      // Mark assignment as completed
      console.log('✅ Marking assignment as completed...')
      const { error: updateError } = await supabase
        .from('assessment_assignments')
        .update({
          is_completed: true,
          completed_at: new Date().toISOString()
        })
        .eq('id', existingAssignment.id)

      if (updateError) {
        console.error('❌ Error updating assignment:', updateError)
        throw updateError
      }

      console.log('✅ Supervisor assessment submitted successfully!')
    } catch (error) {
      console.error('💥 Error in submitSupervisorAssessment:', error)
      throw error
    }
  }

  // Get all users with their assessment results - DATABASE VERSION
  static async getAllUsersWithResults(periodId?: string) {
    console.log('🔍 Starting getAllUsersWithResults - via API (bypass RLS)...')
    console.log('📅 Period filter:', periodId || 'No filter')

    const params = new URLSearchParams()
    if (periodId) params.set('periodId', periodId)

    const res = await fetch(`/api/supervisor/team-results?${params.toString()}`, {
      method: 'GET',
      cache: 'no-store'
    })
    if (!res.ok) {
      const text = await res.text()
      console.error('❌ Failed to fetch team results:', text)
      throw new Error('Failed to fetch team results')
    }
    const json = await res.json()
    return (json.results || []).sort((a: any, b: any) => (b.finalScore || 0) - (a.finalScore || 0))
  }

  // Helper method to process feedback data
  static processFeedbackData(feedbackData: any[], supervisorIds: string[], restrictedIds: string[]) {
    console.log('🔄 Processing feedback data:', feedbackData.length, 'responses')
    
    // Group feedback by assessee
    const userResultsMap = new Map()

    feedbackData.forEach((feedback: any) => {
      const assesseeId = feedback.assignment.assessee_id
      const assessorId = feedback.assignment.assessor_id
      const assessee = feedback.assignment.assessee
      const assessor = feedback.assignment.assessor

      // Skip if assessee is restricted (admin/supervisor)
      if (restrictedIds.includes(assesseeId)) {
        console.log(`⏭️ Skipping ${assessee.full_name} (restricted user as assessee)`)
        return
      }

      // Initialize user result if not exists
      if (!userResultsMap.has(assesseeId)) {
        userResultsMap.set(assesseeId, {
          user: {
            id: assesseeId,
            full_name: assessee.full_name,
            email: assessee.email,
            position: assessee.position,
            department: assessee.department,
            avatar_url: assessee.avatar_url
          },
          supervisorRatings: [],
          peerRatings: [],
          allFeedback: [],
          allAssessors: new Set<string>(), // Track unique assessors
          aspectResults: new Map()
        })
      }

      const userData = userResultsMap.get(assesseeId)
      userData.allFeedback.push(feedback)
      userData.allAssessors.add(assessorId) // Add assessor to the set

      // Determine if this is supervisor assessment
      const isSupervisorAssessment = supervisorIds.includes(assessorId)
      
      console.log(`📊 ${assessor.full_name} (${assessorId}) -> ${assessee.full_name}: rating ${feedback.rating} (${isSupervisorAssessment ? 'SUPERVISOR' : 'PEER'})`)

      // Add to appropriate rating array
      if (isSupervisorAssessment) {
        userData.supervisorRatings.push(feedback.rating)
      } else {
        userData.peerRatings.push(feedback.rating)
      }

      // Group by aspect
      const aspect = feedback.aspect
      if (!userData.aspectResults.has(aspect)) {
        userData.aspectResults.set(aspect, {
          supervisorRatings: [],
          peerRatings: [],
          allRatings: [],
          allAssessors: new Set(), // Track unique assessors for this aspect
          supervisorComments: new Map(), // Track supervisor comments by assessor ID
          peerComments: new Map() // Track peer comments by assessor ID
        })
      }

      const aspectData = userData.aspectResults.get(aspect)
      aspectData.allRatings.push(feedback.rating)
      aspectData.allAssessors.add(assessorId) // Add assessor to the set

      if (isSupervisorAssessment) {
        aspectData.supervisorRatings.push(feedback.rating)
        // Add supervisor comment if available, only once per assessor per aspect
        if (feedback.comment && !aspectData.supervisorComments.has(assessorId)) {
          aspectData.supervisorComments.set(assessorId, {
            comment: feedback.comment,
            assessor: assessor.full_name,
            rating: feedback.rating
          })
        }
      } else {
        aspectData.peerRatings.push(feedback.rating)
        // Add peer comment if available, only once per assessor per aspect
        if (feedback.comment && !aspectData.peerComments.has(assessorId)) {
          aspectData.peerComments.set(assessorId, {
            comment: feedback.comment,
            assessor: assessor.full_name,
            rating: feedback.rating
          })
        }
      }
    })

    console.log('📊 User results map size:', userResultsMap.size)

    // Calculate final scores for each user
    const results = Array.from(userResultsMap.values()).map((userData: any) => {
      // Calculate overall averages
      const supervisorAvg = userData.supervisorRatings.length > 0 
        ? userData.supervisorRatings.reduce((sum: number, r: number) => sum + r, 0) / userData.supervisorRatings.length
        : null

      const peerAvg = userData.peerRatings.length > 0
        ? userData.peerRatings.reduce((sum: number, r: number) => sum + r, 0) / userData.peerRatings.length
        : null

      console.log(`📊 ${userData.user.full_name}:`)
      console.log(`   - Supervisor ratings: ${userData.supervisorRatings.length} ratings, avg: ${supervisorAvg}`)
      console.log(`   - Peer ratings: ${userData.peerRatings.length} ratings, avg: ${peerAvg}`)
      console.log(`   - Total feedback: ${userData.allFeedback.length}`)

      // Calculate weighted final score (60% supervisor, 40% peer)
      let finalScore = null
      if (supervisorAvg !== null || peerAvg !== null) {
        if (supervisorAvg !== null && peerAvg !== null) {
          finalScore = (supervisorAvg * 0.6) + (peerAvg * 0.4)
        } else if (supervisorAvg !== null) {
          finalScore = supervisorAvg
        } else {
          finalScore = peerAvg
        }
      }

      // Process aspect results
      const processedAspects = Array.from(userData.aspectResults.entries()).map((entry) => {
        const [aspect, data] = entry as [string, any];
        const supervisorAspectAvg = data.supervisorRatings.length > 0
          ? data.supervisorRatings.reduce((sum: number, r: number) => sum + r, 0) / data.supervisorRatings.length
          : null

        const peerAspectAvg = data.peerRatings.length > 0
          ? data.peerRatings.reduce((sum: number, r: number) => sum + r, 0) / data.peerRatings.length
          : null

        let aspectFinalScore = null
        if (supervisorAspectAvg !== null || peerAspectAvg !== null) {
          if (supervisorAspectAvg !== null && peerAspectAvg !== null) {
            aspectFinalScore = (supervisorAspectAvg * 0.6) + (peerAspectAvg * 0.4)
          } else if (supervisorAspectAvg !== null) {
            aspectFinalScore = supervisorAspectAvg
          } else {
            aspectFinalScore = peerAspectAvg
          }
        }

        return {
          aspect,
          supervisorAverage: supervisorAspectAvg,
          peerAverage: peerAspectAvg,
          finalScore: aspectFinalScore,
          // Count unique assessors who gave feedback for this aspect (not per indicator)
          totalFeedback: (data.allAssessors as Set<string>).size,
          // Include comments for dropdown display
          supervisorComments: Array.from(data.supervisorComments.values()),
          peerComments: Array.from(data.peerComments.values())
        }
      })

      return {
        user: userData.user,
        supervisorAverage: supervisorAvg,
        peerAverage: peerAvg,
        finalScore,
        // Count unique assessors who gave feedback (not per indicator)
        totalFeedback: (userData.allAssessors as Set<string>).size,
        aspectResults: processedAspects,
        hasSupervisorAssessment: userData.supervisorRatings.length > 0,
        hasPeerAssessment: userData.peerRatings.length > 0
      }
    })

    console.log('✅ Final results summary:')
    results.forEach((result: {
      user: { full_name: string }
      supervisorAverage: number | null
      peerAverage: number | null
      finalScore: number | null
    }) => {
      console.log(`   - ${result.user.full_name}: Supervisor=${result.supervisorAverage}, Peer=${result.peerAverage}, Final=${result.finalScore}`)
    })

    return results
  }

  // Get user detail with results for supervisor view
  static async getUserDetailWithResults(userId: string, periodId?: string) {
    const results = await this.getAllUsersWithResults(periodId)
    return results.find((result: any) => result.user.id === userId) || null
  }

  // Check if current user has already assessed a specific user
  static async hasAssessedUser(assesseeId: string, periodId: string) {
    const currentUser = await supabase.auth.getUser()
    if (!currentUser.data.user) return false

    const { data, error } = await supabase
      .from('assessment_assignments')
      .select('is_completed')
      .eq('assessor_id', currentUser.data.user.id)
      .eq('assessee_id', assesseeId)
      .eq('period_id', periodId)
      .single()

    if (error) return false
    return data?.is_completed || false
  }

  // Get existing supervisor assessment for a user
  static async getExistingSupervisorAssessment(assesseeId: string, periodId: string) {
    const currentUser = await supabase.auth.getUser()
    if (!currentUser.data.user) return null

    const { data: assignment } = await supabase
      .from('assessment_assignments')
      .select('id')
      .eq('assessor_id', currentUser.data.user.id)
      .eq('assessee_id', assesseeId)
      .eq('period_id', periodId)
      .single()

    if (!assignment) return null

    const { data: responses } = await supabase
      .from('feedback_responses')
      .select('*')
      .eq('assignment_id', assignment.id)

    return responses || []
  }

  // Get set of assessee IDs already assessed by current supervisor for a period
  static async getAssessedUserIds(periodId: string) {
    const currentUser = await supabase.auth.getUser()
    if (!currentUser.data.user) return new Set<string>()

    const { data, error } = await supabase
      .from('assessment_assignments')
      .select('assessee_id')
      .eq('assessor_id', currentUser.data.user.id)
      .eq('period_id', periodId)
      .eq('is_completed', true)

    if (error) return new Set<string>()

    return new Set<string>((data || []).map((row: any) => row.assessee_id))
  }
}