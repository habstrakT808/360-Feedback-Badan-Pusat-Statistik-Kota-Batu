// src/lib/supervisor-service.ts (REPLACE METHOD getAllUsersWithResults - DATABASE VERSION)
import { RolesService } from '@/lib/roles-service'
import { prisma } from '@/lib/prisma'

type Profile = {
  id: string
  full_name: string
  email: string
  position: string | null
  department: string | null
  avatar_url: string | null
}

type FeedbackResponse = {
  id: string
  assignment_id: string
  aspect: string
  rating: number
  comment: string | null
  created_at: Date
  updated_at: Date
}

export class SupervisorService {
  // Get all non-admin, non-supervisor users for supervisor to assess
  static async getAllAssessableUsers() {
    // Fetch via API route to avoid Prisma in browser and unify logic
    const res = await fetch('/api/supervisor/assessable-users', { cache: 'no-store' })
    if (!res.ok) return []
    const json = await res.json().catch(() => ({ users: [] }))
    return json.users || []
  }

  static async getAssessedUserIds(periodId?: string) {
    const qs = new URLSearchParams()
    if (periodId) qs.set('periodId', periodId)
    const res = await fetch(`/api/supervisor/assessed?${qs.toString()}`, { cache: 'no-store' })
    if (!res.ok) return new Set<string>()
    const json = await res.json().catch(() => ({ ids: [] }))
    return new Set<string>(json.ids || [])
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
    // Submit via API to keep Prisma on server only. Period is determined server-side.
    const normalized = responses.map((r) => ({
      aspect: r.aspect,
      indicator: r.indicator,
      rating: Math.max(1, Math.min(100, r.rating)),
      comment: r.comment,
    }))
    const res = await fetch('/api/assessment/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assesseeId, responses: normalized }),
    })
    if (!res.ok) {
      const txt = await res.text().catch(() => '')
      throw new Error(txt || 'Failed to submit feedback')
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
  static async hasAssessedUser(assesseeId: string, periodId: string, assessorId: string) {
    const ids = await this.getAssessedUserIds(periodId)
    return ids.has(assesseeId)
  }

  // Get existing supervisor assessment for a user
  static async getExistingSupervisorAssessment(assesseeId: string, periodId: string, assessorId: string) {
    const qs = new URLSearchParams({ assesseeId, periodId })
    const res = await fetch(`/api/supervisor/existing?${qs.toString()}`, { cache: 'no-store' })
    if (!res.ok) return []
    return await res.json()
  }

  // Get set of assessee IDs already assessed by current supervisor for a period
  // duplicate removed
}