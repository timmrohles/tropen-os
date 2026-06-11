import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'
import { validateBody } from '@/lib/validators'
import { withWorkspaceAccess } from '@/lib/auth/route-guards'
import { updateWorkspacePlanCSchema } from '@/lib/validators/workspace-plan-c'
import { apiError } from '@/lib/api-error'

const log = createLogger('api:workspaces:[id]')

export const GET = withWorkspaceAccess<{ id: string }>(async (_req, { auth: me, workspaceId }) => {
  // requireWorkspaceAccess lieferte zusätzlich die Workspace-Zeile — nach
  // bestandenem Guard hier eigenständig nachladen (gleiche Query wie zuvor).
  const { data: workspace } = await supabaseAdmin
    .from('workspaces')
    .select('*')
    .eq('id', workspaceId)
    .is('deleted_at', null)
    .maybeSingle()
  if (!workspace) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  return NextResponse.json({ ...workspace, current_user_id: me.id })
})

export const PATCH = withWorkspaceAccess<{ id: string }>(async (request, { workspaceId: id }) => {
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
    return apiError(error)
  }

  // Mark last export as stale when workspace changes
  await supabaseAdmin
    .from('workspace_exports')
    .update({ is_stale: true })
    .eq('workspace_id', id)
    .eq('status', 'ready')

  return NextResponse.json(data)
}, { write: true })

export const DELETE = withWorkspaceAccess<{ id: string }>(async (_req, { workspaceId: id }) => {
  const { data: deleted, error } = await supabaseAdmin
    .from('workspaces')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .is('deleted_at', null)
    .select('id')
    .maybeSingle()

  if (error) {
    log.error('[workspaces/[id]] DELETE failed', { error: error.message, id })
    return apiError(error)
  }
  if (!deleted) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  return new NextResponse(null, { status: 204 })
}, { write: true })
