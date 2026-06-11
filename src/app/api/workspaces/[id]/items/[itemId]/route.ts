import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'
import { withWorkspaceAccess } from '@/lib/auth/route-guards'
import { apiError } from '@/lib/api-error'

const log = createLogger('api:workspaces:items:[itemId]')

export const DELETE = withWorkspaceAccess<{ id: string; itemId: string }>(async (_req, { params, workspaceId: id }) => {
  const { itemId } = params

  const { error } = await supabaseAdmin
    .from('workspace_items')
    .delete()
    .eq('id', itemId)
    .eq('workspace_id', id)

  if (error) {
    log.error('[items/[itemId]] DELETE failed', { error: error.message, itemId })
    return apiError(error)
  }

  return new NextResponse(null, { status: 204 })
}, { write: true })
