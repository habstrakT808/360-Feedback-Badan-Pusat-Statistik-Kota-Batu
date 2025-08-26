// src/lib/notification-service.ts
import { supabase } from './supabase'
import type { Database } from './database.types'

// Type definitions from database
type NotificationRow = Database['public']['Tables']['notifications']['Row']
type NotificationInsert = Database['public']['Tables']['notifications']['Insert']
type NotificationUpdate = Database['public']['Tables']['notifications']['Update']

type NotificationPreferencesRow = Database['public']['Tables']['notification_preferences']['Row']
type NotificationPreferencesInsert = Database['public']['Tables']['notification_preferences']['Insert']
type NotificationPreferencesUpdate = Database['public']['Tables']['notification_preferences']['Update']

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
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Failed to get user notifications:', error)
      return []
    }
  }

  // Get unread count
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false)

      if (error) throw error
      return count || 0
    } catch (error) {
      console.error('Failed to get unread count:', error)
      return 0
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('id', notificationId)

      if (error) throw error
    } catch (error) {
      console.error('Failed to mark as read:', error)
      throw error
    }
  }

  // Mark all as read
  static async markAllAsRead(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('is_read', false)

      if (error) throw error
    } catch (error) {
      console.error('Failed to mark all as read:', error)
      throw error
    }
  }

  // Delete notification
  static async deleteNotification(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (error) throw error
    } catch (error) {
      console.error('Failed to delete notification:', error)
      throw error
    }
  }

  // Create notification
  static async createNotification(notification: NotificationInsertType): Promise<Notification> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([notification])
        .select()
        .single()

      if (error) throw error
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

      const { data, error } = await supabase
        .from('notifications')
        .insert(validatedNotifications)
        .select()

      if (error) {
        console.error('Supabase insert error:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        throw new Error(`Database insert failed: ${error.message} (Code: ${error.code})`)
      }
      
      if (!data) {
        console.error('No data returned from insert')
        throw new Error('No data returned from database insert')
      }

      console.log('Successfully created', data.length, 'notifications')
      return data
      
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
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      
      if (!data) {
        // Create default preferences if none exist
        const defaultPreferences: NotificationPreferencesInsert = {
          user_id: userId,
          email_enabled: true,
          push_enabled: true,
          assessment_reminders: true,
          deadline_warnings: true,
          completion_notifications: true,
          system_notifications: true,
          reminder_frequency: 'daily',
          quiet_hours_start: '22:00',
          quiet_hours_end: '08:00'
        }

        const { data: newPrefs, error: createError } = await supabase
          .from('notification_preferences')
          .insert([defaultPreferences])
          .select()
          .single()

        if (createError) throw createError
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
        quiet_hours_start: '22:00',
        quiet_hours_end: '08:00',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }
  }

  // Update notification preferences
  static async updateNotificationPreferences(
    userId: string, 
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to update notification preferences:', error)
      throw error
    }
  }

  // Subscribe to real-time notifications
  static subscribeToNotifications(userId: string, callback: (notification: Notification) => void) {
    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          callback(payload.new as Notification)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
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

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('is_read', true)
        .lt('created_at', cutoffDate.toISOString())

      if (error) throw error
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
        last_activity: notifications.length > 0 ? notifications[0].created_at : null
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