// GET /api/cron/agents/check — Vercel Cron Job (täglich 7 Uhr)
// Prüft alle scheduled Agenten und startet fällige Runs
import { NextResponse } from 'next/server'
import { checkScheduledTriggers } from '@/lib/agent-engine'
import { createLogger } from '@/lib/logger'
import { apiError } from '@/lib/api-error'
import { withCronAuth } from '@/lib/auth/route-guards'

export const runtime = 'nodejs'

const log = createLogger('api/cron/agents/check')

export const GET = withCronAuth(async () => {
  log.info('Agent cron check started')

  try {
    const result = await checkScheduledTriggers()

    log.info('Agent cron check completed', result)

    return NextResponse.json({
      ok: true,
      ...result,
    })
  } catch (err) {
    log.error('Agent cron check failed', { error: err })
    return apiError(err)
  }
})
