// src/app/api/preflight/projects/[id]/runs/route.ts
import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/projects'
import { getPreflightProjectForUser } from '@/lib/api/preflight'
import { validateBody } from '@/lib/validators'
import { preflightBody } from '@/lib/validators/preflight'
import { checkBudget, budgetExhaustedResponse } from '@/lib/budget'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { runPreflight } from '@/lib/preflight/run'
import { createLogger } from '@/lib/logger'

const logger = createLogger('api:preflight:runs')

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const project = await getPreflightProjectForUser(id, me)
  if (!project) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  const { data, error: validationError } = await validateBody(req, preflightBody)
  if (validationError) return validationError
  const { input, pivots } = data

  const budget = await checkBudget(me.organization_id, 'preflight', null)
  if (!budget.allowed) return budgetExhaustedResponse(budget.reason)

  let result
  try {
    result = await runPreflight(input, pivots)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Input ungültig'
    logger.warn('runPreflight rejected input', { message })
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

  await supabaseAdmin
    .from('preflight_projects')
    .update({
      latest_run_id: run.id,
      pivots,
      red_count: result.gaps.red.length,
      updated_at: new Date().toISOString(),
    })
    .eq('id', project.id)

  return NextResponse.json({ result })
}
