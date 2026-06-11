import { createLogger } from '@/lib/logger'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isAssignableRole } from '@/lib/roles'
import { NextResponse, NextRequest } from 'next/server'
import { parsePaginationParams } from '@/lib/api/pagination'
import { withOrgAdmin } from '@/lib/auth/route-guards'
const log = createLogger('admin/users')

export const GET = withOrgAdmin(async (request: NextRequest, { auth }) => {
  const { searchParams } = new URL(request.url)
  const { limit, offset } = parsePaginationParams(searchParams)

  const { data: users, error, count } = await supabaseAdmin
    .from('users')
    .select('id, email, full_name, role, is_active, created_at', { count: 'exact' })
    .eq('organization_id', auth.organization_id)
    .order('created_at')
    .range(offset, offset + limit - 1)

  if (error) {
    log.error('GET /api/admin/users failed', { error: error.message })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  return NextResponse.json({ data: users ?? [], total: count ?? 0, limit, offset })
})

export const POST = withOrgAdmin(async (request: NextRequest, { auth }) => {
  let body: { email?: string; role?: string }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Ungültiger Body' }, { status: 400 }) }
  const { email, role } = body
  if (!email || !role)
    return NextResponse.json({ error: 'Email und Rolle erforderlich' }, { status: 400 })

  if (!isAssignableRole(role))
    return NextResponse.json({ error: `Ungültige Rolle: ${role}. Erlaubt: owner, admin, member, viewer` }, { status: 400 })

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const { data: inviteData, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: { organization_id: auth.organization_id, role },
    redirectTo: `${siteUrl}/auth/callback`
  })

  if (error) {
    log.error('Invite Error:', error)
    return NextResponse.json({ error: 'Einladung fehlgeschlagen' }, { status: 400 })
  }

  // Pre-create the user profile so workspace_members FK can be satisfied immediately.
  // onboarding/complete will upsert and fill in full_name + preferences later.
  const invitedUserId = inviteData.user.id
  await supabaseAdmin.from('users').upsert(
    { id: invitedUserId, organization_id: auth.organization_id, email, role },
    { onConflict: 'id' }
  )

  // Create department_members entry for all org departments
  const { data: orgWorkspaces } = await supabaseAdmin
    .from('departments')
    .select('id')
    .eq('organization_id', auth.organization_id)

  if (orgWorkspaces?.length) {
    const wsRole = role === 'viewer' ? 'viewer' : role === 'member' ? 'member' : 'admin'
    const { error: wsErr } = await supabaseAdmin
      .from('department_members')
      .upsert(
        orgWorkspaces.map((ws) => ({ workspace_id: ws.id, user_id: invitedUserId, role: wsRole })),
        { onConflict: 'workspace_id,user_id' }
      )
    if (wsErr) {
      log.error('department_members upsert error:', wsErr)
    }
  }

  return NextResponse.json({ success: true })
})
