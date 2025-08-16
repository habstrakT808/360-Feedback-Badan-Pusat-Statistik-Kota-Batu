// src/lib/smart-notification-service.ts - FIXED VERSION
import { supabase } from './supabase'
import { NotificationService } from './notification-service'

interface UserData {
  id: string
  full_name: string
  position: string | null
  department: string | null
}

export class SmartNotificationService {
  // Generate simple notifications for all users
  static async generateSimpleNotifications(): Promise<void> {
    try {
      console.log('🚀 Starting simple notification generation...')
      
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name')

      if (usersError || !users) {
        console.error('Failed to fetch users:', usersError)
        return
      }

      console.log(`📧 Processing ${users.length} users...`)

      for (const user of users) {
        await this.generateUserSimpleNotifications(user)
        await new Promise(resolve => setTimeout(resolve, 300))
      }

      console.log('🎉 Simple notification generation completed!')
    } catch (error) {
      console.error('❌ Failed to generate notifications:', error)
    }
  }

  // Generate notifications for specific user - FIXED
  static async generateUserSimpleNotifications(user: UserData): Promise<void> {
    try {
      console.log(`📝 Processing: ${user.full_name}`)
      
      const firstName = user.full_name.split(' ')[0]

      // Check existing notifications for this user (last 24 hours to prevent duplicates)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const { data: existingNotifications } = await supabase
        .from('notifications')
        .select('title, type, created_at')
        .eq('user_id', user.id)
        .eq('type', 'system')
        .gte('created_at', oneDayAgo)

      const existingTitles = new Set(
        existingNotifications?.map(n => n.title.toLowerCase()) || []
      )

      console.log(`Existing notifications for ${firstName} (last 24h):`, existingTitles.size)

      // 1. Welcome notification (only if not exists)
      const welcomeTitle = `👋 Selamat datang, ${firstName}!`
      if (!existingTitles.has(welcomeTitle.toLowerCase())) {
        console.log(`Creating welcome for ${firstName}`)
        await NotificationService.sendSystemNotification(
          [user.id],
          welcomeTitle,
          `Selamat datang di sistem penilaian 360° BPS Kota Batu! Mari bersama-sama membangun budaya feedback yang konstruktif untuk pengembangan organisasi.`,
          '/dashboard',
          'low'
        )
        await new Promise(resolve => setTimeout(resolve, 300))
      } else {
        console.log(`Welcome already exists for ${firstName}`)
      }

      // 2. Assignment notification (if has assignments)
      await this.createAssignmentNotificationIfNeeded(user, firstName, existingTitles)

      // 3. Tips notification (only if not exists)
      const tipsTitle = `💡 Tips: Memberikan Feedback yang Efektif`
      if (!existingTitles.has(tipsTitle.toLowerCase())) {
        console.log(`Creating tips for ${firstName}`)
        await NotificationService.sendSystemNotification(
          [user.id],
          tipsTitle,
          `${firstName}, berikan feedback yang spesifik, konstruktif, dan actionable. Fokus pada perilaku dan dampaknya, bukan pada kepribadian. Berikan contoh konkret dan saran perbaikan yang dapat ditindaklanjuti.`,
          '/dashboard',
          'low'
        )
        await new Promise(resolve => setTimeout(resolve, 300))
      } else {
        console.log(`Tips already exists for ${firstName}`)
      }

      console.log(`✅ Completed: ${user.full_name}`)
    } catch (error) {
      console.error(`❌ Failed for ${user.full_name}:`, error)
    }
  }

  // Create assignment notification if needed
  private static async createAssignmentNotificationIfNeeded(
    user: UserData, 
    firstName: string, 
    existingTitles: Set<string>
  ): Promise<void> {
    try {
      // Get current active period
      const { data: period } = await supabase
        .from('assessment_periods')
        .select('*')
        .eq('is_active', true)
        .single()

      if (!period) {
        console.log(`No active period for ${firstName}`)
        return
      }

      // Get user assignments
      const { data: assignments } = await supabase
        .from('assessment_assignments')
        .select(`
          *,
          assessee:profiles!assessment_assignments_assessee_id_fkey(full_name)
        `)
        .eq('assessor_id', user.id)
        .eq('period_id', period.id)

      const assignmentList = assignments || []
      const pendingAssignments = assignmentList.filter(a => !a.is_completed)
      const pendingCount = pendingAssignments.length

      if (pendingCount === 0) {
        console.log(`No pending assignments for ${firstName}`)
        return
      }

      // Check if assignment notification already exists
      const assignmentTitlePattern = `📋 ${pendingCount} penilaian menunggu`
      const hasAssignmentNotification = Array.from(existingTitles).some(title => 
        title.includes('📋') && title.includes('penilaian menunggu')
      )

      if (hasAssignmentNotification) {
        console.log(`Assignment notification already exists for ${firstName}`)
        return
      }

      // Calculate days left
      const daysLeft = Math.ceil(
        (new Date(period.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )

      // Get assignee names (max 3)
      const assigneeNames = pendingAssignments
        .slice(0, 3)
        .map(a => a.assessee?.full_name || 'Rekan kerja')
        .join(', ')

      const remainingText = pendingCount > 3 ? ` dan ${pendingCount - 3} lainnya` : ''
      const priority = pendingCount >= 5 ? 'high' : pendingCount >= 3 ? 'medium' : 'low'

      console.log(`Creating assignment notification for ${firstName}`)
      await NotificationService.sendSystemNotification(
        [user.id],
        `📋 ${pendingCount} Penilaian Menunggu`,
        `${firstName}, Anda memiliki ${pendingCount} rekan kerja yang menunggu penilaian: ${assigneeNames}${remainingText}. Periode berakhir dalam ${daysLeft} hari lagi.`,
        '/assessment',
        priority
      )

    } catch (error) {
      console.error(`Failed to create assignment notification for ${firstName}:`, error)
    }
  }

  // Public method for single user - FIXED
  static async generateForUser(userId: string): Promise<void> {
    try {
      // Check if notifications were generated recently (within last 6 hours)
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
      
      const { data: recentNotifications } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', userId)
        .eq('type', 'system')
        .gte('created_at', sixHoursAgo)
        .limit(5)

      if (recentNotifications && recentNotifications.length >= 3) {
        console.log(`User ${userId} already has ${recentNotifications.length} recent notifications, skipping...`)
        return
      }

      const { data: user } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (user) {
        await this.generateUserSimpleNotifications(user)
      }
    } catch (error) {
      console.error('Failed to generate notifications for user:', error)
    }
  }

  // Daily reminder - SIMPLIFIED
  static async sendDailyReminders(): Promise<void> {
    try {
      console.log('🔔 Sending daily reminders...')
      
      // Get current active period
      const { data: period } = await supabase
        .from('assessment_periods')
        .select('*')
        .eq('is_active', true)
        .single()

      if (!period) {
        console.log('No active period for daily reminders')
        return
      }

      // Calculate days left
      const daysLeft = Math.ceil(
        (new Date(period.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )

      // Only send reminders if deadline is approaching (7 days or less)
      if (daysLeft > 7) {
        console.log(`Deadline is ${daysLeft} days away, no urgent reminders needed`)
        return
      }

      // Get users with pending assignments
      const { data: pendingData } = await supabase
        .from('assessment_assignments')
        .select(`
          assessor_id,
          assessor:profiles!assessment_assignments_assessor_id_fkey(full_name)
        `)
        .eq('period_id', period.id)
        .eq('is_completed', false)

      if (!pendingData) return

      // Group by user and count
      const userCounts = new Map<string, { name: string; count: number }>()
      
      pendingData.forEach(item => {
        const userId = item.assessor_id
        const userName = item.assessor?.full_name || 'Unknown'
        
        if (userCounts.has(userId)) {
          userCounts.get(userId)!.count++
        } else {
          userCounts.set(userId, { name: userName, count: 1 })
        }
      })

      // Send daily reminders
      for (const [userId, userData] of userCounts) {
        const firstName = userData.name.split(' ')[0]
        
        let urgency: 'low' | 'medium' | 'high' | 'urgent' = 'medium'
        let emoji = '📋'
        let prefix = 'Pengingat'

        if (daysLeft <= 1) {
          urgency = 'urgent'
          emoji = '🚨'
          prefix = 'URGENT - Deadline Hari Ini'
        } else if (daysLeft <= 3) {
          urgency = 'urgent'
          emoji = '⚠️'
          prefix = `Deadline ${daysLeft} Hari Lagi`
        } else if (daysLeft <= 7) {
          urgency = 'high'
          emoji = '⏰'
          prefix = `Deadline ${daysLeft} Hari Lagi`
        }

        await NotificationService.sendSystemNotification(
          [userId],
          `${emoji} ${prefix}: ${userData.count} Penilaian`,
          `${firstName}, pengingat: Anda masih memiliki ${userData.count} penilaian yang belum diselesaikan. Deadline dalam ${daysLeft} hari lagi. Jangan sampai terlewat!`,
          '/assessment',
          urgency
        )

        await new Promise(resolve => setTimeout(resolve, 200))
      }

      console.log(`✅ Daily reminders sent to ${userCounts.size} users`)
    } catch (error) {
      console.error('❌ Failed to send daily reminders:', error)
    }
  }

  // Remove duplicates
  static async removeDuplicates(): Promise<void> {
    try {
      console.log('🧹 Removing duplicate notifications...')
      
      // First, remove old notifications (older than 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      await supabase
        .from('notifications')
        .delete()
        .lt('created_at', thirtyDaysAgo.toISOString())

      // Then, remove recent duplicates (keep only the latest one for each user-title combination)
      const { data: duplicates } = await supabase
        .from('notifications')
        .select('user_id, title, created_at, id')
        .eq('type', 'system')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })

      if (duplicates) {
        const seen = new Set<string>()
        const toDelete: string[] = []

        duplicates.forEach(notification => {
          const key = `${notification.user_id}-${notification.title.toLowerCase()}`
          if (seen.has(key)) {
            toDelete.push(notification.id)
          } else {
            seen.add(key)
          }
        })

        if (toDelete.length > 0) {
          await supabase
            .from('notifications')
            .delete()
            .in('id', toDelete)

          console.log(`✅ Removed ${toDelete.length} duplicate notifications`)
        }
      }

      console.log('✅ Duplicate cleanup completed')
    } catch (error) {
      console.error('Failed to remove duplicates:', error)
    }
  }
}