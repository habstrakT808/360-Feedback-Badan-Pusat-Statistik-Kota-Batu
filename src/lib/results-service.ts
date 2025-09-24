// src/lib/results-service.ts (REPLACE COMPLETE FILE)

import { RolesService } from '@/lib/roles-service'

type FeedbackResponse = {
  id: string
  assignment_id: string
  aspect: string
  rating: number
  comment: string | null
  created_at: Date
  updated_at: Date
}

export class ResultsService {
  static async getMyResults(userId: string) {
    try {
      const res = await fetch(`/api/results/my`, { cache: 'no-store' })
      if (!res.ok) return []
      const feedbackData = await res.json()

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
      const res = await fetch(`/api/results/weighted`, { cache: 'no-store' })
      if (!res.ok) return null
      const payload = await res.json()
      return payload
    } catch (error) {
      console.error('Error in getWeightedResults:', error)
      throw error
    }
  }
}