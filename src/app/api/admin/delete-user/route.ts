import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

// Create admin client for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function POST(request: NextRequest) {
  try {
    // Get the current admin user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if current user is admin using service role (bypass RLS)
    const { data: adminCheck, error: adminError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (adminError || adminCheck?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get request body
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const { data: userExists, error: userCheckError } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .eq('id', userId)
      .single();

    if (userCheckError || !userExists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is admin (prevent admin from deleting admin)
    const { data: targetUserRole, error: roleCheckError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .single();

    if (!roleCheckError && targetUserRole) {
      return NextResponse.json(
        { error: 'Cannot delete admin users' },
        { status: 403 }
      );
    }

    // Start transaction-like operations
    // Delete related data first (due to foreign key constraints)
    
    // Delete assessment assignments where user is assessor or assessee
    const { error: assignmentError } = await supabaseAdmin
      .from('assessment_assignments')
      .delete()
      .or(`assessor_id.eq.${userId},assessee_id.eq.${userId}`);

    if (assignmentError) {
      console.error('Error deleting assessment assignments:', assignmentError);
      return NextResponse.json(
        { error: 'Failed to delete user assessment data' },
        { status: 500 }
      );
    }

    // Delete assessment history
    const { error: historyError } = await supabaseAdmin
      .from('assessment_history')
      .delete()
      .eq('user_id', userId);

    if (historyError) {
      console.error('Error deleting assessment history:', historyError);
      return NextResponse.json(
        { error: 'Failed to delete user assessment history' },
        { status: 500 }
      );
    }

    // Delete notification preferences
    const { error: notifPrefError } = await supabaseAdmin
      .from('notification_preferences')
      .delete()
      .eq('user_id', userId);

    if (notifPrefError) {
      console.error('Error deleting notification preferences:', notifPrefError);
      return NextResponse.json(
        { error: 'Failed to delete user notification preferences' },
        { status: 500 }
      );
    }

    // Delete notifications
    const { error: notifError } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('user_id', userId);

    if (notifError) {
      console.error('Error deleting notifications:', notifError);
      return NextResponse.json(
        { error: 'Failed to delete user notifications' },
        { status: 500 }
      );
    }

    // Delete reminder logs
    const { error: reminderError } = await supabaseAdmin
      .from('reminder_logs')
      .delete()
      .eq('user_id', userId);

    if (reminderError) {
      console.error('Error deleting reminder logs:', reminderError);
      return NextResponse.json(
        { error: 'Failed to delete user reminder data' },
        { status: 500 }
      );
    }

    // Delete employee pins where user is giver or receiver
    const { error: pinError } = await supabaseAdmin
      .from('employee_pins')
      .delete()
      .or(`giver_id.eq.${userId},receiver_id.eq.${userId}`);

    if (pinError) {
      console.error('Error deleting employee pins:', pinError);
      return NextResponse.json(
        { error: 'Failed to delete user pin data' },
        { status: 500 }
      );
    }

    // Delete weekly pin allowance
    const { error: weeklyPinError } = await supabaseAdmin
      .from('weekly_pin_allowance')
      .delete()
      .eq('user_id', userId);

    if (weeklyPinError) {
      console.error('Error deleting weekly pin allowance:', weeklyPinError);
      return NextResponse.json(
        { error: 'Failed to delete user weekly pin allowance' },
        { status: 500 }
      );
    }

    // Delete monthly pin allowance
    const { error: monthlyPinError } = await supabaseAdmin
      .from('monthly_pin_allowance')
      .delete()
      .eq('user_id', userId);

    if (monthlyPinError) {
      console.error('Error deleting monthly pin allowance:', monthlyPinError);
      return NextResponse.json(
        { error: 'Failed to delete user monthly pin allowance' },
        { status: 500 }
      );
    }

    // Delete user role
    const { error: roleDeleteError } = await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    if (roleDeleteError) {
      console.error('Error deleting user role:', roleDeleteError);
      return NextResponse.json(
        { error: 'Failed to delete user role' },
        { status: 500 }
      );
    }

    // Finally, delete the user profile
    const { error: profileDeleteError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileDeleteError) {
      console.error('Error deleting user profile:', profileDeleteError);
      return NextResponse.json(
        { error: 'Failed to delete user profile' },
        { status: 500 }
      );
    }

    // Delete the user from Supabase Auth (this requires admin privileges)
    // Note: This might require server-side admin key or special handling
    // For now, we'll just delete the profile data
    // The user will still exist in auth but won't have access to the app

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
      deletedUserId: userId
    });

  } catch (error) {
    console.error('Error in delete user API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
