import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'
import { validateBody } from '@/lib/validators'
import { getAuthUser } from '@/lib/api/workspaces'
import { createWorkspacePlanCSchema } from '@/lib/validators/workspace-plan-c'
import { parsePaginationParams } from '@/lib/api/pagination'

const log = createLogger('api:workspaces')

// GET /api/workspaces — org-level list (department_id optional filter)
export async function GET(request: Request) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const { limit, offset } = parsePaginationParams(searchParams)
  const department_id = searchParams.get('department_id')

  const archived = searchParams.get('archived') === 'true'

  let query = supabaseAdmin
    .from('workspaces')
    .select('id, department_id, organization_id, title, description, emoji, goal, status, item_count, comment_count, archived_at, created_by, created_at, updated_at', { count: 'exact' })
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (archived) {
    query = query.not('archived_at', 'is', null)
  } else {
    query = query.is('archived_at', null)
  }

  if (me.role !== 'superadmin') {
    query = query.eq('organization_id', me.organization_id)
  }

  if (department_id) {
    query = query.eq('department_id', department_id)
  }

  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    log.error('[workspaces] GET failed', { error: error.message })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: data ?? [], total: count ?? 0, limit, offset })
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
      title:          body.title.trim(),
      description:    body.description?.trim() ?? null,
      emoji:          body.emoji?.trim() ?? null,
      goal:           body.goal?.trim() ?? null,
      domain:         body.domain?.trim() ?? 'custom',
      department_id:  body.departmentId ?? null,
      organization_id: me.organization_id,
      created_by:     me.id,
      status:         'draft',
      meta:           body.meta ?? {},
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
