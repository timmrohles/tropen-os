import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

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

export async function POST(request: Request) {
  // 1. Auth prüfen
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

  // Fallback: Organization aus public.users laden (für Owner die nicht per Einladung angelegt wurden)
  if (!organizationId) {
    const { data: existingProfile } = await supabaseAdmin
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .maybeSingle()

    if (existingProfile?.organization_id) {
      organizationId = existingProfile.organization_id
      role = existingProfile.role ?? role
    }
  }

  if (!organizationId) {
    return NextResponse.json({ error: 'Kein Organisations-Link gefunden' }, { status: 400 })
  }

  // 2. User-Profil erstellen / aktualisieren (Service Role – bypasses RLS)
  const { error: userErr } = await supabaseAdmin.from('users').upsert(
    {
      id: user.id,
      organization_id: organizationId,
      email: user.email!,
      full_name: body.full_name.trim(),
      role,
    },
    { onConflict: 'id' }
  )
  if (userErr) {
    console.error('users upsert error:', userErr)
    return NextResponse.json({ error: 'Profil konnte nicht gespeichert werden' }, { status: 500 })
  }

  // 3. Workspace-Mitgliedschaft sicherstellen (falls noch nicht vorhanden)
  const { data: orgWorkspaces } = await supabaseAdmin
    .from('workspaces')
    .select('id')
    .eq('organization_id', organizationId)

  if (orgWorkspaces?.length) {
    const wsRole = role === 'viewer' ? 'viewer' : role === 'member' ? 'member' : 'admin'
    await supabaseAdmin
      .from('workspace_members')
      .upsert(
        orgWorkspaces.map((ws) => ({ workspace_id: ws.id, user_id: user.id, role: wsRole })),
        { onConflict: 'workspace_id,user_id' }
      )
  }

  // 4. User-Präferenzen (Service Role)
  const { error: prefErr } = await supabaseAdmin.from('user_preferences').upsert(
    {
      user_id: user.id,
      chat_style: body.chat_style ?? 'structured',
      model_preference: body.model_preference ?? 'auto',
      onboarding_completed: true,
      ai_act_acknowledged: body.ai_act_acknowledged ?? false,
      ai_act_acknowledged_at: body.ai_act_acknowledged ? (body.ai_act_acknowledged_at ?? new Date().toISOString()) : null,
    },
    { onConflict: 'user_id' }
  )
  if (prefErr) {
    console.error('user_preferences upsert error:', prefErr)
    return NextResponse.json({ error: 'Präferenzen konnten nicht gespeichert werden' }, { status: 500 })
  }

  // 5. Org-Einstellungen (nur Owner/Admin, Service Role)
  const isAdmin = ['owner', 'admin'].includes(role)
  if (isAdmin && body.org_name !== undefined) {
    const { error: orgErr } = await supabaseAdmin.from('organization_settings').upsert(
      {
        organization_id: organizationId,
        organization_display_name: body.org_name?.trim() || null,
        logo_url: body.logo_url || null,
        primary_color: body.primary_color ?? '#14b8a6',
        ai_guide_name: body.guide_name?.trim() || 'Toro',
        onboarding_completed: true,
      },
      { onConflict: 'organization_id' }
    )
    if (orgErr) {
      // Non-fatal: Tabelle existiert eventuell noch nicht (Migration 007 ausstehend)
      console.error('organization_settings upsert error:', orgErr)
    }

    // 6. Einladungen versenden (best-effort)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
    for (const email of (body.invite_emails ?? [])) {
      if (!email.trim() || !email.includes('@')) continue
      try {
        await supabaseAdmin.auth.admin.inviteUserByEmail(email.trim(), {
          data: { organization_id: organizationId, role: 'member' },
          redirectTo: `${siteUrl}/auth/callback`,
        })
      } catch (e) {
        console.error('Invite error for', email, e)
      }
    }
  }

  return NextResponse.json({ success: true })
}
