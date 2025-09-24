// src/lib/team-service.ts
import { prisma } from '@/lib/prisma'

type Profile = {
  id: string
  email: string
  username: string
  full_name: string
  position: string | null
  department: string | null
  avatar_url: string | null
  allow_public_view: boolean
  created_at: Date
  updated_at: Date
}

export class TeamService {
  static async getAllTeamMembers() {
    try {
      // Get all profiles
      const profiles = await prisma.profile.findMany({
        orderBy: { full_name: 'asc' }
      })

      // Get admin user IDs
      const adminUsers = await prisma.userRole.findMany({
        where: { role: 'admin' },
        select: { user_id: true }
      })

      const adminUserIds = adminUsers.map(u => u.user_id).filter((id): id is string => !!id)

      // Filter out admin users and additional safety checks
      const filteredData = profiles.filter(profile => {
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
      })

      return filteredData
    } catch (error) {
      console.error('Error fetching team members:', error)
      throw error
    }
  }

  static async getTeamPerformance(periodId?: string) {
    try {
      let whereClause: any = {}
      if (periodId) {
        whereClause.assignment = {
          period_id: periodId
        }
      }

      const feedbackData = await prisma.feedbackResponse.findMany({
        where: whereClause,
        include: {
          assignment: {
            include: {
              period: true,
              assessee: true
            }
          }
        }
      })

      // Get admin users to exclude them
      const adminUsers = await prisma.userRole.findMany({
        where: { role: 'admin' },
        select: { user_id: true }
      })

      const adminUserIds = adminUsers.map(u => u.user_id).filter((id): id is string => !!id)

      // Group by employee
      const employeePerformance = new Map()

      feedbackData.forEach((response: any) => {
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
    } catch (error) {
      console.error('Error fetching team performance:', error)
      throw error
    }
  }

  static async updateProfile(userId: string, updates: Partial<Profile>) {
    try {
      const updatedProfile = await prisma.profile.update({
        where: { id: userId },
        data: updates
      })

      return updatedProfile
    } catch (error) {
      console.error('Error updating profile:', error)
      throw error
    }
  }

  static async deleteProfile(userId: string) {
    try {
      await prisma.profile.delete({
        where: { id: userId }
      })
    } catch (error) {
      console.error('Error deleting profile:', error)
      throw error
    }
  }

  static async getAssignmentStats(periodId?: string) {
    try {
      let whereClause: any = {}
      if (periodId) {
        whereClause.period_id = periodId
      }

      const assignments = await prisma.assessmentAssignment.findMany({
        where: whereClause,
        include: {
          period: true,
          assessor: true,
          assessee: true
        }
      })

      // Get admin users to exclude them
      const adminUsers = await prisma.userRole.findMany({
        where: { role: 'admin' },
        select: { user_id: true }
      })

      const adminUserIds = adminUsers.map(u => u.user_id).filter((id): id is string => !!id)

      // Filter out assignments involving admin users
      const filteredAssignments = assignments.filter(assignment => 
        !adminUserIds.includes(assignment.assessor_id) && 
        !adminUserIds.includes(assignment.assessee_id)
      )

      const stats = {
        total: filteredAssignments.length,
        completed: filteredAssignments.filter(a => a.is_completed).length,
        pending: filteredAssignments.filter(a => !a.is_completed).length,
        completionRate: 0
      }

      stats.completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0

      return { stats, assignments: filteredAssignments }
    } catch (error) {
      console.error('Error fetching assignment stats:', error)
      throw error
    }
  }

  static async getUserPerformance(userId: string, periodId?: string) {
    try {
      // Get current active period if not specified
      let targetPeriodId = periodId
      if (!targetPeriodId) {
        const currentPeriod = await prisma.assessmentPeriod.findFirst({
          where: { is_active: true }
        })

        if (!currentPeriod) {
          return null
        }
        targetPeriodId = currentPeriod.id
      }

      // Get feedback responses for this user as assessee (people who rated this user)
      const feedbackData = await prisma.feedbackResponse.findMany({
        where: {
          assignment: {
            assessee_id: userId
          }
        },
        include: {
          assignment: {
            select: {
              id: true,
              period_id: true,
              assessee_id: true,
              assessor_id: true,
              is_completed: true
            }
          }
        }
      })

      // Count unique assessors who rated this user
      const uniqueAssessors = new Set(
        feedbackData.map(f => f.assignment.assessor_id)
      )
      let totalFeedback = uniqueAssessors.size
      let averageRating = 0

      if (feedbackData.length > 0) {
        averageRating = feedbackData.reduce((sum, f) => sum + f.rating, 0) / feedbackData.length
      }

      // Get assignments where this user is the assessor (people this user needs to rate)
      const assessorAssignments = await prisma.assessmentAssignment.findMany({
        where: {
          assessor_id: userId,
          period_id: targetPeriodId
        }
      })

      // Count completed assessments where this user is the assessor
      let completedAssessments = assessorAssignments.filter(a => a.is_completed).length

      // Get total employees (excluding admin/supervisor)
      const allProfiles = await prisma.profile.findMany({
        select: { id: true }
      })

      const adminUsers = await prisma.userRole.findMany({
        where: { role: 'admin' },
        select: { user_id: true }
      })

      const adminUserIds = adminUsers.map(u => u.user_id).filter((id): id is string => !!id)
      const totalEmployees = allProfiles.length - adminUserIds.length

      // User's max assignments (5 for regular users)
      const maxAssignments = 5

      // Calculate progress based on completed vs max assignments
      const periodProgress = (completedAssessments / maxAssignments) * 100

      // Get period info for recent scores
      const periodData = await prisma.assessmentPeriod.findUnique({
        where: { id: targetPeriodId }
      })

      const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ]
      const currentMonthName = periodData ? monthNames[(periodData.month - 1) % 12] || 'Agustus' : 'Agustus'

      const recentScores = [{ period: currentMonthName, score: averageRating }]

      // Mock strengths and areas for improvement
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
        totalEmployees, // Total employees excluding admin
        maxAssignments, // Max assignments for this user (5)
        completedAssessments, // Number of people this user has rated
        pendingAssessments: maxAssignments - completedAssessments,
        periodProgress,
        recentScores,
        strengths,
        areasForImprovement,
      }
    } catch (error) {
      console.error('Error in getUserPerformance:', error)
      return null
    }
  }
}
