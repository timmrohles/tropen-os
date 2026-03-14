import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { validateBody } from '@/lib/validators'
import { getAuthUser, canWriteWorkspace } from '@/lib/api/workspaces'
import { createConnectionSchema } from '@/lib/validators/workspace-plan-c'

type Params = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Params) {
  const { id } = await params
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const canWrite = await canWriteWorkspace(id, me)
  if (!canWrite) return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })

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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
