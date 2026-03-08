import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

async function requireSuperadmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: me } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  if (me?.role !== 'superadmin') return null
  return user
}

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
  const suffix = Date.now().toString(36).slice(-4)
  return `${base}-${suffix}`
}

export async function GET() {
  const user = await requireSuperadmin()
  if (!user) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabaseAdmin
    .from('organizations')
    .select(
      'id, name, slug, plan, budget_limit, created_at, workspaces(id, name, budget_limit), organization_settings(onboarding_completed), users(id, email, role)'
    )
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const user = await requireSuperadmin()
  if (!user) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { org_name, plan, org_budget_limit, workspace_name, workspace_budget_limit, owner_email } = body

  if (!org_name || !plan || !workspace_name || !owner_email) {
    return NextResponse.json(
      { error: 'Pflichtfelder fehlen: org_name, plan, workspace_name, owner_email' },
      { status: 400 }
    )
  }

  // Step 1: Insert organization
  const { data: org, error: orgError } = await supabaseAdmin
    .from('organizations')
    .insert({
      name: org_name,
      slug: generateSlug(org_name),
      plan,
      budget_limit: org_budget_limit || null,
    })
    .select()
    .single()

  if (orgError || !org) {
    return NextResponse.json(
      { error: `Organisation konnte nicht erstellt werden: ${orgError?.message}` },
      { status: 500 }
    )
  }

  // Step 2: Insert workspace
  const { data: workspace, error: workspaceError } = await supabaseAdmin
    .from('workspaces')
    .insert({
      organization_id: org.id,
      name: workspace_name,
      budget_limit: workspace_budget_limit || null,
    })
    .select()
    .single()

  if (workspaceError || !workspace) {
    // Cleanup: delete org
    await supabaseAdmin.from('organizations').delete().eq('id', org.id)
    return NextResponse.json(
      { error: `Workspace konnte nicht erstellt werden: ${workspaceError?.message}` },
      { status: 500 }
    )
  }

  // Step 3: Insert organization_settings
  const { error: settingsError } = await supabaseAdmin
    .from('organization_settings')
    .insert({
      organization_id: org.id,
      primary_color: '#14b8a6',
      ai_guide_name: 'Toro',
      ai_guide_description: 'Dein KI-Guide durch den Informationsdschungel',
      onboarding_completed: false,
    })

  if (settingsError) {
    // Cleanup: delete workspace + org
    await supabaseAdmin.from('workspaces').delete().eq('id', workspace.id)
    await supabaseAdmin.from('organizations').delete().eq('id', org.id)
    return NextResponse.json(
      { error: `Einstellungen konnten nicht gespeichert werden: ${settingsError.message}` },
      { status: 500 }
    )
  }

  // Step 4: Invite owner via email
  const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(owner_email, {
    data: {
      organization_id: org.id,
      role: 'owner',
    },
    redirectTo: process.env.NEXT_PUBLIC_SITE_URL + '/auth/callback',
  })

  if (inviteError) {
    // Org + Workspace wurden angelegt, nur E-Mail fehlgeschlagen → trotzdem erfolgreich zurückgeben
    console.error('Invite email failed:', inviteError.message)
    return NextResponse.json(
      { organization: org, workspace, invited: false, invite_error: inviteError.message },
      { status: 201 }
    )
  }

  return NextResponse.json(
    { organization: org, workspace, invited: true },
    { status: 201 }
  )
}
