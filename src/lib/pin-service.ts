// src/lib/pin-service.ts
import { RolesService } from '@/lib/roles-service'

type Profile = {
  id: string
  email: string
  username: string
  full_name: string
  position: string | null
  department: string | null
  avatar_url: string | null
  allow_public_view: boolean
  created_at: Date
  updated_at: Date
}

export interface PinRanking {
  user_id: string
  full_name: string
  avatar_url?: string
  pin_count: number
  rank: number
}

export interface MonthlyPinAllowance {
  user_id: string
  pins_remaining: number
  pins_used: number
  month?: number
  year?: number
  last_reset_at?: string
}

export class PinService {
  // Helper function untuk memastikan konsistensi week number
  private static getConsistentWeekNumber(): { weekNumber: number; year: number; month: number } {
    const weekNumber = this.getCurrentWeekNumber()
    const year = this.getCurrentYear()
    const month = this.getCurrentMonth()
    
    console.log('🔍 Consistent Week Number:', { weekNumber, year, month })
    
    return { weekNumber, year, month }
  }

  // Mendapatkan nomor minggu saat ini
  static getCurrentWeekNumber(): number {
    const now = new Date()
    
    // Gunakan formula yang sama dengan PostgreSQL DATE_PART('week', date)
    // Ini adalah pendekatan sederhana yang konsisten
    const startOfYear = new Date(now.getFullYear(), 0, 1)
    const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)) + 1
    const startDay = startOfYear.getDay() // 0 = Sunday, 1 = Monday, etc.
    
    // Adjust for PostgreSQL week calculation (Monday = start of week)
    const adjustedStartDay = startDay === 0 ? 7 : startDay // Convert Sunday (0) to 7
    const weekNumber = Math.ceil((dayOfYear + adjustedStartDay - 2) / 7)
    
    return Math.max(1, weekNumber) // Ensure minimum week 1
  }

  // Mendapatkan tahun saat ini
  static getCurrentYear(): number {
    return new Date().getFullYear()
  }

  // Mendapatkan bulan saat ini
  static getCurrentMonth(): number {
    return new Date().getMonth() + 1
  }

  // Mendapatkan data pin untuk ranking
  static async getPinRankings(limit: number = 10, period: 'active' | { month: number; year: number } | { start: string; end: string } = 'active'): Promise<PinRanking[]> {
    try {
      if (typeof window !== 'undefined') {
        let periodParam = 'period=active'
        if (typeof period === 'object' && 'month' in period && 'year' in period) {
          const mm = String(period.month).padStart(2, '0')
          periodParam = `period=month:${period.year}-${mm}`
        } else if (typeof period === 'object' && 'start' in period && 'end' in period) {
          periodParam = `period=range:${encodeURIComponent(period.start)},${encodeURIComponent(period.end)}`
        }
        const res = await fetch(`/api/pins/rankings?limit=${limit}&${periodParam}`, { cache: 'no-store' })
        if (!res.ok) return []
        const json = await res.json()
        return json.rankings || []
      }
      // Server-side fallback via RolesService is not needed; prefer API
      const res = await fetch(`${process.env.NEXTAUTH_URL || ''}/api/pins/rankings?limit=${limit}&period=active`, { cache: 'no-store' })
      if (!res.ok) return []
      const json = await res.json()
      return json.rankings || []
    } catch (error) {
      console.error('Error fetching pin rankings:', error)
      return []
    }
  }

  // Mendapatkan data pin untuk user tertentu
  static async getUserPinHistory(userId: string, limit: number = 20) {
    try {
      if (typeof window !== 'undefined') {
        // Load using active period by default; filters are applied in the component via month/year selection
        const res = await fetch('/api/pins/history', { cache: 'no-store' })
        if (!res.ok) return []
        const json = await res.json()
        const pins = Array.isArray(json.pins) ? json.pins : []
        // API sudah menyaring berdasarkan pengguna; kembalikan apa adanya
        return pins.slice(0, limit)
      }
      return []
    } catch (error) {
      console.error('Error fetching user pin history:', error)
      return []
    }
  }

  // Memberikan pin kepada user lain
  static async givePin(giverId: string, receiverId: string): Promise<{ success: boolean; message: string }> {
    try {
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/pins/give', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ receiverId })
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          return { success: false, message: err.error || 'Gagal memberikan pin' }
        }
        const json = await res.json()
        return { success: !!json.success, message: json.message || 'Pin berhasil diberikan!' }
      }
      return { success: false, message: 'Client-only operation' }
    } catch (error) {
      console.error('Error giving pin:', error)
      return {
        success: false,
        message: 'Terjadi kesalahan saat memberikan pin'
      }
    }
  }

  // Mendapatkan weekly pin allowance
  static async getWeeklyPinAllowance(userId: string, weekNumber: number, year: number): Promise<MonthlyPinAllowance> {
    try {
      if (typeof window !== 'undefined') {
        const res = await fetch('/api/pins/allowance', { cache: 'no-store' })
        if (!res.ok) {
          return { user_id: userId, pins_remaining: 0, pins_used: 0, month: this.getCurrentMonth(), year }
        }
        const json = await res.json()
        const payload = (json && typeof json === 'object') ? (json.allowance || json) : null
        if (payload && typeof payload.pins_remaining === 'number') {
          return payload as MonthlyPinAllowance
        }
        return { user_id: userId, pins_remaining: 0, pins_used: 0, month: this.getCurrentMonth(), year }
      }
      return { user_id: userId, pins_remaining: 0, pins_used: 0, month: this.getCurrentMonth(), year }
    } catch (error) {
      console.error('Error getting weekly pin allowance:', error)
      return { user_id: userId, pins_remaining: 0, pins_used: 0, month: this.getCurrentMonth(), year }
    }
  }

  // Update weekly pin allowance
  private static async updateWeeklyPinAllowance(userId: string, weekNumber: number, year: number, pinsUsed: number) {
    // Server-only. No-op on client.
    return
  }

  // Mendapatkan total pin yang diterima user
  static async getUserTotalPins(userId: string): Promise<number> {
    try {
      if (typeof window !== 'undefined') {
        const history = await this.getUserPinHistory(userId, 1000)
        return history.filter((h: any) => h.receiver_id === userId).length
      }
      return 0
    } catch {
      return 0
    }
  }

  // Mendapatkan pin yang diberikan user
  static async getUserGivenPins(userId: string): Promise<number> {
    try {
      if (typeof window !== 'undefined') {
        const history = await this.getUserPinHistory(userId, 1000)
        return history.filter((h: any) => h.giver_id === userId).length
      }
      return 0
    } catch {
      return 0
    }
  }

  // Mendapatkan pin yang diterima user
  static async getUserReceivedPins(userId: string): Promise<number> {
    try {
      if (typeof window !== 'undefined') {
        const history = await this.getUserPinHistory(userId, 1000)
        return history.filter((h: any) => h.receiver_id === userId).length
      }
      return 0
    } catch {
      return 0
    }
  }

  // Mendapatkan pin statistics untuk dashboard
  static async getPinStatistics() {
    try {
      const res = await fetch('/api/pins/stats', { cache: 'no-store' })
      if (!res.ok) return { totalPins: 0, thisWeekPins: 0, thisMonthPins: 0 }
      const json = await res.json()
      return json.stats || { totalPins: 0, thisWeekPins: 0, thisMonthPins: 0 }
    } catch (error) {
      console.error('Error getting pin statistics:', error)
      return { totalPins: 0, thisWeekPins: 0, thisMonthPins: 0 }
    }
  }

  // Load participants (non-admin profiles) to display in Give Pin list
  static async getParticipants(): Promise<Array<{ id: string; full_name: string; avatar_url: string | null }>> {
    try {
      const res = await fetch('/api/pins/participants', { cache: 'no-store' })
      if (!res.ok) return []
      const json = await res.json()
      return json.data || []
    } catch (e) {
      console.error('Error getting pin participants:', e)
      return []
    }
  }
}
