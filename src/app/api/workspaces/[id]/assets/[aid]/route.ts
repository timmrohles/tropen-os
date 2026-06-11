import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { withWorkspaceAccess } from '@/lib/auth/route-guards'
import { apiError } from '@/lib/api-error'

export const DELETE = withWorkspaceAccess<{ id: string; aid: string }>(async (_req, { params, workspaceId: id }) => {
  const { aid } = params

  const { error } = await supabaseAdmin
    .from('workspace_assets')
    .delete()
    .eq('id', aid)
    .eq('workspace_id', id)

  if (error) return apiError(error)
  return new NextResponse(null, { status: 204 })
}, { write: true })
