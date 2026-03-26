import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'
import { getAuthUser, requireWorkspaceAccess } from '@/lib/api/workspaces'
import { z } from 'zod'

const log = createLogger('api:workspaces:comments')
type Params = { params: Promise<{ id: string }> }

const addCommentSchema = z.object({
  content: z.string().min(1).max(2000),
  item_id: z.string().uuid().optional(),
  parent_id: z.string().uuid().optional(),
  guest_name: z.string().max(100).optional(),
})

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const workspace = await requireWorkspaceAccess(id, me)
  if (!workspace) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  const { data, error } = await supabaseAdmin
    .from('workspace_comments')
    .select('id, content, item_id, parent_id, user_id, guest_name, created_at, updated_at')
    .eq('workspace_id', id)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  if (error) {
    log.error('[comments] GET failed', { error: error.message, workspaceId: id })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}

export async function POST(request: Request, { params }: Params) {
  const { id } = await params
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const workspace = await requireWorkspaceAccess(id, me)
  if (!workspace) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  let body: z.infer<typeof addCommentSchema>
  try {
    body = addCommentSchema.parse(await request.json())
  } catch {
    return NextResponse.json({ error: 'Ungültige Daten' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('workspace_comments')
    .insert({
      workspace_id: id,
      organization_id: me.organization_id,
      content: body.content,
      item_id: body.item_id ?? null,
      parent_id: body.parent_id ?? null,
      user_id: me.id,
      guest_name: body.guest_name ?? null,
    })
    .select()
    .single()

  if (error) {
    log.error('[comments] POST failed', { error: error.message, workspaceId: id })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
