// src/app/api/preflight/projects/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { withPreflightProjectAccess } from '@/lib/auth/route-guards'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { validateBody } from '@/lib/validators'
import { renameProjectBody } from '@/lib/validators/preflight'
import { apiError } from '@/lib/api-error'

export const GET = withPreflightProjectAccess(async (_req: NextRequest, { preflightProject: project }) => {
  let result: unknown = null
  let input = ''
  if (project.latest_run_id) {
    const { data: run, error } = await supabaseAdmin
      .from('preflight_runs').select('result, input_text').eq('id', project.latest_run_id).single()
    if (error) return apiError(error)
    result = run?.result ?? null
    input = run?.input_text ?? ''
  }

  const { data: extra } = await supabaseAdmin
    .from('preflight_projects').select('decisions, startpaket').eq('id', project.id).single()
  const decisions = extra?.decisions ?? {}
  // Fallback: altes Startpaket lag im Run (CRUD-Scheibe)
  const runStartpaket = (result as { startpaket?: unknown } | null)?.startpaket ?? null
  const startpaket = extra?.startpaket ?? runStartpaket

  return NextResponse.json({ id: project.id, name: project.name, pivots: project.pivots, input, decisions, startpaket, result })
})

export const PATCH = withPreflightProjectAccess(async (req: NextRequest, { preflightProject: project }) => {
  const { data, error: validationError } = await validateBody(req, renameProjectBody)
  if (validationError) return validationError

  const { data: updated, error } = await supabaseAdmin
    .from('preflight_projects')
    .update({ name: data.name.trim(), updated_at: new Date().toISOString() })
    .eq('id', project.id)
    .select('id, name')
    .single()
  if (error) return apiError(error)
  return NextResponse.json(updated)
})

export const DELETE = withPreflightProjectAccess(async (_req: NextRequest, { preflightProject: project }) => {
  const { error } = await supabaseAdmin
    .from('preflight_projects')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', project.id)
  if (error) return apiError(error)
  return NextResponse.json({ success: true })
})
