// src/app/api/cleanup-duplicates/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !('id' in session.user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if current user is admin
    const role = await prisma.userRole.findFirst({ 
      where: { user_id: session.user.id as string } 
    })

    if (role?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    console.log('🧹 Starting duplicate notification cleanup...')
    
    // Get all system notifications
    const allNotifications = await prisma.notification.findMany({
      where: { type: 'system' },
      select: {
        id: true,
        user_id: true,
        title: true,
        message: true,
        created_at: true,
        metadata: true
      },
      orderBy: { created_at: 'desc' }
    })

    if (!allNotifications || allNotifications.length === 0) {
      return NextResponse.json({ success: true, message: 'No notifications found' })
    }

    // Group by user_id and notification type
    const userNotificationGroups = new Map<string, Map<string, any[]>>() 
    
    allNotifications.forEach((notification: { id: string; user_id: string; title: string | null; message: string | null; created_at: Date; metadata: unknown }) => {
      const userId = notification.user_id
      let type = 'unknown'
      
      if (notification.metadata && 
          typeof notification.metadata === 'object' && 
          notification.metadata !== null &&
          'notification_type' in notification.metadata &&
          typeof (notification.metadata as any).notification_type === 'string') {
        type = (notification.metadata as any).notification_type
      } else if (notification.title?.includes('Selamat datang')) {
        type = 'welcome'
      } else if (notification.title?.includes('Tips')) {
        type = 'tips'
      } else if (notification.title?.includes('Penilaian Menunggu')) {
        type = 'assignment'
      }
      
      if (!userNotificationGroups.has(userId)) {
        userNotificationGroups.set(userId, new Map())
      }
      
      const userTypes = userNotificationGroups.get(userId)!
      if (!userTypes.has(type)) {
        userTypes.set(type, [])
      }
      
      userTypes.get(type)!.push(notification)
    })

    const idsToDelete: string[] = []
    let totalDuplicates = 0
    
    // For each user and type, keep only the most recent notification
    userNotificationGroups.forEach((userTypes, userId) => {
      userTypes.forEach((notifications, type) => {
        if (notifications.length > 1) {
          // Sort by created_at and keep the most recent
          notifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          
          // Add all but the first (most recent) to deletion list
          const duplicates = notifications.slice(1)
          idsToDelete.push(...duplicates.map(n => n.id))
          totalDuplicates += duplicates.length
          
          console.log(`User ${userId}, type ${type}: keeping 1, deleting ${duplicates.length} duplicates`)
        }
      })
    })

    // Also remove assignment notifications (we only want welcome + tips)
    const assignmentNotifications = allNotifications.filter((n: { id: string; user_id: string; title: string | null; message: string | null; created_at: Date; metadata: unknown }) => {
      let type = 'unknown'
      if (
        n.metadata &&
        typeof n.metadata === 'object' &&
        n.metadata !== null &&
        'notification_type' in n.metadata &&
        typeof (n.metadata as any).notification_type === 'string'
      ) {
        type = (n.metadata as any).notification_type
      } else if (n.title?.includes('Penilaian Menunggu')) {
        type = 'assignment'
      }
      return type === 'assignment'
    })
    
    if (assignmentNotifications.length > 0) {
      idsToDelete.push(
        ...assignmentNotifications.map((n: { id: string }) => n.id)
      )
      totalDuplicates += assignmentNotifications.length
      console.log(`Removing ${assignmentNotifications.length} assignment notifications (not needed for initial setup)`)
    }

    if (idsToDelete.length > 0) {
      console.log(`🗑️ Deleting ${idsToDelete.length} duplicate notifications...`)
      
      // Delete in batches to avoid overwhelming the database
      const batchSize = 50
      for (let i = 0; i < idsToDelete.length; i += batchSize) {
        const batch = idsToDelete.slice(i, i + batchSize)
        await prisma.notification.deleteMany({
          where: { id: { in: batch } }
        })
      }
      
      console.log(`✅ Successfully deleted ${idsToDelete.length} duplicate notifications`)
    }

    // Get final count per user
    const finalCounts = new Map<string, number>()
    userNotificationGroups.forEach((userTypes, userId) => {
      let count = 0
      userTypes.forEach((notifications, type) => {
        if (type !== 'assignment') { // Don't count assignment notifications
          count += Math.min(notifications.length, 1) // Only count 1 per type
        }
      })
      finalCounts.set(userId, count)
    })

    return NextResponse.json({
      success: true,
      message: `Cleanup completed successfully`,
      total_duplicates_removed: totalDuplicates,
      users_processed: userNotificationGroups.size,
      final_counts: Object.fromEntries(finalCounts),
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Cleanup failed:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

// GET method to check current notification status
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !('id' in session.user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if current user is admin
    const role = await prisma.userRole.findFirst({ 
      where: { user_id: session.user.id as string } 
    })

    if (role?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    console.log('🔍 Checking notification status...')
    
    // Get all system notifications
    const allNotifications = await prisma.notification.findMany({
      where: { type: 'system' },
      select: {
        id: true,
        user_id: true,
        title: true,
        message: true,
        created_at: true,
        metadata: true
      },
      orderBy: { created_at: 'desc' }
    })

    // Group by user and count by type
    const userStats = new Map<string, { welcome: number, tips: number, assignment: number, total: number }>()
    
    allNotifications?.forEach((notification: { id: string; user_id: string; title: string | null; message: string | null; created_at: Date; metadata: unknown }) => {
      const userId = notification.user_id
      let type = 'unknown'
      
      if (
        notification.metadata &&
        typeof notification.metadata === 'object' &&
        notification.metadata !== null &&
        'notification_type' in notification.metadata &&
        typeof (notification.metadata as any).notification_type === 'string'
      ) {
        type = (notification.metadata as any).notification_type
      } else if (notification.title?.includes('Selamat datang')) {
        type = 'welcome'
      } else if (notification.title?.includes('Tips')) {
        type = 'tips'
      } else if (notification.title?.includes('Penilaian Menunggu')) {
        type = 'assignment'
      }
      
      if (!userStats.has(userId)) {
        userStats.set(userId, { welcome: 0, tips: 0, assignment: 0, total: 0 })
      }
      
      const stats = userStats.get(userId)!
      if (type === 'welcome') stats.welcome++
      else if (type === 'tips') stats.tips++
      else if (type === 'assignment') stats.assignment++
      stats.total++
    })

    // Calculate summary
    const summary = {
      total_users: userStats.size,
      users_with_duplicates: 0,
      users_with_correct_count: 0,
      total_notifications: allNotifications?.length || 0
    }

    userStats.forEach(stats => {
      if (stats.total > 2) {
        summary.users_with_duplicates++
      } else if (stats.welcome === 1 && stats.tips === 1) {
        summary.users_with_correct_count++
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Notification status check completed',
      summary,
      user_details: Object.fromEntries(userStats),
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Status check failed:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}