import { createLogger } from '@/lib/logger'
import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { withSuperadmin } from '@/lib/auth/route-guards'
import type { QaRunType, RunResponse } from '@/types/qa'
const log = createLogger('admin/qa/runs')

const VALID_RUN_TYPES: QaRunType[] = [
  'functional', 'integration', 'regression',
  'bias', 'hallucination', 'routing', 'security', 'lighthouse',
]

export const POST = withSuperadmin(async (request: NextRequest, { auth }) => {
  try {
    const body = await request.json() as { runType?: QaRunType }
    const runType = body.runType

    if (!runType || !VALID_RUN_TYPES.includes(runType)) {
      return NextResponse.json(
        { error: 'Ungültiger runType', code: 'INVALID_RUN_TYPE' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('qa_test_runs')
      .insert({
        run_type: runType,
        status: 'running',
        triggered_by: 'manual',
        triggered_by_user_id: auth.id,
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (error) throw error

    const response: RunResponse = {
      runId: data.id,
      status: 'running',
      message: `Test-Run "${runType}" gestartet.`,
    }

    return NextResponse.json(response, { status: 201 })
  } catch (err) {
    log.error('[qa/runs]', err)
    return NextResponse.json(
      { error: 'Interner Fehler', code: 'QA_RUNS_ERROR' },
      { status: 500 }
    )
  }
})
