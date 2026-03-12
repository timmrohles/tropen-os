import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('users').select('organization_id, role').eq('id', user.id).single()
  if (!profile?.organization_id) return null
  return { id: user.id, organization_id: profile.organization_id, role: profile.role } as {
    id: string; organization_id: string; role: string
  }
}

async function verifyProjectAccess(
  projectId: string,
  me: { id: string; organization_id: string; role: string }
): Promise<boolean> {
  if (me.role === 'superadmin') return true
  const { data: project } = await supabaseAdmin
    .from('projects').select('department_id').eq('id', projectId).is('deleted_at', null).single()
  if (!project) return false
  const { data } = await supabaseAdmin
    .from('departments').select('id')
    .eq('id', project.department_id).eq('organization_id', me.organization_id).single()
  return !!data
}

// GET /api/projects/[id]/memory
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
  const { id } = await params

  const allowed = await verifyProjectAccess(id, me)
  if (!allowed) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  const { data, error } = await supabaseAdmin
    .from('project_memory')
    .select('id, type, content, source_conversation_id, importance, tags, frozen, created_at')
    .eq('project_id', id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST /api/projects/[id]/memory — APPEND ONLY (no PATCH, no DELETE handler)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
  const { id } = await params

  const allowed = await verifyProjectAccess(id, me)
  if (!allowed) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  let body: Record<string, unknown>
  try { body = await request.json() }
  catch { return NextResponse.json({ error: 'Ungültiger Request-Body' }, { status: 400 }) }

  const { type, content, importance, tags, conversation_id } = body as {
    type?: string; content?: string; importance?: string; tags?: string[]; conversation_id?: string
  }

  if (!type || !content?.trim())
    return NextResponse.json({ error: 'type und content erforderlich' }, { status: 400 })

  const validTypes = ['insight', 'decision', 'open_question', 'summary', 'fact']
  if (!validTypes.includes(type))
    return NextResponse.json({ error: 'Ungültiger type' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('project_memory')
    .insert({
      project_id: id,
      type,
      content: (content as string).trim(),
      importance: importance ?? 'medium',
      tags: tags ?? [],
      source_conversation_id: conversation_id ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
