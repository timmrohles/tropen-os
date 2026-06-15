// src/app/api/preflight/projects/[id]/concept/route.ts
import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/projects'
import { getPreflightProjectForUser } from '@/lib/api/preflight'
import { validateBody } from '@/lib/validators'
import { conceptBody } from '@/lib/validators/preflight'
import { checkBudget, budgetExhaustedResponse } from '@/lib/budget'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { analyzePreflight } from '@/lib/preflight/run'
import { composeConceptText, derivePivotsFromConcept } from '@/lib/preflight/concept'
import { normalizePivots } from '@/lib/preflight/types'
import { createLogger } from '@/lib/logger'

const logger = createLogger('api:preflight:concept')

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const project = await getPreflightProjectForUser(id, me)
  if (!project) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  const { data: concept, error: validationError } = await validateBody(req, conceptBody)
  if (validationError) return validationError

  const budget = await checkBudget(me.organization_id, 'preflight', null)
  if (!budget.allowed) return budgetExhaustedResponse(budget.reason)

  const existingPivots = normalizePivots(project.pivots as never)
  const pivots = derivePivotsFromConcept(concept, existingPivots)
  const input = composeConceptText(concept)

  let result
  try {
    result = await analyzePreflight(input, pivots)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Input ungültig'
    logger.warn('analyzePreflight rejected concept input', { message })
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const { data: run, error: runErr } = await supabaseAdmin
    .from('preflight_runs')
    .insert({
      organization_id: me.organization_id,
      user_id: me.id,
      project_id: project.id,
      input_text: input,
      result,
    })
    .select('id')
    .single()
  if (runErr || !run) {
    logger.error('preflight_runs insert failed', { error: runErr?.message })
    return NextResponse.json({ error: 'Fehler beim Speichern', code: 'DB_ERROR' }, { status: 500 })
  }

  const { error: upErr } = await supabaseAdmin
    .from('preflight_projects')
    .update({
      concept,
      pivots,
      latest_run_id: run.id,
      red_count: result.gaps.red.length,
      startpaket: null, // Re-Analyse → altes Startpaket verwerfen (passt nicht mehr zur frischen Analyse)
      updated_at: new Date().toISOString(),
    })
    .eq('id', project.id)
  if (upErr) logger.warn('project update after concept failed', { error: upErr.message, projectId: project.id })

  return NextResponse.json({ result })
}
