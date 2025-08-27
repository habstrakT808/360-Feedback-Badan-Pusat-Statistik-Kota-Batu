// src/lib/pin-service.ts
import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

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
    
    console.log('🔍 Week Number Calculation (PostgreSQL Compatible):', {
      currentDate: now.toISOString(),
      dayOfYear,
      startDay: adjustedStartDay,
      calculatedWeek: weekNumber
    })
    
    return weekNumber
  }

  // Mendapatkan tahun saat ini
  static getCurrentYear(): number {
    return new Date().getFullYear()
  }

  // Mendapatkan bulan saat ini
  static getCurrentMonth(): number {
    return new Date().getMonth() + 1
  }

  // Mendapatkan apakah hari ini adalah hari Jumat
  static isFriday(): boolean {
    return new Date().getDay() === 5 // 0 = Minggu, 5 = Jumat
  }

  // Mendapatkan allowance pin bulanan untuk user
  static async getMonthlyPinAllowance(userId: string): Promise<MonthlyPinAllowance | null> {
    const { month, year } = this.getConsistentWeekNumber()

    // Cek allowance yang ada di database (tabel bulanan)
    const { data, error } = await (supabase as any)
      .from('monthly_pin_allowance')
      .select('*')
      .eq('user_id', userId)
      .eq('month', month)
      .eq('year', year)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching monthly pin allowance:', error)
      return null
    }

    if (!data) {
      // Buat allowance baru jika belum ada
      const { data: newAllowance, error: createError } = await (supabase as any)
        .from('monthly_pin_allowance')
        .insert({
          user_id: userId,
          month,
          year,
          pins_remaining: 4,
          pins_used: 0
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating monthly pin allowance:', createError)
        return null
      }

      return {
        user_id: (newAllowance as any).user_id,
        pins_remaining: (newAllowance as any).pins_remaining,
        pins_used: (newAllowance as any).pins_used,
        month: (newAllowance as any).month,
        year: (newAllowance as any).year,
        last_reset_at: new Date().toISOString(),
      }
    }

    return {
      user_id: (data as any).user_id,
      pins_remaining: (data as any).pins_remaining,
      pins_used: (data as any).pins_used,
      month: (data as any).month,
      year: (data as any).year,
      last_reset_at: new Date().toISOString(),
    }
  }

  // Memberikan pin kepada user lain
  static async givePin(giverId: string, receiverId: string): Promise<boolean> {
    // Validasi periode pin aktif
    const today = new Date()
    const todayStr = today.toISOString().slice(0, 10)
    const { data: activePeriod, error: apError } = await (supabase as any)
      .from('pin_periods')
      .select('*')
      .eq('is_active', true)
      .single()
    if (apError || !activePeriod) {
      throw new Error('Tidak ada pin period aktif saat ini')
    }
    if (!(todayStr >= activePeriod.start_date && todayStr <= activePeriod.end_date)) {
      throw new Error('Di luar rentang tanggal pin period aktif')
    }

    // Cek allowance pin bulanan
    const allowance = await this.getMonthlyPinAllowance(giverId)
    if (!allowance || allowance.pins_remaining <= 0) {
      throw new Error('Anda tidak memiliki pin tersisa untuk bulan ini')
    }

    console.log('🔍 Giving pin:', { giverId, receiverId, allowance })

    // Gunakan helper function untuk konsistensi 100%
    const { weekNumber, year, month } = this.getConsistentWeekNumber()

    console.log('🔍 Pin creation details:', { weekNumber, year, month })

    // Mulai transaksi
    const { error: pinError } = await supabase
      .from('employee_pins')
      .insert({
        giver_id: giverId,
        receiver_id: receiverId,
        week_number: weekNumber,
        year: year,
        month: month
      })

    if (pinError) {
      console.error('Error giving pin:', pinError)
      throw new Error('Gagal memberikan pin')
    }

    // Update allowance bulanan dengan logging yang lebih detail
    console.log('🔍 Updating allowance:', {
      userId: giverId,
      month,
      year,
      currentRemaining: allowance.pins_remaining,
      newRemaining: allowance.pins_remaining - 1,
      currentUsed: allowance.pins_used,
      newUsed: allowance.pins_used + 1
    })

    const { data: updatedAllowance, error: allowanceError } = await (supabase as any)
      .from('monthly_pin_allowance')
      .update({
        pins_remaining: allowance.pins_remaining - 1,
        pins_used: allowance.pins_used + 1
      })
      .eq('user_id', giverId)
      .eq('month', month)
      .eq('year', year)
      .select()

    if (allowanceError) {
      console.error('Error updating allowance:', allowanceError)
      throw new Error('Gagal update allowance pin')
    }

    console.log('🔍 Allowance updated successfully:', updatedAllowance)

    return true
  }

  // Mendapatkan peringkat mingguan
  static async getWeeklyRanking(): Promise<PinRanking[]> {
    // SELALU gunakan helper function untuk konsistensi 100% dengan givePin
    const { weekNumber, year } = this.getConsistentWeekNumber()

    console.log('🔍 Fetching Weekly Ranking for week:', weekNumber, 'year:', year)

    // 1. Ambil semua user dari profiles (exclude admin users)
    const { data: allUsers, error: usersError } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, email')
      .order('full_name', { ascending: true })

    if (usersError) {
      console.error('Error fetching all users:', usersError)
      return []
    }

    // Filter out admin users
    const adminEmails = ['jhodywiraputra@gmail.com']
    const adminNames = ['Hafiyan Al Muqaffi Umary']
    
    const filteredUsers = allUsers.filter(profile => {
      // Exclude by email
      if (adminEmails.includes(profile.email || '')) {
        return false
      }
      // Exclude by name
      if (adminNames.includes(profile.full_name || '')) {
        return false
      }
      return true
    })

    console.log('🔍 All users from profiles (filtered):', filteredUsers)

    // 2. Ambil pin untuk minggu tertentu (SELALU gunakan week number yang konsisten)
    const { data: pins, error: pinsError } = await supabase
      .from('employee_pins')
      .select(`
        id,
        receiver_id,
        week_number,
        year,
        month,
        created_at,
        receiver:profiles!employee_pins_receiver_id_fkey(
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('week_number', weekNumber)
      .eq('year', year)
      .order('created_at', { ascending: false })

    console.log('🔍 Weekly Pins Query Result:', { pins, pinsError, weekNumber, year })

    if (pinsError) {
      console.error('Error fetching weekly pins:', pinsError)
      return []
    }

    // Debug: log semua pin yang ditemukan
    if (pins && pins.length > 0) {
      console.log('🔍 All pins found for week', weekNumber, 'year', year, ':', pins.map(p => ({
        id: p.id,
        receiver: p.receiver?.full_name,
        week_number: p.week_number,
        year: p.year,
        month: p.month,
        created_at: p.created_at
      })))
    } else {
      console.log('🔍 No pins found for week', weekNumber, 'year', year)
    }

    // 3. Hitung jumlah pin per user
    const pinCounts = new Map<string, number>()
    
    if (pins && pins.length > 0) {
      pins.forEach((pin: any) => {
        const receiverId = pin.receiver_id
        pinCounts.set(receiverId, (pinCounts.get(receiverId) || 0) + 1)
      })
    }

    console.log('🔍 Weekly Pin Counts Map:', pinCounts)
    console.log('🔍 Weekly Pin Counts Details:', Array.from(pinCounts.entries()).map(([userId, count]) => ({
      userId,
      count,
      user: filteredUsers.find(u => u.id === userId)?.full_name
    })))

    // 4. Buat ranking dengan semua user (termasuk yang 0 pin, exclude admin)
    const rankings: PinRanking[] = filteredUsers.map((user, index) => ({
      user_id: user.id,
      full_name: user.full_name,
      avatar_url: user.avatar_url || undefined,
      pin_count: pinCounts.get(user.id) || 0,
      rank: 0
    }))

    // 5. Sort berdasarkan jumlah pin (descending), kemudian nama (ascending) untuk yang sama
    rankings.sort((a, b) => {
      if (b.pin_count !== a.pin_count) {
        return b.pin_count - a.pin_count
      }
      return a.full_name.localeCompare(b.full_name)
    })

    // 6. Tambahkan rank
    rankings.forEach((ranking, index) => {
      ranking.rank = index + 1
    })

    console.log('🔍 Final Weekly Rankings (filtered users):', rankings)
    return rankings
  }

  // Mendapatkan peringkat bulanan
  static async getMonthlyRanking(): Promise<PinRanking[]> {
    // SELALU gunakan helper function untuk konsistensi
    const { month, year } = this.getConsistentWeekNumber()

    console.log('🔍 Fetching Monthly Ranking for month:', month, 'year:', year)

    // 1. Ambil semua user dari profiles (exclude admin users)
    const { data: allUsers, error: usersError } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, email')
      .order('full_name', { ascending: true })

    if (usersError) {
      console.error('Error fetching all users:', usersError)
      return []
    }

    // Filter out admin users
    const adminEmails = ['jhodywiraputra@gmail.com']
    const adminNames = ['Hafiyan Al Muqaffi Umary']
    
    const filteredUsers = allUsers.filter(profile => {
      // Exclude by email
      if (adminEmails.includes(profile.email || '')) {
        return false
      }
      // Exclude by name
      if (adminNames.includes(profile.full_name || '')) {
        return false
      }
      return true
    })

    console.log('🔍 All users from profiles (filtered monthly):', filteredUsers)

    // 2. Ambil pin untuk bulan tertentu
    const { data: pins, error: pinsError } = await supabase
      .from('employee_pins')
      .select(`
        id,
        receiver_id,
        week_number,
        year,
        month,
        created_at,
        receiver:profiles!employee_pins_receiver_id_fkey(
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('month', month)
      .eq('year', year)
      .order('created_at', { ascending: false })

    console.log('🔍 Monthly Pins Query Result:', { pins, pinsError, month, year })

    if (pinsError) {
      console.error('Error fetching monthly pins:', pinsError)
      return []
    }

    // Debug: log semua pin yang ditemukan
    if (pins && pins.length > 0) {
      console.log('🔍 All pins found for month', month, 'year', year, ':', pins.map(p => ({
        id: p.id,
        receiver: p.receiver?.full_name,
        week_number: p.week_number,
        year: p.year,
        month: p.month,
        created_at: p.created_at
      })))
    } else {
      console.log('🔍 No pins found for month', month, 'year', year)
    }

    // 3. Hitung jumlah pin per user
    const pinCounts = new Map<string, number>()
    
    if (pins && pins.length > 0) {
      pins.forEach((pin: any) => {
        const receiverId = pin.receiver_id
        pinCounts.set(receiverId, (pinCounts.get(receiverId) || 0) + 1)
      })
    }

    console.log('🔍 Monthly Pin Counts Map:', pinCounts)
    console.log('🔍 Monthly Pin Counts Details:', Array.from(pinCounts.entries()).map(([userId, count]) => ({
      userId,
      count,
      user: filteredUsers.find(u => u.id === userId)?.full_name
    })))

    // 4. Buat ranking dengan semua user (termasuk yang 0 pin, exclude admin)
    const rankings: PinRanking[] = filteredUsers.map((user, index) => ({
      user_id: user.id,
      full_name: user.full_name,
      avatar_url: user.avatar_url || undefined,
      pin_count: pinCounts.get(user.id) || 0,
      rank: 0
    }))

    // 5. Sort berdasarkan jumlah pin (descending), kemudian nama (ascending) untuk yang sama
    rankings.sort((a, b) => {
      if (b.pin_count !== a.pin_count) {
        return b.pin_count - a.pin_count
      }
      return a.full_name.localeCompare(b.full_name)
    })

    // 6. Tambahkan rank
    rankings.forEach((ranking, index) => {
      ranking.rank = index + 1
    })

    console.log('🔍 Final Monthly Rankings (filtered users):', rankings)
    return rankings
  }

  // Fungsi untuk membuat data pin test (hanya untuk development)
  static async createTestPins(currentUserId: string): Promise<void> {
    // Nonaktifkan fungsi test untuk mencegah data otomatis dibuat
    return;
    
    // Aktifkan untuk testing weekly ranking
    if (process.env.NODE_ENV !== 'development') {
      return
    }

    console.log('🔧 Creating test pins for development...')
    
    try {
      // Cek apakah sudah ada data pin untuk minggu ini
      const weekNumber = this.getCurrentWeekNumber()
      const year = this.getCurrentYear()
      
      console.log('🔧 Checking for existing pins in week', weekNumber, year)
      
      const { data: existingPins } = await supabase
        .from('employee_pins')
        .select('id, week_number, year, giver_id, receiver_id')
        .eq('week_number', weekNumber)
        .eq('year', year)
        .limit(5)
      
      const pins = existingPins || []
      console.log('🔧 Existing pins found:', pins)
      
      if (pins.length > 0) {
        console.log('🔧 Test pins already exist for week', weekNumber, year)
        return
      }
      
      // Buat beberapa pin test dengan current user sebagai giver
      const testPins = [
        { receiver_id: 'd22c96f8-d4c3-42d3-9368-925fec3016c9' },
        { receiver_id: '3eea9883-b781-464b-8923-f0a015bb02c1' },
        { receiver_id: '03a2e16d-3f83-40f2-ac7a-448cac0e34f9' },
        { receiver_id: '678ad9e9-cc08-4101-b735-6d2e1feaab3a' },
      ]
      
      console.log('🔧 Creating test pins for receivers:', testPins.map(p => p.receiver_id))
      
      for (const pin of testPins) {
        const { data, error } = await supabase
          .from('employee_pins')
          .insert({
            giver_id: currentUserId, // Gunakan current user sebagai giver
            receiver_id: pin.receiver_id,
            week_number: weekNumber,
            year: year,
            month: this.getCurrentMonth()
          })
          .select('id, week_number, year, month, giver_id, receiver_id')
        
        if (error) {
          console.error('Error creating test pin:', error)
        } else {
          console.log('🔧 Test pin created:', data?.[0])
        }
      }
      
      console.log('🔧 Test pins created successfully')
    } catch (error) {
      console.error('Error creating test pins:', error)
    }
  }

  // Mendapatkan semua team members yang dapat diberikan pin
  static async getAvailableTeamMembers(excludeUserId: string): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name')

    if (error) {
      console.error('Error fetching team members:', error)
      return []
    }

    // Filter out admin users (hardcoded untuk Hafiyan dan jhodywiraputra@gmail.com)
    const adminEmails = ['jhodywiraputra@gmail.com']
    const adminNames = ['Hafiyan Al Muqaffi Umary']
    
    const filteredData = data?.filter(profile => {
      // Exclude by email
      if (adminEmails.includes(profile.email || '')) {
        return false
      }
      // Exclude by name
      if (adminNames.includes(profile.full_name || '')) {
        return false
      }
      return true
    }) || []

    return filteredData
  }

  // Mendapatkan history pin yang diberikan oleh user
  static async getPinHistory(userId: string, weekNumber?: number, year?: number) {
    let query = supabase
      .from('employee_pins')
      .select(`
        *,
        receiver:profiles!employee_pins_receiver_id_fkey(
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('giver_id', userId)
      .order('created_at', { ascending: false })

    if (weekNumber && year) {
      query = query.eq('week_number', weekNumber).eq('year', year)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching pin history:', error)
      return []
    }

    return data || []
  }

  // Membatalkan pin yang sudah diberikan
  static async cancelPin(pinId: string, giverId: string): Promise<void> {
    // 1) Ambil data pin untuk mengetahui bulan dan tahun
    const { data: pin, error: fetchError } = await supabase
      .from('employee_pins')
      .select('id, giver_id, month, year')
      .eq('id', pinId)
      .single()

    if (fetchError || !pin) {
      console.error('Error fetching pin to cancel:', fetchError)
      throw new Error('Pin tidak ditemukan')
    }

    if (pin.giver_id !== giverId) {
      throw new Error('Anda hanya dapat membatalkan pin yang Anda berikan')
    }

    // 2) Hapus pin
    const { error: deleteError } = await supabase
      .from('employee_pins')
      .delete()
      .eq('id', pinId)

    if (deleteError) {
      console.error('Error deleting pin:', deleteError)
      throw new Error('Gagal membatalkan pin')
    }

    // 3) Kembalikan allowance bulanan
    const { data: allowance, error: allowanceFetchError } = await (supabase as any)
      .from('monthly_pin_allowance')
      .select('*')
      .eq('user_id', giverId)
      .eq('month', pin.month)
      .eq('year', pin.year)
      .single()

    if (allowanceFetchError) {
      console.warn('Monthly allowance not found when cancelling pin:', allowanceFetchError)
      return
    }

    const newPinsUsed = Math.max(0, (allowance as any).pins_used - 1)
    const newPinsRemaining = Math.min(4, (allowance as any).pins_remaining + 1)

    const { error: allowanceUpdateError } = await (supabase as any)
      .from('monthly_pin_allowance')
      .update({ pins_used: newPinsUsed, pins_remaining: newPinsRemaining })
      .eq('user_id', giverId)
      .eq('month', pin.month)
      .eq('year', pin.year)

    if (allowanceUpdateError) {
      console.error('Error updating monthly allowance after cancel:', allowanceUpdateError)
      // tidak throw; pin sudah dihapus, allowance bisa disesuaikan manual bila perlu
    }
  }

  // Mendapatkan total pin yang diterima user
  static async getTotalPinsReceived(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('employee_pins')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', userId)

    if (error) {
      console.error('Error counting received pins:', error)
      return 0
    }

    return count || 0
  }
}
