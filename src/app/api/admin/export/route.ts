// src/app/api/admin/export/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { RolesService } from '@/lib/roles-service';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Signed-in required
    const session = await getServerSession(authOptions);
    if (!session?.user || !('id' in session.user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { dataType, periodFilter, startDate, endDate, selectedPeriod } = body;

    // Authorization rules per data type (assessments, pins, triwulan allowed for any logged-in user)
    if (dataType !== 'assessments' && dataType !== 'pins' && dataType !== 'triwulan') {
      const { adminIds, supervisorIds } = await RolesService.getRoleUserIds();
      const uid = session.user.id as string
      if (!adminIds.includes(uid) && !supervisorIds.includes(uid)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

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

    if (dataType === 'triwulan') {
      const normalized = await normalizeTriwulanPeriodId(periodFilter, selectedPeriod, startDate, endDate)
      const tri = await getTriwulanData('specific', undefined, undefined, normalized)
      const detailed = await getTriwulanDetailedRatings(normalized)
      const periodLabel = normalized ? getQuarterPrettyLabel(normalized) : ''
      // Backward compatible: return detailed rows in `data` array directly
      // and include extra info in `meta` for UI display needs
      return NextResponse.json({ data: detailed, meta: { period: normalized, period_label: periodLabel, ranking: tri } })
    }

    return NextResponse.json({ data });

  } catch (error) {
    console.error('Export API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function getAssessmentData(periodFilter: string, startDate?: string, endDate?: string, selectedPeriod?: string) {
  const whereClause: any = {};

  // Apply period filter
  if (periodFilter === 'specific') {
    if (selectedPeriod) {
      whereClause.period_id = selectedPeriod;
    } else if (startDate && endDate) {
      whereClause.created_at = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }
  }

  const data = await prisma.assessmentAssignment.findMany({
    where: whereClause,
    include: {
      period: true,
      assessor: {
        select: {
          id: true,
          full_name: true,
          email: true,
          position: true,
          department: true
        }
      },
      assessee: {
        select: {
          id: true,
          full_name: true,
          email: true,
          position: true,
          department: true
        }
      },
      feedbacks: true
    }
  });

  // Get supervisor IDs for proper categorization
  const { supervisorIds } = await RolesService.getRoleUserIds();

  // Transform data for export
  return data?.map((assignment: any) => {
    const responses = assignment.feedbacks || [];
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
  const whereClause: any = {};

  // Apply period filter
  if (periodFilter === 'specific') {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    let start: Date | null = null
    let endPlusOne: Date | null = null

    if (selectedPeriod) {
      if (uuidRegex.test(selectedPeriod)) {
        const periodData = await prisma.pinPeriod.findUnique({
          where: { id: selectedPeriod },
          select: { start_date: true, end_date: true }
        })
        if (periodData) {
          start = new Date(periodData.start_date)
          endPlusOne = new Date(new Date(periodData.end_date).getTime() + 24 * 60 * 60 * 1000)
        }
      } else {
        // Try parse 'YYYY-MM' or 'YYYY/MM'
        const m = selectedPeriod.match(/^(\d{4})[-\/](\d{1,2})$/)
        if (m) {
          const y = Number(m[1])
          const mo = Number(m[2])
          if (!Number.isNaN(y) && !Number.isNaN(mo)) {
            start = new Date(Date.UTC(y, mo - 1, 1))
            endPlusOne = new Date(Date.UTC(y, mo, 1))
          }
        } else {
          // Fallback: month-year numeric in body? ignore
        }
      }
    }

    if (!start && startDate && endDate) {
      start = new Date(startDate)
      endPlusOne = new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000)
    }

    if (!start && periodFilter === 'specific') {
      // If nothing parsed, but UI intended active month
      const active = await prisma.pinPeriod.findFirst({ where: { is_active: true } })
      if (active) {
        start = new Date(active.start_date)
        endPlusOne = new Date(new Date(active.end_date).getTime() + 24 * 60 * 60 * 1000)
      }
    }

    if (start && endPlusOne) {
      whereClause.given_at = { gte: start, lt: endPlusOne }
    }
  }

  const data = await prisma.employeePin.findMany({
    where: whereClause,
    include: {
      giver: {
        select: {
          id: true,
          full_name: true,
          email: true,
          position: true,
          department: true
        }
      },
      receiver: {
        select: {
          id: true,
          full_name: true,
          email: true,
          position: true,
          department: true
        }
      }
    }
  });

  return data?.map((pin: any) => ({
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
  // Build ranking from triwulan_ratings totals
  const periodId = await normalizeTriwulanPeriodId(periodFilter, selectedPeriod, startDate, endDate)
  if (!periodId) return []
  const rows = await prisma.$queryRaw<any[]>`
    SELECT candidate_id,
           SUM(x)::float AS total_score,
           COUNT(*) AS num_items
    FROM (
      SELECT candidate_id, unnest(scores)::numeric AS x
      FROM public.triwulan_ratings
      WHERE period_id = ${periodId}
    ) s
    GROUP BY candidate_id
    ORDER BY total_score DESC
  `
  // Attach names for readability
  const ids: string[] = Array.from(
    new Set(
      rows
        .map((r: any) => r.candidate_id)
        .filter((v: any): v is string => typeof v === 'string' && v.length > 0)
    )
  )
  const profiles = await prisma.profile.findMany({
    where: { id: { in: ids } },
    select: { id: true, full_name: true, department: true, position: true }
  })
  const map: Map<string, { id: string; full_name?: string | null; department?: string | null; position?: string | null }> =
    new Map(profiles.map((p: any) => [p.id as string, p]))
  return rows.map((r: any) => ({
    candidate_id: r.candidate_id,
    candidate_name: (map.get(r.candidate_id) as any)?.full_name || r.candidate_id,
    position: (map.get(r.candidate_id) as any)?.position || null,
    department: (map.get(r.candidate_id) as any)?.department || null,
    total_score: Number(r.total_score || 0),
    items: Number(r.num_items || 0)
  }))
}

// Detailed triwulan export: per rater, per candidate, 13 indikator (1-5)
async function getTriwulanDetailedRatings(periodId: string) {
  if (!periodId) return []
  if (!periodId) return []
  const rows = await prisma.$queryRaw<any[]>`
    SELECT r.rater_id, r.candidate_id, r.scores
    FROM public.triwulan_ratings r
    WHERE r.period_id = ${periodId}
  `
  // Hydrate names
  const ids = Array.from(new Set(rows.flatMap((r: any) => [r.rater_id, r.candidate_id]).filter(Boolean)))
  const profiles = await prisma.profile.findMany({
    where: { id: { in: ids } },
    select: { id: true, full_name: true, email: true }
  })
  const nameById: Map<string, string | null> = new Map(
    profiles.map((p: any) => [p.id as string, (p.full_name as string | null) ?? null])
  )
  const emailById: Map<string, string | null> = new Map(
    profiles.map((p: any) => [p.id as string, (p.email as string | null) ?? null])
  )

  // Fallback: if some ids are not Profile.id, try resolving by User.id -> User.email -> Profile by email
  const missingIds: string[] = (ids as string[]).filter((id) => !nameById.has(id))
  if (missingIds.length > 0) {
    const users = await prisma.user.findMany({ where: { id: { in: missingIds } }, select: { id: true, email: true } })
    const userEmailById: Map<string, string | null> = new Map(users.map((u: any) => [u.id as string, u.email || null]))
    const emails = users
      .map((u: { email: string | null }) => u.email)
      .filter((e: string | null): e is string => typeof e === 'string' && e.length > 0)
    if (emails.length > 0) {
      type ProfileLite = { id: string; full_name: string | null; email: string | null }
      const profByEmail: ProfileLite[] = await prisma.profile.findMany({ where: { email: { in: emails } }, select: { id: true, full_name: true, email: true } })
      const profByEmailMap: Map<string, ProfileLite> = new Map(
        profByEmail.map((p: ProfileLite) => [p.email || '', p])
      )
      for (const uid of missingIds) {
        const em = userEmailById.get(uid)
        const p: ProfileLite | undefined = em ? profByEmailMap.get(em || '') : undefined
        if (p) {
          // Map the User.id to the corresponding profile's name/email for export display
          nameById.set(uid, (p.full_name ?? em ?? uid))
          emailById.set(uid, (p.email ?? em ?? ''))
        } else if (em) {
          emailById.set(uid, em)
        }
      }
    }
  }
  // Return in the exact shape the frontend expects for the sheet
  return rows.map((r: { rater_id: string; candidate_id: string; scores: any }) => {
    const scores = (r.scores as any[]).map(n => Number(n))
    const rec: any = {
      'Penilai': nameById.get(r.rater_id) || r.rater_id,
      'Email Penilai': emailById.get(r.rater_id) || '',
      'Kandidat': nameById.get(r.candidate_id) || r.candidate_id,
      'Email Kandidat': emailById.get(r.candidate_id) || '',
    }
    for (let i = 0; i < 13; i++) {
      rec[`Aspek ${i + 1}`] = typeof scores[i] === 'number' ? scores[i] : ''
    }
    return rec
  })
}

async function normalizeTriwulanPeriodId(periodFilter?: string, selectedPeriod?: string, startDate?: string, endDate?: string): Promise<string> {
  // Accept explicit quarter id "YYYY-Qn" or derive from dates
  if (selectedPeriod && /^(\d{4})-Q([1-4])$/i.test(selectedPeriod)) {
    return selectedPeriod
  }
  // If UI passes assessmentPeriod.id (UUID), convert to its quarter id
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (selectedPeriod && uuidRegex.test(selectedPeriod)) {
    const ap = await prisma.assessmentPeriod.findUnique({ where: { id: selectedPeriod }, select: { year: true, month: true } })
    if (ap?.year && ap?.month) {
      const q = Math.floor(((ap.month || 1) - 1) / 3) + 1
      return `${ap.year}-Q${q}`
    }
  }
  // If UI passes YYYY-MM, map to quarter
  if (selectedPeriod && /^(\d{4})[-\/](\d{1,2})$/.test(selectedPeriod)) {
    const m = selectedPeriod.match(/^(\d{4})[-\/](\d{1,2})$/)!
    const y = Number(m[1])
    const mo = Number(m[2])
    if (!Number.isNaN(y) && !Number.isNaN(mo)) {
      const q = Math.floor((mo - 1) / 3) + 1
      return `${y}-Q${q}`
    }
  }
  // If UI passes MonthName YYYY (e.g., 'September 2025'), parse to quarter
  if (selectedPeriod && /\d{4}/.test(selectedPeriod)) {
    const parts = selectedPeriod.trim().toLowerCase().split(/\s+/)
    if (parts.length === 2) {
      const [monthName, yearStr] = parts
      const monthMap: Record<string, number> = {
        'januari': 1, 'februari': 2, 'maret': 3, 'april': 4, 'mei': 5, 'juni': 6,
        'juli': 7, 'agustus': 8, 'september': 9, 'oktober': 10, 'november': 11, 'desember': 12,
        // English variants that differ from Indonesian spelling
        'january': 1, 'february': 2, 'march': 3, 'may': 5, 'june': 6, 'july': 7,
        'august': 8, 'october': 10,
      }
      const mo = monthMap[monthName]
      const y = Number(yearStr)
      if (mo && !Number.isNaN(y)) {
        const q = Math.floor((mo - 1) / 3) + 1
        return `${y}-Q${q}`
      }
    }
  }
  if (periodFilter === 'specific' && startDate) {
    const d = new Date(startDate)
    if (!isNaN(d.getTime())) {
      const y = d.getUTCFullYear()
      const m = d.getUTCMonth() + 1
      const q = Math.floor((m - 1) / 3) + 1
      return `${y}-Q${q}`
    }
  }
  // fallback to active assessment period's quarter
  const current = await prisma.assessmentPeriod.findFirst({ where: { is_active: true } })
  if (current) {
    const q = Math.floor(((current.month || 1) - 1) / 3) + 1
    return `${current.year}-Q${q}`
  }
  return ''
}

function getQuarterPrettyLabel(qid: string): string {
  const m = qid.match(/^(\d{4})-Q([1-4])$/)
  if (!m) return qid
  const y = Number(m[1])
  const q = Number(m[2])
  const names = ['Q1', 'Q2', 'Q3', 'Q4']
  return `${names[q - 1]} ${y}`
}
