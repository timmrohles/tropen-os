import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'

const log = createLogger('api:cockpit:artifact-stats')

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .maybeSingle()

    const orgId = profile?.organization_id
    if (!orgId) return NextResponse.json({ thisWeek: 0, total: 0, recent: [] })

    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const [totalRes, weekRes, recentRes] = await Promise.all([
      supabaseAdmin
        .from('artifacts')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId),

      supabaseAdmin
        .from('artifacts')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .gte('created_at', weekAgo.toISOString()),

      supabaseAdmin
        .from('artifacts')
        .select('id, title, type')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(3),
    ])

    return NextResponse.json({
      total: totalRes.count ?? 0,
      thisWeek: weekRes.count ?? 0,
      recent: recentRes.data ?? [],
    })
  } catch (err) {
    log.error('artifact-stats error', { error: String(err) })
    return NextResponse.json({ thisWeek: 0, total: 0, recent: [] })
  }
}
