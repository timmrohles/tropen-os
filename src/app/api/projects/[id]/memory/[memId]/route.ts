import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'
import { apiError } from '@/lib/api-error'
import { withProjectAccess } from '@/lib/auth/route-guards'

// PATCH /api/projects/[id]/memory/[memId] — edit content
export const PATCH = withProjectAccess<{ id: string; memId: string }>(async (request, { projectId, params }) => {
  const { memId } = params

  let body: Record<string, unknown>
  try { body = await request.json() }
  catch { return NextResponse.json({ error: 'Ungültiger Request-Body' }, { status: 400 }) }

  const content = (body.content as string | undefined)?.trim()
  if (!content) return NextResponse.json({ error: 'content erforderlich' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('project_memory')
    .update({ content })
    .eq('id', memId)
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .select()
    .single()

  if (error) return apiError(error)
  return NextResponse.json(data)
})

// DELETE /api/projects/[id]/memory/[memId] — soft-delete single entry
export const DELETE = withProjectAccess<{ id: string; memId: string }>(async (_req, { projectId, params }) => {
  const { memId } = params

  const { error } = await supabaseAdmin
    .from('project_memory')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', memId)
    .eq('project_id', projectId)
    .is('deleted_at', null)

  if (error) return apiError(error)
  return NextResponse.json({ success: true })
})
