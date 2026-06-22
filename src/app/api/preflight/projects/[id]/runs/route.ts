// src/app/api/preflight/projects/[id]/runs/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { withPreflightProjectAccess } from '@/lib/auth/route-guards'
import { validateBody } from '@/lib/validators'
import { preflightBody } from '@/lib/validators/preflight'
import { checkBudget, budgetExhaustedResponse } from '@/lib/budget'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { analyzePreflight } from '@/lib/preflight/run'
import { createLogger } from '@/lib/logger'

const logger = createLogger('api:preflight:runs')

export const POST = withPreflightProjectAccess(async (req: NextRequest, { auth: me, preflightProject: project }) => {
  const { data, error: validationError } = await validateBody(req, preflightBody)
  if (validationError) return validationError
  const { input, pivots } = data

  const budget = await checkBudget(me.organization_id, 'preflight', null)
  if (!budget.allowed) return budgetExhaustedResponse(budget.reason)

  let result
  try {
    result = await analyzePreflight(input, pivots)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Input ungültig'
    logger.warn('analyzePreflight rejected input', { message })
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

  const { error: linkErr } = await supabaseAdmin
    .from('preflight_projects')
    .update({
      latest_run_id: run.id,
      pivots,
      red_count: result.gaps.red.length,
      startpaket: null, // Re-Analyse → altes Startpaket verwerfen (passt nicht mehr zur frischen Analyse)
      updated_at: new Date().toISOString(),
    })
    .eq('id', project.id)
  if (linkErr) logger.warn('project update after run failed', { error: linkErr.message, projectId: project.id })

  return NextResponse.json({ result })
})
