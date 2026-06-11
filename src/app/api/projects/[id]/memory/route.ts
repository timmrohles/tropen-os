import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'
import { apiError } from '@/lib/api-error'
import { withProjectAccess } from '@/lib/auth/route-guards'

// DELETE /api/projects/[id]/memory — soft-delete ALL entries
export const DELETE = withProjectAccess<{ id: string }>(async (_req, { projectId }) => {
  const { error } = await supabaseAdmin
    .from('project_memory')
    .update({ deleted_at: new Date().toISOString() })
    .eq('project_id', projectId)
    .is('deleted_at', null)

  if (error) return apiError(error)
  return NextResponse.json({ success: true })
})

// GET /api/projects/[id]/memory
export const GET = withProjectAccess<{ id: string }>(async (_req, { projectId }) => {
  const { data, error } = await supabaseAdmin
    .from('project_memory')
    .select('id, type, content, source_conversation_id, importance, tags, frozen, created_at')
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) return apiError(error)
  return NextResponse.json(data ?? [])
})

// POST /api/projects/[id]/memory — APPEND ONLY (no PATCH, no DELETE handler)
export const POST = withProjectAccess<{ id: string }>(async (request, { projectId, auth }) => {
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
      project_id: projectId,
      organization_id: auth.organization_id,
      type,
      content: (content as string).trim(),
      importance: importance ?? 'medium',
      tags: tags ?? [],
      source_conversation_id: conversation_id ?? null,
    })
    .select()
    .single()

  if (error) return apiError(error)
  return NextResponse.json(data)
})
