// src/lib/pin-period-service.ts
import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/database.types'

type PinPeriod = Database['public']['Tables']['pin_periods']['Row']

export class PinPeriodService {
  static async list(): Promise<PinPeriod[]> {
    const { data, error } = await supabase
      .from('pin_periods')
      .select('*')
      // Newest first: prioritize year desc, then month desc, then start_date desc
      .order('year', { ascending: false, nullsFirst: false })
      .order('month', { ascending: false, nullsFirst: false })
      .order('start_date', { ascending: false })

    if (error) throw error
    return data || []
  }

  static async create(input: {
    month?: number | null
    year?: number | null
    start_date: string
    end_date: string
  }): Promise<PinPeriod> {
    // Deactivate current active pin period
    await supabase.from('pin_periods').update({ is_active: false }).eq('is_active', true)

    const { data, error } = await supabase
      .from('pin_periods')
      .insert({
        ...input,
        is_active: true,
        is_completed: false,
      })
      .select()
      .single()

    if (error) throw error
    return data as PinPeriod
  }

  static async update(id: string, updates: Partial<PinPeriod>): Promise<PinPeriod> {
    const { data, error } = await supabase
      .from('pin_periods')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as PinPeriod
  }

  static async remove(id: string): Promise<void> {
    const { error } = await supabase.from('pin_periods').delete().eq('id', id)
    if (error) throw error
  }

  static async getActive(): Promise<PinPeriod | null> {
    const { data, error } = await supabase
      .from('pin_periods')
      .select('*')
      .eq('is_active', true)
      .single()

    if (error && error.code !== 'PGRST116') return null
    return (data as PinPeriod) || null
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

    const { data, error } = await supabase
      .from('pin_periods')
      .insert(rows)
      .select('id')

    if (error) throw error
    return data?.length || 0
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

    const { data, error } = await supabase
      .from('pin_periods')
      .insert(rows)
      .select('id')

    if (error) throw error
    return data?.length || 0
  }
}


