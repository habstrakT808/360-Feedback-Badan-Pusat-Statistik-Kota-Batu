// src/lib/results-service.ts (REPLACE COMPLETE FILE)
import { supabase } from '@/lib/supabase'
import { RolesService } from '@/lib/roles-service'
import { Database } from '@/lib/database.types'

type FeedbackResponse = Database['public']['Tables']['feedback_responses']['Row']

export class ResultsService {
  static async getMyResults(userId: string) {
    try {
      // Get all feedback responses for this user
      const { data: feedbackData, error: feedbackError } = await supabase
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

      if (feedbackError) {
        console.error('Error fetching feedback:', feedbackError)
        throw feedbackError
      }

      if (!feedbackData || feedbackData.length === 0) {
        console.log('No feedback data found for user:', userId)
        return []
      }

      // Get supervisor IDs from roles service with env overrides (no hardcoded IDs)
      const { supervisorIds: allSupervisorIds } = await RolesService.getRoleUserIds()
      console.log('🔍 ResultsService - Supervisor IDs:', allSupervisorIds)

      // Separate supervisor and peer feedback
      const supervisorFeedback = feedbackData.filter((f: any) => 
        allSupervisorIds.includes(f.assignment.assessor_id)
      )
      const peerFeedback = feedbackData.filter((f: any) => 
        !allSupervisorIds.includes(f.assignment.assessor_id)
      )

      // Calculate weighted scores
      const processedData = feedbackData.map((feedback: any) => {
        const isSupervisorFeedback = allSupervisorIds.includes(feedback.assignment.assessor_id)
        
        // For display purposes, we'll show the original rating
        // but the final score calculation will be done separately
        return {
          ...feedback,
          isSupervisorFeedback,
          // Add weighted information for context
          assessorType: isSupervisorFeedback ? 'supervisor' : 'peer'
        }
      })

      console.log('Processed feedback data:', {
        total: processedData.length,
        supervisor: supervisorFeedback.length,
        peer: peerFeedback.length
      })

      return processedData
    } catch (error) {
      console.error('Error in getMyResults:', error)
      throw error
    }
  }

  // Get weighted final scores for a user
  static async getWeightedResults(userId: string) {
    try {
      const allFeedback = await this.getMyResults(userId)
      
      if (!allFeedback || allFeedback.length === 0) {
        return null
      }

      // Group by aspect (track unique assessors so counts are per-aspect, not per-indicator)
      const aspectGroups = allFeedback.reduce((groups: any, item: any) => {
        const aspectId = item.aspect
        if (!groups[aspectId]) {
          groups[aspectId] = {
            supervisorRatings: [] as number[],
            peerRatings: [] as number[],
            allRatings: [] as number[],
            allAssessors: new Set<string>(),
            supervisorAssessors: new Set<string>(),
            peerAssessors: new Set<string>()
          }
        }

        const assessorId: string = item?.assignment?.assessor_id || item.assessor_id

        groups[aspectId].allRatings.push(item.rating)
        groups[aspectId].allAssessors.add(assessorId)

        // Use the isSupervisorFeedback flag that was set in getMyResults
        if (item.isSupervisorFeedback) {
          groups[aspectId].supervisorRatings.push(item.rating)
          groups[aspectId].supervisorAssessors.add(assessorId)
        } else {
          groups[aspectId].peerRatings.push(item.rating)
          groups[aspectId].peerAssessors.add(assessorId)
        }
        
        return groups
      }, {} as Record<string, any>)

      // Calculate weighted scores for each aspect
      const aspectResults = Object.entries(aspectGroups).map(([aspectId, data]: [string, any]) => {
        const supervisorAvg = data.supervisorRatings.length > 0
          ? data.supervisorRatings.reduce((sum: number, r: number) => sum + r, 0) / data.supervisorRatings.length
          : null

        const peerAvg = data.peerRatings.length > 0
          ? data.peerRatings.reduce((sum: number, r: number) => sum + r, 0) / data.peerRatings.length
          : null

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

        return {
          aspect: aspectId,
          supervisorAverage: supervisorAvg,
          peerAverage: peerAvg,
          finalScore,
          // Count unique assessors who gave feedback for this aspect
          totalFeedback: (data.allAssessors as Set<string>).size,
          supervisorAssessorCount: (data.supervisorAssessors as Set<string>).size,
          peerAssessorCount: (data.peerAssessors as Set<string>).size,
          hasSupervisorAssessment: data.supervisorRatings.length > 0,
          hasPeerAssessment: data.peerRatings.length > 0
        }
      })

      // Calculate overall weighted score
      const validAspects = aspectResults.filter(a => a.finalScore !== null)
      const overallScore = validAspects.length > 0
        ? validAspects.reduce((sum, a) => sum + (a.finalScore || 0), 0) / validAspects.length
        : 0

      // Summary: count unique assessors (not per indicator)
      const supervisorIds = new Set<string>()
      const peerIds = new Set<string>()
      for (const f of allFeedback as any[]) {
        const assessorId: string = f?.assignment?.assessor_id || f.assessor_id
        if (f.isSupervisorFeedback) supervisorIds.add(assessorId)
        else peerIds.add(assessorId)
      }
      const supervisorFeedbackCount = supervisorIds.size
      const peerFeedbackCount = peerIds.size

      return {
        aspectResults,
        overallScore,
        totalFeedback: allFeedback.length,
        supervisorFeedbackCount,
        peerFeedbackCount,
        hasSupervisorAssessment: supervisorFeedbackCount > 0,
        hasPeerAssessment: peerFeedbackCount > 0,
        periodInfo: allFeedback[0]?.assignment?.period
      }
    } catch (error) {
      console.error('Error in getWeightedResults:', error)
      throw error
    }
  }
}