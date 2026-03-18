// src/app/api/cron/sync-feeds/route.ts
// Vercel Cron: runs once per day (Hobby plan limit).
// Queries all active (non-paused) sources, checks polling interval,
// and delegates each due source to runFeedSource for full pipeline + logging.

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { runFeedSource } from '@/lib/feeds/feed-runner'
import { runTtlCleanup } from '@/lib/feeds/ttl-cleanup'
import { createLogger } from '@/lib/logger'
import type { FeedRunResult } from '@/types/feeds'

const log = createLogger('cron:sync-feeds')

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const results: Array<{ sourceId: string; name: string } & FeedRunResult> = []

  // Only active sources (status field — paused/archived are skipped)
  const { data: sources } = await supabaseAdmin
    .from('feed_sources')
    .select('id, name, config, last_fetched_at')
    .eq('status', 'active')
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

    log.info('[sync-feeds] running source', { sourceId: s.id, name: s.name })
    const runResult = await runFeedSource(s.id as string, 'cron')
    results.push({ sourceId: s.id as string, name: s.name as string, ...runResult })
  }

  const { archived } = await runTtlCleanup()
  log.info('[sync-feeds] complete', { processed: results.length, archived })

  return NextResponse.json({ ok: true, processed: results.length, results, archived })
}
