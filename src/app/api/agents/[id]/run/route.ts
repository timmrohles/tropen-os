// POST /api/agents/[id]/run — manuellen Run starten (gibt run_id zurück)
import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/route-guards'
import { runAgent } from '@/lib/agent-engine'
import { createLogger } from '@/lib/logger'

export const runtime = 'nodejs'

const log = createLogger('api/agents/[id]/run')

export const POST = withAuth<{ id: string }>(async (request, { auth: me, params }) => {
  const { id } = params
  const body = await request.json().catch(() => ({}))

  try {
    const runId = await runAgent(id, 'manual', { initiated_by: me.id, ...body })
    return NextResponse.json({ run_id: runId })
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    log.error('POST /api/agents/[id]/run failed', { id, error: msg })
    if (msg.includes('not found'))      return NextResponse.json({ error: 'Agent nicht gefunden' }, { status: 404 })
    if (msg.includes('inactive'))       return NextResponse.json({ error: 'Agent ist inaktiv' }, { status: 422 })
    if (msg.includes('already running'))return NextResponse.json({ error: 'Agent läuft bereits' }, { status: 409 })
    if (msg.includes('Budget'))         return NextResponse.json({ error: 'Budget erschöpft', code: 'BUDGET_EXHAUSTED' }, { status: 402 })
    return NextResponse.json({ error: 'Ein Fehler ist aufgetreten', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
})
