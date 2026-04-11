import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthUser, requireWorkspaceAccess } from '@/lib/api/workspaces'
import { apiError } from '@/lib/api-error'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const workspace = await requireWorkspaceAccess(id, me)
  if (!workspace) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  const { data, error } = await supabaseAdmin
    .from('workspace_exports')
    .select('id, format, status, file_url, is_stale, created_at')
    .eq('workspace_id', id)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return apiError(error)
  return NextResponse.json({ data: data ?? [] })
}
