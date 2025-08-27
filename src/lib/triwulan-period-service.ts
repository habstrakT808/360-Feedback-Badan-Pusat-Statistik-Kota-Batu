// src/lib/triwulan-period-service.ts
import { supabase } from '@/lib/supabase'

type TriwulanPeriod = any
type TriwulanMonthlyDef = any

export class TriwulanPeriodService {
  static async list(): Promise<TriwulanPeriod[]> {
    const { data, error } = await supabase
      .from('triwulan_periods' as any)
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data as any[]) || []
  }

  static async getActive(): Promise<TriwulanPeriod | null> {
    const { data, error } = await supabase
      .from('triwulan_periods' as any)
      .select('*')
      .eq('is_active', true)
      .maybeSingle()

    if (error) throw error
    return (data as any) || null
  }

  static async create(input: {
    year: number
    quarter: number
    start_date: string
    end_date: string
  }): Promise<TriwulanPeriod> {
    // Deactivate current active triwulan
    await supabase.from('triwulan_periods' as any).update({ is_active: false }).eq('is_active', true)

    const { data, error } = await supabase
      .from('triwulan_periods' as any)
      .insert({
        ...input,
        is_active: true,
        is_completed: false,
      })
      .select()
      .single()

    if (error) throw error
    return data as any
  }

  static async update(id: string, updates: Partial<TriwulanPeriod>): Promise<TriwulanPeriod> {
    const { data, error } = await supabase
      .from('triwulan_periods' as any)
      .update(updates as any)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as any
  }

  static async remove(id: string): Promise<void> {
    const { error } = await supabase.from('triwulan_periods' as any).delete().eq('id', id)
    if (error) throw error
  }

  static async upsertMonthlyDeficiencies(rows: Array<{
    period_id: string
    user_id: string
    year: number
    month: number
    deficiency_hours: number
    filled_by?: string | null
  }>): Promise<void> {
    const { error } = await (supabase as any)
      .from('triwulan_monthly_deficiencies')
      .upsert(rows, { onConflict: 'period_id,user_id,year,month' })

    if (error) throw error
  }

  static async listMonthlyDeficiencies(periodId: string): Promise<TriwulanMonthlyDef[]> {
    const { data, error } = await supabase
      .from('triwulan_monthly_deficiencies' as any)
      .select('*')
      .eq('period_id', periodId)

    if (error) throw error
    return (data as any[]) || []
  }
}


