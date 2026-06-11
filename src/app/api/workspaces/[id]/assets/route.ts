import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { validateBody } from '@/lib/validators'
import { withWorkspaceAccess } from '@/lib/auth/route-guards'
import { createAssetSchema } from '@/lib/validators/workspace-plan-c'
import { apiError } from '@/lib/api-error'
import { WORKSPACE_ASSET_FIELDS } from '@/lib/db/fields'

export const GET = withWorkspaceAccess<{ id: string }>(async (_req, { workspaceId: id }) => {
  const { data, error } = await supabaseAdmin
    .from('workspace_assets')
    .select(WORKSPACE_ASSET_FIELDS)
    .eq('workspace_id', id)
    .order('created_at', { ascending: false })

  if (error) return apiError(error)
  return NextResponse.json({ data: data ?? [] })
})

export const POST = withWorkspaceAccess<{ id: string }>(async (request, { workspaceId: id }) => {
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
    .select(WORKSPACE_ASSET_FIELDS)
    .single()

  if (error) return apiError(error)
  return NextResponse.json(data, { status: 201 })
}, { write: true })
