import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'
import { withWorkspaceAccess } from '@/lib/auth/route-guards'
import { z } from 'zod'
import { apiError } from '@/lib/api-error'

const log = createLogger('api:workspaces:members')

const inviteSchema = z.object({
  user_id: z.string().uuid().optional(),
  email: z.string().email().optional(),
  role: z.enum(['admin', 'member', 'viewer']).default('viewer'),
})

export const GET = withWorkspaceAccess<{ id: string }>(async (_req, { workspaceId: id }) => {
  const { data, error } = await supabaseAdmin
    .from('workspace_members')
    .select('id, user_id, email, role, status, invited_by, created_at, joined_at')
    .eq('workspace_id', id)
    .order('created_at', { ascending: true })

  if (error) {
    log.error('[members] GET failed', { error: error.message, workspaceId: id })
    return apiError(error)
  }

  const rows = data ?? []

  // Enrich with full_name from users table
  const userIds = rows.map(r => r.user_id).filter(Boolean) as string[]
  let nameMap: Record<string, string> = {}
  if (userIds.length > 0) {
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id, full_name')
      .in('id', userIds)
    if (users) {
      nameMap = Object.fromEntries(users.map(u => [u.id, u.full_name ?? '']))
    }
  }

  return NextResponse.json(rows.map(r => ({
    ...r,
    full_name: r.user_id ? (nameMap[r.user_id] || null) : null,
  })))
})

export const POST = withWorkspaceAccess<{ id: string }>(async (request, { auth: me, workspaceId: id }) => {
  // Only org admins/owners can invite members
  if (!['owner', 'admin', 'superadmin'].includes(me.role)) {
    return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })
  }

  let body: z.infer<typeof inviteSchema>
  try {
    body = inviteSchema.parse(await request.json())
  } catch {
    return NextResponse.json({ error: 'Ungültige Daten' }, { status: 400 })
  }

  if (!body.user_id && !body.email) {
    return NextResponse.json({ error: 'user_id oder email erforderlich' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('workspace_members')
    .upsert({
      workspace_id: id,
      organization_id: me.organization_id,
      user_id: body.user_id ?? null,
      email: body.email ?? null,
      role: body.role,
      status: body.user_id ? 'active' : 'pending',
      invited_by: me.id,
      joined_at: body.user_id ? new Date().toISOString() : null,
    }, { onConflict: 'workspace_id,user_id' })
    .select()
    .single()

  if (error) {
    log.error('[members] POST failed', { error: error.message, workspaceId: id })
    return apiError(error)
  }

  return NextResponse.json(data, { status: 201 })
})
