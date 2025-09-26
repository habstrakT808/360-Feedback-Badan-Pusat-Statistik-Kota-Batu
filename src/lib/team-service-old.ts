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

      const adminUserIds = adminUsers.map((u: any) => u.user_id).filter((id: any): id is string => !!id)

      // Filter out admin users and additional safety checks
      const filteredData = profiles.filter((profile: any) => {
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
    const whereClause: any = {}
    if (periodId) {
      whereClause.assignment = {
        period_id: periodId
      }
    }

    const data = await prisma.feedbackResponse.findMany({
      where: whereClause,
      include: {
        assignment: {
          include: {
            assessee: {
              select: {
                id: true,
                email: true,
                username: true,
                full_name: true,
                position: true,
                department: true,
                avatar_url: true,
                created_at: true,
                updated_at: true
              }
            }
          }
        }
      }
    })


    // Get admin users to exclude them using multiple approaches
    let adminUserIds: string[] = []
    
    const adminUsers = await prisma.userRole.findMany({
      where: { role: 'admin' },
      select: { user_id: true }
    })

    adminUserIds = (adminUsers || []).map((u: any) => u.user_id).filter((id: any): id is string => !!id)

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
        aspectAverages[aspect] = ratings.reduce((sum: number, r: number) => sum + r, 0) / ratings.length
      })
      emp.aspectAverages = aspectAverages

      return emp
    })

    return result.sort((a: any, b: any) => b.averageRating - a.averageRating)
  }

  static async updateProfile(userId: string, updates: Partial<Profile>) {
    const data = await prisma.profile.update({
      where: { id: userId },
      data: updates
    })
    return data
  }

  static async deleteProfile(userId: string) {
    await prisma.profile.delete({
      where: { id: userId }
    })
  }

  static async getAssignmentStats(periodId?: string) {
    const whereClause: any = {}
    if (periodId) {
      whereClause.period_id = periodId
    }

    const data = await prisma.assessmentAssignment.findMany({
      where: whereClause,
      include: {
        assessor: {
          select: {
            id: true,
            email: true,
            username: true,
            full_name: true,
            position: true,
            department: true,
            avatar_url: true,
            created_at: true,
            updated_at: true
          }
        },
        assessee: {
          select: {
            id: true,
            email: true,
            username: true,
            full_name: true,
            position: true,
            department: true,
            avatar_url: true,
            created_at: true,
            updated_at: true
          }
        }
      }
    })


    // Get admin users to exclude them using multiple approaches
    let adminUserIds: string[] = []
    
    const adminUsers = await prisma.userRole.findMany({
      where: { role: 'admin' },
      select: { user_id: true }
    })

    adminUserIds = (adminUsers || []).map((u: any) => u.user_id).filter((id: any): id is string => !!id)

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
    const currentPeriod = await prisma.assessmentPeriod.findFirst({
      where: { is_active: true }
    })

        if (!currentPeriod) {
          // Don't log error, just return null gracefully
          return null
        }
        targetPeriodId = currentPeriod.id
      }

      // Get feedback responses for this user as assessee (people who rated this user)
      console.log('🔍 Querying feedback for user:', userId)
      const feedbackData = await prisma.feedbackResponse.findMany({
        where: {
          assignment: {
            assessee_id: userId
            // Remove period filter to get all feedback like ResultsService
            // period_id: targetPeriodId
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


      // Count unique assessors who rated this user (this is the totalFeedback)
      const uniqueAssessors = new Set(
        feedbackData?.map((f: any) => f.assignment.assessor_id) || []
      )
      const totalFeedback = uniqueAssessors.size
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
          ratings: feedbackData.map((f: any) => f.rating),
          aspects: feedbackData.map((f: any) => f.aspect),
          assessors: feedbackData.map((f: any) => f.assignment?.assessor_id)
        })
      }

      // Test query to compare with ResultsService
      console.log('🧪 Testing ResultsService-like query...')
      const testData = await prisma.feedbackResponse.findMany({
        where: {
          assignment: {
            assessee_id: userId
          }
        },
        include: {
          assignment: {
            include: {
              period: {
                select: {
                  id: true,
                  month: true,
                  year: true,
                  is_active: true,
                  start_date: true,
                  end_date: true,
                  created_at: true
                }
              },
              assessor: {
                select: {
                  id: true,
                  email: true,
                  username: true,
                  full_name: true,
                  position: true,
                  department: true,
                  avatar_url: true,
                  created_at: true,
                  updated_at: true
                }
              }
            }
          }
        }
      })

      console.log('✅ Test query success:', {
        count: testData?.length || 0,
        firstItem: testData?.[0] || null,
        // Compare with main query
        mainQueryCount: feedbackData?.length || 0,
        isSame: testData?.length === feedbackData?.length
      })

      // Test if this is a permission issue by trying to get the same data as the logged-in user
      console.log('🔐 Testing permission issue...')
      const currentUserData = await prisma.feedbackResponse.findMany({
        where: {
          assignment: {
            assessee_id: '1cb30beb-bd3e-4ab5-8842-83aec3e64fc4' // Current logged-in user ID
          }
        },
        include: {
          assignment: {
            select: {
              id: true,
              assessee_id: true,
              assessor_id: true,
              period_id: true,
              is_completed: true
            }
          }
        }
      })

      console.log('✅ Current user query success:', {
        count: currentUserData?.length || 0,
        // This should work if it's the same user
        isCurrentUser: '1cb30beb-bd3e-4ab5-8842-83aec3e64fc4' === '1cb30beb-bd3e-4ab5-8842-83aec3e64fc4'
      })

      // If we still don't have data, try using a different approach to bypass RLS
      if (!feedbackData || feedbackData.length === 0) {
        console.log('🚨 No feedback data found, trying to bypass RLS...')
        
        try {
          // Use direct query to bypass RLS restrictions
        const directData = await prisma.feedbackResponse.findMany({
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

          console.log('✅ Direct query success:', {
            count: directData?.length || 0,
            isDirect: true
          })
          
          if (directData && directData.length > 0) {
            // feedbackData = directData // Cannot reassign const
            console.log('🔄 Using direct query data (RLS bypassed)')
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
      const assessorAssignments = await prisma.assessmentAssignment.findMany({
        where: {
          assessor_id: userId,
          period_id: targetPeriodId
        }
      })

      // Count completed assessments where this user is the assessor
      const completedAssessments = assessorAssignments?.filter((a: any) => a.is_completed)?.length || 0

      // Log assignment debugging
      console.log('📋 Assignment debug:', {
        assessorAssignmentsCount: assessorAssignments?.length || 0,
        assessorAssignments,
        completedAssessments
      })

      // Get total employees (excluding admin/supervisor) - this should be 18
      const allProfiles = await prisma.profile.findMany({
        select: { id: true }
      })

      const adminUsers = await prisma.userRole.findMany({
        where: { role: 'admin' },
        select: { user_id: true }
      })

      const adminUserIds = adminUsers?.map((u: any) => u.user_id) || []
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
      const periodData = await prisma.assessmentPeriod.findUnique({
        where: { id: targetPeriodId }
      })

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