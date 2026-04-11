import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthUser, canWriteWorkspace } from '@/lib/api/workspaces'
import { apiError } from '@/lib/api-error'

type Params = { params: Promise<{ id: string; connid: string }> }

export async function DELETE(_req: Request, { params }: Params) {
  const { id, connid } = await params
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const canWrite = await canWriteWorkspace(id, me)
  if (!canWrite) return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })

  const { error } = await supabaseAdmin
    .from('connections')
    .delete()
    .eq('id', connid)
    .eq('workspace_id', id)

  if (error) return apiError(error)
  return new NextResponse(null, { status: 204 })
}
