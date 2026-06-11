import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'
import { apiError } from '@/lib/api-error'
import { withProjectAccess } from '@/lib/auth/route-guards'

// GET /api/projects/[id]
export const GET = withProjectAccess<{ id: string }>(async (_req, { projectId }) => {
  const { data, error } = await supabaseAdmin
    .from('projects')
    .select(`
      id, department_id, title, goal, instructions, meta,
      created_by, created_at, updated_at,
      project_participants(user_id, role),
      project_memory(count)
    `)
    .eq('id', projectId)
    .is('deleted_at', null)
    .single()

  if (error) return apiError(error)
  return NextResponse.json(data)
})

// PATCH /api/projects/[id]
export const PATCH = withProjectAccess<{ id: string }>(async (request, { projectId }) => {
  let body: Record<string, unknown>
  try { body = await request.json() }
  catch { return NextResponse.json({ error: 'Ungültiger Request-Body' }, { status: 400 }) }

  const allowedFields = ['title', 'goal', 'instructions', 'emoji', 'context', 'archived_at']
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of allowedFields) {
    if (key in body) update[key] = body[key]
  }

  // Sanitize title — no blank strings
  if ('title' in update && typeof update.title === 'string' && !update.title.trim()) {
    return NextResponse.json({ error: 'title darf nicht leer sein' }, { status: 400 })
  }
  if (typeof update.title === 'string') update.title = (update.title as string).trim()

  // meta: merge (never replace)
  if ('meta' in body && body.meta !== null && typeof body.meta === 'object') {
    const { data: current } = await supabaseAdmin
      .from('projects').select('meta').eq('id', projectId).single()
    update.meta = { ...(current?.meta ?? {}), ...(body.meta as Record<string, unknown>) }
  }

  const { data, error } = await supabaseAdmin
    .from('projects').update(update).eq('id', projectId).select().single()
  if (error) return apiError(error)
  return NextResponse.json(data)
})

// DELETE /api/projects/[id] — soft delete
export const DELETE = withProjectAccess<{ id: string }>(async (_req, { projectId }) => {
  const { error } = await supabaseAdmin
    .from('projects')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', projectId)
  if (error) return apiError(error)
  return NextResponse.json({ success: true })
})
