// POST /api/agents/[id]/run — manuellen Run starten (gibt run_id zurück)
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/projects'
import { runAgent } from '@/lib/agent-engine'
import { createLogger } from '@/lib/logger'

export const runtime = 'nodejs'

const log = createLogger('api/agents/[id]/run')

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json().catch(() => ({}))

  try {
    const runId = await runAgent(id, 'manual', { initiated_by: me.id, ...body })
    return NextResponse.json({ run_id: runId })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    log.error('POST /api/agents/[id]/run failed', { id, error: msg })
    const status = msg.includes('not found') ? 404
                 : msg.includes('inactive') ? 422
                 : msg.includes('already running') ? 409
                 : msg.includes('Budget') ? 402
                 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
