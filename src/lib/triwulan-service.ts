// src/lib/triwulan-service.ts
import { supabase } from '@/lib/supabase'
import { RolesService } from '@/lib/roles-service'

export class TriwulanService {
  static async listCandidates(periodId: string): Promise<Array<{ user_id: string }>> {
    const { data, error } = await (supabase as any)
      .from('triwulan_candidates')
      .select('*')
      .eq('period_id', periodId)

    if (error) throw error
    return data || []
  }

  static async countCandidates(periodId: string): Promise<number> {
    const { count, error } = await (supabase as any)
      .from('triwulan_candidates')
      .select('*', { count: 'exact', head: true })
      .eq('period_id', periodId)

    if (error) throw error
    return count || 0
  }

  static async submitVotes(periodId: string, voterId: string, candidateIds: string[]): Promise<void> {
    // Remove existing votes (allow re-submit until locked)
    const { error: delErr } = await (supabase as any)
      .from('triwulan_votes')
      .delete()
      .eq('period_id', periodId)
      .eq('voter_id', voterId)
    if (delErr) throw delErr

    // Insert new votes
    const rows = candidateIds.map((cid) => ({ period_id: periodId, voter_id: voterId, candidate_id: cid }))
    const { error } = await (supabase as any).from('triwulan_votes').insert(rows)
    if (error) throw error
  }

  static async getUserVotes(periodId: string, voterId: string): Promise<string[]> {
    const { data, error } = await (supabase as any)
      .from('triwulan_votes')
      .select('candidate_id')
      .eq('period_id', periodId)
      .eq('voter_id', voterId)

    if (error) throw error
    return (data || []).map((r: any) => r.candidate_id)
  }

  static async markVoteCompleted(periodId: string, voterId: string): Promise<void> {
    const { error } = await (supabase as any)
      .from('triwulan_vote_completion')
      .upsert({ period_id: periodId, voter_id: voterId, completed: true, completed_at: new Date().toISOString() })
    if (error) throw error
  }

  static async hasCompletedVote(periodId: string, voterId: string): Promise<boolean> {
    const { data, error } = await (supabase as any)
      .from('triwulan_vote_completion')
      .select('completed')
      .eq('period_id', periodId)
      .eq('voter_id', voterId)
      .maybeSingle()

    if (error) throw error
    return Boolean(data?.completed)
  }

  static async submitRatings(input: {
    periodId: string
    raterId: string
    candidateId: string
    scores: [number, number, number, number, number, number, number, number, number, number, number, number, number]
  }): Promise<void> {
    const [c1,c2,c3,c4,c5,c6,c7,c8,c9,c10,c11,c12,c13] = input.scores
    const { error } = await (supabase as any).from('triwulan_ratings').upsert({
      period_id: input.periodId,
      rater_id: input.raterId,
      candidate_id: input.candidateId,
      c1,c2,c3,c4,c5,c6,c7,c8,c9,c10,c11,c12,c13,
    }, { onConflict: 'period_id,rater_id,candidate_id' })
    if (error) throw error
  }

  static async getUserRating(periodId: string, raterId: string, candidateId: string): Promise<number[] | null> {
    const { data, error } = await (supabase as any)
      .from('triwulan_ratings')
      .select('c1,c2,c3,c4,c5,c6,c7,c8,c9,c10,c11,c12,c13')
      .eq('period_id', periodId)
      .eq('rater_id', raterId)
      .eq('candidate_id', candidateId)
      .maybeSingle()

    if (error) throw error
    if (!data) return null
    return [
      data.c1, data.c2, data.c3, data.c4, data.c5, data.c6, data.c7,
      data.c8, data.c9, data.c10, data.c11, data.c12, data.c13,
    ]
  }

  static async getUserRatingsMap(periodId: string, raterId: string): Promise<Record<string, number[]>> {
    const { data, error } = await (supabase as any)
      .from('triwulan_ratings')
      .select('candidate_id,c1,c2,c3,c4,c5,c6,c7,c8,c9,c10,c11,c12,c13')
      .eq('period_id', periodId)
      .eq('rater_id', raterId)

    if (error) throw error
    const map: Record<string, number[]> = {}
    ;(data || []).forEach((row: any) => {
      map[row.candidate_id] = [
        row.c1,row.c2,row.c3,row.c4,row.c5,row.c6,row.c7,row.c8,row.c9,row.c10,row.c11,row.c12,row.c13,
      ]
    })
    return map
  }

  static async getScores(periodId: string): Promise<Array<{ candidate_id: string; total_score: number; num_raters: number; score_percent: number }>> {
    const { data, error } = await (supabase as any)
      .from('triwulan_candidate_scores')
      .select('*')
      .eq('period_id', periodId)

    if (error) throw error
    return data || []
  }

  static async setWinner(periodId: string, winnerId: string, totalScore?: number): Promise<void> {
    const { error } = await (supabase as any)
      .from('triwulan_winners')
      .upsert({ period_id: periodId, winner_id: winnerId, total_score: totalScore ?? null })
    if (error) throw error
  }

  static async getWinner(periodId: string): Promise<{ winner_id: string; total_score: number | null } | null> {
    const { data, error } = await (supabase as any)
      .from('triwulan_winners')
      .select('*')
      .eq('period_id', periodId)
      .maybeSingle()

    if (error) throw error
    return data || null
  }

  static async getVotingStatus(periodId: string): Promise<{ requiredCount: number; completedCount: number; completedUserIds: string[] }> {
    // Voters = all profiles EXCEPT admins (supervisors + user biasa keduanya ikut menilai)
    const { data: profiles, error: pErr } = await (supabase as any)
      .from('profiles')
      .select('id')
    if (pErr) throw pErr

    // Use RolesService to include env overrides and any missing rows
    const { adminIds } = await RolesService.getRoleUserIds()
    const adminSet = new Set(adminIds || [])
    const voterSet = new Set<string>((profiles || []).map((p: any) => p.id).filter((id: string) => !adminSet.has(id)))
    const voterIds = Array.from(voterSet)

    const { data: doneRows, error: dErr } = await (supabase as any)
      .from('triwulan_vote_completion')
      .select('voter_id, completed')
      .eq('period_id', periodId)
      .eq('completed', true)
    if (dErr) throw dErr

    const completedUserIds = (doneRows || []).map((r: any) => r.voter_id).filter((id: string) => voterSet.has(id))
    const completedCount = completedUserIds.length
    return { requiredCount: voterIds.length, completedCount, completedUserIds }
  }

  static async getRatingsCompletionStatus(periodId: string): Promise<{ requiredCount: number; completedCount: number; completedUserIds: string[] }> {
    // Eligible voters: all non-admin profiles
    const { data: profiles, error: pErr } = await (supabase as any)
      .from('profiles')
      .select('id')
    if (pErr) throw pErr

    const { adminIds } = await RolesService.getRoleUserIds()
    const adminSet = new Set(adminIds || [])
    const voterSet = new Set<string>((profiles || []).map((p: any) => p.id).filter((id: string) => !adminSet.has(id)))
    const voterIds = Array.from(voterSet)

    // Determine required number of candidates to be rated per user (up to 5)
    let threshold = 5
    try {
      const count = await TriwulanService.countCandidates(periodId)
      threshold = Math.min(5, count)
    } catch {}

    // Count completed raters: have rated at least `threshold` candidates with all 13 criteria filled
    const { data: rows, error: rErr } = await (supabase as any)
      .from('triwulan_ratings')
      .select('rater_id, candidate_id, c1,c2,c3,c4,c5,c6,c7,c8,c9,c10,c11,c12,c13')
      .eq('period_id', periodId)
    if (rErr) throw rErr

    const completedPerRater: Record<string, Set<string>> = {}
    ;(rows || []).forEach((row: any) => {
      const allFilled = [row.c1,row.c2,row.c3,row.c4,row.c5,row.c6,row.c7,row.c8,row.c9,row.c10,row.c11,row.c12,row.c13].every((v: any) => v !== null && v !== undefined && v !== 0)
      if (!allFilled) return
      if (!voterSet.has(row.rater_id)) return
      if (!completedPerRater[row.rater_id]) completedPerRater[row.rater_id] = new Set<string>()
      completedPerRater[row.rater_id].add(row.candidate_id)
    })

    const completedUserIds = Object.entries(completedPerRater)
      .filter(([, set]) => set.size >= threshold)
      .map(([raterId]) => raterId)
    return { requiredCount: voterIds.length, completedCount: completedUserIds.length, completedUserIds }
  }

  static async getTopCandidates(periodId: string, limit = 5): Promise<Array<{ candidate_id: string; votes: number }>> {
    const { data: votes, error } = await (supabase as any)
      .from('triwulan_votes')
      .select('candidate_id')
      .eq('period_id', periodId)
    if (error) throw error

    const counts: Record<string, number> = {}
    ;(votes || []).forEach((v: any) => {
      counts[v.candidate_id] = (counts[v.candidate_id] || 0) + 1
    })
    const sorted = Object.entries(counts)
      .map(([candidate_id, votes]) => ({ candidate_id, votes }))
      .sort((a, b) => b.votes - a.votes)
      .slice(0, limit)
    return sorted
  }
}


