import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/projects'
import { validateBody } from '@/lib/validators'
import { preflightBody } from '@/lib/validators/preflight'
import { checkBudget, budgetExhaustedResponse } from '@/lib/budget'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { runPreflight } from '@/lib/preflight/run'
import { createLogger } from '@/lib/logger'

const logger = createLogger('api:preflight:analyze')

export async function POST(req: NextRequest) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error: validationError } = await validateBody(req, preflightBody)
  if (validationError) return validationError

  const { input, pivots, name } = data

  const budget = await checkBudget(me.organization_id, 'preflight', null)
  if (!budget.allowed) return budgetExhaustedResponse(budget.reason)

  try {
    let result
    try {
      result = await runPreflight(input, pivots)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Input ungültig'
      logger.warn('runPreflight rejected input', { message })
      return NextResponse.json({ error: message }, { status: 400 })
    }

    // 1. Projekt (latest_run_id zunächst NULL)
    const projectName = (name?.trim() || result.summary.projectLabel).slice(0, 120)
    const { data: project, error: projErr } = await supabaseAdmin
      .from('preflight_projects')
      .insert({
        organization_id: me.organization_id,
        user_id: me.id,
        name: projectName,
        pivots,
        red_count: result.gaps.red.length,
      })
      .select('id')
      .single()
    if (projErr || !project) {
      logger.error('preflight_projects insert failed', { error: projErr?.message })
      return NextResponse.json({ error: 'Fehler beim Speichern', code: 'DB_ERROR' }, { status: 500 })
    }

    // 2. Run mit project_id
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

    // 3. latest_run_id setzen
    await supabaseAdmin
      .from('preflight_projects')
      .update({ latest_run_id: run.id, updated_at: new Date().toISOString() })
      .eq('id', project.id)

    return NextResponse.json({ projectId: project.id, result })
  } catch (err) {
    logger.error('preflight analyze error', { err })
    return NextResponse.json({ error: 'Ein Fehler ist aufgetreten', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
