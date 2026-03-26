import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'

const log = createLogger('api:cockpit:projects')

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
    if (!orgId) return NextResponse.json({ projects: [] })

    const { data: projects } = await supabaseAdmin
      .from('projects')
      .select('id, title, emoji, updated_at')
      .eq('organization_id', orgId)
      .is('deleted_at', null)
      .is('archived_at', null)
      .order('updated_at', { ascending: false })
      .limit(4)

    // Get chat counts per project
    const projectIds = (projects ?? []).map(p => p.id)
    const { data: convCounts } = projectIds.length > 0
      ? await supabaseAdmin
          .from('conversations')
          .select('current_project_id')
          .in('current_project_id', projectIds)
      : { data: [] }

    const countMap: Record<string, number> = {}
    for (const c of convCounts ?? []) {
      if (c.current_project_id) {
        countMap[c.current_project_id] = (countMap[c.current_project_id] ?? 0) + 1
      }
    }

    const result = (projects ?? []).map(p => ({
      id: p.id,
      title: p.title,
      emoji: p.emoji ?? null,
      updated_at: p.updated_at,
      chat_count: countMap[p.id] ?? 0,
    }))

    return NextResponse.json({ projects: result })
  } catch (err) {
    log.error('projects error', { error: String(err) })
    return NextResponse.json({ projects: [] })
  }
}
