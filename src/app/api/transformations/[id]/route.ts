import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { validateBody } from '@/lib/validators'
import { executeTransformationSchema } from '@/lib/validators/transformations'
import { apiError } from '@/lib/api-error'
import { withAuth } from '@/lib/auth/route-guards'

// GET /api/transformations/[id]
export const GET = withAuth<{ id: string }>(async (_req, { params, auth }) => {
  const { id } = params

  const { data, error } = await supabaseAdmin
    .from('transformations')
    .select('*')
    .eq('id', id)
    .eq('created_by', auth.id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
  return NextResponse.json(data)
})

// PATCH /api/transformations/[id] — { action: 'execute' }
export const PATCH = withAuth<{ id: string }>(async (request, { params, auth }) => {
  const { id } = params

  const { data: body, error: valErr } = await validateBody(request, executeTransformationSchema)
  if (valErr) return valErr
  void body // action: 'execute' validated

  // Load transformation
  const { data: tx, error: txErr } = await supabaseAdmin
    .from('transformations')
    .select('*')
    .eq('id', id)
    .eq('created_by', auth.id)
    .single()

  if (txErr || !tx) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
  if (tx.status !== 'pending') {
    return NextResponse.json({ error: 'Transformation ist nicht mehr pending' }, { status: 409 })
  }

  await supabaseAdmin.from('transformations').update({ status: 'in_progress' }).eq('id', id)

  try {
    let targetId: string | null = null
    const meta = (tx.meta ?? {}) as Record<string, unknown>
    const config = (meta.config ?? {}) as Record<string, unknown>

    if (tx.target_type === 'workspace') {
      const { data: src } = await supabaseAdmin
        .from('projects')
        .select('title, goal, department_id')
        .eq('id', tx.source_id)
        .single()

      const { data: ws, error: wsErr } = await supabaseAdmin
        .from('workspaces')
        .insert({
          title:           (meta.title as string | undefined) ?? `${src?.title ?? ''} — Workspace`,
          goal:            (meta.goal as string | undefined) ?? (config.goal as string | undefined) ?? src?.goal ?? null,
          domain:          (config.domain as string | undefined) ?? null,
          department_id:   src?.department_id ?? null,
          organization_id: auth.organization_id,
          created_by:      auth.id,
          status:          'draft',
          meta:            {},
        })
        .select('id')
        .single()

      if (wsErr) throw wsErr
      targetId = ws!.id

      await supabaseAdmin.from('workspace_participants').insert({
        workspace_id: targetId,
        user_id: auth.id,
        role: 'admin',
      })

    } else if (tx.target_type === 'feed') {
      const { data: feed, error: feedErr } = await supabaseAdmin
        .from('feed_sources')
        .insert({
          organization_id: auth.organization_id,
          created_by:      auth.id,
          title:           (meta.title as string | undefined) ?? 'Feed',
          search_query:    (config.search_query as string | undefined) ?? '',
          language:        (config.language as string | undefined) ?? 'de',
          is_active:       false,
          min_score:       60,
        })
        .select('id')
        .single()

      if (feedErr) throw feedErr
      targetId = feed!.id
    }

    await supabaseAdmin
      .from('transformations')
      .update({ status: 'done', target_id: targetId, completed_at: new Date().toISOString() })
      .eq('id', id)

    if (targetId) {
      await supabaseAdmin.from('transformation_links').insert({
        source_type: tx.source_type,
        source_id:   tx.source_id,
        target_type: tx.target_type,
        target_id:   targetId,
        is_active:   true,
      })
    }

    const { data: updated } = await supabaseAdmin
      .from('transformations')
      .select('*')
      .eq('id', id)
      .single()

    return NextResponse.json(updated)
  } catch (err) {
    await supabaseAdmin.from('transformations').update({ status: 'failed' }).eq('id', id)
    return apiError(err)
  }
})
