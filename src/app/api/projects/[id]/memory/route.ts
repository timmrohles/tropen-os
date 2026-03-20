import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'
import { getAuthUser, verifyProjectAccess } from '@/lib/api/projects'

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

  const validImportance = ['high', 'medium', 'low']
  if (importance && !validImportance.includes(importance))
    return NextResponse.json({ error: 'Ungültige importance (high|medium|low)' }, { status: 400 })

  if (tags !== undefined && (!Array.isArray(tags) || !tags.every(t => typeof t === 'string')))
    return NextResponse.json({ error: 'tags muss ein String-Array sein' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('project_memory')
    .insert({
      project_id: id,
      organization_id: me.organization_id,
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
