import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'
import { getAuthUser, canWriteWorkspace } from '@/lib/api/workspaces'
import { apiError } from '@/lib/api-error'

const log = createLogger('api:workspaces:items:[itemId]')
type Params = { params: Promise<{ id: string; itemId: string }> }

export async function DELETE(_req: Request, { params }: Params) {
  const { id, itemId } = await params
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const canWrite = await canWriteWorkspace(id, me)
  if (!canWrite) return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })

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
}
