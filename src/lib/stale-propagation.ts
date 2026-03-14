// src/lib/stale-propagation.ts
// Marks DIRECT dependent cards as stale when a source card changes.
// NOT recursive — only one hop.
// Called from PATCH /api/workspaces/[id]/cards/[cid] after writeCardSnapshot.

import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'

const log = createLogger('stale-propagation')

/**
 * Find all cards that have a connection FROM changedCardId TO them,
 * and mark each as status='stale'.
 */
export async function markDirectDepsStale(
  workspaceId: string,
  changedCardId: string,
  staleReason: string
): Promise<void> {
  // 1. Find direct dependents (cards that receive from changedCardId)
  const { data: connections, error: connErr } = await supabaseAdmin
    .from('connections')
    .select('target_card_id')
    .eq('workspace_id', workspaceId)
    .eq('source_card_id', changedCardId)

  if (connErr) {
    log.error('[stale-propagation] connection lookup failed', { error: connErr.message, changedCardId })
    return
  }

  const depIds = (connections ?? []).map((c: Record<string, unknown>) => c.target_card_id as string)
  if (depIds.length === 0) return

  // 2. Mark all dependents as stale
  const { error: updateErr } = await supabaseAdmin
    .from('cards')
    .update({
      status: 'stale',
      stale_since: new Date().toISOString(),
      stale_reason: staleReason,
      updated_at: new Date().toISOString(),
    })
    .in('id', depIds)

  if (updateErr) {
    log.error('[stale-propagation] update failed', { error: updateErr.message, depIds })
    return
  }

  log.info('[stale-propagation] marked deps stale', { changedCardId, count: depIds.length })
}
