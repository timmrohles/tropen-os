import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'
import { validateBody } from '@/lib/validators'
import { getAuthUser, canWriteWorkspace } from '@/lib/api/workspaces'
import { updateCardSchema } from '@/lib/validators/workspace-plan-c'
import { writeCardSnapshot } from '@/lib/card-history'
import { markDirectDepsStale } from '@/lib/stale-propagation'
import type { Card } from '@/db/schema'

const log = createLogger('api:workspaces:cards:[cid]')
type Params = { params: Promise<{ id: string; cid: string }> }

export async function PATCH(request: Request, { params }: Params) {
  const { id, cid } = await params
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const canWrite = await canWriteWorkspace(id, me)
  if (!canWrite) return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })

  const { data: body, error: valErr } = await validateBody(request, updateCardSchema)
  if (valErr) return valErr

  // 1. Load current card for snapshot
  const { data: current, error: fetchErr } = await supabaseAdmin
    .from('cards')
    .select('*')
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
      current as unknown as Card,
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
  if (body.meta !== undefined) updates.meta = body.meta

  const { data: updated, error: updateErr } = await supabaseAdmin
    .from('cards')
    .update(updates)
    .eq('id', cid)
    .select()
    .single()

  if (updateErr) {
    log.error('[cards/[cid]] PATCH failed', { error: updateErr.message })
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  // 4. Stale propagation — non-blocking fire-and-forget
  const cardTitle = (updates.title ?? current.title) as string
  markDirectDepsStale(id, cid, `Karte "${cardTitle}" wurde geändert`).catch((err) => {
    log.error('[cards/[cid]] stale propagation failed', { error: String(err) })
  })

  return NextResponse.json(updated)
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id, cid } = await params
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const canWrite = await canWriteWorkspace(id, me)
  if (!canWrite) return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })

  const { error } = await supabaseAdmin
    .from('cards')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', cid)
    .eq('workspace_id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
