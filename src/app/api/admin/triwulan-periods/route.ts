import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { RolesService } from '@/lib/roles-service'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { adminIds, supervisorIds } = await RolesService.getRoleUserIds()
    if (!adminIds.includes(user.id) && !supervisorIds.includes(user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('triwulan_periods')
      .select('*')
      .order('year', { ascending: false })
      .order('quarter', { ascending: false })

    if (error) return NextResponse.json({ error: 'Failed to fetch triwulan periods' }, { status: 500 })
    return NextResponse.json({ data: data || [] })
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


