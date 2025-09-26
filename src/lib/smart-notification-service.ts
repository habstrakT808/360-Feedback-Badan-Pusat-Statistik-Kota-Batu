// src/lib/smart-notification-service-improved.ts
import { prisma } from './prisma'
import { NotificationService } from './notification-service'

interface UserData {
  id: string
  full_name: string
  position: string | null
  department: string | null
}

export class SmartNotificationServiceImproved {
  private static readonly DUPLICATE_CHECK_HOURS = 6
  private static readonly BATCH_SIZE = 3
  private static readonly DELAY_BETWEEN_USERS = 500

  // Generate notifications with better duplicate prevention
  static async generateSimpleNotifications(): Promise<void> {
    if (typeof window !== 'undefined') return
    try {
      console.log('🚀 Starting improved notification generation...')
      
      // First, cleanup any recent duplicates
      await this.cleanupRecentDuplicatesSimple()
      
      const users = await prisma.profile.findMany({
        orderBy: { full_name: 'asc' }
      })

      if (!users) {
        console.error('Failed to fetch users')
        return
      }

      console.log(`📧 Processing ${users.length} users...`)

      // Process users one by one with delay to prevent race conditions
      for (const user of users) {
        try {
          await this.generateUserNotificationsImproved(user)
          await new Promise(resolve => setTimeout(resolve, this.DELAY_BETWEEN_USERS))
        } catch (error) {
          console.error(`Failed for user ${user.full_name}:`, error)
          // Continue with next user
        }
      }

      console.log('🎉 Improved notification generation completed!')
    } catch (error) {
      console.error('❌ Failed to generate notifications:', error)
    }
  }

  // Improved notification generation with better duplicate checking
  private static async generateUserNotificationsImproved(user: UserData): Promise<void> {
    if (typeof window !== 'undefined') return
    try {
      console.log(`📝 Processing: ${user.full_name}`)
      
      const firstName = user.full_name.split(' ')[0]
      const checkTime = new Date(Date.now() - this.DUPLICATE_CHECK_HOURS * 60 * 60 * 1000).toISOString()

      // Get existing notifications with more specific checking
      const existingNotifications = await prisma.notification.findMany({
        where: {
          user_id: user.id,
          type: 'system',
          created_at: {
            gte: new Date(checkTime)
          }
        },
        select: {
          title: true,
          type: true,
          created_at: true,
          message: true
        },
        orderBy: {
          created_at: 'desc'
        }
      })

      // Create a more specific key for duplicate detection
      const existingKeys = new Set(
        (existingNotifications || []).map((n: { title: string; message: string; type: string; created_at: Date }) => 
          this.createNotificationKey(n.title, n.message)
        )
      )

      console.log(`${firstName} has ${existingKeys.size} recent notifications`)

      const notificationsToCreate: any[] = []

      // 1. Welcome notification
      const welcomeTitle = `👋 Selamat datang, ${firstName}!`
      const welcomeMessage = `Selamat datang di sistem penilaian 360° BPS Kota Batu! Mari bersama-sama membangun budaya feedback yang konstruktif untuk pengembangan organisasi.`
      const welcomeKey = this.createNotificationKey(welcomeTitle, welcomeMessage)
      
      if (!existingKeys.has(welcomeKey)) {
        notificationsToCreate.push({
          user_id: user.id,
          title: welcomeTitle,
          message: welcomeMessage,
          type: 'system',
          priority: 'low',
          action_url: '/dashboard',
          metadata: { 
            notification_type: 'welcome',
            generated_at: new Date().toISOString(),
            user_name: firstName
          }
        })
      }

      // 2. Assignment notification
      const assignmentNotification = await this.createAssignmentNotificationData(user, firstName)
      if (assignmentNotification) {
        const assignmentKey = this.createNotificationKey(assignmentNotification.title, assignmentNotification.message)
        if (!existingKeys.has(assignmentKey)) {
          notificationsToCreate.push(assignmentNotification)
        }
      }

      // 3. Tips notification
      const tipsTitle = `💡 Tips: Memberikan Feedback yang Efektif`
      const tipsMessage = `${firstName}, berikan feedback yang spesifik, konstruktif, dan actionable. Fokus pada perilaku dan dampaknya, bukan pada kepribadian. Berikan contoh konkret dan saran perbaikan yang dapat ditindaklanjuti.`
      const tipsKey = this.createNotificationKey(tipsTitle, tipsMessage)
      
      if (!existingKeys.has(tipsKey)) {
        notificationsToCreate.push({
          user_id: user.id,
          title: tipsTitle,
          message: tipsMessage,
          type: 'system',
          priority: 'low',
          action_url: '/dashboard',
          metadata: { 
            notification_type: 'tips',
            generated_at: new Date().toISOString(),
            user_name: firstName
          }
        })
      }

      // Create notifications if any (one by one to prevent race conditions)
      if (notificationsToCreate.length > 0) {
        console.log(`Creating ${notificationsToCreate.length} notifications for ${firstName}`)
        
        for (const notification of notificationsToCreate) {
          try {
            await NotificationService.createNotification(notification)
            await new Promise(resolve => setTimeout(resolve, 100)) // Small delay between notifications
          } catch (error) {
            console.error(`Failed to create notification for ${firstName}:`, error)
          }
        }
      } else {
        console.log(`No new notifications needed for ${firstName}`)
      }

      console.log(`✅ Completed: ${user.full_name}`)
    } catch (error) {
      console.error(`❌ Failed for ${user.full_name}:`, error)
      throw error
    }
  }

  // Create assignment notification data
  private static async createAssignmentNotificationData(
    user: UserData, 
    firstName: string
  ): Promise<any | null> {
    try {
      // Get current active period
      const period = await prisma.assessmentPeriod.findFirst({
        where: { is_active: true }
      })

      if (!period) return null

      // Get user assignments
      const assignments = await prisma.assessmentAssignment.findMany({
        where: {
          assessor_id: user.id,
          period_id: period.id
        },
        include: {
          assessee: {
            select: {
              full_name: true
            }
          }
        }
      })

      const assignmentList = assignments || []
      const pendingAssignments = assignmentList.filter((a: { is_completed: boolean; assessee?: { full_name: string } | null }) => !a.is_completed)
      const pendingCount = pendingAssignments.length

      if (pendingCount === 0) return null

      // Calculate days left
      const daysLeft = Math.ceil(
        (new Date(period.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )

      // Get assignee names (max 3)
      const assigneeNames = pendingAssignments
        .slice(0, 3)
        .map((a: { assessee?: { full_name: string } | null }) => a.assessee?.full_name || 'Rekan kerja')
        .join(', ')

      const remainingText = pendingCount > 3 ? ` dan ${pendingCount - 3} lainnya` : ''
      const priority = pendingCount >= 5 ? 'high' : pendingCount >= 3 ? 'medium' : 'low'

      return {
        user_id: user.id,
        title: `📋 ${pendingCount} Penilaian Menunggu`,
        message: `${firstName}, Anda memiliki ${pendingCount} rekan kerja yang menunggu penilaian: ${assigneeNames}${remainingText}. Periode berakhir dalam ${daysLeft} hari lagi.`,
        type: 'system',
        priority: priority,
        action_url: '/assessment',
        metadata: {
          notification_type: 'assignment',
          pending_count: pendingCount,
          days_left: daysLeft,
          period_id: period.id,
          generated_at: new Date().toISOString(),
          user_name: firstName
        }
      }
    } catch (error) {
      console.error(`Failed to create assignment notification for ${firstName}:`, error)
      return null
    }
  }

  // Create unique key for notification
  private static createNotificationKey(title: string, message: string): string {
    // Remove dynamic parts like names and numbers for better duplicate detection
    const normalizedTitle = title
      .replace(/\d+/g, 'N') // Replace numbers with N
      .replace(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g, 'NAME') // Replace names
      .toLowerCase()
      .trim()
    
    const normalizedMessage = message
      .substring(0, 100) // Only check first 100 chars
      .replace(/\d+/g, 'N')
      .replace(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g, 'NAME')
      .toLowerCase()
      .trim()
    
    return `${normalizedTitle}|${normalizedMessage}`
  }

  // Clean up recent duplicates - simplified version
  private static async cleanupRecentDuplicatesSimple(): Promise<void> {
    if (typeof window !== 'undefined') return
    try {
      console.log('🧹 Cleaning up recent duplicates...')
      
      // Get duplicates from last 24 hours
      const duplicates = await prisma.notification.findMany({
        where: {
          created_at: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        },
        select: {
          user_id: true,
          title: true,
          created_at: true,
          id: true
        },
        orderBy: {
          created_at: 'desc'
        }
      })

      if (!duplicates || duplicates.length === 0) return

      // Group by user_id + title to find duplicates
      const groupedNotifications = new Map<string, any[]>()
      
      duplicates.forEach((notification: { user_id: string; title: string; created_at: Date; id: string }) => {
        const key = `${notification.user_id}|${notification.title}`
        if (!groupedNotifications.has(key)) {
          groupedNotifications.set(key, [])
        }
        groupedNotifications.get(key)!.push(notification)
      })

      const idsToDelete: string[] = []
      
      // For each group, keep the oldest and mark others for deletion
      groupedNotifications.forEach(notifications => {
        if (notifications.length > 1) {
          // Sort by created_at and keep the first (oldest)
          notifications.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          // Add all but the first to deletion list
          idsToDelete.push(...notifications.slice(1).map(n => n.id))
        }
      })

      if (idsToDelete.length > 0) {
        // Delete in batches to avoid timeout
        const batchSize = 50
        for (let i = 0; i < idsToDelete.length; i += batchSize) {
          const batch = idsToDelete.slice(i, i + batchSize)
          await prisma.notification.deleteMany({
            where: {
              id: {
                in: batch
              }
            }
          })
          
          console.log(`Deleted batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(idsToDelete.length/batchSize)}`)
        }

        console.log(`✅ Removed ${idsToDelete.length} duplicate notifications`)
      }
    } catch (error) {
      console.error('Failed to cleanup duplicates:', error)
    }
  }

  // Public method for single user
  static async generateForUser(userId: string): Promise<void> {
    if (typeof window !== 'undefined') return
    try {
      console.log(`🔍 Checking notifications for user ${userId}...`)
      
      // Check if user already has the 3 required notifications
      const existingNotifications = await prisma.notification.findMany({
        where: {
          user_id: userId,
          type: 'system'
        },
        select: {
          id: true,
          title: true,
          type: true,
          created_at: true,
          metadata: true
        },
        orderBy: {
          created_at: 'desc'
        }
      })

      if (existingNotifications && existingNotifications.length >= 3) {
        // Check if user has all 3 types of notifications
        const hasWelcome = existingNotifications.some((n: { id: string; title: string; type: string; created_at: Date; metadata: any }) => 
          (typeof n.metadata === 'object' && n.metadata && 'notification_type' in n.metadata && n.metadata.notification_type === 'welcome') || 
          n.title?.includes('Selamat datang')
        )
        const hasTips = existingNotifications.some((n: { id: string; title: string; type: string; created_at: Date; metadata: any }) => 
          (typeof n.metadata === 'object' && n.metadata && 'notification_type' in n.metadata && n.metadata.notification_type === 'tips') || 
          n.title?.includes('Tips')
        )
        const hasAssignment = existingNotifications.some((n: { id: string; title: string; type: string; created_at: Date; metadata: any }) => 
          (typeof n.metadata === 'object' && n.metadata && 'notification_type' in n.metadata && n.metadata.notification_type === 'assignment') || 
          n.title?.includes('Penilaian Menunggu')
        )

        if (hasWelcome && hasTips && hasAssignment) {
          console.log(`User ${userId} already has all 3 required notifications, skipping...`)
          return
        }
      }

      // Clean up any existing duplicates for this user first
      await this.cleanupUserDuplicates(userId)

      const user = await prisma.profile.findUnique({
        where: { id: userId }
      })

      if (user) {
        await this.generateUserNotificationsImproved(user)
      }
    } catch (error) {
      console.error('Failed to generate notifications for user:', error)
    }
  }

  // Clean up duplicates for specific user
  private static async cleanupUserDuplicates(userId: string): Promise<void> {
    if (typeof window !== 'undefined') return
    try {
      console.log(`🧹 Cleaning up duplicates for user ${userId}...`)
      
      // Get all notifications for this user
      const userNotifications = await prisma.notification.findMany({
        where: {
          user_id: userId,
          type: 'system'
        },
        select: {
          id: true,
          title: true,
          message: true,
          created_at: true,
          metadata: true
        },
        orderBy: {
          created_at: 'desc'
        }
      })

      if (!userNotifications || userNotifications.length === 0) return

      // Group by notification type
      const groupedByType = new Map<string, any[]>()
      
      userNotifications.forEach((notification: { id: string; title: string; message: string; created_at: Date; metadata: any }) => {
        let type = 'unknown'
        
        if (typeof notification.metadata === 'object' && notification.metadata && 'notification_type' in notification.metadata && typeof notification.metadata.notification_type === 'string') {
          type = notification.metadata.notification_type
        } else if (notification.title?.includes('Selamat datang')) {
          type = 'welcome'
        } else if (notification.title?.includes('Tips')) {
          type = 'tips'
        } else if (notification.title?.includes('Penilaian Menunggu')) {
          type = 'assignment'
        }
        
        if (!groupedByType.has(type)) {
          groupedByType.set(type, [])
        }
        groupedByType.get(type)!.push(notification)
      })

      const idsToDelete: string[] = []
      
      // For each type, keep only the most recent notification
      groupedByType.forEach((notifications, type) => {
        if (notifications.length > 1) {
          // Sort by created_at and keep the most recent
          notifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          // Add all but the first (most recent) to deletion list
          idsToDelete.push(...notifications.slice(1).map(n => n.id))
        }
      })

      if (idsToDelete.length > 0) {
        console.log(`Deleting ${idsToDelete.length} duplicate notifications for user ${userId}`)
        
        // Delete in batches
        const batchSize = 50
        for (let i = 0; i < idsToDelete.length; i += batchSize) {
          const batch = idsToDelete.slice(i, i + batchSize)
          await prisma.notification.deleteMany({
            where: {
              id: {
                in: batch
              }
            }
          })
        }

        console.log(`✅ Removed ${idsToDelete.length} duplicate notifications for user ${userId}`)
      }
    } catch (error) {
      console.error(`Failed to cleanup duplicates for user ${userId}:`, error)
    }
  }

  // Remove all duplicates
  static async removeDuplicates(): Promise<void> {
    if (typeof window !== 'undefined') return
    try {
      console.log('🧹 Removing all duplicate notifications...')
      
      // Remove old notifications first (30+ days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      await prisma.notification.deleteMany({
        where: {
          is_read: true,
          created_at: {
            lt: thirtyDaysAgo
          }
        }
      })

      // Clean up recent duplicates
      await this.cleanupRecentDuplicatesSimple()

      console.log('✅ Duplicate cleanup completed')
    } catch (error) {
      console.error('Failed to remove duplicates:', error)
    }
  }

  // Daily reminder - simplified
  static async sendDailyReminders(): Promise<void> {
    if (typeof window !== 'undefined') return
    try {
      console.log('🔔 Sending daily reminders...')
      
      // Get current active period
      const period = await prisma.assessmentPeriod.findFirst({
        where: { is_active: true }
      })

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
      const pendingData = await prisma.assessmentAssignment.findMany({
        where: {
          period_id: period.id,
          is_completed: false
        },
        select: {
          assessor_id: true,
          assessor: {
            select: {
              full_name: true
            }
          }
        }
      })

      if (!pendingData) return

      // Group by user and count
      const userCounts = new Map<string, { name: string; count: number }>()
      
      pendingData.forEach((item: { assessor_id: string; assessor?: { full_name: string } | null }) => {
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
        const title = `⏰ Pengingat: Penilaian 360° Menunggu`
        const message = `${userData.name}, Anda memiliki ${userData.count} penilaian 360° yang belum diselesaikan. Deadline: ${daysLeft} hari lagi.`
        
        await NotificationService.createNotification({
          user_id: userId,
          title,
          message,
          type: 'reminder',
          priority: 'high',
          action_url: '/assessment',
          metadata: {
            notification_type: 'daily_reminder_360',
            period_id: period.id,
            days_left: daysLeft,
            pending_count: userData.count
          }
        })
      }

      console.log(`✅ Sent ${userCounts.size} daily reminders`)
    } catch (error) {
      console.error('Failed to send daily reminders:', error)
    }
  }

  // Comprehensive daily reminder system
  static async sendComprehensiveDailyReminders(): Promise<void> {
    if (typeof window !== 'undefined') return
    try {
      console.log('🔔 Sending comprehensive daily reminders...')
      
      // Get all users (excluding admins)
      const users = await prisma.profile.findMany({
        orderBy: { full_name: 'asc' }
      })

      if (!users) {
        console.error('Failed to fetch users')
        return
      }

      // Get admin IDs to exclude
      const adminUsers = await prisma.userRole.findMany({
        where: { role: 'admin' },
        select: { user_id: true }
      })

      const adminIds = adminUsers?.map((u: { user_id: string | null }) => u.user_id).filter((id: string | null): id is string => !!id) || []
      const regularUsers = users.filter((user: { id: string }) => !adminIds.includes(user.id))

      console.log(`📧 Processing ${regularUsers.length} users for daily reminders...`)

      for (const user of regularUsers) {
        try {
          await this.sendUserDailyReminders(user)
          await new Promise(resolve => setTimeout(resolve, 200)) // Delay between users
        } catch (error) {
          console.error(`Failed to send reminders for ${user.full_name}:`, error)
        }
      }

      console.log('✅ Comprehensive daily reminders completed!')
    } catch (error) {
      console.error('❌ Failed to send comprehensive daily reminders:', error)
    }
  }

  // Send daily reminders for a specific user
  private static async sendUserDailyReminders(user: any): Promise<void> {
    if (typeof window !== 'undefined') return
    const firstName = user.full_name.split(' ')[0]
    const reminders: any[] = []

    // 1. Check 360° Assessment reminders
    const assessmentReminder = await this.checkAssessmentReminders(user.id)
    if (assessmentReminder) {
      reminders.push(assessmentReminder)
    }

    // 2. Check Pin System reminders
    const pinReminder = await this.checkPinSystemReminders(user.id)
    if (pinReminder) {
      reminders.push(pinReminder)
    }

    // 3. Check Triwulan reminders
    const triwulanReminder = await this.checkTriwulanReminders(user.id)
    if (triwulanReminder) {
      reminders.push(triwulanReminder)
    }

    // Send reminders (limit to 1 per day per type to avoid spam)
    for (const reminder of reminders) {
      const wasSentToday = await this.wasReminderSentToday(user.id, reminder.metadata.notification_type)
      if (!wasSentToday) {
        await NotificationService.createNotification(reminder)
        console.log(`📤 Sent ${reminder.metadata.notification_type} reminder to ${firstName}`)
      }
    }
  }

  // Check if reminder was already sent today
  private static async wasReminderSentToday(userId: string, reminderType: string): Promise<boolean> {
    if (typeof window !== 'undefined') return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const existingReminders = await prisma.notification.findMany({
      where: {
        user_id: userId,
        type: 'reminder',
        created_at: {
          gte: today
        },
        metadata: {
          path: ['notification_type'],
          equals: reminderType
        }
      },
      select: {
        id: true
      }
    })

    return (existingReminders?.length || 0) > 0
  }

  // Check 360° Assessment reminders
  private static async checkAssessmentReminders(userId: string): Promise<any | null> {
    if (typeof window !== 'undefined') return null
    try {
      // Get active period
      const period = await prisma.assessmentPeriod.findFirst({
        where: { is_active: true }
      })

      if (!period) return null

      // Get pending assignments for this user
      const pendingAssignments = await prisma.assessmentAssignment.findMany({
        where: {
          assessor_id: userId,
          period_id: period.id,
          is_completed: false
        },
        select: {
          id: true,
          assessee: {
            select: {
              full_name: true
            }
          }
        }
      })

      if (!pendingAssignments || pendingAssignments.length === 0) return null

      // Calculate days left
      const daysLeft = Math.ceil(
        (new Date(period.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )

      // Only send reminder if deadline is approaching or there are many pending
      if (daysLeft > 7 && pendingAssignments.length < 3) return null

      const assesseeNames = pendingAssignments.map((a: { id: string; assessee?: { full_name: string } | null }) => a.assessee?.full_name || 'Unknown').join(', ')
      
      return {
        user_id: userId,
        title: `⏰ Pengingat: Penilaian 360° Menunggu`,
        message: `Anda memiliki ${pendingAssignments.length} penilaian 360° yang belum diselesaikan untuk: ${assesseeNames}.${daysLeft <= 7 ? ` Deadline: ${daysLeft} hari lagi!` : ''}`,
        type: 'reminder',
        priority: daysLeft <= 3 ? 'high' : 'medium',
        action_url: '/assessment',
        metadata: {
          notification_type: 'daily_reminder_360',
          period_id: period.id,
          days_left: daysLeft,
          pending_count: pendingAssignments.length,
          assessee_names: assesseeNames
        }
      }
    } catch (error) {
      console.error('Error checking assessment reminders:', error)
      return null
    }
  }

  // Check Pin System reminders
  private static async checkPinSystemReminders(userId: string): Promise<any | null> {
    if (typeof window !== 'undefined') return null
    try {
      // Get active pin period
      const pinPeriod = await prisma.pinPeriod.findFirst({
        where: { is_active: true }
      })

      if (!pinPeriod) return null

      // Check if user has already submitted pins this period
      // Pin system uses `employee_pins` without explicit period linkage.
      // Infer period by date range from active `pin_periods`.
      const existingPins = await prisma.employeePin.findMany({
        where: {
          giver_id: userId,
          given_at: {
            gte: new Date(pinPeriod.start_date),
            lte: new Date(pinPeriod.end_date)
          }
        },
        select: {
          id: true
        }
      })

      if (existingPins && existingPins.length > 0) return null

      // Calculate days left
      const daysLeft = Math.ceil(
        (new Date(pinPeriod.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )

      // Only send reminder if deadline is approaching
      if (daysLeft > 7) return null

      return {
        user_id: userId,
        title: `📌 Pengingat: Sistem Pin Menunggu`,
        message: `Anda belum mengisi sistem pin untuk periode ini.${daysLeft <= 3 ? ` Deadline: ${daysLeft} hari lagi!` : ` Tersisa ${daysLeft} hari.`}`,
        type: 'reminder',
        priority: daysLeft <= 3 ? 'high' : 'medium',
        action_url: '/pins',
        metadata: {
          notification_type: 'daily_reminder_pin',
          period_id: pinPeriod.id,
          days_left: daysLeft
        }
      }
    } catch (error) {
      console.error('Error checking pin system reminders:', error)
      return null
    }
  }

  // Check Triwulan reminders
  private static async checkTriwulanReminders(userId: string): Promise<any | null> {
    try {
      // TODO: Implement triwulan reminders when triwulan model is available
      // For now, return null to skip triwulan reminders
      return null
    } catch (error) {
      console.error('Error checking triwulan reminders:', error)
      return null
    }
  }
}