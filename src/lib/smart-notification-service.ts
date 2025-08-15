// src/lib/smart-notification-service.ts
import { supabase } from './supabase'
import { NotificationService } from './notification-service'

interface UserAssignmentData {
  user_id: string
  pending_assignments: number
  completed_assignments: number
  current_period: any
  days_until_deadline: number
  role: string
  department: string | null
  position: string | null
  assignment_details: any[]
}

interface PersonalizedNotificationData {
  userId: string
  fullName: string
  assignmentCount: number
  completedCount: number
  daysLeft: number
  currentPeriod: any
  role: string
  department: string | null
  recentCompletions: any[]
  assignmentDetails: any[]
}

export class SmartNotificationService {
  // Generate accurate notifications for Eka specifically
  static async generateAccurateNotificationsForEka(): Promise<void> {
    const ekaUserId = 'd22c96f8-d4c3-42d3-9368-925fec3016c9'
    
    try {
      console.log('🎯 Generating ACCURATE notifications for Eka...')
      
      // Clear old notifications first
      await supabase
        .from('notifications')
        .delete()
        .eq('user_id', ekaUserId)

      // Get real data
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', ekaUserId)
        .single()

      if (!profile) {
        console.error('❌ Profile not found for Eka')
        return
      }

      const { data: activePeriod } = await supabase
        .from('assessment_periods')
        .select('*')
        .eq('is_active', true)
        .single()

      if (!activePeriod) {
        console.log('ℹ️ No active period found')
        await NotificationService.sendSystemNotification(
          [ekaUserId],
          `👋 Halo ${profile.full_name}!`,
          'Selamat datang di sistem penilaian 360° BPS Kota Batu. Saat ini belum ada periode penilaian yang aktif.',
          '/dashboard',
          'low'
        )
        return
      }

      const { data: assignments } = await supabase
        .from('assessment_assignments')
        .select(`
          *,
          assessee:profiles!assessment_assignments_assessee_id_fkey(full_name, position)
        `)
        .eq('assessor_id', ekaUserId)
        .eq('period_id', activePeriod.id)

      const assignmentList = assignments || []
      const pendingCount = assignmentList.filter(a => !a.is_completed).length
      const completedCount = assignmentList.filter(a => a.is_completed).length
      const daysLeft = Math.ceil((new Date(activePeriod.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

      console.log('📊 Real data:', {
        name: profile.full_name,
        period: `${activePeriod.month}/${activePeriod.year}`,
        daysLeft,
        pendingCount,
        assignments: assignmentList.map(a => a.assessee?.full_name)
      })

      // 1. Welcome notification
      await NotificationService.sendSystemNotification(
        [ekaUserId],
        `👋 Selamat datang, ${profile.full_name}!`,
        `Halo Eka! Sistem penilaian 360° BPS Kota Batu siap membantu pengembangan tim.`,
        '/dashboard',
        'low'
      )

      // 2. ACCURATE assignment reminder
      if (pendingCount > 0) {
        const urgency = pendingCount >= 5 ? 'high' : pendingCount >= 3 ? 'medium' : 'low'
        
        const assigneeNames = assignmentList
          .filter(a => !a.is_completed)
          .slice(0, 3)
          .map(a => a.assessee?.full_name || 'Unknown')
          .join(', ')
        
        const remainingText = assignmentList.length > 3 ? ` dan ${assignmentList.length - 3} lainnya` : ''
        
        await NotificationService.sendSystemNotification(
          [ekaUserId],
          `📋 ${pendingCount} Penilaian Menunggu`,
          `Eka, Anda memiliki ${pendingCount} rekan kerja yang menunggu penilaian dari Anda. Mari berikan feedback yang berharga untuk: ${assigneeNames}${remainingText}.`,
          '/assessment',
          urgency
        )
      }

      // 3. ACCURATE deadline notification
      let deadlineEmoji = '📅'
      let deadlineUrgency = 'low'
      let deadlineMessage = ''

      if (daysLeft <= 3) {
        deadlineEmoji = '🚨'
        deadlineUrgency = 'urgent'
        deadlineMessage = `URGENT: Hanya ${daysLeft} hari tersisa!`
      } else if (daysLeft <= 7) {
        deadlineEmoji = '⚠️'
        deadlineUrgency = 'high'
        deadlineMessage = `Perhatian: ${daysLeft} hari menuju deadline`
      } else if (daysLeft <= 14) {
        deadlineEmoji = '⏰'
        deadlineUrgency = 'medium'
        deadlineMessage = `Reminder: ${daysLeft} hari menuju deadline`
      } else {
        deadlineEmoji = '📅'
        deadlineUrgency = 'low'
        deadlineMessage = `Info: ${daysLeft} hari menuju deadline`
      }

      await NotificationService.sendSystemNotification(
        [ekaUserId],
        `${deadlineEmoji} ${deadlineMessage}`,
        `Eka, periode penilaian ${activePeriod.month}/${activePeriod.year} akan berakhir pada ${new Date(activePeriod.end_date).toLocaleDateString('id-ID', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}. ${pendingCount > 0 ? `Masih ada ${pendingCount} penilaian yang perlu diselesaikan.` : 'Pastikan semua sudah lengkap!'}`,
        '/assessment',
        deadlineUrgency
      )

      // 4. Detailed assignment breakdown
      if (assignmentList.length > 0) {
        const assignmentListText = assignmentList.map((a, index) => 
          `${index + 1}. ${a.assessee?.full_name || 'Unknown'} (${a.assessee?.position || 'Staff'})`
        ).join('\n')

        await NotificationService.sendSystemNotification(
          [ekaUserId],
          `📝 Daftar Rekan Kerja yang Perlu Dinilai`,
          `Eka, berikut adalah daftar lengkap rekan kerja yang menunggu penilaian Anda:\n\n${assignmentListText}\n\nSetiap feedback yang Anda berikan akan membantu mereka berkembang lebih baik.`,
          '/assessment',
          'medium'
        )
      }

      // 5. Progress tracking
      const progressPercentage = assignmentList.length > 0 
        ? (completedCount / assignmentList.length) * 100 
        : 0

      await NotificationService.sendSystemNotification(
        [ekaUserId],
        `📊 Progress Penilaian: ${Math.round(progressPercentage)}%`,
        `Eka, Anda telah menyelesaikan ${completedCount} dari ${assignmentList.length} penilaian (${Math.round(progressPercentage)}%). ${progressPercentage === 0 ? 'Mari mulai memberikan penilaian pertama!' : progressPercentage < 50 ? 'Terus semangat!' : progressPercentage < 100 ? 'Hampir selesai!' : 'Luar biasa, semua selesai!'}`,
        '/assessment',
        'low'
      )

      // 6. Motivational message
      const motivationalMessages = [
        `Eka, sebagai bagian dari tim BPS Kota Batu, kontribusi Anda dalam memberikan feedback sangat berharga untuk pengembangan organisasi.`,
        `Feedback yang konstruktif dan spesifik akan membantu rekan kerja memahami kekuatan dan area pengembangan mereka.`,
        `Penilaian 360° adalah kesempatan untuk membangun budaya kerja yang saling mendukung dan berkembang bersama.`
      ]

      const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]

      await NotificationService.sendSystemNotification(
        [ekaUserId],
        `💡 Pesan Motivasi`,
        randomMessage,
        '/tips',
        'low'
      )

      console.log('✅ Successfully generated accurate notifications for Eka!')

    } catch (error) {
      console.error('❌ Failed to generate accurate notifications:', error)
    }
  }



  private static async generateUserSpecificNotifications(userId: string, data: any): Promise<void> {
    const { profile, activePeriod, assignments, pendingCount, completedCount, totalCount, daysLeft } = data

    // 1. Welcome/Status notification
    const welcomeMessage = totalCount === 0 
      ? `Halo ${profile.full_name}! Saat ini belum ada assignment penilaian untuk Anda di periode ${activePeriod.month}/${activePeriod.year}.`
      : `Selamat datang ${profile.full_name}! Anda memiliki ${totalCount} penilaian untuk periode ${activePeriod.month}/${activePeriod.year}.`

    await NotificationService.sendSystemNotification(
      [userId],
      `👋 Halo ${profile.full_name}!`,
      welcomeMessage,
      '/dashboard',
      'low'
    )

    // 2. Assignment notifications
    if (pendingCount > 0) {
      const urgency = pendingCount >= 5 ? 'high' : pendingCount >= 3 ? 'medium' : 'low'
      
      await NotificationService.sendSystemNotification(
        [userId],
        `📋 ${pendingCount} Penilaian Menunggu`,
        `${profile.full_name}, Anda memiliki ${pendingCount} rekan kerja yang menunggu penilaian. Mari berikan feedback yang berharga!`,
        '/assessment',
        urgency
      )
    } else if (totalCount > 0) {
      await NotificationService.sendSystemNotification(
        [userId],
        '🎉 Semua Penilaian Selesai!',
        `Luar biasa ${profile.full_name}! Anda telah menyelesaikan semua ${totalCount} penilaian. Terima kasih atas kontribusi Anda!`,
        '/my-results',
        'low'
      )
    }

    // 3. Deadline notifications
    if (daysLeft > 0) {
      let emoji = '📅'
      let urgency = 'low'
      let message = ''

      if (daysLeft <= 3) {
        emoji = '🚨'
        urgency = 'urgent'
        message = `URGENT: Hanya ${daysLeft} hari tersisa!`
      } else if (daysLeft <= 7) {
        emoji = '⚠️'
        urgency = 'high'
        message = `Perhatian: ${daysLeft} hari menuju deadline`
      } else if (daysLeft <= 14) {
        emoji = '⏰'
        urgency = 'medium'
        message = `${daysLeft} hari menuju deadline`
      } else {
        emoji = '📅'
        urgency = 'low'
        message = `${daysLeft} hari menuju deadline`
      }

      await NotificationService.sendSystemNotification(
        [userId],
        `${emoji} ${message}`,
        `${profile.full_name}, periode penilaian ${activePeriod.month}/${activePeriod.year} akan berakhir pada ${new Date(activePeriod.end_date).toLocaleDateString('id-ID')}. ${pendingCount > 0 ? `Masih ada ${pendingCount} penilaian yang perlu diselesaikan.` : 'Semua penilaian sudah selesai!'}`,
        '/assessment',
        urgency
      )
    }

    // 4. Progress notification
    if (totalCount > 0) {
      const progressPercentage = (completedCount / totalCount) * 100
      
      await NotificationService.sendSystemNotification(
        [userId],
        `📊 Progress: ${Math.round(progressPercentage)}%`,
        `${profile.full_name}, Anda telah menyelesaikan ${completedCount} dari ${totalCount} penilaian (${Math.round(progressPercentage)}%). ${progressPercentage === 0 ? 'Mari mulai!' : progressPercentage < 50 ? 'Terus semangat!' : progressPercentage < 100 ? 'Hampir selesai!' : 'Sempurna!'}`,
        '/assessment',
        'low'
      )
    }
  }

  // Get user assignment data - FIXED with proper null checks
  private static async getUserAssignmentData(userId: string): Promise<UserAssignmentData | null> {
    try {
      console.log('🔍 Getting REAL user assignment data for:', userId)
      
      // Get current active period with detailed info
      const { data: currentPeriod, error: periodError } = await supabase
        .from('assessment_periods')
        .select('*')
        .eq('is_active', true)
        .single()

      if (periodError || !currentPeriod) {
        console.log('ℹ️ No active period found:', periodError?.message)
        return null
      }

      console.log('📅 Active period found:', {
        id: currentPeriod.id,
        period: `${currentPeriod.month}/${currentPeriod.year}`,
        start: currentPeriod.start_date,
        end: currentPeriod.end_date
      })

      // Get ALL assignments for this user in current period with details
      const { data: assignments, error: assignmentError } = await supabase
        .from('assessment_assignments')
        .select(`
          *,
          assessee:profiles!assessment_assignments_assessee_id_fkey(
            id,
            full_name,
            position,
            department
          )
        `)
        .eq('assessor_id', userId)
        .eq('period_id', currentPeriod.id)

      if (assignmentError) {
        console.error('❌ Error fetching assignments:', assignmentError)
        return null
      }

      const assignmentList = assignments || []
      const pendingAssignments = assignmentList.filter(a => a.is_completed === false || a.is_completed === null).length
      const completedAssignments = assignmentList.filter(a => a.is_completed === true).length

      console.log('📋 Assignment details:', {
        total: assignmentList.length,
        pending: pendingAssignments,
        completed: completedAssignments,
        assignments: assignmentList.map(a => ({
          id: a.id,
          assessee: a.assessee?.full_name,
          completed: a.is_completed,
          completed_at: a.completed_at
        }))
      })

      // Calculate REAL days until deadline
      const endDate = new Date(currentPeriod.end_date)
      const today = new Date()
      const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

      console.log('⏰ Deadline calculation:', {
        endDate: currentPeriod.end_date,
        today: today.toISOString().split('T')[0],
        daysLeft
      })

      // Get user profile info
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      // Get user role with fallback
      let userRole = 'user'
      try {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .single()
        
        userRole = roleData?.role || 'user'
      } catch (roleError) {
        console.log('ℹ️ No role found, using default user role')
      }

      const result: UserAssignmentData = {
        user_id: userId,
        pending_assignments: pendingAssignments,
        completed_assignments: completedAssignments,
        current_period: currentPeriod,
        days_until_deadline: daysLeft,
        role: userRole,
        department: profile?.department || null,
        position: profile?.position || null,
        assignment_details: assignmentList
      }

      console.log('✅ Final user assignment data:', result)
      return result

    } catch (error) {
      console.error('❌ Failed to get user assignment data:', error)
      return null
    }
  }

  // Get recent completions for motivation
  private static async getRecentCompletions(userId: string): Promise<any[]> {
    try {
      const { data } = await supabase
        .from('assessment_history')
        .select(`
          *,
          assessee:profiles!assessment_history_assessee_id_fkey(full_name)
        `)
        .eq('assessor_id', userId)
        .order('submitted_at', { ascending: false })
        .limit(3)

      return data || []
    } catch (error) {
      return []
    }
  }

  // Generate personalized notifications for a specific user
  static async generatePersonalizedNotifications(userId: string): Promise<void> {
    try {
      console.log('🔍 Generating personalized notifications for user:', userId)
      
      if (!userId) {
        console.error('❌ No userId provided')
        return
      }

      // Get REAL user data from database
      const userData = await this.getUserAssignmentData(userId)
      if (!userData) {
        console.log('ℹ️ No user assignment data found, creating basic notifications only')
        await this.generateBasicNotifications(userId)
        return
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError || !profile) {
        console.error('❌ Failed to get user profile:', profileError)
        return
      }

      console.log('✅ User profile loaded:', profile.full_name)
      console.log('📊 Assignment data:', {
        pending: userData.pending_assignments,
        completed: userData.completed_assignments,
        daysLeft: userData.days_until_deadline,
        period: userData.current_period ? `${userData.current_period.month}/${userData.current_period.year}` : 'None'
      })

      const personalizedData: PersonalizedNotificationData = {
        userId,
        fullName: profile.full_name,
        assignmentCount: userData.pending_assignments,
        completedCount: userData.completed_assignments,
        daysLeft: userData.days_until_deadline,
        currentPeriod: userData.current_period,
        role: userData.role,
        department: userData.department,
        recentCompletions: await this.getRecentCompletions(userId),
        assignmentDetails: userData.assignment_details
      }

      // Clear old auto-generated notifications
      await this.clearAutoGeneratedNotifications(userId)

      // Generate accurate notifications
      await this.generateAccurateNotifications(personalizedData)

      console.log('✅ Successfully generated all notifications for user:', userId)

    } catch (error) {
      console.error('❌ Failed to generate personalized notifications:', error)
    }
  }

  private static async generateBasicNotifications(userId: string): Promise<void> {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .single()

      if (profile) {
        await NotificationService.sendSystemNotification(
          [userId],
          `👋 Halo ${profile.full_name}!`,
          'Selamat datang di sistem penilaian 360° BPS Kota Batu. Saat ini belum ada periode penilaian yang aktif.',
          '/dashboard',
          'low'
        )
      }
    } catch (error) {
      console.error('Failed to generate basic notifications:', error)
    }
  }

  private static async clearAutoGeneratedNotifications(userId: string): Promise<void> {
    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId)
        .eq('type', 'system')
    } catch (error) {
      console.error('Failed to clear notifications:', error)
    }
  }

  private static async generateAccurateNotifications(data: PersonalizedNotificationData): Promise<void> {
    // Implementation will be the same as generateUserSpecificNotifications
    // but using the PersonalizedNotificationData structure
    await this.generateUserSpecificNotifications(data.userId, {
      profile: { full_name: data.fullName },
      activePeriod: data.currentPeriod,
      assignments: data.assignmentDetails,
      pendingCount: data.assignmentCount,
      completedCount: data.completedCount,
      totalCount: data.assignmentCount + data.completedCount,
      daysLeft: data.daysLeft
    })
  }

  // Generate for all users
  static async generateNotificationsForAllUsers(): Promise<void> {
    try {
      console.log('🚀 Starting bulk notification generation for all users...')
      
      const { data: users, error } = await supabase
        .from('profiles')
        .select('id')

      if (error) {
        console.error('❌ Failed to fetch users:', error)
        return
      }

      if (!users || users.length === 0) {
        console.log('ℹ️ No users found')
        return
      }

      console.log(`📧 Generating notifications for ${users.length} users...`)

      for (const user of users) {
        try {
          await this.generatePersonalizedNotifications(user.id)
          console.log(`✅ Generated notifications for user: ${user.id}`)
        } catch (error) {
          console.error(`❌ Failed to generate notifications for user ${user.id}:`, error)
        }
        
        // Add delay to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      console.log('🎉 Bulk notification generation completed!')
    } catch (error) {
      console.error('❌ Failed to generate notifications for all users:', error)
    }
  }

  // Simplified version for testing
  static async generateSimpleNotification(userId: string): Promise<void> {
    try {
      console.log('Generating simple notification for:', userId)
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .single()

      if (!profile) {
        console.error('Profile not found for user:', userId)
        return
      }

      await NotificationService.sendSystemNotification(
        [userId],
        '🎉 Test Notification',
        `Hello ${profile.full_name}! This is a simple test notification.`,
        '/dashboard',
        'low'
      )

      console.log('Simple notification created successfully')
    } catch (error) {
      console.error('Failed to generate simple notification:', error)
    }
  }
}