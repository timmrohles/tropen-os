// GET /api/cron/agents/check — Vercel Cron Job (täglich 7 Uhr)
// Prüft alle scheduled Agenten und startet fällige Runs
import { NextRequest, NextResponse } from 'next/server'
import { checkScheduledTriggers } from '@/lib/agent-engine'
import { createLogger } from '@/lib/logger'

export const runtime = 'nodejs'

const log = createLogger('api/cron/agents/check')

export async function GET(request: NextRequest) {
  // Vercel Cron Authentication
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  log.info('Agent cron check started')

  try {
    const result = await checkScheduledTriggers()

    log.info('Agent cron check completed', result)

    return NextResponse.json({
      ok: true,
      ...result,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    log.error('Agent cron check failed', { error: msg })
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
