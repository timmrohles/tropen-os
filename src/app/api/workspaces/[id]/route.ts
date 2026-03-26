import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'
import { validateBody } from '@/lib/validators'
import { getAuthUser, requireWorkspaceAccess, canWriteWorkspace } from '@/lib/api/workspaces'
import { updateWorkspacePlanCSchema } from '@/lib/validators/workspace-plan-c'

const log = createLogger('api:workspaces:[id]')
type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const workspace = await requireWorkspaceAccess(id, me)
  if (!workspace) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  return NextResponse.json({ ...workspace, current_user_id: me.id })
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const canWrite = await canWriteWorkspace(id, me)
  if (!canWrite) return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })

  const { data: body, error: valErr } = await validateBody(request, updateWorkspacePlanCSchema)
  if (valErr) return valErr

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.title !== undefined)       updates.title       = body.title.trim()
  if (body.description !== undefined) updates.description = body.description
  if (body.emoji !== undefined)       updates.emoji       = body.emoji
  if (body.goal !== undefined)        updates.goal        = body.goal.trim()
  if (body.domain !== undefined)      updates.domain      = body.domain.trim()
  if (body.status !== undefined)      updates.status      = body.status
  if (body.archived_at !== undefined) updates.archived_at = body.archived_at
  if (body.meta !== undefined) {
    // Merge meta — never replace (project convention)
    const { data: current } = await supabaseAdmin
      .from('workspaces')
      .select('meta')
      .eq('id', id)
      .maybeSingle()
    updates.meta = { ...(current?.meta ?? {}), ...body.meta }
  }

  const { data, error } = await supabaseAdmin
    .from('workspaces')
    .update(updates)
    .eq('id', id)
    .is('deleted_at', null)
    .select()
    .single()

  if (error) {
    log.error('[workspaces/[id]] PATCH failed', { error: error.message, id })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Mark last export as stale when workspace changes
  await supabaseAdmin
    .from('workspace_exports')
    .update({ is_stale: true })
    .eq('workspace_id', id)
    .eq('status', 'ready')

  return NextResponse.json(data)
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const canWrite = await canWriteWorkspace(id, me)
  if (!canWrite) return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })

  const { data: deleted, error } = await supabaseAdmin
    .from('workspaces')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .is('deleted_at', null)
    .select('id')
    .maybeSingle()

  if (error) {
    log.error('[workspaces/[id]] DELETE failed', { error: error.message, id })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!deleted) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  return new NextResponse(null, { status: 204 })
}
