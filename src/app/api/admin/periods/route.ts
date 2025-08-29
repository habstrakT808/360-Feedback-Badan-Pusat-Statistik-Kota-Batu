// src/app/api/admin/periods/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { RolesService } from '@/lib/roles-service';

export async function GET(request: NextRequest) {
  try {
    // Check if user is admin or supervisor
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get role user IDs
    const { adminIds, supervisorIds } = await RolesService.getRoleUserIds();
    
    // Check if user has admin or supervisor role
    if (!adminIds.includes(user.id) && !supervisorIds.includes(user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch assessment periods
    const { data: periods, error } = await supabase
      .from('assessment_periods')
      .select('*')
      .order('year', { ascending: false })
      .order('month', { ascending: false });

    if (error) {
      console.error('Error fetching periods:', error);
      return NextResponse.json({ error: 'Failed to fetch periods' }, { status: 500 });
    }

    return NextResponse.json({ data: periods || [] });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
