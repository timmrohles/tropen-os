// src/lib/feeds/feed-pause.ts
// Pause and resume feed sources (updates status + audit fields).

import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'

const log = createLogger('feeds:pause')

export async function pauseFeed(
  sourceId: string,
  pausedBy: string,
  reason?: string,
): Promise<{ error?: boolean }> {
  const { error } = await supabaseAdmin
    .from('feed_sources')
    .update({
      status: 'paused',
      paused_at: new Date().toISOString(),
      paused_by: pausedBy,
      pause_reason: reason ?? null,
    })
    .eq('id', sourceId)

  if (error) {
    log.error('[pause] failed to pause feed', { sourceId, error: error.message })
    return { error: true }
  }

  log.info('[pause] feed paused', { sourceId, pausedBy })
  return {}
}

export async function resumeFeed(sourceId: string): Promise<{ error?: boolean }> {
  const { error } = await supabaseAdmin
    .from('feed_sources')
    .update({
      status: 'active',
      paused_at: null,
      paused_by: null,
      pause_reason: null,
    })
    .eq('id', sourceId)

  if (error) {
    log.error('[pause] failed to resume feed', { sourceId, error: error.message })
    return { error: true }
  }

  log.info('[pause] feed resumed', { sourceId })
  return {}
}
