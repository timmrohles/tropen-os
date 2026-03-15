import { createLogger } from '@/lib/logger'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'
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

export async function GET() {
  const me = await getAdminUser()
  if (!me) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })

  const { data: users } = await supabaseAdmin
    .from('users')
    .select('id, email, full_name, role, is_active, created_at')
    .eq('organization_id', me.organization_id)
    .order('created_at')

  return NextResponse.json(users ?? [])
}

export async function POST(request: Request) {
  const me = await getAdminUser()
  if (!me) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })

  const { email, role } = await request.json()
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
