// src/app/api/debug-notification/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'


export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()
    const testUserId = userId || 'd22c96f8-d4c3-42d3-9368-925fec3016c9' // Eka's ID
    
    console.log('Testing notification creation for user:', testUserId)
    
    // Test 1: Simple notification creation
    console.log('Test 1: Creating simple notification...')
    
    const simpleNotification = {
      user_id: testUserId,
      title: 'Test Notification',
      message: 'This is a test notification to debug the issue.',
      type: 'system',
      priority: 'low'
    }
    
    console.log('Notification data:', simpleNotification)
    
    const createdNotification = await prisma.notification.create({
      data: simpleNotification
    })
    
    console.log('Insert successful:', createdNotification)
    
    // Test 2: Check if user exists
    const userCheck = await prisma.profile.findUnique({
      where: { id: testUserId },
      select: { id: true, full_name: true }
    })
    
    // Test 3: Check notification table structure
    const tableInfo = await prisma.notification.findFirst({
      select: {
        id: true,
        user_id: true,
        title: true,
        message: true,
        type: true,
        priority: true,
        created_at: true
      }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Notification created successfully',
      data: {
        createdNotification,
        userExists: !!userCheck,
        userInfo: userCheck,
        tableStructure: tableInfo || 'No existing notifications'
      }
    })
    
  } catch (error: any) {
    console.error('Debug error:', error)
    return NextResponse.json({
      success: false,
      error: 'Debug failed',
      details: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}