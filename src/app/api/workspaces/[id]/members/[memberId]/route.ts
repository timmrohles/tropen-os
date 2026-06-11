import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'
import { withWorkspaceAccess } from '@/lib/auth/route-guards'
import { z } from 'zod'

const log = createLogger('api:workspaces:members:[memberId]')

const updateSchema = z.object({
  role: z.enum(['admin', 'member', 'viewer']),
})

export const PATCH = withWorkspaceAccess<{ id: string; memberId: string }>(async (request, { auth: me, params, workspaceId: id }) => {
  const { memberId } = params

  if (!['owner', 'admin', 'superadmin'].includes(me.role)) {
    return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })
  }

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
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }

  return NextResponse.json(data)
})

export const DELETE = withWorkspaceAccess<{ id: string; memberId: string }>(async (_req, { auth: me, params, workspaceId: id }) => {
  const { memberId } = params

  if (!['owner', 'admin', 'superadmin'].includes(me.role)) {
    return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })
  }

  const { error } = await supabaseAdmin
    .from('workspace_members')
    .delete()
    .eq('id', memberId)
    .eq('workspace_id', id)

  if (error) {
    log.error('[members/[memberId]] DELETE failed', { error: error.message, memberId })
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
})
