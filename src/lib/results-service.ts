// src/lib/results-service.ts
import { supabase } from '@/lib/supabase'
import { ASSESSMENT_ASPECTS } from '@/lib/assessment-data'

export class ResultsService {
  static async getMyResults(userId: string) {
    // Check if user is admin
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single()

    if (roleError && roleError.code !== 'PGRST116') {
      throw roleError
    }

    // If user is admin, return empty array
    if (userRole?.role === 'admin') {
      return []
    }

    // Check if we have any feedback responses for this user
    const { data: feedbackResponses, error } = await supabase
      .from('feedback_responses')
      .select(`
        *,
        assignment:assessment_assignments!inner(
          assessee_id,
          period:assessment_periods(*)
        )
      `)
      .eq('assignment.assessee_id', userId)

    if (error) {
      console.error('Error fetching feedback responses:', error);
      throw error;
    }

    // If we have feedback responses, return them regardless of period status
    if (feedbackResponses && feedbackResponses.length > 0) {
      console.log(`Found ${feedbackResponses.length} feedback responses for user`);
      return feedbackResponses;
    }

    console.log('No feedback responses found for user');
    return [];
  }

  // New function to get results for any period with feedback data
  static async getResultsForPeriod(periodId: string, userId: string) {
    try {
      const { data: feedbackResponses, error } = await supabase
        .from('feedback_responses')
        .select(`
          *,
          assignment:assessment_assignments!inner(
            assessee_id,
            period:assessment_periods(*)
          )
        `)
        .eq('assignment.assessee_id', userId)
        .eq('assignment.period_id', periodId)

      if (error) {
        console.error('Error fetching feedback responses for period:', error);
        throw error;
      }

      return feedbackResponses || [];
    } catch (error) {
      console.error('Error in getResultsForPeriod:', error);
      return [];
    }
  }

  // Function to process raw feedback data into display format
  static processRawFeedbackData(rawData: any[]) {
    if (!rawData || rawData.length === 0) {
      return {
        overallRating: 0,
        totalFeedback: 0,
        aspectResults: [],
        comments: [],
        ratingDistribution: []
      };
    }

    // Calculate overall rating
    const totalRating = rawData.reduce((sum, item) => sum + item.rating, 0);
    const overallRating = totalRating / rawData.length;

    // Group by aspect
    const aspectGroups = rawData.reduce((groups, item) => {
      if (!groups[item.aspect]) {
        groups[item.aspect] = [];
      }
      groups[item.aspect].push(item);
      return groups;
    }, {});

    // Process aspect results
    const aspectResults = Object.entries(aspectGroups).map(([aspect, items]: [string, any]) => {
      const aspectRating = items.reduce((sum: number, item: any) => sum + item.rating, 0) / items.length;
      
      return {
        aspect,
        aspectId: aspect,
        rating: Math.round(aspectRating * 10) / 10,
        indicators: items.map((item: any) => ({
          indicator: item.indicator,
          rating: item.rating,
          responses: 1,
          comments: item.comment ? [item.comment] : []
        })),
        totalResponses: items.length
      };
    });

    // Extract comments
    const comments = rawData
      .filter(item => item.comment)
      .map(item => ({
        comment: item.comment,
        aspect: item.aspect,
        rating: item.rating
      }));

    // Create rating distribution
    const ratingDistribution = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(rating => ({
      rating,
      count: rawData.filter(item => item.rating === rating).length
    }));

    return {
      aspectResults,
      overallRating: Math.round(overallRating * 10) / 10,
      totalFeedback: rawData.length,
      ratingDistribution,
      comments
    };
  }

  static async getTeamResults(periodId?: string) {
    let query = supabase
      .from('feedback_responses')
      .select(`
        *,
        assignment:assessment_assignments!inner(
          assessee_id,
          assessor_id,
          period:assessment_periods(*),
          assessee:profiles!assessment_assignments_assessee_id_fkey(*)
        )
      `)

    if (periodId) {
      query = query.eq('assignment.period_id', periodId)
    }

    const { data, error } = await query

    if (error) throw error

    // Get admin users to exclude them
    const { data: adminUsers, error: adminError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin')

    const adminUserIds = adminError ? [] : (adminUsers?.map(u => u.user_id) || [])

    // Filter out results involving admin users
    const filteredData = data?.filter((response: any) => 
      !adminUserIds.includes(response.assignment.assessee_id) && 
      !adminUserIds.includes(response.assignment.assessor_id)
    ) || []

    return filteredData
  }

  static async getDetailedResults(userId: string, periodId?: string) {
    // Check if user is admin
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single()

    if (roleError && roleError.code !== 'PGRST116') {
      throw roleError
    }

    // If user is admin, return empty processed data
    if (userRole?.role === 'admin') {
      return this.processResultsData([])
    }

    let query = supabase
      .from('feedback_responses')
      .select(`
        *,
        assignment:assessment_assignments!inner(
          assessee_id,
          period:assessment_periods(*)
        )
      `)
      .eq('assignment.assessee_id', userId)

    if (periodId) {
      query = query.eq('assignment.period_id', periodId)
    }

    const { data, error } = await query

    if (error) throw error

    // Process data for visualization
    const processedData = this.processResultsData(data || [])
    return processedData
  }

  private static processResultsData(data: any[]): {
    aspectResults: Array<{
      aspect: string
      aspectId: string
      rating: number
      indicators: Array<{
        indicator: string
        rating: number
        responses: number
        comments: string[]
      }>
      totalResponses: number
    }>
    overallRating: number
    totalFeedback: number
    ratingDistribution: Array<{ rating: number; count: number }>
    comments: Array<{ comment: string; aspect: string; rating: number }>
  } {
    const aspectResults = ASSESSMENT_ASPECTS.map((aspect: any) => {
      const aspectResponses = data.filter(r => r.aspect === aspect.id)
      const avgRating = aspectResponses.length > 0 
        ? aspectResponses.reduce((sum: number, r: any) => sum + r.rating, 0) / aspectResponses.length 
        : 0

      const indicatorResults = aspect.indicators.map((indicator: string) => {
        const indicatorResponses = aspectResponses.filter(r => r.indicator === indicator)
        const avgIndicatorRating = indicatorResponses.length > 0
          ? indicatorResponses.reduce((sum: number, r: any) => sum + r.rating, 0) / indicatorResponses.length
          : 0

        return {
          indicator,
          rating: avgIndicatorRating,
          responses: indicatorResponses.length,
          comments: indicatorResponses.filter(r => r.comment).map(r => r.comment)
        }
      })

      return {
        aspect: aspect.name,
        aspectId: aspect.id,
        rating: avgRating,
        indicators: indicatorResults,
        totalResponses: aspectResponses.length
      }
    })

    const overallRating = aspectResults.length > 0
      ? aspectResults.reduce((sum: number, a: any) => sum + a.rating, 0) / aspectResults.length
      : 0

    const totalFeedback = data.length

    const ratingDistribution = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(rating => ({
      rating,
      count: data.filter(r => r.rating === rating).length
    }))

    return {
      aspectResults,
      overallRating,
      totalFeedback,
      ratingDistribution,
      comments: data.filter(r => r.comment).map(r => ({
        comment: r.comment,
        aspect: r.aspect,
        rating: r.rating
      }))
    }
  }
}