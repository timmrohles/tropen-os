import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'

const log = createLogger('api:cockpit:team-activity')

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .maybeSingle()

    const orgId = profile?.organization_id
    const role = profile?.role ?? ''
    if (!['admin', 'owner', 'superadmin'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (!orgId) return NextResponse.json({ items: [] })

    const twoDaysAgo = new Date()
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

    const [convsRes, artifactsRes] = await Promise.all([
      supabaseAdmin
        .from('conversations')
        .select('id, created_by, created_at, users!conversations_created_by_fkey(email, raw_user_meta_data)')
        .eq('organization_id', orgId)
        .gte('created_at', twoDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(4),

      supabaseAdmin
        .from('artifacts')
        .select('id, created_by, created_at, users!artifacts_created_by_fkey(email, raw_user_meta_data)')
        .eq('organization_id', orgId)
        .gte('created_at', twoDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(4),
    ])

    function userName(u: unknown): string {
      const userObj = u as { raw_user_meta_data?: { full_name?: string }; email?: string } | null
      return userObj?.raw_user_meta_data?.full_name ?? userObj?.email ?? 'Unbekannt'
    }

    const items = [
      ...(convsRes.data ?? []).map(c => ({
        id: c.id,
        user_name: userName(c.users),
        action: 'Chat gestartet',
        created_at: c.created_at,
      })),
      ...(artifactsRes.data ?? []).map(a => ({
        id: a.id,
        user_name: userName(a.users),
        action: 'Artefakt erstellt',
        created_at: a.created_at,
      })),
    ]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 6)

    return NextResponse.json({ items })
  } catch (err) {
    log.error('team-activity error', { error: String(err) })
    return NextResponse.json({ items: [] })
  }
}
