import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile, error } = await supabase
    .from('users')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()
  if (error) console.error('[projects] getAuthUser DB error:', error.message)
  if (!profile?.organization_id) return null
  return { id: user.id, organization_id: profile.organization_id, role: profile.role } as {
    id: string; organization_id: string; role: string
  }
}

/** Prüft ob workspace_id zur Organisation des Users gehört. */
async function verifyWorkspaceOrg(workspaceId: string, organizationId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('workspaces')
    .select('id')
    .eq('id', workspaceId)
    .eq('organization_id', organizationId)
    .single()
  return !!data
}

/** Lädt das Projekt und gibt workspace_id zurück – oder null wenn nicht gefunden. */
async function getProjectWorkspace(projectId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('projects')
    .select('workspace_id')
    .eq('id', projectId)
    .single()
  return data?.workspace_id ?? null
}

// GET /api/projects?workspace_id=...
export async function GET(request: Request) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const workspace_id = searchParams.get('workspace_id')
  if (!workspace_id) return NextResponse.json({ error: 'workspace_id fehlt' }, { status: 400 })

  // IDOR-Schutz: workspace muss zur eigenen Organisation gehören
  const allowed = await verifyWorkspaceOrg(workspace_id, me.organization_id)
  if (!allowed) return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })

  const { data: projects, error } = await supabaseAdmin
    .from('projects')
    .select(`
      id, name, description, context, tone, language, target_audience,
      memory, display_order, created_at, updated_at,
      conversations(count)
    `)
    .eq('workspace_id', workspace_id)
    .order('display_order')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(projects ?? [])
}

// POST /api/projects
export async function POST(request: Request) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await request.json() }
  catch { return NextResponse.json({ error: 'Ungültiger Request-Body' }, { status: 400 }) }

  const { workspace_id, name } = body as { workspace_id?: string; name?: string }
  if (!workspace_id || !name?.trim())
    return NextResponse.json({ error: 'workspace_id und name erforderlich' }, { status: 400 })

  // IDOR-Schutz
  const allowed = await verifyWorkspaceOrg(workspace_id, me.organization_id)
  if (!allowed) return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })

  const { data, error } = await supabaseAdmin
    .from('projects')
    .insert({ workspace_id, name: (name as string).trim() })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// PATCH /api/projects
export async function PATCH(request: Request) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await request.json() }
  catch { return NextResponse.json({ error: 'Ungültiger Request-Body' }, { status: 400 }) }

  const { id, ...fields } = body
  if (!id) return NextResponse.json({ error: 'id fehlt' }, { status: 400 })

  // IDOR-Schutz: Projekt muss zur eigenen Org gehören
  const workspaceId = await getProjectWorkspace(id as string)
  if (!workspaceId) return NextResponse.json({ error: 'Projekt nicht gefunden' }, { status: 404 })
  const allowed = await verifyWorkspaceOrg(workspaceId, me.organization_id)
  if (!allowed) return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })

  // Allowlist – memory ist bewusst ausgeschlossen (wird in Phase 3 von Toro geschrieben)
  const allowedFields = ['name','description','context','tone','language','target_audience']
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of allowedFields) {
    if (key in fields) update[key] = fields[key]
  }

  const { data, error } = await supabaseAdmin
    .from('projects')
    .update(update)
    .eq('id', id as string)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE /api/projects
export async function DELETE(request: Request) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await request.json() }
  catch { return NextResponse.json({ error: 'Ungültiger Request-Body' }, { status: 400 }) }

  const { id } = body
  if (!id) return NextResponse.json({ error: 'id fehlt' }, { status: 400 })

  // IDOR-Schutz
  const workspaceId = await getProjectWorkspace(id as string)
  if (!workspaceId) return NextResponse.json({ error: 'Projekt nicht gefunden' }, { status: 404 })
  const allowed = await verifyWorkspaceOrg(workspaceId, me.organization_id)
  if (!allowed) return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })

  // Hard delete – conversations.project_id wird via ON DELETE SET NULL auf NULL gesetzt
  const { error } = await supabaseAdmin
    .from('projects')
    .delete()
    .eq('id', id as string)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
