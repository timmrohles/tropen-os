import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { validateBody } from '@/lib/validators'
import { getAuthUser, canWriteWorkspace, requireWorkspaceAccess } from '@/lib/api/workspaces'
import { createAssetSchema } from '@/lib/validators/workspace-plan-c'
import { apiError } from '@/lib/api-error'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const workspace = await requireWorkspaceAccess(id, me)
  if (!workspace) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  const { data, error } = await supabaseAdmin
    .from('workspace_assets')
    .select('*')
    .eq('workspace_id', id)
    .order('created_at', { ascending: false })

  if (error) return apiError(error)
  return NextResponse.json({ data: data ?? [] })
}

export async function POST(request: Request, { params }: Params) {
  const { id } = await params
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const canWrite = await canWriteWorkspace(id, me)
  if (!canWrite) return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })

  const { data: body, error: valErr } = await validateBody(request, createAssetSchema)
  if (valErr) return valErr

  const { data, error } = await supabaseAdmin
    .from('workspace_assets')
    .insert({
      workspace_id: id,
      card_id: body.cardId ?? null,
      type: body.type,
      name: body.name.trim(),
      url: body.url,
      size: body.size ?? null,
      meta: body.meta ?? {},
    })
    .select()
    .single()

  if (error) return apiError(error)
  return NextResponse.json(data, { status: 201 })
}
