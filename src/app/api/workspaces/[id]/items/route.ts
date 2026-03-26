import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'
import { getAuthUser, requireWorkspaceAccess, canWriteWorkspace } from '@/lib/api/workspaces'
import { z } from 'zod'

const log = createLogger('api:workspaces:items')
type Params = { params: Promise<{ id: string }> }

const addItemSchema = z.object({
  item_type: z.enum(['conversation', 'artifact', 'project', 'feed_source', 'agent']),
  item_id: z.string().uuid().optional(),
  title: z.string().min(1).max(255),
  description: z.string().max(500).optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
})

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const workspace = await requireWorkspaceAccess(id, me)
  if (!workspace) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  const { data, error } = await supabaseAdmin
    .from('workspace_items')
    .select('id, item_type, item_id, title, description, meta, added_by, created_at')
    .eq('workspace_id', id)
    .order('created_at', { ascending: false })

  if (error) {
    log.error('[items] GET failed', { error: error.message, workspaceId: id })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}

export async function POST(request: Request, { params }: Params) {
  const { id } = await params
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const canWrite = await canWriteWorkspace(id, me)
  if (!canWrite) return NextResponse.json({ error: 'Kein Schreibzugriff' }, { status: 403 })

  let body: z.infer<typeof addItemSchema>
  try {
    body = addItemSchema.parse(await request.json())
  } catch {
    return NextResponse.json({ error: 'Ungültige Daten' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('workspace_items')
    .insert({
      workspace_id: id,
      organization_id: me.organization_id,
      item_type: body.item_type,
      item_id: body.item_id ?? null,
      title: body.title,
      description: body.description ?? null,
      meta: body.meta ?? {},
      added_by: me.id,
    })
    .select()
    .single()

  if (error) {
    log.error('[items] POST failed', { error: error.message, workspaceId: id })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
