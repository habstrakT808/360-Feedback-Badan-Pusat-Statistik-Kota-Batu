// src/lib/assessment-service.ts (REPLACE COMPLETE FILE)
// Refactored to hit Next.js API routes backed by Prisma

export class AssessmentService {
  static async getCurrentPeriod() {
    const res = await fetch('/api/assessment/current-period', { cache: 'no-store' })
    if (!res.ok) return null
    return await res.json()
  }

  static async getMyAssignments(_userId: string) {
    const res = await fetch('/api/assessment/my-assignments', { cache: 'no-store' })
    if (!res.ok) return []
    return await res.json()
  }

  static async submitFeedback(
    assignmentId: string,
    responses: Array<{
      aspect: string
      indicator: string
      rating: number
      comment?: string
    }>
  ) {
    const res = await fetch('/api/assessment/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignmentId, responses })
    })
    if (!res.ok) throw new Error('Failed to submit feedback')
  }

  static async getExistingResponses(assignmentId: string) {
    const res = await fetch(`/api/assessment/responses?assignmentId=${assignmentId}`, { cache: 'no-store' })
    if (!res.ok) return []
    return await res.json()
  }

  static async getMyFeedback(userId: string) {
    const res = await fetch(`/api/assessment/my-feedback?userId=${userId}`, { cache: 'no-store' })
    if (!res.ok) return []
    return await res.json()
  }

  // Check if user is supervisor
  static async isSupervisor(userId: string) {
    const res = await fetch(`/api/me/role`, { cache: 'no-store' })
    if (!res.ok) return false
    const json = await res.json()
    return json.role === 'supervisor'
  }

  // Check if user is admin
  static async isAdmin(userId: string) {
    const res = await fetch(`/api/me/role`, { cache: 'no-store' })
    if (!res.ok) return false
    const json = await res.json()
    return json.role === 'admin'
  }
}