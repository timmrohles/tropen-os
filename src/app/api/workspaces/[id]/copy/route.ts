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

  const { data: copy, error: wsErr } = await supabaseAdmin
    .from('workspaces')
    .insert({
      title:          `${(ws as unknown as { title: string }).title} (Kopie)`,
      description:    (ws as unknown as { description: string | null }).description ?? null,
      emoji:          (ws as unknown as { emoji: string | null }).emoji ?? null,
      organization_id: me.organization_id,
      created_by:     me.id,
      status:         'draft',
      meta:           (ws as unknown as { meta: Record<string, unknown> | null }).meta ?? {},
    })
    .select('id, title, description, emoji, status, item_count, comment_count, created_at')
    .single()

  if (wsErr || !copy) {
    log.error('[copy] workspace insert failed', { error: wsErr?.message })
    return NextResponse.json({ error: wsErr?.message ?? 'Fehler beim Kopieren' }, { status: 500 })
  }

  // Add creator as participant
  await supabaseAdmin.from('workspace_participants').insert({
    workspace_id: copy.id, user_id: me.id, role: 'admin',
  }).then()

  // Copy workspace_items (without id/created_at — new rows)
  const { data: items } = await supabaseAdmin
    .from('workspace_items')
    .select('item_type, item_id, title, description, meta')
    .eq('workspace_id', id)

  if (items && items.length > 0) {
    await supabaseAdmin.from('workspace_items').insert(
      items.map(item => ({
        ...item,
        workspace_id: copy.id,
        organization_id: me.organization_id,
        added_by: me.id,
      }))
    )
  }

  return NextResponse.json({ ...copy, item_count: items?.length ?? 0 }, { status: 201 })
}
