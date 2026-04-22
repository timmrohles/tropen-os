import { createLogger } from '@/lib/logger'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse, NextRequest } from 'next/server'
import { parsePaginationParams } from '@/lib/api/pagination'
const log = createLogger('admin/users')

async function getAdminUser() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: me } = await supabase
    .from('users')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  if (!me || !['owner', 'admin', 'superadmin'].includes(me.role)) return null
  return me as { organization_id: string; role: string }
}

export async function GET(request: NextRequest) {
  const me = await getAdminUser()
  if (!me) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const { limit, offset } = parsePaginationParams(searchParams)

  const { data: users, error, count } = await supabaseAdmin
    .from('users')
    .select('id, email, full_name, role, is_active, created_at', { count: 'exact' })
    .eq('organization_id', me.organization_id)
    .order('created_at')
    .range(offset, offset + limit - 1)

  if (error) {
    log.error('GET /api/admin/users failed', { error: error.message })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  return NextResponse.json({ data: users ?? [], total: count ?? 0, limit, offset })
}

export async function POST(request: Request) {
  const me = await getAdminUser()
  if (!me) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })

  let body: { email?: string; role?: string }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Ungültiger Body' }, { status: 400 }) }
  const { email, role } = body
  if (!email || !role)
    return NextResponse.json({ error: 'Email und Rolle erforderlich' }, { status: 400 })

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const { data: inviteData, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: { organization_id: me.organization_id, role },
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
    { id: invitedUserId, organization_id: me.organization_id, email, role },
    { onConflict: 'id' }
  )

  // Create department_members entry for all org departments
  const { data: orgWorkspaces } = await supabaseAdmin
    .from('departments')
    .select('id')
    .eq('organization_id', me.organization_id)

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
}
