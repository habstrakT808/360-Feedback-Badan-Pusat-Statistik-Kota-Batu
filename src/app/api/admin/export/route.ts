// src/app/api/admin/export/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { RolesService } from '@/lib/roles-service';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { dataType, periodFilter, startDate, endDate, selectedPeriod } = body;

    let data: any[] = [];

    switch (dataType) {
      case 'assessments':
        data = await getAssessmentData(periodFilter, startDate, endDate, selectedPeriod);
        break;
      case 'pins':
        data = await getPinData(periodFilter, startDate, endDate, selectedPeriod);
        break;
      case 'triwulan':
        data = await getTriwulanData(periodFilter, startDate, endDate, selectedPeriod);
        break;
      default:
        return NextResponse.json({ error: 'Invalid data type' }, { status: 400 });
    }

    return NextResponse.json({ data });

  } catch (error) {
    console.error('Export API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function getAssessmentData(periodFilter: string, startDate?: string, endDate?: string, selectedPeriod?: string) {
  let query = supabase
    .from('assessment_assignments')
    .select(`
      *,
      period:assessment_periods(*),
      assessor:profiles!assessment_assignments_assessor_id_fkey(
        id, full_name, email, position, department
      ),
      assessee:profiles!assessment_assignments_assessee_id_fkey(
        id, full_name, email, position, department
      ),
      feedback_responses(*)
    `);

  // Apply period filter
  if (periodFilter === 'specific') {
    if (selectedPeriod) {
      query = query.eq('period_id', selectedPeriod);
    } else if (startDate && endDate) {
      query = query.gte('created_at', startDate).lte('created_at', endDate);
    }
  }

  const { data, error } = await query;

  if (error) throw error;

  // Transform data for export
  return data?.map(assignment => {
    const responses = assignment.feedback_responses || [];
    const totalRating = responses.reduce((sum: number, r: any) => sum + (r.rating || 0), 0);
    const averageRating = responses.length > 0 ? totalRating / responses.length : 0;

    return {
      // Assignment Info
      assignment_id: assignment.id,
      period_id: assignment.period_id,
      period_month: assignment.period?.month,
      period_year: assignment.period?.year,
      period_start_date: assignment.period?.start_date,
      period_end_date: assignment.period?.end_date,
      is_completed: assignment.is_completed,
      completed_at: assignment.completed_at,
      created_at: assignment.created_at,

      // Assessor Info
      assessor_id: assignment.assessor?.id,
      assessor_name: assignment.assessor?.full_name,
      assessor_email: assignment.assessor?.email,
      assessor_position: assignment.assessor?.position,
      assessor_department: assignment.assessor?.department,

      // Assessee Info
      assessee_id: assignment.assessee?.id,
      assessee_name: assignment.assessee?.full_name,
      assessee_email: assignment.assessee?.email,
      assessee_position: assignment.assessee?.position,
      assessee_department: assignment.assessee?.department,

      // Assessment Results
      total_responses: responses.length,
      average_rating: averageRating.toFixed(2),
      total_rating: totalRating,

      // Detailed Responses
      responses: responses.map((r: any) => ({
        aspect: r.aspect,
        indicator: r.indicator,
        rating: r.rating,
        comment: r.comment,
        created_at: r.created_at
      }))
    };
  }) || [];
}

async function getPinData(periodFilter: string, startDate?: string, endDate?: string, selectedPeriod?: string) {
  let query = supabase
    .from('employee_pins')
    .select(`
      *,
      giver:profiles!employee_pins_giver_id_fkey(
        id, full_name, email, position, department
      ),
      receiver:profiles!employee_pins_receiver_id_fkey(
        id, full_name, email, position, department
      )
    `);

  // Apply period filter
  if (periodFilter === 'specific') {
    if (selectedPeriod) {
      // Get period info first
      const { data: periodData } = await supabase
        .from('assessment_periods')
        .select('month, year')
        .eq('id', selectedPeriod)
        .single();

      if (periodData) {
        query = query.eq('month', periodData.month).eq('year', periodData.year);
      }
    } else if (startDate && endDate) {
      query = query.gte('given_at', startDate).lte('given_at', endDate);
    }
  }

  const { data, error } = await query;

  if (error) throw error;

  return data?.map(pin => ({
    // Pin Info
    pin_id: pin.id,
    given_at: pin.given_at,
    week_number: pin.week_number,
    month: pin.month,
    year: pin.year,
    created_at: pin.created_at,

    // Giver Info
    giver_id: pin.giver?.id,
    giver_name: pin.giver?.full_name,
    giver_email: pin.giver?.email,
    giver_position: pin.giver?.position,
    giver_department: pin.giver?.department,

    // Receiver Info
    receiver_id: pin.receiver?.id,
    receiver_name: pin.receiver?.full_name,
    receiver_email: pin.receiver?.email,
    receiver_position: pin.receiver?.position,
    receiver_department: pin.receiver?.department,
  })) || [];
}

async function getTriwulanData(periodFilter: string, startDate?: string, endDate?: string, selectedPeriod?: string) {
  let query = supabase
    .from('triwulan_winners')
    .select(`
      *,
      period:assessment_periods(*),
      winner:profiles!triwulan_winners_winner_id_fkey(
        id, full_name, email, position, department
      )
    `);

  // Apply period filter
  if (periodFilter === 'specific') {
    if (selectedPeriod) {
      query = query.eq('period_id', selectedPeriod);
    } else if (startDate && endDate) {
      query = query.gte('decided_at', startDate).lte('decided_at', endDate);
    }
  }

  const { data, error } = await query;

  if (error) throw error;

  return data?.map((winner: any) => ({
    // Winner Info
    winner_id: winner.winner?.id,
    winner_name: winner.winner?.full_name,
    winner_email: winner.winner?.email,
    winner_position: winner.winner?.position,
    winner_department: winner.winner?.department,

    // Period Info
    period_id: winner.period_id,
    period_month: winner.period?.month,
    period_year: winner.period?.year,
    period_start_date: winner.period?.start_date,
    period_end_date: winner.period?.end_date,

    // Score Info
    total_score: winner.total_score,
    decided_at: winner.decided_at,
  })) || [];
}
