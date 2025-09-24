// src/lib/triwulan-period-service.ts

// Client-side service: use API routes instead of Prisma

type TriwulanPeriod = any
type TriwulanMonthlyDef = any

export class TriwulanPeriodService {
  static async list(): Promise<TriwulanPeriod[]> {
    const res = await fetch('/api/admin/triwulan', { cache: 'no-store' })
    if (!res.ok) return []
    const json = await res.json().catch(() => ({ data: [] }))
    return json.data || []
  }

  static async getActive(): Promise<TriwulanPeriod | null> {
    const res = await fetch('/api/admin/triwulan?active=1', { cache: 'no-store' })
    if (!res.ok) return null
    const json = await res.json().catch(() => ({ data: [] }))
    const arr = json.data || []
    return arr[0] || null
  }

  static async create(input: {
    year: number
    quarter: number
    start_date: string
    end_date: string
  }): Promise<TriwulanPeriod> {
    const res = await fetch('/api/admin/triwulan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || 'Gagal membuat triwulan')
    }
    const json = await res.json().catch(() => ({}))
    return json.data
  }

  static async update(id: string, updates: Partial<TriwulanPeriod>): Promise<TriwulanPeriod> {
    const res = await fetch('/api/admin/triwulan', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates })
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || 'Gagal memperbarui triwulan')
    }
    const json = await res.json().catch(() => ({}))
    return json.data
  }

  static async remove(id: string): Promise<void> {
    const res = await fetch(`/api/admin/triwulan?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || 'Gagal menghapus triwulan')
    }
  }

  static async upsertMonthlyDeficiencies(rows: Array<{
    period_id: string
    user_id: string
    year: number
    month: number
    deficiency_hours: number
    filled_by?: string | null
  }>): Promise<void> {
    const res = await fetch('/api/admin/triwulan/deficiencies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows })
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || 'Gagal menyimpan kekurangan jam kerja')
    }
  }

  static async listMonthlyDeficiencies(periodId: string): Promise<TriwulanMonthlyDef[]> {
    const res = await fetch(`/api/admin/triwulan/deficiencies?periodId=${encodeURIComponent(periodId)}`, { cache: 'no-store' })
    if (!res.ok) return []
    const json = await res.json().catch(() => ({ data: [] }))
    return json.data || []
  }
}


