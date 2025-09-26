// src/lib/triwulan-service.ts

export class TriwulanService {
  static async listCandidates(periodId: string): Promise<Array<{ user_id: string }>> {
    try {
      const res = await fetch(`/api/triwulan/candidates?periodId=${encodeURIComponent(periodId)}`, { cache: 'no-store' })
      if (!res.ok) return []
      const json = await res.json().catch(() => ({ candidates: [] }))
      return json.candidates || []
    } catch {
      return []
    }
  }

  static async countCandidates(periodId: string): Promise<number> {
    const list = await this.listCandidates(periodId)
    return list.length
  }

  static async submitVotes(periodId: string, voterId: string, candidateIds: string[]): Promise<void> {
    const res = await fetch('/api/triwulan/votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ periodId, voterId, candidateIds })
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || 'Gagal menyimpan pilihan kandidat')
    }
  }

  static async getUserVotes(periodId: string, voterId: string): Promise<string[]> {
    const qs = new URLSearchParams({ periodId, voterId })
    const res = await fetch(`/api/triwulan/votes?${qs.toString()}`, { cache: 'no-store' })
    if (!res.ok) return []
    const json = await res.json().catch(() => ({ votes: [] }))
    return json.votes || []
  }

  static async markVoteCompleted(periodId: string, voterId: string): Promise<void> {
    const res = await fetch('/api/triwulan/votes?complete=1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ periodId, voterId })
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || 'Gagal menandai selesai memilih')
    }
  }

  static async hasCompletedVote(periodId: string, voterId: string): Promise<boolean> {
    const qs = new URLSearchParams({ periodId, voterId, check: '1' })
    const res = await fetch(`/api/triwulan/votes?${qs.toString()}`, { cache: 'no-store' })
    if (!res.ok) return false
    const json = await res.json().catch(() => ({ completed: false }))
    return !!json.completed
  }

  static async submitRatings(input: {
    periodId: string
    raterId: string
    candidateId: string
    scores: [number, number, number, number, number, number, number, number, number, number, number, number, number]
  }): Promise<void> {
    const res = await fetch('/api/triwulan/ratings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || 'Gagal menyimpan penilaian')
    }
  }

  static async getUserRating(periodId: string, raterId: string, candidateId: string): Promise<number[] | null> {
    const qs = new URLSearchParams({ periodId, raterId, candidateId })
    const res = await fetch(`/api/triwulan/ratings?${qs.toString()}`, { cache: 'no-store' })
    if (!res.ok) return null
    const json = await res.json().catch(() => ({}))
    return json.scores || null
  }

  static async getUserRatingsMap(periodId: string, raterId: string): Promise<Record<string, number[]>> {
    const qs = new URLSearchParams({ periodId, raterId, map: '1' })
    const res = await fetch(`/api/triwulan/ratings?${qs.toString()}`, { cache: 'no-store' })
    if (!res.ok) return {}
    const json = await res.json().catch(() => ({ map: {} }))
    return json.map || {}
  }

  static async getScores(periodId: string): Promise<Array<{ candidate_id: string; total_score: number; num_raters: number; score_percent: number }>> {
    const qs = new URLSearchParams({ periodId })
    const res = await fetch(`/api/triwulan/ratings/scores?${qs.toString()}`, { cache: 'no-store' })
    if (!res.ok) return []
    const json = await res.json().catch(() => ({ scores: [] }))
    return json.scores || []
  }

  static async setWinner(periodId: string, winnerId: string, totalScore?: number): Promise<void> {
    const res = await fetch('/api/triwulan/winner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ periodId, winnerId, totalScore })
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || 'Gagal menyimpan pemenang')
    }
  }

  static async getWinner(periodId: string): Promise<{ winner_id: string; total_score: number | null } | null> {
    const qs = new URLSearchParams({ periodId })
    const res = await fetch(`/api/triwulan/winner?${qs.toString()}`, { cache: 'no-store' })
    if (!res.ok) return null
    const json = await res.json().catch(() => ({}))
    return json.winner || null
  }

  static async getVotingStatus(periodId: string): Promise<{ requiredCount: number; completedCount: number; completedUserIds: string[] }> {
    const qs = new URLSearchParams({ periodId })
    const res = await fetch(`/api/triwulan/votes/status?${qs.toString()}`, { cache: 'no-store' })
    if (!res.ok) return { requiredCount: 0, completedCount: 0, completedUserIds: [] }
    const json = await res.json().catch(() => ({ requiredCount: 0, completedCount: 0, completedUserIds: [] }))
    return json
  }

  static async getRatingsCompletionStatus(periodId: string): Promise<{ requiredCount: number; completedCount: number; completedUserIds: string[] }> {
    const qs = new URLSearchParams({ periodId })
    const res = await fetch(`/api/triwulan/ratings/status?${qs.toString()}`, { cache: 'no-store' })
    if (!res.ok) return { requiredCount: 0, completedCount: 0, completedUserIds: [] }
    const json = await res.json().catch(() => ({ requiredCount: 0, completedCount: 0, completedUserIds: [] }))
    return json
  }

  static async getTopCandidates(periodId: string, limit = 5): Promise<Array<{ candidate_id: string; votes: number }>> {
    const qs = new URLSearchParams({ periodId, limit: String(limit) })
    const res = await fetch(`/api/triwulan/votes/top?${qs.toString()}`, { cache: 'no-store' })
    if (!res.ok) return []
    const json = await res.json().catch(() => ({ top: [] }))
    return json.top || []
  }
}


