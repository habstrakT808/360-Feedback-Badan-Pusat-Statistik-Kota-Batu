// src/lib/notification-service.ts
import { prisma } from './prisma'

// Type definitions from Prisma
type NotificationRow = {
  id: string
  user_id: string
  title: string
  message: string
  type: string
  priority: string
  is_read: boolean
  action_url: string | null
  action_label: string | null
  metadata: any
  expires_at: Date | null
  created_at: Date
  updated_at: Date
}

type NotificationInsert = {
  user_id: string
  title: string
  message: string
  type: string
  priority?: string
  is_read?: boolean
  action_url?: string | null
  action_label?: string | null
  metadata?: any
  expires_at?: Date | null
}
type NotificationUpdate = Partial<NotificationInsert> & { id: string }

type NotificationPreferencesRow = {
  id: string
  user_id: string
  email_enabled: boolean
  push_enabled: boolean
  assessment_reminders: boolean
  deadline_warnings: boolean
  completion_notifications: boolean
  system_notifications: boolean
  reminder_frequency: string
  quiet_hours_start: Date
  quiet_hours_end: Date
  created_at: Date
  updated_at: Date
}

type NotificationPreferencesInsert = {
  user_id: string
  email_enabled?: boolean
  push_enabled?: boolean
  assessment_reminders?: boolean
  deadline_warnings?: boolean
  completion_notifications?: boolean
  system_notifications?: boolean
  reminder_frequency?: string
  quiet_hours_start: Date
  quiet_hours_end: Date
}

type NotificationPreferencesUpdate = Partial<NotificationPreferencesInsert> & { id: string }

// Export interfaces that match database structure
export interface Notification extends NotificationRow {}
export interface NotificationInsertType extends NotificationInsert {
  // Add any additional properties if needed
}
export interface NotificationPreferences extends NotificationPreferencesRow {
  // Add any additional properties if needed
}

export interface NotificationAnalytics {
  total_notifications: number
  unread_count: number
  read_count: number
  type_distribution: Record<string, number>
  priority_distribution: Record<string, number>
  response_time_average: number
  engagement_rate: number
  last_activity: string | null
}

export class NotificationService {
  // Get user notifications from database
  static async getUserNotifications(userId: string, limit = 50): Promise<Notification[]> {
    try {
      if (typeof window !== 'undefined') {
        const res = await fetch(`/api/notifications/list?limit=${encodeURIComponent(String(limit))}`, { cache: 'no-store' })
        if (!res.ok) return []
        const json = await res.json().catch(() => ({}))
        return json.data || []
      }
      const data = await prisma.notification.findMany({ where: { user_id: userId }, orderBy: { created_at: 'desc' }, take: limit })
      return data || []
    } catch (error) {
      console.error('Failed to get user notifications:', error)
      return []
    }
  }

  // Get unread count
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/notifications/unread-count', { cache: 'no-store' })
        if (!res.ok) return 0
        const json = await res.json().catch(() => ({}))
        return json.count || 0
      }
      const count = await prisma.notification.count({
        where: {
          user_id: userId,
          is_read: false
        }
      })

      return count || 0
    } catch (error) {
      console.error('Failed to get unread count:', error)
      return 0
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId: string): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        await fetch('/api/notifications/mark-read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: notificationId }) })
        return
      }
      await prisma.notification.update({
        where: { id: notificationId },
        data: { 
          is_read: true, 
          updated_at: new Date()
        }
      })
    } catch (error) {
      console.error('Failed to mark as read:', error)
      throw error
    }
  }

  // Mark all as read
  static async markAllAsRead(userId: string): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        await fetch('/api/notifications/mark-all-read', { method: 'POST' })
        return
      }
      await prisma.notification.updateMany({
        where: { 
          user_id: userId,
          is_read: false
        },
        data: { 
          is_read: true, 
          updated_at: new Date()
        }
      })
    } catch (error) {
      console.error('Failed to mark all as read:', error)
      throw error
    }
  }

  // Delete notification
  static async deleteNotification(notificationId: string): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        await fetch('/api/notifications/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: notificationId }) })
        return
      }
      await prisma.notification.delete({
        where: { id: notificationId }
      })
    } catch (error) {
      console.error('Failed to delete notification:', error)
      throw error
    }
  }

  // Create notification
  static async createNotification(notification: NotificationInsertType): Promise<Notification> {
    try {
      const data = await prisma.notification.create({
        data: notification
      })

      return data
    } catch (error) {
      console.error('Failed to create notification:', error)
      throw error
    }
  }

  // Bulk create notifications - ADD DETAILED LOGGING
  static async createBulkNotifications(notifications: NotificationInsertType[]): Promise<Notification[]> {
    try {
      console.log('Creating bulk notifications:', notifications.length, 'items')
      
      if (!notifications || notifications.length === 0) {
        console.log('No notifications to create')
        return []
      }

      // Validate and clean data
      const validatedNotifications = notifications.map((notification, index) => {
        if (!notification.user_id) {
          throw new Error(`Missing user_id for notification ${index}`)
        }
        if (!notification.title) {
          throw new Error(`Missing title for notification ${index}`)
        }
        if (!notification.message) {
          throw new Error(`Missing message for notification ${index}`)
        }

        const validated = {
          user_id: notification.user_id,
          title: notification.title.substring(0, 255), // Ensure within limit
          message: notification.message.substring(0, 1000), // Ensure within limit
          type: notification.type || 'system',
          priority: notification.priority || 'medium',
          action_url: notification.action_url || null,
          action_label: notification.action_label || null,
          metadata: notification.metadata || {}
        }
        
        console.log(`Validated notification ${index + 1}:`, {
          user_id: validated.user_id,
          title: validated.title,
          type: validated.type,
          priority: validated.priority
        })
        
        return validated
      })

      console.log('Attempting to insert', validatedNotifications.length, 'notifications...')

      const data = await prisma.notification.createMany({
        data: validatedNotifications
      })

      console.log('Successfully created', data.count || 0, 'notifications')
      return [] // createMany doesn't return the created records
      
    } catch (error: any) {
      console.error('Failed to create bulk notifications:', {
        error: error.message,
        stack: error.stack,
        notificationCount: notifications?.length || 0
      })
      throw error
    }
  }

  // Send reminder notification
  static async sendReminderNotification(userId: string, assignmentCount: number): Promise<Notification> {
    const notification: NotificationInsertType = {
      user_id: userId,
      title: '📋 Pengingat: Penilaian Menunggu',
      message: `Anda memiliki ${assignmentCount} penilaian yang belum diselesaikan. Silakan lengkapi untuk periode ini.`,
      type: 'reminder',
      priority: assignmentCount >= 5 ? 'urgent' : assignmentCount >= 3 ? 'high' : 'medium',
      action_url: '/assessment',
      action_label: 'Mulai Penilaian',
      metadata: { 
        assignment_count: assignmentCount,
        reminder_type: 'assessment_pending',
        generated_at: new Date().toISOString()
      }
    }

    return this.createNotification(notification)
  }

  // Send deadline warning
  static async sendDeadlineWarning(userId: string, daysLeft: number): Promise<Notification> {
    const priority = daysLeft <= 1 ? 'urgent' : daysLeft <= 3 ? 'high' : 'medium'
    const emoji = daysLeft <= 1 ? '🚨' : daysLeft <= 3 ? '⚠️' : '📅'
    
    const notification: NotificationInsertType = {
      user_id: userId,
      title: `${emoji} ${daysLeft <= 1 ? 'URGENT: ' : ''}Deadline Mendekati`,
      message: `Periode penilaian akan berakhir dalam ${daysLeft} hari${daysLeft > 1 ? '' : ' lagi'}. Pastikan semua penilaian telah diselesaikan!`,
      type: 'deadline',
      priority,
      action_url: '/assessment',
      action_label: 'Selesaikan Sekarang',
      metadata: { 
        days_left: daysLeft,
        urgency_level: priority,
        deadline_type: 'assessment_period'
      }
    }

    return this.createNotification(notification)
  }

  // Send completion notification
  static async sendCompletionNotification(userId: string, assesseeName: string): Promise<Notification> {
    const notification: NotificationInsertType = {
      user_id: userId,
      title: '🎉 Penilaian Berhasil Diselesaikan',
      message: `Terima kasih telah menyelesaikan penilaian untuk ${assesseeName}. Feedback Anda sangat berharga!`,
      type: 'completion',
      priority: 'low',
      action_url: '/my-results',
      action_label: 'Lihat Hasil',
      metadata: { 
        assessee_name: assesseeName,
        completion_type: 'individual_assessment',
        celebration: true
      }
    }

    return this.createNotification(notification)
  }

  // Send assessment invitation
  static async sendAssessmentInvitation(userId: string, periodInfo: any): Promise<Notification> {
    const notification: NotificationInsertType = {
      user_id: userId,
      title: '🎯 Undangan Penilaian 360° Baru',
      message: `Anda diundang untuk berpartisipasi dalam penilaian 360° periode ${periodInfo.month}/${periodInfo.year}. Mari berkontribusi untuk pengembangan tim!`,
      type: 'assessment',
      priority: 'high',
      action_url: '/assessment',
      action_label: 'Lihat Detail',
      metadata: {
        period_id: periodInfo.id,
        month: periodInfo.month,
        year: periodInfo.year,
        invitation_type: 'new_period'
      }
    }

    return this.createNotification(notification)
  }

  // Send system notification - ADD VALIDATION
  static async sendSystemNotification(
    userIds: string[], 
    title: string, 
    message: string, 
    actionUrl?: string,
    priority: string = 'medium'
  ): Promise<Notification[]> {
    try {
      console.log('sendSystemNotification called:', { 
        userCount: userIds?.length || 0, 
        title: title?.substring(0, 50) + '...', 
        priority 
      })
      
      // Enhanced validation
      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        console.error('Invalid userIds provided:', userIds)
        throw new Error('No valid user IDs provided')
      }

      if (!title || title.trim().length === 0) {
        console.error('Empty title provided')
        throw new Error('Title is required and cannot be empty')
      }

      if (!message || message.trim().length === 0) {
        console.error('Empty message provided')
        throw new Error('Message is required and cannot be empty')
      }

      // Validate priority
      const validPriorities = ['low', 'medium', 'high', 'urgent']
      if (!validPriorities.includes(priority)) {
        console.warn(`Invalid priority "${priority}", using "medium"`)
        priority = 'medium'
      }

      // Create notifications array
      const notifications = userIds.map(userId => {
        if (!userId || typeof userId !== 'string') {
          throw new Error(`Invalid user ID: ${userId}`)
        }

        return {
          user_id: userId,
          title: title.trim().substring(0, 255),
          message: message.trim().substring(0, 1000),
          type: 'system' as const,
          priority: priority,
          action_url: actionUrl || null,
          action_label: actionUrl ? 'Lihat Detail' : null,
          metadata: {
            system_notification: true,
            broadcast: userIds.length > 1,
            sent_at: new Date().toISOString()
          }
        }
      })

      console.log('Prepared notifications for', notifications.length, 'users')
      return await this.createBulkNotifications(notifications)
      
    } catch (error: any) {
      console.error('sendSystemNotification failed:', {
        error: error.message,
        userIds: userIds?.length || 0,
        title: title?.substring(0, 30) || 'undefined'
      })
      throw error
    }
  }

  // Get notification preferences
  static async getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/notifications/preferences', { cache: 'no-store' })
        if (!res.ok) throw new Error('Failed to fetch preferences')
        const json = await res.json()
        return json.data as NotificationPreferences
      }
      const data = await prisma.notificationPreference.findFirst({ where: { user_id: userId } })
      
      if (!data) {
        // Create default preferences if none exist
        const defaultPreferences = {
          user_id: userId,
          email_enabled: true,
          push_enabled: true,
          assessment_reminders: true,
          deadline_warnings: true,
          completion_notifications: true,
          system_notifications: true,
          reminder_frequency: 'daily',
          quiet_hours_start: new Date('1970-01-01T22:00:00Z'),
          quiet_hours_end: new Date('1970-01-01T08:00:00Z')
        }

        const newPrefs = await prisma.notificationPreference.create({
          data: defaultPreferences
        })

        return newPrefs
      }

      return data
    } catch (error) {
      console.error('Failed to get notification preferences:', error)
      // Return default preferences on error
      return {
        id: '',
        user_id: userId,
        email_enabled: true,
        push_enabled: true,
        assessment_reminders: true,
        deadline_warnings: true,
        completion_notifications: true,
        system_notifications: true,
        reminder_frequency: 'daily',
        quiet_hours_start: new Date('1970-01-01T22:00:00Z'),
        quiet_hours_end: new Date('1970-01-01T08:00:00Z'),
        created_at: new Date(),
        updated_at: new Date()
      }
    }
  }

  // Update notification preferences
  static async updateNotificationPreferences(
    userId: string, 
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    try {
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/notifications/preferences', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ preferences }) })
        if (!res.ok) throw new Error('Failed to update preferences')
        const json = await res.json()
        return json.data as NotificationPreferences
      }
      // First try to find existing preferences
      const existing = await prisma.notificationPreference.findFirst({
        where: { user_id: userId }
      })

      let data
      if (existing) {
        // Update existing preferences
        data = await prisma.notificationPreference.update({
          where: { id: existing.id },
          data: {
            ...preferences,
            updated_at: new Date()
          }
        })
      } else {
        // Create new preferences
        data = await prisma.notificationPreference.create({
          data: {
            user_id: userId,
            ...preferences,
            email_enabled: true,
            push_enabled: true,
            assessment_reminders: true,
            deadline_warnings: true,
            completion_notifications: true,
            system_notifications: true,
            reminder_frequency: 'daily',
            quiet_hours_start: new Date('1970-01-01T22:00:00Z'),
            quiet_hours_end: new Date('1970-01-01T08:00:00Z')
          }
        })
      }

      return data
    } catch (error) {
      console.error('Failed to update notification preferences:', error)
      throw error
    }
  }

  // Subscribe to real-time notifications
  static subscribeToNotifications(userId: string, callback: (notification: Notification) => void) {
    // TODO: Implement real-time notifications with Prisma
    // For now, return a no-op unsubscribe function
    console.log('Real-time notifications not implemented with Prisma yet')
    return () => {
      // No-op unsubscribe function
    }
  }

  // Initialize sample notifications for new users
  static async initializeSampleNotifications(userId: string): Promise<void> {
    try {
      const existingCount = await this.getUnreadCount(userId)
      if (existingCount > 0) return // User already has notifications

      // Create welcome notification
      await this.sendSystemNotification(
        [userId],
        '🎉 Selamat Datang di BPS Kota Batu 360° Feedback!',
        'Akun Anda telah berhasil dibuat. Anda sekarang dapat mulai menggunakan sistem penilaian untuk memberikan feedback yang berharga kepada rekan kerja.',
        '/dashboard',
        'medium'
      )

      // Create sample assessment reminder
      await this.sendReminderNotification(userId, 2)

      // Create sample tip notification
      await this.sendSystemNotification(
        [userId],
        '💡 Tips: Memberikan Feedback yang Efektif',
        'Berikan feedback yang spesifik, konstruktif, dan actionable. Fokus pada perilaku dan dampaknya, bukan pada kepribadian.',
        undefined,
        'low'
      )

    } catch (error) {
      console.error('Failed to initialize sample notifications:', error)
    }
  }

  // Clean up old notifications
  static async cleanupOldNotifications(daysOld = 30): Promise<void> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysOld)

      await prisma.notification.deleteMany({
        where: {
          is_read: true,
          created_at: {
            lt: cutoffDate
          }
        }
      })
    } catch (error) {
      console.error('Failed to cleanup old notifications:', error)
    }
  }

  // Get notification analytics
  static async getNotificationAnalytics(userId: string): Promise<NotificationAnalytics> {
    try {
      const notifications = await this.getUserNotifications(userId, 1000)
      
      const analytics: NotificationAnalytics = {
        total_notifications: notifications.length,
        unread_count: notifications.filter(n => !n.is_read).length,
        read_count: notifications.filter(n => n.is_read).length,
        type_distribution: this.calculateTypeDistribution(notifications),
        priority_distribution: this.calculatePriorityDistribution(notifications),
        response_time_average: this.calculateAverageResponseTime(notifications),
        engagement_rate: this.calculateEngagementRate(notifications),
        last_activity: notifications.length > 0 ? notifications[0].created_at.toISOString() : null
      }

      return analytics
    } catch (error) {
      console.error('Failed to get notification analytics:', error)
      throw error
    }
  }

  // Helper methods
  private static calculateTypeDistribution(notifications: Notification[]): Record<string, number> {
    const distribution: Record<string, number> = {}
    notifications.forEach(notification => {
      const type = notification.type || 'unknown'
      distribution[type] = (distribution[type] || 0) + 1
    })
    return distribution
  }

  private static calculatePriorityDistribution(notifications: Notification[]): Record<string, number> {
    const distribution: Record<string, number> = {}
    notifications.forEach(notification => {
      const priority = notification.priority || 'medium'
      distribution[priority] = (distribution[priority] || 0) + 1
    })
    return distribution
  }

  private static calculateAverageResponseTime(notifications: Notification[]): number {
    const readNotifications = notifications.filter(n => n.is_read)
    if (readNotifications.length === 0) return 0

    const totalResponseTime = readNotifications.reduce((total, notification) => {
      const created = new Date(notification.created_at).getTime()
      const updated = new Date(notification.updated_at).getTime()
      return total + (updated - created)
    }, 0)

    return totalResponseTime / readNotifications.length
  }

  private static calculateEngagementRate(notifications: Notification[]): number {
    if (notifications.length === 0) return 0
    const readCount = notifications.filter(n => n.is_read).length
    return (readCount / notifications.length) * 100
  }
}