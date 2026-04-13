import { createLogger } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { parsePaginationParams } from '@/lib/api/pagination'
const log = createLogger('superadmin/clients')

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

export async function GET(request: NextRequest) {
  const user = await requireSuperadmin()
  if (!user) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const { limit, offset } = parsePaginationParams(searchParams)

  const { data, error, count } = await supabaseAdmin
    .from('organizations')
    .select(
      'id, name, slug, plan, budget_limit, created_at, workspaces(id, name, budget_limit), organization_settings(onboarding_completed), users(id, email, role)',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    log.error('GET /api/superadmin/clients failed', { error: error.message, code: error.code })
    return NextResponse.json({ error: 'Fehler beim Laden der Clients' }, { status: 500 })
  }

  return NextResponse.json({ data: data ?? [], total: count ?? 0, limit, offset })
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
    log.error('POST /api/superadmin/clients: org insert failed', { error: orgError?.message, code: orgError?.code })
    return NextResponse.json(
      { error: 'Organisation konnte nicht erstellt werden' },
      { status: 500 }
    )
  }

  // Step 2: Insert workspace
  const { data: workspace, error: workspaceError } = await supabaseAdmin
    .from('departments')
    .insert({
      organization_id: org.id,
      name: workspace_name,
      budget_limit: workspace_budget_limit || null,
    })
    .select()
    .single()

  if (workspaceError || !workspace) {
    log.error('POST /api/superadmin/clients: workspace insert failed', { error: workspaceError?.message, code: workspaceError?.code })
    // Cleanup: delete org
    await supabaseAdmin.from('organizations').delete().eq('id', org.id)
    return NextResponse.json(
      { error: 'Workspace konnte nicht erstellt werden' },
      { status: 500 }
    )
  }

  // Step 3: Insert organization_settings
  const { error: settingsError } = await supabaseAdmin
    .from('organization_settings')
    .insert({
      organization_id: org.id,
      primary_color: 'var(--accent)',
      ai_guide_name: 'Toro',
      ai_guide_description: 'Dein KI-Guide durch den Informationsdschungel',
      onboarding_completed: false,
    })

  if (settingsError) {
    log.error('POST /api/superadmin/clients: settings insert failed', { error: settingsError.message, code: settingsError.code })
    // Cleanup: delete workspace + org
    await supabaseAdmin.from('departments').delete().eq('id', workspace.id)
    await supabaseAdmin.from('organizations').delete().eq('id', org.id)
    return NextResponse.json(
      { error: 'Einstellungen konnten nicht gespeichert werden' },
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
    log.error('POST /api/superadmin/clients: invite email failed', { error: inviteError.message })
    return NextResponse.json(
      { organization: org, workspace, invited: false },
      { status: 201 }
    )
  }

  return NextResponse.json(
    { organization: org, workspace, invited: true },
    { status: 201 }
  )
}
