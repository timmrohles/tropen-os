import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'
import { getAuthUser, verifyProjectAccess } from '@/lib/api/projects'

// POST /api/projects/[id]/merge — move chats + memory to target, archive source
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

  const targetId = body.target_id as string | undefined
  if (!targetId || targetId === id)
    return NextResponse.json({ error: 'Ungültige target_id' }, { status: 400 })

  const targetAllowed = await verifyProjectAccess(targetId, me)
  if (!targetAllowed) return NextResponse.json({ error: 'Zielprojekt nicht gefunden' }, { status: 404 })

  // 1. Move all conversations from source → target
  const { error: convErr } = await supabaseAdmin
    .from('conversations')
    .update({ project_id: targetId })
    .eq('project_id', id)
    .is('deleted_at', null)

  if (convErr) return NextResponse.json({ error: convErr.message }, { status: 500 })

  // 2. Copy non-deleted memory entries to target (APPEND ONLY — insert copies)
  const { data: memories } = await supabaseAdmin
    .from('project_memory')
    .select('type, content, importance, tags, source_conversation_id')
    .eq('project_id', id)
    .is('deleted_at', null)

  if (memories && memories.length > 0) {
    const copies = memories.map(m => ({
      ...m,
      project_id: targetId,
      organization_id: me.organization_id,
    }))
    const { error: memErr } = await supabaseAdmin
      .from('project_memory')
      .insert(copies)
    if (memErr) return NextResponse.json({ error: memErr.message }, { status: 500 })
  }

  // 3. Archive source project
  const { error: archErr } = await supabaseAdmin
    .from('projects')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id)

  if (archErr) return NextResponse.json({ error: archErr.message }, { status: 500 })

  return NextResponse.json({ success: true, merged_into: targetId })
}
