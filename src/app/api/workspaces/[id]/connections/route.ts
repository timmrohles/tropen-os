import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { validateBody } from '@/lib/validators'
import { withWorkspaceAccess } from '@/lib/auth/route-guards'
import { createConnectionSchema } from '@/lib/validators/workspace-plan-c'
import { apiError } from '@/lib/api-error'

export const POST = withWorkspaceAccess<{ id: string }>(async (request, { workspaceId: id }) => {
  const { data: body, error: valErr } = await validateBody(request, createConnectionSchema)
  if (valErr) return valErr

  // Verify both cards belong to this workspace
  const { data: cards } = await supabaseAdmin
    .from('cards')
    .select('id')
    .eq('workspace_id', id)
    .is('deleted_at', null)
    .in('id', [body.sourceCardId, body.targetCardId])

  if (!cards || cards.length < 2)
    return NextResponse.json({ error: 'Karten nicht gefunden oder gehören nicht zu diesem Workspace' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('connections')
    .insert({
      workspace_id: id,
      source_card_id: body.sourceCardId,
      target_card_id: body.targetCardId,
      label: body.label ?? null,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505')
      return NextResponse.json({ error: 'Verbindung existiert bereits' }, { status: 409 })
    return apiError(error)
  }
  return NextResponse.json(data, { status: 201 })
}, { write: true })
