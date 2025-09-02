import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: Request) {
  try {
    const { id } = await request.json()
    if (!id) return new NextResponse('Missing id', { status: 400 })

    // Load period
    const { data: period, error: fetchError } = await (supabaseAdmin as any)
      .from('pin_periods')
      .select('*')
      .eq('id', id)
      .single()
    if (fetchError || !period) return new NextResponse('Pin period tidak ditemukan', { status: 404 })

    const targetMonth = (period as any).month ?? new Date((period as any).start_date).getMonth() + 1
    const targetYear = (period as any).year ?? new Date((period as any).start_date).getFullYear()

    // Half-open window: [start_date, end_date + 1 day)
    const start = (period as any).start_date
    const endPlusOne = new Date(new Date((period as any).end_date + 'T00:00:00Z').getTime() + 24*60*60*1000)
      .toISOString()
      .slice(0, 10)

    const { count: pinsDeleted, error: pinsError } = await (supabaseAdmin as any)
      .from('employee_pins')
      .delete({ count: 'exact' })
      .gte('created_at', start)
      .lt('created_at', endPlusOne)
    if (pinsError) return new NextResponse('Gagal menghapus data pin', { status: 500 })

    const { count: allowancesReset, error: allowError } = await (supabaseAdmin as any)
      .from('monthly_pin_allowance')
      .update({ pins_remaining: 4, pins_used: 0 })
      .eq('month', targetMonth)
      .eq('year', targetYear)
    if (allowError) return new NextResponse('Gagal mereset allowance', { status: 500 })

    return NextResponse.json({ pins_deleted: pinsDeleted || 0, allowances_reset: allowancesReset || 0 })
  } catch (e: any) {
    return new NextResponse(e?.message || 'Internal error', { status: 500 })
  }
}


