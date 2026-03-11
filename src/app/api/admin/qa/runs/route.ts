import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import type { QaRunType, RunResponse } from '@/types/qa'

async function isSuperadmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false
  const { data } = await supabase.from('users').select('role').eq('id', user.id).single()
  return data?.role === 'superadmin'
}

const VALID_RUN_TYPES: QaRunType[] = [
  'functional', 'integration', 'regression',
  'bias', 'hallucination', 'routing', 'security', 'lighthouse',
]

export async function POST(request: NextRequest) {
  try {
    if (!(await isSuperadmin())) {
      return NextResponse.json({ error: 'Keine Berechtigung', code: 'UNAUTHORIZED' }, { status: 403 })
    }

    const supabase_auth = await createClient()
    const {
      data: { user },
    } = await supabase_auth.auth.getUser()

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
        triggered_by_user_id: user?.id ?? null,
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
    console.error('[qa/runs]', err)
    return NextResponse.json(
      { error: 'Interner Fehler', code: 'QA_RUNS_ERROR' },
      { status: 500 }
    )
  }
}
