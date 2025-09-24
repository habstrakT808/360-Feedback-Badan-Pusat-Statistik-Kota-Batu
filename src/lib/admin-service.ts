// src/lib/admin-service.ts
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
      const res = await fetch('/api/admin/users', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to fetch users')
      const json = await res.json()
      return json.users || []
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
      // Delegate to server API to avoid Prisma on client
      const response = await fetch('/api/admin/update-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, updates })
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to update user')
      }
      const json = await response.json()
      return json.profile || json.user || { id: userId, ...updates }
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
      const res = await fetch('/api/admin/periods', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to fetch periods')
      const json = await res.json()
      const periods = json.data || json.periods || []
      if (json.periods) return json.periods
      // Fallback: compute counts client-side if assignments not included
      return periods.map((p: any) => ({ ...p, assigned_count: p.assigned_count ?? 0, completed_count: p.completed_count ?? 0 }))
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
      const response = await fetch('/api/admin/periods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(periodData),
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to create period')
      }
      const json = await response.json()
      return json.period
    } catch (error) {
      console.error('Error creating period:', error)
      throw error
    }
  }

  static async updatePeriod(_periodId: string, _updates: Partial<AssessmentPeriod>) {
    try {
      throw new Error('Update period is server-only. Please use admin API route.')
    } catch (error) {
      console.error('Error updating period:', error)
      throw error
    }
  }

  static async deletePeriod(_periodId: string) {
    try {
      throw new Error('Delete period is server-only. Please use admin API route.')
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

  private static async manuallyCompletePeriod(_periodId: string) {
    try {
      throw new Error('Manual completion is server-only. Please use admin API route.')
    } catch (error) {
      console.error('Error in manual completion:', error);
      throw error;
    }
  }

  // Analytics & Reports
  static async getSystemStats() {
    try {
      const res = await fetch('/api/admin/stats', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to fetch stats')
      const json = await res.json()
      return json.stats
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
      const res = await fetch(`/api/admin/activity?limit=${limit}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to fetch activity')
      const json = await res.json()
      return json.activities || []
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
