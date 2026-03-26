import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'
import { getAuthUser, verifyProjectAccess } from '@/lib/api/projects'

// PATCH /api/projects/[id]/memory/[memId] — edit content
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; memId: string }> }
) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
  const { id, memId } = await params

  const allowed = await verifyProjectAccess(id, me)
  if (!allowed) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  let body: Record<string, unknown>
  try { body = await request.json() }
  catch { return NextResponse.json({ error: 'Ungültiger Request-Body' }, { status: 400 }) }

  const content = (body.content as string | undefined)?.trim()
  if (!content) return NextResponse.json({ error: 'content erforderlich' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('project_memory')
    .update({ content })
    .eq('id', memId)
    .eq('project_id', id)
    .is('deleted_at', null)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE /api/projects/[id]/memory/[memId] — soft-delete single entry
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; memId: string }> }
) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
  const { id, memId } = await params

  const allowed = await verifyProjectAccess(id, me)
  if (!allowed) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  const { error } = await supabaseAdmin
    .from('project_memory')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', memId)
    .eq('project_id', id)
    .is('deleted_at', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
