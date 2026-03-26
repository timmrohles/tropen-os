import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'
import { getAuthUser, requireWorkspaceAccess } from '@/lib/api/workspaces'
import { z } from 'zod'

const log = createLogger('api:workspaces:members:[memberId]')
type Params = { params: Promise<{ id: string; memberId: string }> }

const updateSchema = z.object({
  role: z.enum(['admin', 'member', 'viewer']),
})

export async function PATCH(request: Request, { params }: Params) {
  const { id, memberId } = await params
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  if (!['owner', 'admin', 'superadmin'].includes(me.role)) {
    return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })
  }

  const workspace = await requireWorkspaceAccess(id, me)
  if (!workspace) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  let body: z.infer<typeof updateSchema>
  try {
    body = updateSchema.parse(await request.json())
  } catch {
    return NextResponse.json({ error: 'Ungültige Daten' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('workspace_members')
    .update({ role: body.role })
    .eq('id', memberId)
    .eq('workspace_id', id)
    .select()
    .single()

  if (error) {
    log.error('[members/[memberId]] PATCH failed', { error: error.message, memberId })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id, memberId } = await params
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  if (!['owner', 'admin', 'superadmin'].includes(me.role)) {
    return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })
  }

  const workspace = await requireWorkspaceAccess(id, me)
  if (!workspace) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  const { error } = await supabaseAdmin
    .from('workspace_members')
    .delete()
    .eq('id', memberId)
    .eq('workspace_id', id)

  if (error) {
    log.error('[members/[memberId]] DELETE failed', { error: error.message, memberId })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}
