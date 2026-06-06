// src/app/api/preflight/projects/[id]/route.ts
import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/projects'
import { getPreflightProjectForUser } from '@/lib/api/preflight'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { validateBody } from '@/lib/validators'
import { renameProjectBody } from '@/lib/validators/preflight'
import { apiError } from '@/lib/api-error'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const project = await getPreflightProjectForUser(id, me)
  if (!project) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  let result: unknown = null
  let input = ''
  if (project.latest_run_id) {
    const { data: run, error } = await supabaseAdmin
      .from('preflight_runs')
      .select('result, input_text')
      .eq('id', project.latest_run_id)
      .single()
    if (error) return apiError(error)
    result = run?.result ?? null
    input = run?.input_text ?? ''
  }

  return NextResponse.json({ id: project.id, name: project.name, pivots: project.pivots, input, result })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const project = await getPreflightProjectForUser(id, me)
  if (!project) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  const { data, error: validationError } = await validateBody(req, renameProjectBody)
  if (validationError) return validationError

  const { data: updated, error } = await supabaseAdmin
    .from('preflight_projects')
    .update({ name: data.name.trim(), updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id, name')
    .single()
  if (error) return apiError(error)
  return NextResponse.json(updated)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const project = await getPreflightProjectForUser(id, me)
  if (!project) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  const { error } = await supabaseAdmin
    .from('preflight_projects')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return apiError(error)
  return NextResponse.json({ success: true })
}
