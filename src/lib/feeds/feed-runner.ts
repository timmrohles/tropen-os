// src/lib/feeds/feed-runner.ts
// Orchestriert einen vollständigen Feed-Run: Fetch → Pipeline → Distribute → Log.
// Erstellt einen feed_runs-Eintrag und updated ihn am Ende.

import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'
import { triggerFetch } from '@/actions/feeds'
import { distributeItem } from './distributor'
import type { FeedRunError, FeedRunResult } from '@/types/feeds'

const log = createLogger('feeds:runner')

export async function runFeedSource(
  sourceId: string,
  triggeredBy: 'cron' | 'manual' | 'webhook' = 'cron',
): Promise<FeedRunResult> {
  const startedAt = Date.now()

  // ── Source laden + Pause-Check ──────────────────────────────────────────
  const { data: src } = await supabaseAdmin
    .from('feed_sources')
    .select('id, organization_id, status, name')
    .eq('id', sourceId)
    .maybeSingle()

  if (!src) {
    return {
      runId: '',
      status: 'error',
      itemsFound: 0,
      itemsScored: 0,
      itemsDistributed: 0,
      errors: [{ step: 'fetch', message: 'Source not found' }],
      durationMs: 0,
    }
  }

  const s = src as Record<string, unknown>
  const sourceStatus = (s.status as string) ?? 'active'

  if (sourceStatus === 'paused' || sourceStatus === 'archived') {
    log.info('[runner] skipping paused/archived source', { sourceId, status: sourceStatus })
    return {
      runId: '',
      status: 'error',
      itemsFound: 0,
      itemsScored: 0,
      itemsDistributed: 0,
      errors: [{ step: 'fetch', message: `Source is ${sourceStatus}` }],
      durationMs: 0,
    }
  }

  const organizationId = s.organization_id as string

  // ── feed_runs Row anlegen ────────────────────────────────────────────────
  const { data: runRow, error: runInsertErr } = await supabaseAdmin
    .from('feed_runs')
    .insert({
      source_id: sourceId,
      organization_id: organizationId,
      status: 'running',
      triggered_by: triggeredBy,
    })
    .select('id')
    .single()

  if (runInsertErr || !runRow) {
    log.error('[runner] failed to create feed_run record', { sourceId, error: runInsertErr?.message })
    // Run trotzdem — nur ohne Logging
  }

  const runId = (runRow as Record<string, unknown>)?.id as string ?? ''
  const errors: FeedRunError[] = []

  // ── Stage 1–3: Fetch + Pipeline ─────────────────────────────────────────
  let itemsFound = 0
  let itemsScored = 0

  try {
    const fetchResult = await triggerFetch(sourceId)
    itemsFound = fetchResult.itemsFound
    itemsScored = fetchResult.itemsSaved

    for (const err of fetchResult.errors) {
      errors.push({ step: 'fetch', message: err })
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    log.error('[runner] triggerFetch threw', { sourceId, error: msg })
    errors.push({ step: 'fetch', message: msg })
  }

  // ── Distribution: Stage-3-Items verteilen ───────────────────────────────
  let itemsDistributed = 0

  try {
    const { data: stage3Items } = await supabaseAdmin
      .from('feed_items')
      .select('id')
      .eq('source_id', sourceId)
      .eq('stage', 3)
      .gte('created_at', new Date(startedAt - 5_000).toISOString()) // Items dieses Runs

    for (const item of stage3Items ?? []) {
      try {
        await distributeItem((item as Record<string, unknown>).id as string)
        itemsDistributed++
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        errors.push({ step: 'distribute', message: msg, itemId: (item as Record<string, unknown>).id as string })
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    log.error('[runner] distribution query failed', { sourceId, error: msg })
    errors.push({ step: 'distribute', message: msg })
  }

  // ── feed_run abschließen ─────────────────────────────────────────────────
  const durationMs = Date.now() - startedAt
  const hasErrors = errors.length > 0
  const status = hasErrors
    ? (itemsFound > 0 ? 'partial' : 'error')
    : 'success'

  if (runId) {
    const { error: updateErr } = await supabaseAdmin
      .from('feed_runs')
      .update({
        finished_at: new Date().toISOString(),
        status,
        items_found: itemsFound,
        items_scored: itemsScored,
        items_distributed: itemsDistributed,
        errors: hasErrors ? errors : null,
        duration_ms: durationMs,
      })
      .eq('id', runId)

    if (updateErr) {
      log.error('[runner] failed to update feed_run', { runId, error: updateErr.message })
    }
  }

  log.info('[runner] run complete', { sourceId, runId, status, itemsFound, itemsScored, itemsDistributed, durationMs })

  return { runId, status, itemsFound, itemsScored, itemsDistributed, errors, durationMs }
}
