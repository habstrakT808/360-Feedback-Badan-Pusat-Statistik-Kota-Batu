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
    console.log('Reset Password - Environment check:', {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set',
      serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set'
    });

    const { userId } = await request.json();

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
    console.log('Reset Password - Checking admin role for user:', user.id);
    
    const { data: userRole, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    console.log('Reset Password - Role check result:', { userRole, roleError });

    if (roleError || userRole?.role !== 'admin') {
      console.log('Reset Password - Admin access denied for user:', user.id);
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    console.log('Reset Password - Admin access granted for user:', user.id);

    // Reset password to default: 12345678
    const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: '12345678'
    });

    if (passwordError) {
      return NextResponse.json({ error: passwordError.message }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Password berhasil direset ke 12345678' 
    });

  } catch (error: any) {
    console.error('Error resetting password:', error);
    return NextResponse.json(
      { error: 'Gagal reset password' }, 
      { status: 500 }
    );
  }
}
