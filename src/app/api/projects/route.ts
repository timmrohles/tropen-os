import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('users')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()
  if (!profile) return null
  return { id: user.id, ...profile } as { id: string; organization_id: string; role: string }
}

// GET /api/projects?workspace_id=...
export async function GET(request: Request) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const workspace_id = searchParams.get('workspace_id')
  if (!workspace_id) return NextResponse.json({ error: 'workspace_id fehlt' }, { status: 400 })

  const { data: projects } = await supabaseAdmin
    .from('projects')
    .select(`
      id, name, description, context, tone, language, target_audience,
      memory, display_order, created_at, updated_at,
      conversations(count)
    `)
    .eq('workspace_id', workspace_id)
    .is('conversations.deleted_at', null)
    .order('display_order')

  return NextResponse.json(projects ?? [])
}

// POST /api/projects
export async function POST(request: Request) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const body = await request.json()
  const { workspace_id, name } = body
  if (!workspace_id || !name?.trim())
    return NextResponse.json({ error: 'workspace_id und name erforderlich' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('projects')
    .insert({ workspace_id, name: name.trim() })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// PATCH /api/projects
export async function PATCH(request: Request) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const { id, ...fields } = await request.json()
  if (!id) return NextResponse.json({ error: 'id fehlt' }, { status: 400 })

  const allowed = ['name','description','context','tone','language','target_audience']
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of allowed) {
    if (key in fields) update[key] = fields[key]
  }

  const { data, error } = await supabaseAdmin
    .from('projects')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE /api/projects
export async function DELETE(request: Request) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'id fehlt' }, { status: 400 })

  // conversations.project_id wird via ON DELETE SET NULL automatisch auf NULL gesetzt
  const { error } = await supabaseAdmin
    .from('projects')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
