// GET /api/workspaces/[id]/picker?type=conversation|artifact|project|feed_source|agent&q=...
// Returns searchable items for the workspace "add item" picker.
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthUser } from '@/lib/api/workspaces'

type Params = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  await params // id/workspaceId unused but params must be awaited
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const q = searchParams.get('q')?.trim() ?? ''

  const like = q ? `%${q}%` : '%'

  if (type === 'conversation') {
    const { data } = await supabaseAdmin
      .from('conversations')
      .select('id, title, created_at')
      .eq('user_id', me.id)
      .eq('conversation_type', 'chat')
      .is('deleted_at', null)
      .ilike('title', like)
      .order('created_at', { ascending: false })
      .limit(30)
    return NextResponse.json(
      (data ?? []).map(r => ({ id: r.id, title: r.title ?? 'Unbenannter Chat', subtitle: new Date(r.created_at).toLocaleDateString('de-DE') }))
    )
  }

  if (type === 'artifact') {
    const { data } = await supabaseAdmin
      .from('artifacts')
      .select('id, name, type, created_at')
      .eq('organization_id', me.organization_id)
      .ilike('name', like)
      .order('created_at', { ascending: false })
      .limit(30)
    return NextResponse.json(
      (data ?? []).map(r => ({ id: r.id, title: r.name, subtitle: r.type }))
    )
  }

  if (type === 'project') {
    // projects links via department_id → departments.organization_id (no direct org column)
    const { data: depts } = await supabaseAdmin
      .from('departments')
      .select('id')
      .eq('organization_id', me.organization_id)
    const deptIds = (depts ?? []).map(d => d.id)
    if (deptIds.length === 0) return NextResponse.json([])
    const { data } = await supabaseAdmin
      .from('projects')
      .select('id, title, emoji, created_at')
      .in('department_id', deptIds)
      .is('deleted_at', null)
      .ilike('title', like)
      .order('created_at', { ascending: false })
      .limit(30)
    return NextResponse.json(
      (data ?? []).map(r => ({ id: r.id, title: r.title, subtitle: 'Projekt' }))
    )
  }

  if (type === 'feed_source') {
    const { data } = await supabaseAdmin
      .from('feed_sources')
      .select('id, name, url, created_at')
      .eq('organization_id', me.organization_id)
      .neq('status', 'archived')
      .ilike('name', like)
      .order('created_at', { ascending: false })
      .limit(30)
    return NextResponse.json(
      (data ?? []).map(r => ({ id: r.id, title: r.name, subtitle: r.url ?? 'Feed' }))
    )
  }

  if (type === 'agent') {
    const { data } = await supabaseAdmin
      .from('agents')
      .select('id, name, description, created_at')
      .eq('organization_id', me.organization_id)
      .is('deleted_at', null)
      .eq('is_active', true)
      .ilike('name', like)
      .order('display_order', { ascending: true })
      .limit(30)
    return NextResponse.json(
      (data ?? []).map(r => ({ id: r.id, title: r.name, subtitle: r.description ?? 'Agent' }))
    )
  }

  return NextResponse.json({ error: 'Unbekannter Typ' }, { status: 400 })
}
