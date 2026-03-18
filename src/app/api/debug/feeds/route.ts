import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthUser } from '@/lib/api/projects'

// POST /api/debug/feeds — hard-delete all deleted feed_items so feed-fetch can re-insert them
export async function POST() {
  const { error, count } = await supabaseAdmin
    .from('feed_items')
    .delete({ count: 'exact' })
    .eq('status', 'deleted')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ purged: count })
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { count: totalInDB } = await supabaseAdmin
    .from('feed_items').select('id', { count: 'exact' })

  const { count: totalNotDeleted } = await supabaseAdmin
    .from('feed_items').select('id', { count: 'exact' }).neq('status', 'deleted')

  const { count: totalDeleted } = await supabaseAdmin
    .from('feed_items').select('id', { count: 'exact' }).eq('status', 'deleted')

  // Status breakdown
  const { data: statusRows } = await supabaseAdmin
    .from('feed_items').select('status')
  const statusCounts: Record<string, number> = {}
  for (const row of statusRows ?? []) {
    const s = (row as { status: string | null }).status ?? 'null'
    statusCounts[s] = (statusCounts[s] ?? 0) + 1
  }

  // getAuthUser (used by listFeedItems server action)
  const me = await getAuthUser()

  // What does THIS user see via RLS?
  const { count: visibleCount } = await supabase
    .from('feed_items').select('id', { count: 'exact' }).neq('status', 'deleted')

  // What does server action see (admin + org filter)?
  const { count: serverActionCount } = me
    ? await supabaseAdmin
        .from('feed_items').select('id', { count: 'exact' })
        .eq('organization_id', me.organization_id)
        .neq('status', 'deleted')
    : { count: null }

  const { data: profile } = user
    ? await supabaseAdmin.from('users').select('organization_id, role').eq('id', user.id).maybeSingle()
    : { data: null }

  return NextResponse.json({
    loggedInAs: user?.email ?? null,
    userOrgId: profile?.organization_id ?? null,
    userRole: profile?.role ?? null,
    getAuthUserResult: me ? { orgId: me.organization_id, role: me.role } : null,
    totalItemsInDB: totalInDB,
    totalNotDeleted,
    totalDeleted,
    statusBreakdown: statusCounts,
    itemsVisibleToUserViaRLS: visibleCount,
    itemsVisibleViaServerAction: serverActionCount,
  })
}
