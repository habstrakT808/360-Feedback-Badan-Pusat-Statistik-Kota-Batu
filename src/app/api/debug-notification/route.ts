// src/app/api/debug-notification/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

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
    
    const { data, error } = await supabase
      .from('notifications')
      .insert([simpleNotification])
      .select()
    
    if (error) {
      console.error('Supabase insert error:', error)
      return NextResponse.json({
        success: false,
        error: 'Supabase insert failed',
        details: error,
        errorCode: error.code,
        errorMessage: error.message,
        errorHint: error.hint
      }, { status: 400 })
    }
    
    console.log('Insert successful:', data)
    
    // Test 2: Check if user exists
    const { data: userCheck, error: userError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('id', testUserId)
      .single()
    
    // Test 3: Check notification table structure
    const { data: tableInfo, error: tableError } = await supabase
      .from('notifications')
      .select('*')
      .limit(1)
    
    return NextResponse.json({
      success: true,
      message: 'Notification created successfully',
      data: {
        createdNotification: data,
        userExists: !!userCheck,
        userInfo: userCheck,
        userError,
        tableStructure: tableInfo?.[0] || 'No existing notifications',
        tableError
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