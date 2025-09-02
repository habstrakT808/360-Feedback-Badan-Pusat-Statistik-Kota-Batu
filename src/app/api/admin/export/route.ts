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

    // For triwulan, always attach detailed ratings
    if (dataType === 'triwulan') {
      let usedPeriodId: string | null = null;
      
      // For triwulan, always use triwulan_periods regardless of periodFilter
      // because frontend might send assessment_periods ID but data is in triwulan_periods
      const { data: active } = await supabase
        .from('triwulan_periods')
        .select('id, year, quarter, is_active')
        .eq('is_active', true)
        .maybeSingle();
      
      usedPeriodId = (active as any)?.id || null;
      console.log('Triwulan export - active triwulan period:', active);
      console.log('Triwulan export - usedPeriodId:', usedPeriodId);
      
      if (usedPeriodId) {
        const detailedRatings = await getTriwulanDetailedRatings(usedPeriodId);
        console.log('Triwulan export - detailedRatings count:', detailedRatings.length);
        return NextResponse.json({ data: { ranking: data, detailedRatings } });
      } else {
        // Return empty structure if no period found
        console.log('Triwulan export - no active triwulan period found, returning empty data');
        return NextResponse.json({ data: { ranking: [], detailedRatings: [] } });
      }
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

  // Get supervisor IDs for proper categorization
  const { supervisorIds } = await RolesService.getRoleUserIds();

  // Transform data for export
  return data?.map(assignment => {
    const responses = assignment.feedback_responses || [];
    const totalRating = responses.reduce((sum: number, r: any) => sum + (r.rating || 0), 0);
    const averageRating = responses.length > 0 ? totalRating / responses.length : 0;

    // Determine if this is a supervisor assessment
    const isSupervisorAssessment = supervisorIds.includes(assignment.assessor?.id);

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
      is_supervisor_assessment: isSupervisorAssessment,

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
      // Get pin period info (EOTM uses pin_periods, not assessment_periods)
      const { data: periodData } = await supabase
        .from('pin_periods')
        .select('start_date, end_date')
        .eq('id', selectedPeriod)
        .single();

      if (periodData) {
        // Use date range on created_at (half-open window)
        query = query
          .gte('created_at', (periodData as any).start_date)
          .lt('created_at', new Date(new Date(((periodData as any).end_date + 'T00:00:00Z')).getTime() + 24*60*60*1000).toISOString().slice(0,10));
      }
    } else if (startDate && endDate) {
      // Fallback to explicit date range (created_at)
      query = query.gte('created_at', startDate).lte('created_at', endDate);
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
  console.log('getTriwulanData called with:', { periodFilter, startDate, endDate, selectedPeriod });
  
  // For triwulan, always use triwulan_periods regardless of periodFilter
  // because frontend might send assessment_periods ID but data is in triwulan_periods
  console.log('Looking for active triwulan period...');
  const { data: active, error: activeError } = await supabase
    .from('triwulan_periods')
    .select('id, year, quarter, is_active')
    .eq('is_active', true)
    .maybeSingle();
  
  console.log('Active triwulan period query result:', { active, activeError });
  
  if (!active?.id) {
    console.log('No active triwulan period found, returning empty array');
    return [];
  }
  
  console.log('Using active triwulan period:', active.id);
  
  // Build ranking from triwulan_candidate_scores using the correct period
  let scoresQuery = supabase
    .from('triwulan_candidate_scores')
    .select('candidate_id, total_score, period_id')
    .eq('period_id', active.id);

  console.log('Executing scores query...');
  const { data: scoreRows, error: scoreErr } = await scoresQuery;
  if (scoreErr) {
    console.error('Error fetching scores:', scoreErr);
    throw scoreErr;
  }
  console.log('getTriwulanData - scoreRows:', scoreRows?.length || 0, scoreRows);
  const rows = (scoreRows || []).map((r: any) => ({ candidate_id: r.candidate_id, score: Number(r.total_score || 0) }));

  // Fallback: if no precomputed scores, aggregate from triwulan_ratings for the same period
  if (rows.length === 0) {
    console.log('No precomputed scores found, trying fallback from triwulan_ratings...');
    console.log('Using same active period for fallback:', active.id);

    console.log('Fetching ratings for period:', active.id);
    const { data: ratingRows, error: ratingErr } = await supabase
      .from('triwulan_ratings')
      .select('candidate_id,c1,c2,c3,c4,c5,c6,c7,c8,c9,c10,c11,c12,c13')
      .eq('period_id', active.id);
    
    if (ratingErr) {
      console.error('Error fetching ratings:', ratingErr);
      throw ratingErr;
    }
    
    console.log('Rating rows found:', ratingRows?.length || 0);

    const scoresMap = new Map<string, number>();
    (ratingRows || []).forEach((r: any) => {
      const sum = (r.c1||0)+(r.c2||0)+(r.c3||0)+(r.c4||0)+(r.c5||0)+(r.c6||0)+(r.c7||0)+
                  (r.c8||0)+(r.c9||0)+(r.c10||0)+(r.c11||0)+(r.c12||0)+(r.c13||0);
      scoresMap.set(r.candidate_id, (scoresMap.get(r.candidate_id) || 0) + sum);
    });

    const aggRows = Array.from(scoresMap.entries()).map(([candidate_id, score]) => ({ candidate_id, score }));

    // Fetch profiles in batch
    if (aggRows.length === 0) return [];
    const idsAgg = aggRows.map(r => r.candidate_id);
    const { data: profilesAgg, error: profAggErr } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', idsAgg);
    if (profAggErr) throw profAggErr;
    const mapAgg = new Map<string, { name: string; email: string }>();
    (profilesAgg || []).forEach((p: any) => mapAgg.set(p.id, { name: p.full_name || '', email: p.email || '' }));

    const fallbackResult = aggRows
      .map(r => ({ name: mapAgg.get(r.candidate_id)?.name || '', email: mapAgg.get(r.candidate_id)?.email || '', score: Number(r.score || 0) }))
      .sort((a, b) => b.score - a.score);
    
    console.log('getTriwulanData - fallback result:', fallbackResult.length, 'items');
    return fallbackResult;
  }

  // Fetch profiles in batch
  console.log('Fetching profiles for', rows.length, 'candidates');
  const ids = Array.from(new Set(rows.map(r => r.candidate_id)));
  console.log('Candidate IDs:', ids);
  
  const { data: profiles, error: profErr } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', ids);
  
  if (profErr) {
    console.error('Error fetching profiles:', profErr);
    throw profErr;
  }
  
  console.log('Profiles found:', profiles?.length || 0);
  const map = new Map<string, { name: string; email: string }>();
  (profiles || []).forEach((p: any) => map.set(p.id, { name: p.full_name || '', email: p.email || '' }));

  const result = rows
    .map(r => ({ name: map.get(r.candidate_id)?.name || '', email: map.get(r.candidate_id)?.email || '', score: r.score }))
    .sort((a, b) => b.score - a.score);
  
  console.log('getTriwulanData - final result:', result.length, 'items', result);
  return result;
}

// Detailed triwulan export: per rater, per candidate, 13 indikator (1-5)
async function getTriwulanDetailedRatings(periodId: string) {
  // Fetch all ratings for the period
  const { data: rows, error } = await supabase
    .from('triwulan_ratings')
    .select('rater_id,candidate_id,c1,c2,c3,c4,c5,c6,c7,c8,c9,c10,c11,c12,c13')
    .eq('period_id', periodId)
  if (error) throw error

  if (!rows || rows.length === 0) return []

  // fetch rater and candidate profiles
  const raterIds = Array.from(new Set(rows.map((r: any) => r.rater_id)))
  const candIds = Array.from(new Set(rows.map((r: any) => r.candidate_id)))

  const [{ data: raters }, { data: candidates }] = await Promise.all([
    supabase.from('profiles').select('id, full_name, email').in('id', raterIds),
    supabase.from('profiles').select('id, full_name, email').in('id', candIds),
  ])

  const rMap = new Map<string, { name: string; email: string }>()
  const cMap = new Map<string, { name: string; email: string }>()
  ;(raters || []).forEach((p: any) => rMap.set(p.id, { name: p.full_name || '', email: p.email || '' }))
  ;(candidates || []).forEach((p: any) => cMap.set(p.id, { name: p.full_name || '', email: p.email || '' }))

  // Return flat rows per rating with 13 indicator scores
  return (rows || []).map((r: any) => ({
    rater_name: rMap.get(r.rater_id)?.name || '',
    rater_email: rMap.get(r.rater_id)?.email || '',
    candidate_name: cMap.get(r.candidate_id)?.name || '',
    candidate_email: cMap.get(r.candidate_id)?.email || '',
    c1: r.c1, c2: r.c2, c3: r.c3, c4: r.c4, c5: r.c5, c6: r.c6, c7: r.c7,
    c8: r.c8, c9: r.c9, c10: r.c10, c11: r.c11, c12: r.c12, c13: r.c13,
  }))
}
