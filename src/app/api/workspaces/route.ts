import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'
import { validateBody } from '@/lib/validators'
import { getAuthUser } from '@/lib/api/workspaces'
import { createWorkspacePlanCSchema } from '@/lib/validators/workspace-plan-c'

const log = createLogger('api:workspaces')

// GET /api/workspaces?department_id=...
export async function GET(request: Request) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const department_id = searchParams.get('department_id')
  if (!department_id) return NextResponse.json({ error: 'department_id fehlt' }, { status: 400 })

  let query = supabaseAdmin
    .from('workspaces')
    .select('id, department_id, organization_id, title, goal, domain, status, created_by, created_at, updated_at', { count: 'exact' })
    .eq('department_id', department_id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (me.role !== 'superadmin') {
    const { data: participantRows } = await supabaseAdmin
      .from('workspace_participants')
      .select('workspace_id')
      .eq('user_id', me.id)
    const ids = (participantRows ?? []).map((r: Record<string, unknown>) => r.workspace_id as string)
    if (ids.length === 0) return NextResponse.json({ data: [], total: 0 })
    query = query.in('id', ids)
  }

  const { data, error, count } = await query

  if (error) {
    log.error('[workspaces] GET failed', { error: error.message })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: data ?? [], total: count ?? 0 })
}

// POST /api/workspaces
export async function POST(request: Request) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const { data: body, error: valErr } = await validateBody(request, createWorkspacePlanCSchema)
  if (valErr) return valErr

  const { data: workspace, error } = await supabaseAdmin
    .from('workspaces')
    .insert({
      title: body.title.trim(),
      goal: body.goal?.trim() ?? null,
      domain: body.domain?.trim() ?? null,
      department_id: body.departmentId ?? null,
      organization_id: me.organization_id,
      created_by: me.id,
      status: 'draft',
      meta: body.meta ?? {},
    })
    .select()
    .single()

  if (error) {
    log.error('[workspaces] POST insert failed', { error: error.message })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Auto-add creator as admin participant
  const { error: participantErr } = await supabaseAdmin
    .from('workspace_participants')
    .insert({ workspace_id: workspace.id, user_id: me.id, role: 'admin' })
  if (participantErr) {
    log.error('[workspaces] participant insert failed', { error: participantErr.message })
  }

  return NextResponse.json(workspace, { status: 201 })
}
