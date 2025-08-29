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
    // Debug: Log environment variables
    console.log('Environment check:', {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set',
      serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set'
    });

    const { userId, updates, newEmail, newPassword } = await request.json();

    // Get the current admin user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if current user is admin using service role (bypass RLS)
    console.log('Checking admin role for user:', user.id);
    
    const { data: userRole, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    console.log('Role check result:', { userRole, roleError });

    if (roleError || userRole?.role !== 'admin') {
      console.log('Admin access denied for user:', user.id);
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    console.log('Admin access granted for user:', user.id);

    // Update user profile if provided
    if (updates) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (profileError) {
        return NextResponse.json({ error: profileError.message }, { status: 400 });
      }
    }

    // Update email if provided
    if (newEmail) {
      const { error: emailError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        email: newEmail,
        email_confirm: true // Automatically confirm the email
      });

      if (emailError) {
        return NextResponse.json({ error: emailError.message }, { status: 400 });
      }

      // Also update the profiles table email field
      const { error: profileEmailError } = await supabaseAdmin
        .from('profiles')
        .update({ email: newEmail })
        .eq('id', userId);

      if (profileEmailError) {
        return NextResponse.json({ error: profileEmailError.message }, { status: 400 });
      }
    }

    // Update password if provided
    if (newPassword) {
      const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: newPassword
      });

      if (passwordError) {
        return NextResponse.json({ error: passwordError.message }, { status: 400 });
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'User berhasil diperbarui' 
    });

  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Gagal memperbarui user' }, 
      { status: 500 }
    );
  }
}
