// src/lib/dashboard-service.ts
import { RolesService } from '@/lib/roles-service'

export interface DashboardStats {
  totalEmployees: number
  completedAssessments: number
  pendingAssessments: number
  currentPeriod: string
  myProgress: number
  averageRating: number
  myAssignments: any[]
  currentPeriodData: any | null
  isSupervisor: boolean
  maxAssignments: number
}

export class DashboardService {
  static async getDashboardStats(userId: string): Promise<DashboardStats> {
    try {
      const res = await fetch('/api/dashboard/stats', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to fetch dashboard stats')
      const json = await res.json()
      return json.stats
    } catch (error) {
      console.error('Error in getDashboardStats:', error instanceof Error ? error.message : 'Unknown error')
      return this.getDefaultStats()
    }
  }

  private static getDefaultStats(): DashboardStats {
    return {
      totalEmployees: 0,
      completedAssessments: 0,
      pendingAssessments: 0,
      currentPeriod: 'Tidak ada periode aktif',
      myProgress: 0,
      averageRating: 0,
      myAssignments: [],
      currentPeriodData: null,
      isSupervisor: false,
      maxAssignments: 5
    }
  }

  static async getMyRecentActivity(userId: string) {
    try {
      const res = await fetch('/api/admin/activity?limit=10', { cache: 'no-store' })
      if (!res.ok) return []
      const json = await res.json()
      return json.activities || []
    } catch (error) {
      console.error('Error fetching recent activity:', error)
      return []
    }
  }
}
