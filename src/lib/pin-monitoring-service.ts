export type PinMonitoringRow = {
  user_id: string
  full_name: string | null
  email: string | null
  position: string | null
  department: string | null
  avatar_url?: string | null
  pins_used: number
  pins_remaining: number
  has_submitted: boolean
}

export class PinMonitoringService {
  static async get(periodId?: string): Promise<{ rows: PinMonitoringRow[]; meta: any }> {
    const qs = new URLSearchParams()
    if (periodId) qs.set('periodId', periodId)
    const res = await fetch(`/api/admin/pin-monitoring${qs.toString() ? `?${qs.toString()}` : ''}`, { cache: 'no-store' })
    if (!res.ok) throw new Error('Gagal memuat data monitoring pin')
    const json = await res.json()
    return { rows: (json.data || []) as PinMonitoringRow[], meta: json.meta }
  }
}


