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
    const { userIds } = await request.json();
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'User IDs array is required' },
        { status: 400 }
      );
    }

    // Check if any of the target users are admin (prevent admin from deleting admin)
    const { data: targetUserRoles, error: roleCheckError } = await supabaseAdmin
      .from('user_roles')
      .select('user_id, role')
      .in('user_id', userIds)
      .eq('role', 'admin');

    if (roleCheckError) {
      console.error('Error checking user roles:', roleCheckError);
      return NextResponse.json(
        { error: 'Failed to check user roles' },
        { status: 500 }
      );
    }

    const adminUserIds = targetUserRoles?.map(u => u.user_id).filter(Boolean) || [];
    if (adminUserIds.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete admin users' },
        { status: 403 }
      );
    }

    const results = [];
    
    // Process each user deletion
    for (const userId of userIds) {
      try {
        // Delete related data first (due to foreign key constraints)
        
        // Delete assessment assignments where user is assessor or assessee
        await supabaseAdmin
          .from('assessment_assignments')
          .delete()
          .or(`assessor_id.eq.${userId},assessee_id.eq.${userId}`);

        // Delete assessment history
        await supabaseAdmin
          .from('assessment_history')
          .delete()
          .eq('user_id', userId);

        // Delete notification preferences
        await supabaseAdmin
          .from('notification_preferences')
          .delete()
          .eq('user_id', userId);

        // Delete notifications
        await supabaseAdmin
          .from('notifications')
          .delete()
          .eq('user_id', userId);

        // Delete reminder logs
        await supabaseAdmin
          .from('reminder_logs')
          .delete()
          .eq('user_id', userId);

        // Delete employee pins where user is giver or receiver
        await supabaseAdmin
          .from('employee_pins')
          .delete()
          .or(`giver_id.eq.${userId},receiver_id.eq.${userId}`);

        // Delete weekly pin allowance
        await supabaseAdmin
          .from('weekly_pin_allowance')
          .delete()
          .eq('user_id', userId);

        // Delete monthly pin allowance
        await supabaseAdmin
          .from('monthly_pin_allowance')
          .delete()
          .eq('user_id', userId);

        // Delete user role
        await supabaseAdmin
          .from('user_roles')
          .delete()
          .eq('user_id', userId);

        // Finally, delete the user profile
        const { error: profileDeleteError } = await supabaseAdmin
          .from('profiles')
          .delete()
          .eq('id', userId);

        if (profileDeleteError) {
          throw new Error(`Failed to delete user profile: ${profileDeleteError.message}`);
        }

        results.push({ success: true, userId });
      } catch (error: any) {
        console.error(`Error deleting user ${userId}:`, error);
        results.push({ 
          success: false, 
          userId, 
          error: error.message || 'Unknown error' 
        });
      }
    }

    const successfulDeletions = results.filter(r => r.success).length;
    const failedDeletions = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Bulk delete completed. ${successfulDeletions} users deleted successfully, ${failedDeletions} failed.`,
      results,
      summary: {
        total: userIds.length,
        successful: successfulDeletions,
        failed: failedDeletions
      }
    });

  } catch (error) {
    console.error('Error in bulk delete users API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
