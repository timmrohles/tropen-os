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
  // 1. Auth
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // 2. Validate body
  const { data, error: validationError } = await validateBody(req, preflightBody)
  if (validationError) return validationError

  const { input, pivots } = data

  // 3. Budget check
  const budget = await checkBudget(me.organization_id, 'preflight', null)
  if (!budget.allowed) return budgetExhaustedResponse(budget.reason)

  try {
    // 4. Run preflight (may throw if input is too short after normalisation)
    let result
    try {
      result = await runPreflight(input, pivots)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Input ungültig'
      logger.warn('runPreflight rejected input', { message })
      return NextResponse.json({ error: message }, { status: 400 })
    }

    // 5. Persist run
    const { data: row, error: dbError } = await supabaseAdmin
      .from('preflight_runs')
      .insert({
        organization_id: me.organization_id,
        user_id: me.id,
        input_text: input,
        result,
      })
      .select('id')
      .single()

    if (dbError) {
      logger.error('preflight_runs insert failed', { error: dbError.message })
      return NextResponse.json({ error: 'Fehler beim Speichern', code: 'DB_ERROR' }, { status: 500 })
    }

    // 6. Return result
    return NextResponse.json({
      summary: result.summary,
      gaps: result.gaps,
      startpaket: result.startpaket,
      runId: row.id,
    })
  } catch (err) {
    logger.error('preflight analyze error', { err })
    return NextResponse.json({ error: 'Ein Fehler ist aufgetreten', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
