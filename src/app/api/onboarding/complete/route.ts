import { createLogger } from '@/lib/logger'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isAssignableRole } from '@/lib/roles'
import { NextResponse } from 'next/server'
const log = createLogger('onboarding')

interface CompleteBody {
  full_name: string
  chat_style: 'clear' | 'structured' | 'detailed'
  model_preference: 'cheapest' | 'eu_only' | 'auto'
  ai_act_acknowledged?: boolean
  ai_act_acknowledged_at?: string
  // Org-Settings (nur Owner/Admin)
  org_name?: string
  logo_url?: string | null
  primary_color?: string
  guide_name?: string
  invite_emails?: string[]
}

async function resolveOrganizationId(
  userId: string,
  metaOrgId: string | undefined
): Promise<{ organizationId: string; role: string } | null> {
  if (metaOrgId) return null // caller handles it; only used when missing

  const { data } = await supabaseAdmin
    .from('users')
    .select('organization_id, role')
    .eq('id', userId)
    .maybeSingle()

  if (!data?.organization_id) return null
  return { organizationId: data.organization_id, role: data.role ?? 'member' }
}

async function upsertUserProfile(userId: string, organizationId: string, email: string, fullName: string, role: string) {
  return supabaseAdmin.from('users').upsert(
    { id: userId, organization_id: organizationId, email, full_name: fullName, role },
    { onConflict: 'id' }
  )
}

async function ensureWorkspaceMembership(organizationId: string, userId: string, role: string) {
  const { data: orgWorkspaces } = await supabaseAdmin
    .from('departments')
    .select('id')
    .eq('organization_id', organizationId)

  if (!orgWorkspaces?.length) return

  const wsRole = role === 'viewer' ? 'viewer' : role === 'member' ? 'member' : 'admin'
  await supabaseAdmin
    .from('department_members')
    .upsert(
      orgWorkspaces.map((ws) => ({ workspace_id: ws.id, user_id: userId, role: wsRole })),
      { onConflict: 'workspace_id,user_id' }
    )
}

async function upsertUserPreferences(userId: string, body: CompleteBody) {
  return supabaseAdmin.from('user_preferences').upsert(
    {
      user_id: userId,
      chat_style: body.chat_style ?? 'structured',
      model_preference: body.model_preference ?? 'auto',
      onboarding_completed: true,
      ai_act_acknowledged: body.ai_act_acknowledged ?? false,
      ai_act_acknowledged_at: body.ai_act_acknowledged
        ? (body.ai_act_acknowledged_at ?? new Date().toISOString())
        : null,
    },
    { onConflict: 'user_id' }
  )
}

async function upsertOrgSettings(organizationId: string, body: CompleteBody) {
  const { error } = await supabaseAdmin.from('organization_settings').upsert(
    {
      organization_id: organizationId,
      organization_display_name: body.org_name?.trim() || null,
      logo_url: body.logo_url || null,
      primary_color: body.primary_color ?? 'var(--accent)',
      ai_guide_name: body.guide_name?.trim() || 'Toro',
      onboarding_completed: true,
    },
    { onConflict: 'organization_id' }
  )
  if (error) {
    // Non-fatal: Tabelle existiert eventuell noch nicht (Migration 007 ausstehend)
    log.error('organization_settings upsert error:', error)
  }
}

async function sendInvites(organizationId: string, emails: string[]) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  for (const email of emails) {
    if (!email.trim() || !email.includes('@')) continue
    try {
      await supabaseAdmin.auth.admin.inviteUserByEmail(email.trim(), {
        data: { organization_id: organizationId, role: 'member' },
        redirectTo: `${siteUrl}/auth/callback`,
      })
    } catch (e) {
      log.error('Invite error', e)
    }
  }
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
  }

  let body: CompleteBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Ungültiger Request-Body' }, { status: 400 })
  }

  if (!body.full_name?.trim()) {
    return NextResponse.json({ error: 'Name ist erforderlich' }, { status: 400 })
  }

  const meta = user.user_metadata as { organization_id?: string; role?: string }
  let organizationId = meta.organization_id
  let role = meta.role ?? 'member'
  if (!isAssignableRole(role)) role = 'member'

  if (!organizationId) {
    const resolved = await resolveOrganizationId(user.id, organizationId)
    if (resolved) {
      organizationId = resolved.organizationId
      role = resolved.role
    }
  }

  if (!organizationId) {
    return NextResponse.json({ error: 'Kein Organisations-Link gefunden' }, { status: 400 })
  }

  const { error: userErr } = await upsertUserProfile(user.id, organizationId, user.email!, body.full_name.trim(), role)
  if (userErr) {
    log.error('users upsert error:', userErr)
    return NextResponse.json({ error: 'Profil konnte nicht gespeichert werden' }, { status: 500 })
  }

  await ensureWorkspaceMembership(organizationId, user.id, role)

  const { error: prefErr } = await upsertUserPreferences(user.id, body)
  if (prefErr) {
    log.error('user_preferences upsert error:', prefErr)
    return NextResponse.json({ error: 'Präferenzen konnten nicht gespeichert werden' }, { status: 500 })
  }

  const isAdmin = ['owner', 'admin'].includes(role)
  if (isAdmin && body.org_name !== undefined) {
    await upsertOrgSettings(organizationId, body)
    await sendInvites(organizationId, body.invite_emails ?? [])
  }

  return NextResponse.json({ success: true })
}
