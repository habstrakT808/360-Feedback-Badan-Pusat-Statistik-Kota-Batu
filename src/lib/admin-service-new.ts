// src/lib/admin-service.ts
import { prisma } from '@/lib/prisma'
import { RolesService } from '@/lib/roles-service'

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

type AssessmentPeriod = {
  id: string
  month: number
  year: number
  start_date: Date
  end_date: Date
  is_active: boolean
  created_at: Date
  completed_at: Date | null
  is_completed: boolean
}

export class AdminService {
  // Check if current user is admin
  static async isCurrentUserAdmin(userId?: string): Promise<boolean> {
    try {
      if (!userId) return false;

      const { adminIds } = await RolesService.getRoleUserIds();
      return adminIds.includes(userId);
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  // User Management
  static async getAllUsers() {
    try {
      // Get all profiles
      const profiles = await prisma.profile.findMany({
        orderBy: { created_at: 'desc' }
      })

      // Get admin user IDs
      const adminUsers = await prisma.userRole.findMany({
        where: { role: 'admin' },
        select: { user_id: true }
      })

      const adminUserIds = adminUsers
        .map((u: { user_id: string | null }) => u.user_id)
        .filter((id: string | null): id is string => !!id)
      
      // Filter out admin users
      return profiles.filter((user: { id: string }) => !adminUserIds.includes(user.id))
    } catch (error) {
      console.error('Error fetching users:', error)
      throw error
    }
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
    try {
      // Update profile directly
      const updatedProfile = await prisma.profile.update({
        where: { id: userId },
        data: updates
      });

      return updatedProfile;
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error('Failed to update user');
    }
  }

  static async deleteUser(userId: string) {
    try {
      // Call API endpoint to delete user
      const response = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete user');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete user');
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error('Failed to delete user');
    }
  }

  static async resetUserPassword(userId: string) {
    try {
      // Call API endpoint to reset password
      const response = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reset password');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to reset password');
      }

      return { success: true };
    } catch (error) {
      console.error('Error resetting user password:', error);
      throw new Error('Failed to reset user password');
    }
  }

  static async updateUserEmail(userId: string, newEmail: string) {
    try {
      // Call API endpoint to update email
      const response = await fetch('/api/admin/update-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, newEmail })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update email');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to update email');
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating user email:', error);
      throw new Error('Failed to update user email');
    }
  }

  static async updateUserPassword(userId: string, newPassword: string) {
    try {
      // Call API endpoint to update password
      const response = await fetch('/api/admin/update-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, newPassword })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update password');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to update password');
      }
      return { success: true };
    } catch (error) {
      console.error('Error updating user password:', error);
      throw new Error('Failed to update user password');
    }
  }

  // Period Management
  static async getAllPeriods() {
    try {
      const periods = await prisma.assessmentPeriod.findMany({
        orderBy: { created_at: 'desc' },
        include: {
          assignments: {
            select: {
              id: true,
              is_completed: true
            }
          }
        }
      })

      // Process the data to get actual counts
      const processedData = periods.map((period: { assignments: Array<{ is_completed: boolean }> } & any) => {
        const assignedCount = period.assignments.length
        const completedCount = period.assignments.filter((a: { is_completed: boolean }) => a.is_completed).length

        return {
          ...period,
          assigned_count: assignedCount,
          completed_count: completedCount
        }
      })

      return processedData
    } catch (error) {
      console.error('Error fetching periods:', error)
      throw error
    }
  }

  static async createPeriod(periodData: {
    month: number
    year: number
    start_date: string
    end_date: string
  }) {
    try {
      // Create new period without automatically activating it
      const newPeriod = await prisma.assessmentPeriod.create({
        data: {
          ...periodData,
          start_date: new Date(periodData.start_date),
          end_date: new Date(periodData.end_date),
          is_active: false // Let users manually activate periods
        }
      })

      return newPeriod
    } catch (error) {
      console.error('Error creating period:', error)
      throw error
    }
  }

  static async updatePeriod(periodId: string, updates: Partial<AssessmentPeriod>) {
    try {
      const updatedPeriod = await prisma.assessmentPeriod.update({
        where: { id: periodId },
        data: updates
      })

      return updatedPeriod
    } catch (error) {
      console.error('Error updating period:', error)
      throw error
    }
  }

  static async deletePeriod(periodId: string) {
    try {
      await prisma.assessmentPeriod.delete({
        where: { id: periodId }
      })
    } catch (error) {
      console.error('Error deleting period:', error)
      throw error
    }
  }

  static async generateAssignments(periodId: string) {
    try {
      // Call API endpoint to generate assignments
      const response = await fetch('/api/admin/generate-assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ periodId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate assignments');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error generating assignments:', error);
      throw error;
    }
  }

  static async completeAllAssignments(periodId: string) {
    try {
      return await this.manuallyCompletePeriod(periodId);
    } catch (error) {
      console.error('Error in completeAllAssignments:', error);
      throw error;
    }
  }

  private static async manuallyCompletePeriod(periodId: string) {
    try {
      // Update period to mark as completed
      await prisma.assessmentPeriod.update({
        where: { id: periodId },
        data: {
          is_active: false,
          end_date: new Date(),
          is_completed: true,
          completed_at: new Date()
        }
      })

      // Mark all assignments as completed
      await prisma.assessmentAssignment.updateMany({
        where: {
          period_id: periodId,
          is_completed: false
        },
        data: {
          is_completed: true,
          completed_at: new Date()
        }
      })

      return { success: true }
    } catch (error) {
      console.error('Error in manual completion:', error);
      throw error;
    }
  }

  // Analytics & Reports
  static async getSystemStats() {
    try {
      // Get role user IDs (with env overrides)
      const { adminIds, supervisorIds } = await RolesService.getRoleUserIds()

      // Active period
      const activePeriod = await prisma.assessmentPeriod.findFirst({
        where: { is_active: true }
      })

      // Total users excluding admins and supervisors (eligible peer assessors)
      const allProfiles = await prisma.profile.findMany({
        select: { id: true }
      })

      const eligibleUserIds = allProfiles
        .map((p: { id: string | null }) => p.id as string | null)
        .filter((id: string | null): id is string => !!id && !adminIds.includes(id) && !supervisorIds.includes(id))

      const totalEligibleUsers = eligibleUserIds.length

      // Fetch assignments for the active period only (guard when no active period)
      let periodAssignments: Array<{ assessor_id: string; assessee_id: string; is_completed: boolean | null; period_id: string }> = []
      if (activePeriod?.id) {
        const assignments = await prisma.assessmentAssignment.findMany({
          where: { period_id: activePeriod.id },
          select: {
            assessor_id: true,
            assessee_id: true,
            is_completed: true,
            period_id: true
          }
        })
        periodAssignments = assignments
      }

      // Keep only peer assignments: assessor is eligible (non-admin, non-supervisor) and assessee not admin
      const peerAssignments = periodAssignments.filter(a =>
        !!a.assessor_id &&
        !!a.assessee_id &&
        !adminIds.includes(a.assessor_id) &&
        !supervisorIds.includes(a.assessor_id) &&
        !adminIds.includes(a.assessee_id)
      )

      // Build completion count per assessor
      const assessorToCompletedCount = new Map<string, number>()
      for (const a of peerAssignments) {
        if (a.is_completed) {
          const prev = assessorToCompletedCount.get(a.assessor_id) || 0
          assessorToCompletedCount.set(a.assessor_id, prev + 1)
        }
      }

      // Users who completed all 5 peer assessments
      const usersCompletedAllFive = eligibleUserIds.filter((uid: string) =>
        (assessorToCompletedCount.get(uid) || 0) >= 5
      ).length

      const pendingUsers = Math.max(0, totalEligibleUsers - usersCompletedAllFive)
      const completionRate = totalEligibleUsers > 0 ? Math.round((usersCompletedAllFive / totalEligibleUsers) * 100) : 0

      // Keep other basic counts for display
      const totalUsers = await prisma.profile.count()
      const totalPeriods = await prisma.assessmentPeriod.count()

      return {
        totalUsers: totalUsers - adminIds.length,
        totalPeriods,
        totalAssignments: totalEligibleUsers, // denominator for Completed Assessments card
        completedAssignments: usersCompletedAllFive, // numerator for Completed Assessments card
        pendingAssignments: pendingUsers,
        completionRate
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
      const recentActivity = await prisma.assessmentAssignment.findMany({
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          assessor: {
            select: {
              id: true,
              full_name: true
            }
          },
          assessee: {
            select: {
              id: true,
              full_name: true
            }
          },
          period: {
            select: {
              id: true,
              month: true,
              year: true
            }
          }
        }
      })

      // Get admin users to exclude them
      const adminUsers = await prisma.userRole.findMany({
        where: { role: 'admin' },
        select: { user_id: true }
      })

      const adminUserIds = adminUsers
        .map((u: { user_id: string | null }) => u.user_id)
        .filter((id: string | null): id is string => !!id)

      // Filter out any entries with missing required data and admin users
      const validActivities = recentActivity.filter((activity: { assessor?: { id: string }; assessee?: { id: string }; period?: { id: string } }) => 
        activity.assessor && 
        activity.assessee && 
        activity.period &&
        !adminUserIds.includes(activity.assessor.id) &&
        !adminUserIds.includes(activity.assessee.id)
      )

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
    try {
      // Call API endpoint to bulk delete users
      const response = await fetch('/api/admin/bulk-delete-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userIds })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to bulk delete users');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to bulk delete users');
      }

      return result.results;
    } catch (error) {
      console.error('Error in bulk delete users:', error);
      throw new Error('Failed to bulk delete users');
    }
  }
}
