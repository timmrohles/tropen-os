import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'
import { validateBody } from '@/lib/validators'
import { getAuthUser, canWriteWorkspace, requireWorkspaceAccess } from '@/lib/api/workspaces'
import { createCardSchema } from '@/lib/validators/workspace-plan-c'
import { apiError } from '@/lib/api-error'

const log = createLogger('api:workspaces:cards')
type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const workspace = await requireWorkspaceAccess(id, me)
  if (!workspace) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  const { data, error } = await supabaseAdmin
    .from('cards')
    .select('id, workspace_id, title, description, content_type, role, content, chart_config, status, stale_since, stale_reason, sort_order, meta, created_at, updated_at')
    .eq('workspace_id', id)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true })

  if (error) return apiError(error)
  return NextResponse.json({ data: data ?? [] })
}

export async function POST(request: Request, { params }: Params) {
  const { id } = await params
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const canWrite = await canWriteWorkspace(id, me)
  if (!canWrite) return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })

  const { data: body, error: valErr } = await validateBody(request, createCardSchema)
  if (valErr) return valErr

  const { data: card, error } = await supabaseAdmin
    .from('cards')
    .insert({
      workspace_id: id,
      title: body.title.trim(),
      description: body.description?.trim() ?? null,
      content_type: body.contentType,
      role: body.role,
      content: body.content ?? null,
      chart_config: body.chartConfig ?? null,
      sort_order: body.sortOrder ?? 0,
      meta: body.meta ?? {},
      status: 'draft',
    })
    .select()
    .single()

  if (error) {
    log.error('[cards] POST failed', { error: error.message })
    return apiError(error)
  }

  return NextResponse.json(card, { status: 201 })
}
