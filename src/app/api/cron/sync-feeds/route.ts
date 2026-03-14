// src/app/api/cron/sync-feeds/route.ts
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { triggerFetch } from '@/actions/feeds'
import { runTtlCleanup } from '@/lib/feeds/ttl-cleanup'
import { createLogger } from '@/lib/logger'

const log = createLogger('cron:sync-feeds')

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const results: Array<{ sourceId: string; name: string; itemsFound: number; itemsSaved: number; errors: string[] }> = []

  const { data: sources } = await supabaseAdmin
    .from('feed_sources')
    .select('id, name, type, config, last_fetched_at')
    .eq('is_active', true)
    .neq('type', 'email')

  for (const src of sources ?? []) {
    const s = src as Record<string, unknown>
    const config = s.config as Record<string, unknown>
    const intervalMin = Number(config.polling_interval_minutes ?? 60)
    const lastFetched = s.last_fetched_at ? new Date(s.last_fetched_at as string) : null
    const minutesSinceFetch = lastFetched
      ? (now.getTime() - lastFetched.getTime()) / 60_000
      : Infinity

    if (minutesSinceFetch < intervalMin) continue

    log.info('[sync-feeds] fetching source', { sourceId: s.id, name: s.name })
    const result = await triggerFetch(s.id as string)
    results.push({ sourceId: s.id as string, name: s.name as string, ...result })
  }

  const { archived } = await runTtlCleanup()
  log.info('[sync-feeds] TTL cleanup', { archived })

  return NextResponse.json({ ok: true, processed: results.length, results, archived })
}
