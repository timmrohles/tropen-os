import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { withWorkspaceAccess } from '@/lib/auth/route-guards'
import { apiError } from '@/lib/api-error'

export const DELETE = withWorkspaceAccess<{ id: string; connid: string }>(async (_req, { params, workspaceId: id }) => {
  const { connid } = params

  const { error } = await supabaseAdmin
    .from('connections')
    .delete()
    .eq('id', connid)
    .eq('workspace_id', id)

  if (error) return apiError(error)
  return new NextResponse(null, { status: 204 })
}, { write: true })
