// src/lib/roles-service.ts
import { prisma } from '@/lib/prisma'
import { env, parseIdList } from '@/lib/utils'

export class RolesService {
  // Returns arrays of admin and supervisor user IDs, with env overrides merged
  static async getRoleUserIds(): Promise<{ adminIds: string[]; supervisorIds: string[] }> {
    const overrideAdmins = new Set(parseIdList(env.adminIdsOverride))
    const overrideSupervisors = new Set(parseIdList(env.supervisorIdsOverride))

    // Fallback IDs for known users (if env overrides are empty)
    if (overrideAdmins.size === 0) {
      overrideAdmins.add('dccdb786-d7e7-44a8-a4d0-e446623c19b9') // Hafiyan (admin)
    }
    if (overrideSupervisors.size === 0) {
      overrideSupervisors.add('678ad9e9-cc08-4101-b735-6d2e1feaab3a') // Herlina (supervisor)
    }

    // If running in the browser, avoid Prisma and return overrides only
    if (typeof window !== 'undefined') {
      return { adminIds: Array.from(overrideAdmins), supervisorIds: Array.from(overrideSupervisors) }
    }

    try {
      // Query roles table
      const roles = await prisma.userRole.findMany({
        select: { user_id: true, role: true }
      })

      for (const row of roles) {
        if (row.role === 'admin' && row.user_id) overrideAdmins.add(row.user_id)
        if (row.role === 'supervisor' && row.user_id) overrideSupervisors.add(row.user_id)
      }
    } catch (error) {
      console.error('Error fetching roles:', error)
      // Fall back to overrides only
    }

    return { adminIds: Array.from(overrideAdmins), supervisorIds: Array.from(overrideSupervisors) }
  }
}


