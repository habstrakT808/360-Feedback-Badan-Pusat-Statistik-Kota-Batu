// src/lib/pin-period-service.ts

type PinPeriod = {
  id: string
  year: number | null
  month: number | null
  start_date: Date
  end_date: Date
  is_active: boolean
  is_completed: boolean
  created_at: Date
  updated_at?: Date
}

export class PinPeriodService {
  static async list(): Promise<PinPeriod[]> {
    const res = await fetch('/api/admin/pin-periods', { cache: 'no-store' })
    if (!res.ok) return []
    const json = await res.json()
    return json.data || []
  }

  static async create(input: {
    month?: number | null
    year?: number | null
    start_date: string
    end_date: string
  }): Promise<PinPeriod> {
    const res = await fetch('/api/admin/pin-periods', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (!res.ok) throw new Error('Gagal membuat pin period')
    const json = await res.json()
    return json.data
  }

  static async update(id: string, updates: Partial<PinPeriod>): Promise<PinPeriod> {
    const res = await fetch('/api/admin/pin-periods', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    })
    if (!res.ok) throw new Error('Gagal memperbarui pin period')
    const json = await res.json()
    return json.data
  }

  static async remove(id: string): Promise<void> {
    const res = await fetch(`/api/admin/pin-periods?id=${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Gagal menghapus pin period')
  }

  // Reset all pins (by date range) and reset monthly allowance values for the period (to 4/0)
  static async reset(id: string): Promise<{ pins_deleted: number; allowances_reset: number }> {
    // Delegate to server route to use service role (bypass RLS)
    const res = await fetch('/api/admin/reset-pin-period', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(text || 'Gagal mereset periode')
    }
    return res.json()
  }

  static async getActive(): Promise<PinPeriod | null> {
    const res = await fetch('/api/pins/period/active', { cache: 'no-store' })
    if (!res.ok) return null
    const json = await res.json()
    return json.data || null
  }

  // Seed completed pin periods for a full year (Jan-Dec)
  static async seedCompletedYear(year: number): Promise<number> {
    // Build 12 periods, each spanning the full month, marked completed
    const rows = Array.from({ length: 12 }).map((_, i) => {
      const month = i + 1
      const start = new Date(Date.UTC(year, i, 1))
      const end = new Date(Date.UTC(year, i + 1, 0))
      const startStr = start.toISOString().slice(0, 10)
      const endStr = end.toISOString().slice(0, 10)
      return {
        month,
        year,
        start_date: startStr,
        end_date: endStr,
        is_active: false,
        is_completed: true,
      }
    })

    // Admin-only utility; ensure endpoint exists before using. Placeholder no-op.
    return 0
  }

  // Seed completed pin periods for a specific month range in a year (inclusive)
  static async seedCompletedRange(year: number, startMonth: number, endMonth: number): Promise<number> {
    const safeStart = Math.max(1, Math.min(12, startMonth))
    const safeEnd = Math.max(1, Math.min(12, endMonth))
    const [from, to] = safeStart <= safeEnd ? [safeStart, safeEnd] : [safeEnd, safeStart]

    const rows = Array.from({ length: to - from + 1 }).map((_, idx) => {
      const month = from + idx
      const start = new Date(Date.UTC(year, month - 1, 1))
      const end = new Date(Date.UTC(year, month, 0))
      return {
        month,
        year,
        start_date: start.toISOString().slice(0, 10),
        end_date: end.toISOString().slice(0, 10),
        is_active: false,
        is_completed: true,
      }
    })

    // Admin-only utility; ensure endpoint exists before using. Placeholder no-op.
    return 0
  }
}