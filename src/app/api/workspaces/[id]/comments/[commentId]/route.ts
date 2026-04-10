import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'
import { getAuthUser, requireWorkspaceAccess } from '@/lib/api/workspaces'
import { apiError } from '@/lib/api-error'

const log = createLogger('api:workspaces:comments:[commentId]')
type Params = { params: Promise<{ id: string; commentId: string }> }

export async function DELETE(_req: Request, { params }: Params) {
  const { id, commentId } = await params
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const workspace = await requireWorkspaceAccess(id, me)
  if (!workspace) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

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
}
