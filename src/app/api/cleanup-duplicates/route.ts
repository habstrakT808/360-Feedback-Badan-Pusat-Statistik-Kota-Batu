// src/app/api/cleanup-duplicates/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    console.log('🧹 Starting duplicate notification cleanup...')
    
    // Get all system notifications
    const { data: allNotifications, error: fetchError } = await supabaseAdmin
      .from('notifications')
      .select('id, user_id, title, message, created_at, metadata')
      .eq('type', 'system')
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('Error fetching notifications:', fetchError)
      return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 })
    }

    if (!allNotifications || allNotifications.length === 0) {
      return NextResponse.json({ success: true, message: 'No notifications found' })
    }

    // Group by user_id and notification type
    const userNotificationGroups = new Map<string, Map<string, any[]>>()
    
    allNotifications.forEach(notification => {
      const userId = notification.user_id
      let type = 'unknown'
      
      if (notification.metadata?.notification_type) {
        type = notification.metadata.notification_type
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

    if (idsToDelete.length > 0) {
      console.log(`🗑️ Deleting ${idsToDelete.length} duplicate notifications...`)
      
      // Delete in batches to avoid timeout
      const batchSize = 50
      for (let i = 0; i < idsToDelete.length; i += batchSize) {
        const batch = idsToDelete.slice(i, i + batchSize)
        const { error: deleteError } = await supabaseAdmin
          .from('notifications')
          .delete()
          .in('id', batch)
        
        if (deleteError) {
          console.error(`Error deleting batch ${Math.floor(i/batchSize) + 1}:`, deleteError)
          return NextResponse.json({ success: false, error: deleteError.message }, { status: 500 })
        }
        
        console.log(`Deleted batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(idsToDelete.length/batchSize)}`)
      }

      console.log(`✅ Successfully removed ${idsToDelete.length} duplicate notifications`)
      
      return NextResponse.json({ 
        success: true, 
        message: `Cleaned up ${idsToDelete.length} duplicate notifications`,
        deletedCount: idsToDelete.length,
        totalDuplicates
      })
    } else {
      return NextResponse.json({ 
        success: true, 
        message: 'No duplicate notifications found',
        deletedCount: 0,
        totalDuplicates: 0
      })
    }
    
  } catch (error: any) {
    console.error('Error in cleanup duplicates:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Unknown error occurred' 
    }, { status: 500 })
  }
}