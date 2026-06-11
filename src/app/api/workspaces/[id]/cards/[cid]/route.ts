import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'
import { validateBody } from '@/lib/validators'
import { withWorkspaceAccess } from '@/lib/auth/route-guards'
import { updateCardSchema } from '@/lib/validators/workspace-plan-c'
import { writeCardSnapshot } from '@/lib/card-history'
import { markDirectDepsStale } from '@/lib/stale-propagation'
import { apiError } from '@/lib/api-error'
import { CARD_FIELDS } from '@/lib/db/fields'
const log = createLogger('api:workspaces:cards:[cid]')

export const PATCH = withWorkspaceAccess<{ id: string; cid: string }>(async (request, { auth: me, params, workspaceId: id }) => {
  const { cid } = params

  const { data: body, error: valErr } = await validateBody(request, updateCardSchema)
  if (valErr) return valErr

  // 1. Load current card for snapshot
  const { data: current, error: fetchErr } = await supabaseAdmin
    .from('cards')
    .select(CARD_FIELDS)
    .eq('id', cid)
    .eq('workspace_id', id)
    .is('deleted_at', null)
    .maybeSingle()

  if (fetchErr || !current) return NextResponse.json({ error: 'Karte nicht gefunden' }, { status: 404 })

  // 2. Write history snapshot (APPEND ONLY)
  // Cast the Plan C DB row to Card so writeCardSnapshot can store it as JSON.
  // The snapshot value is stored as jsonb, so the raw row data is preserved correctly.
  try {
    await writeCardSnapshot(
      current as Record<string, unknown>,
      body.changeReason ?? 'Karte aktualisiert',
      me.id,
    )
  } catch (err) {
    log.error('[cards/[cid]] snapshot failed', { error: String(err) })
    // Non-fatal — continue with update
  }

  // 3. Apply updates
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.title !== undefined) updates.title = body.title.trim()
  if (body.description !== undefined) updates.description = body.description.trim()
  if (body.contentType !== undefined) updates.content_type = body.contentType
  if (body.role !== undefined) updates.role = body.role
  if (body.content !== undefined) updates.content = body.content
  if (body.chartConfig !== undefined) updates.chart_config = body.chartConfig
  if (body.status !== undefined) updates.status = body.status
  if (body.sortOrder !== undefined) updates.sort_order = body.sortOrder
  if (body.meta !== undefined) updates.meta = { ...(current.meta ?? {}), ...body.meta }

  const { data: updated, error: updateErr } = await supabaseAdmin
    .from('cards')
    .update(updates)
    .eq('id', cid)
    .eq('workspace_id', id)
    .select(CARD_FIELDS)
    .single()

  if (updateErr) {
    log.error('[cards/[cid]] PATCH failed', { error: updateErr.message })
    return apiError(updateErr)
  }

  // 4. Stale propagation — non-blocking fire-and-forget
  const cardTitle = (updates.title ?? current.title) as string
  markDirectDepsStale(id, cid, `Karte "${cardTitle}" wurde geändert`).catch((err) => {
    log.error('[cards/[cid]] stale propagation failed', { error: String(err) })
  })

  return NextResponse.json(updated)
}, { write: true })

export const DELETE = withWorkspaceAccess<{ id: string; cid: string }>(async (_req, { params, workspaceId: id }) => {
  const { cid } = params

  const { error } = await supabaseAdmin
    .from('cards')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', cid)
    .eq('workspace_id', id)

  if (error) return apiError(error)
  return new NextResponse(null, { status: 204 })
}, { write: true })
