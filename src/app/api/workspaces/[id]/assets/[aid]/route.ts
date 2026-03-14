import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthUser, canWriteWorkspace } from '@/lib/api/workspaces'

type Params = { params: Promise<{ id: string; aid: string }> }

export async function DELETE(_req: Request, { params }: Params) {
  const { aid, id } = await params
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const canWrite = await canWriteWorkspace(id, me)
  if (!canWrite) return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })

  const { error } = await supabaseAdmin
    .from('workspace_assets')
    .delete()
    .eq('id', aid)
    .eq('workspace_id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
