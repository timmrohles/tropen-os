import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthUser, requireWorkspaceAccess } from '@/lib/api/workspaces'
import { createLogger } from '@/lib/logger'

const log = createLogger('api:workspaces:copy')
type Params = { params: Promise<{ id: string }> }

export async function POST(_req: Request, { params }: Params) {
  const { id } = await params
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const ws = await requireWorkspaceAccess(id, me)
  if (!ws) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  // Create workspace copy
  const { data: copy, error: wsErr } = await supabaseAdmin
    .from('workspaces')
    .insert({
      title: `${ws.title} (Kopie)`,
      domain: ws.domain ?? 'custom',
      goal: ws.goal ?? null,
      meta: ws.meta ?? null,
      department_id: ws.departmentId ?? null,
      status: 'draft',
      created_by: me.id,
    })
    .select('id, title')
    .single()

  if (wsErr || !copy) {
    return NextResponse.json({ error: wsErr?.message ?? 'Fehler beim Kopieren' }, { status: 500 })
  }

  // Add creator as participant
  await supabaseAdmin.from('workspace_participants').insert({
    workspace_id: copy.id,
    user_id: me.id,
    role: 'admin',
  })

  // Copy cards (without history)
  const { data: cards } = await supabaseAdmin
    .from('cards')
    .select()
    .eq('workspace_id', id)
    .is('deleted_at', null)
    .neq('status', 'archived')

  if (cards && cards.length > 0) {
    await supabaseAdmin.from('cards').insert(
      cards.map(({ id: _id, created_at: _ca, updated_at: _ua, ...card }) => ({
        ...card,
        workspace_id: copy.id,
        status: 'draft',
        created_by: me.id,
      }))
    )
  }

  return NextResponse.json(copy, { status: 201 })
}
