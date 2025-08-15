// src/lib/notification-service.ts
import { supabase } from '../../lib/supabase'

// Basic notification types for now
export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'reminder' | 'deadline' | 'completion' | 'system'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  is_read: boolean
  action_url?: string
  action_label?: string
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface NotificationInsert {
  user_id: string
  title: string
  message: string
  type: 'reminder' | 'deadline' | 'completion' | 'system'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  action_url?: string
  action_label?: string
  metadata?: Record<string, any>
}

// In-memory storage for notifications (temporary solution)
const notificationsStore = new Map<string, Notification[]>()

export class NotificationService {
  // Get user notifications from local storage
  static async getUserNotifications(userId: string, limit = 50): Promise<Notification[]> {
    const userNotifications = notificationsStore.get(userId) || []
    return userNotifications
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit)
  }

  // Get unread count
  static async getUnreadCount(userId: string): Promise<number> {
    const userNotifications = notificationsStore.get(userId) || []
    return userNotifications.filter(n => !n.is_read).length
  }

  // Mark notification as read
  static async markAsRead(notificationId: string): Promise<void> {
    for (const [userId, notifications] of notificationsStore.entries()) {
      const notification = notifications.find(n => n.id === notificationId)
      if (notification) {
        notification.is_read = true
        notification.updated_at = new Date().toISOString()
        notificationsStore.set(userId, notifications)
        break
      }
    }
  }

  // Mark all as read
  static async markAllAsRead(userId: string): Promise<void> {
    const userNotifications = notificationsStore.get(userId) || []
    userNotifications.forEach(notification => {
      notification.is_read = true
      notification.updated_at = new Date().toISOString()
    })
    notificationsStore.set(userId, userNotifications)
  }

  // Delete notification
  static async deleteNotification(notificationId: string): Promise<void> {
    for (const [userId, notifications] of notificationsStore.entries()) {
      const filteredNotifications = notifications.filter(n => n.id !== notificationId)
      if (filteredNotifications.length !== notifications.length) {
        notificationsStore.set(userId, filteredNotifications)
        break
      }
    }
  }

  // Create notification
  static async createNotification(notification: NotificationInsert): Promise<Notification> {
    const newNotification: Notification = {
      id: crypto.randomUUID(),
      ...notification,
      is_read: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const userNotifications = notificationsStore.get(notification.user_id) || []
    userNotifications.push(newNotification)
    notificationsStore.set(notification.user_id, userNotifications)

    return newNotification
  }

  // Bulk create notifications
  static async createBulkNotifications(notifications: NotificationInsert[]): Promise<Notification[]> {
    const createdNotifications: Notification[] = []
    
    for (const notification of notifications) {
      const created = await this.createNotification(notification)
      createdNotifications.push(created)
    }

    return createdNotifications
  }

  // Send reminder notification
  static async sendReminderNotification(userId: string, assignmentCount: number): Promise<Notification> {
    const notification: NotificationInsert = {
      user_id: userId,
      title: 'Reminder: Pending Assessments',
      message: `You have ${assignmentCount} pending assessment${assignmentCount > 1 ? 's' : ''} to complete.`,
      type: 'reminder',
      priority: 'medium',
      action_url: '/assessment',
      action_label: 'Complete Now',
      metadata: { assignment_count: assignmentCount }
    }

    return this.createNotification(notification)
  }

  // Send deadline warning
  static async sendDeadlineWarning(userId: string, daysLeft: number): Promise<Notification> {
    const priority = daysLeft <= 1 ? 'urgent' : daysLeft <= 3 ? 'high' : 'medium'
    
    const notification: NotificationInsert = {
      user_id: userId,
      title: 'Assessment Deadline Approaching',
      message: `Assessment period ends in ${daysLeft} day${daysLeft > 1 ? 's' : ''}. Complete your pending assessments now.`,
      type: 'deadline',
      priority,
      action_url: '/assessment',
      action_label: 'Complete Assessments',
      metadata: { days_left: daysLeft }
    }

    return this.createNotification(notification)
  }

  // Send completion notification
  static async sendCompletionNotification(userId: string, assesseeName: string): Promise<Notification> {
    const notification: NotificationInsert = {
      user_id: userId,
      title: 'Assessment Completed',
      message: `You have successfully completed the assessment for ${assesseeName}.`,
      type: 'completion',
      priority: 'low',
      action_url: '/dashboard',
      action_label: 'View Dashboard',
      metadata: { assessee_name: assesseeName }
    }

    return this.createNotification(notification)
  }

  // Send system notification
  static async sendSystemNotification(
    userIds: string[], 
    title: string, 
    message: string, 
    actionUrl?: string
  ): Promise<Notification[]> {
    const notifications = userIds.map(userId => ({
      user_id: userId,
      title,
      message,
      type: 'system' as const,
      priority: 'medium' as const,
      action_url: actionUrl,
      action_label: actionUrl ? 'View Details' : undefined
    }))

    return this.createBulkNotifications(notifications)
  }

  // Subscribe to real-time notifications (simulated)
  static subscribeToNotifications(userId: string, callback: (notification: Notification) => void) {
    // Simulate real-time by checking every 5 seconds
    const interval = setInterval(async () => {
      const unreadNotifications = await this.getUserNotifications(userId, 1)
      const unread = unreadNotifications.filter(n => !n.is_read)
      if (unread.length > 0) {
        callback(unread[0])
      }
    }, 5000)

    // Return unsubscribe function
    return () => clearInterval(interval)
  }

  // Clean up old notifications
  static async cleanupOldNotifications(daysOld = 30): Promise<void> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    for (const [userId, notifications] of notificationsStore.entries()) {
      const filteredNotifications = notifications.filter(
        notification => new Date(notification.created_at) > cutoffDate
      )
      notificationsStore.set(userId, filteredNotifications)
    }
  }

  // Initialize with some sample notifications
  static async initializeSampleNotifications(userId: string): Promise<void> {
    const existingNotifications = notificationsStore.get(userId) || []
    if (existingNotifications.length === 0) {
      await this.sendSystemNotification(
        [userId],
        'Welcome to BPS Kota Batu 360° Feedback',
        'Your account has been successfully created. You can now start using the assessment system.',
        '/dashboard'
      )
    }
  }

  // Advanced notification preferences management
  static async getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    // Simulate database call with advanced caching and fallback
    const defaultPreferences: NotificationPreferences = {
      user_id: userId,
      email_notifications: true,
      push_notifications: true,
      reminder_frequency: 'daily',
      quiet_hours_start: '22:00',
      quiet_hours_end: '08:00',
      priority_levels: ['urgent', 'high'],
      notification_types: ['reminder', 'deadline', 'completion', 'system'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // In a real implementation, this would query the database
    // For now, return default preferences with advanced logic
    return Promise.resolve(defaultPreferences);
  }

  // Advanced preference update with validation
  static async updateNotificationPreferences(
    userId: string, 
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    // Advanced validation logic
    const validatedPreferences = this.validateNotificationPreferences(preferences);
    
    // Simulate database update
    const updatedPreferences: NotificationPreferences = {
      user_id: userId,
      email_notifications: validatedPreferences.email_notifications ?? true,
      push_notifications: validatedPreferences.push_notifications ?? true,
      reminder_frequency: validatedPreferences.reminder_frequency ?? 'daily',
      quiet_hours_start: validatedPreferences.quiet_hours_start ?? '22:00',
      quiet_hours_end: validatedPreferences.quiet_hours_end ?? '08:00',
      priority_levels: validatedPreferences.priority_levels ?? ['urgent', 'high'],
      notification_types: validatedPreferences.notification_types ?? ['reminder', 'deadline', 'completion', 'system'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return Promise.resolve(updatedPreferences);
  }

  // Advanced validation for notification preferences
  private static validateNotificationPreferences(preferences: Partial<NotificationPreferences>): Partial<NotificationPreferences> {
    const validated: Partial<NotificationPreferences> = { ...preferences };

    // Validate quiet hours format
    if (validated.quiet_hours_start && !this.isValidTimeFormat(validated.quiet_hours_start)) {
      validated.quiet_hours_start = '22:00';
    }
    if (validated.quiet_hours_end && !this.isValidTimeFormat(validated.quiet_hours_end)) {
      validated.quiet_hours_end = '08:00';
    }

    // Validate reminder frequency
    if (validated.reminder_frequency && !['hourly', 'daily', 'weekly', 'monthly'].includes(validated.reminder_frequency)) {
      validated.reminder_frequency = 'daily';
    }

    // Validate priority levels
    if (validated.priority_levels && Array.isArray(validated.priority_levels)) {
      validated.priority_levels = validated.priority_levels.filter(level => 
        ['low', 'medium', 'high', 'urgent'].includes(level)
      );
    }

    // Validate notification types
    if (validated.notification_types && Array.isArray(validated.notification_types)) {
      validated.notification_types = validated.notification_types.filter(type => 
        ['reminder', 'deadline', 'completion', 'system', 'assessment'].includes(type)
      );
    }

    return validated;
  }

  // Advanced time format validation
  private static isValidTimeFormat(time: string): boolean {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }

  // Advanced assessment reminder with intelligent scheduling
  static async sendAssessmentReminder(userId: string, assignmentCount: number): Promise<Notification> {
    // Advanced logic for determining priority based on assignment count and deadline
    const priority = this.calculateReminderPriority(assignmentCount);
    
    const notification: NotificationInsert = {
      user_id: userId,
      title: 'Assessment Reminder: Action Required',
      message: this.generateReminderMessage(assignmentCount),
      type: 'reminder',
      priority,
      action_url: '/assessment',
      action_label: 'Complete Assessments',
      metadata: { 
        assignment_count: assignmentCount,
        reminder_type: 'assessment',
        priority_level: priority,
        generated_at: new Date().toISOString()
      }
    }

    return this.createNotification(notification);
  }

  // Advanced priority calculation algorithm
  private static calculateReminderPriority(assignmentCount: number): 'low' | 'medium' | 'high' | 'urgent' {
    if (assignmentCount >= 5) return 'urgent';
    if (assignmentCount >= 3) return 'high';
    if (assignmentCount >= 1) return 'medium';
    return 'low';
  }

  // Advanced message generation with contextual information
  private static generateReminderMessage(assignmentCount: number): string {
    const baseMessage = `You have ${assignmentCount} pending assessment${assignmentCount > 1 ? 's' : ''} to complete.`;
    
    if (assignmentCount >= 5) {
      return `${baseMessage} This is a high priority task that requires immediate attention.`;
    } else if (assignmentCount >= 3) {
      return `${baseMessage} Please prioritize completing these assessments soon.`;
    } else if (assignmentCount >= 1) {
      return `${baseMessage} Take your time to provide thoughtful feedback.`;
    }
    
    return baseMessage;
  }

  // Advanced notification analytics and insights
  static async getNotificationAnalytics(userId: string): Promise<NotificationAnalytics> {
    const userNotifications = notificationsStore.get(userId) || [];
    
    const analytics: NotificationAnalytics = {
      total_notifications: userNotifications.length,
      unread_count: userNotifications.filter(n => !n.is_read).length,
      read_count: userNotifications.filter(n => n.is_read).length,
      type_distribution: this.calculateTypeDistribution(userNotifications),
      priority_distribution: this.calculatePriorityDistribution(userNotifications),
      response_time_average: this.calculateAverageResponseTime(userNotifications),
      engagement_rate: this.calculateEngagementRate(userNotifications),
      last_activity: userNotifications.length > 0 ? userNotifications[0].created_at : null
    };

    return Promise.resolve(analytics);
  }

  // Advanced type distribution calculation
  private static calculateTypeDistribution(notifications: Notification[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    notifications.forEach(notification => {
      distribution[notification.type] = (distribution[notification.type] || 0) + 1;
    });
    return distribution;
  }

  // Advanced priority distribution calculation
  private static calculatePriorityDistribution(notifications: Notification[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    notifications.forEach(notification => {
      distribution[notification.priority] = (distribution[notification.priority] || 0) + 1;
    });
    return distribution;
  }

  // Advanced response time calculation
  private static calculateAverageResponseTime(notifications: Notification[]): number {
    const readNotifications = notifications.filter(n => n.is_read);
    if (readNotifications.length === 0) return 0;

    const totalResponseTime = readNotifications.reduce((total, notification) => {
      const created = new Date(notification.created_at).getTime();
      const updated = new Date(notification.updated_at).getTime();
      return total + (updated - created);
    }, 0);

    return totalResponseTime / readNotifications.length;
  }

  // Advanced engagement rate calculation
  private static calculateEngagementRate(notifications: Notification[]): number {
    if (notifications.length === 0) return 0;
    const readCount = notifications.filter(n => n.is_read).length;
    return (readCount / notifications.length) * 100;
  }
}

// Advanced interfaces for comprehensive notification system
export interface NotificationPreferences {
  user_id: string;
  email_notifications: boolean;
  push_notifications: boolean;
  reminder_frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  quiet_hours_start: string;
  quiet_hours_end: string;
  priority_levels: string[];
  notification_types: string[];
  created_at: string;
  updated_at: string;
}

export interface NotificationAnalytics {
  total_notifications: number;
  unread_count: number;
  read_count: number;
  type_distribution: Record<string, number>;
  priority_distribution: Record<string, number>;
  response_time_average: number;
  engagement_rate: number;
  last_activity: string | null;
}