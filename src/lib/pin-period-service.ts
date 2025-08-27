// src/lib/pin-period-service.ts
import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/database.types'

type PinPeriod = Database['public']['Tables']['pin_periods']['Row']

export class PinPeriodService {
  static async list(): Promise<PinPeriod[]> {
    const { data, error } = await supabase
      .from('pin_periods')
      .select('*')
      .order('created_at', { ascending: false })

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
}


