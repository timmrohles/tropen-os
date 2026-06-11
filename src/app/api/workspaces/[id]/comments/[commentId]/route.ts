import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'
import { withWorkspaceAccess } from '@/lib/auth/route-guards'
import { apiError } from '@/lib/api-error'

const log = createLogger('api:workspaces:comments:[commentId]')

export const DELETE = withWorkspaceAccess<{ id: string; commentId: string }>(async (_req, { auth: me, params, workspaceId: id }) => {
  const { commentId } = params

  // Soft delete — only own comments; admins/owners can delete any
  const isAdmin = ['owner', 'admin', 'superadmin'].includes(me.role)
  let query = supabaseAdmin
    .from('workspace_comments')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', commentId)
    .eq('workspace_id', id)
  if (!isAdmin) query = query.eq('user_id', me.id)

  const { error } = await query

  if (error) {
    log.error('[comments/[commentId]] DELETE failed', { error: error.message, commentId })
    return apiError(error)
  }

  return new NextResponse(null, { status: 204 })
})
