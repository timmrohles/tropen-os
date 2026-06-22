// src/app/api/preflight/projects/[id]/generate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { withPreflightProjectAccess } from '@/lib/auth/route-guards'
import { checkBudget, budgetExhaustedResponse } from '@/lib/budget'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { generateStartpaket } from '@/lib/preflight/generate'
import { isMinStandardMet, normalizePivots } from '@/lib/preflight/types'
import type { DecisionMap, GapList, NodeAnalysis } from '@/lib/preflight/types'
import { apiError } from '@/lib/api-error'
import { createLogger } from '@/lib/logger'

const logger = createLogger('api:preflight:generate')

export const POST = withPreflightProjectAccess(async (_req: NextRequest, { auth: me, preflightProject: project }) => {
  if (!project.latest_run_id) return NextResponse.json({ error: 'Noch keine Analyse' }, { status: 409 })

  const { data: run, error: runErr } = await supabaseAdmin
    .from('preflight_runs').select('result, input_text').eq('id', project.latest_run_id).single()
  if (runErr) return apiError(runErr)

  const result = run?.result as { gaps: GapList; nodes: NodeAnalysis[] }
  const decisions = (project.decisions ?? {}) as DecisionMap

  if (!isMinStandardMet(result.gaps, decisions)) {
    return NextResponse.json({ error: 'Mindeststandard nicht erreicht', code: 'MIN_STANDARD_NOT_MET' }, { status: 409 })
  }

  const budget = await checkBudget(me.organization_id, 'preflight', null)
  if (!budget.allowed) return budgetExhaustedResponse(budget.reason)

  let startpaket
  try {
    startpaket = await generateStartpaket(run!.input_text, result.nodes ?? [], normalizePivots(project.pivots as never), decisions)
  } catch (err) {
    logger.error('generateStartpaket failed', { err })
    return NextResponse.json({ error: 'Generierung fehlgeschlagen', code: 'GENERATE_ERROR' }, { status: 500 })
  }

  const { error: updErr } = await supabaseAdmin
    .from('preflight_projects').update({ startpaket, updated_at: new Date().toISOString() }).eq('id', project.id)
  if (updErr) return apiError(updErr)

  return NextResponse.json({ startpaket })
})
