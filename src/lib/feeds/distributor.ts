// src/lib/feeds/distributor.ts
// After Stage 3, inject high-scoring items into linked projects/workspaces/notifications.

import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'

const log = createLogger('feeds:distributor')

function buildContent(src: Record<string, unknown>): string {
  return [
    src.summary,
    ...(Array.isArray(src.key_facts) ? (src.key_facts as string[]).map((f) => `• ${f}`) : []),
    src.url ? `Quelle: ${src.url}` : '',
  ].filter(Boolean).join('\n')
}

export async function distributeItem(itemId: string): Promise<void> {
  const src = await fetchDistributableItem(itemId)
  if (!src) return

  const dists = await fetchActiveDists(src.source_id as string)
  if (dists.length === 0) return

  const orgUsers = await fetchOrgUsersIfNeeded(dists, src.organization_id as string)
  const batches = buildInsertBatches(dists, src, itemId, orgUsers)
  await flushBatches(batches)
}

// ---------------------------------------------------------------------------
// Helpers (extracted to reduce CC of distributeItem)
// ---------------------------------------------------------------------------

async function fetchDistributableItem(itemId: string): Promise<Record<string, unknown> | null> {
  const { data: item } = await supabaseAdmin
    .from('feed_items')
    .select('source_id, organization_id, score, stage, title, summary, key_facts, url')
    .eq('id', itemId)
    .maybeSingle()
  if (!item || (item as Record<string, unknown>).stage as number < 3) return null
  return item as Record<string, unknown>
}

async function fetchActiveDists(sourceId: string): Promise<Array<Record<string, unknown>>> {
  const { data } = await supabaseAdmin
    .from('feed_distributions')
    .select('*')
    .eq('source_id', sourceId)
    .eq('auto_inject', true)
  return (data ?? []) as Array<Record<string, unknown>>
}

async function fetchOrgUsersIfNeeded(
  dists: Array<Record<string, unknown>>,
  organizationId: string,
): Promise<Array<Record<string, unknown>>> {
  const needsNotification = dists.some(d => d.target_type === 'notification')
  if (!needsNotification) return []
  const { data } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('organization_id', organizationId)
  return (data as Array<Record<string, unknown>> | null) ?? []
}

interface InsertBatches {
  workspace: Array<Record<string, unknown>>
  notification: Array<Record<string, unknown>>
  project: Array<Record<string, unknown>>
}

function buildInsertBatches(
  dists: Array<Record<string, unknown>>,
  src: Record<string, unknown>,
  itemId: string,
  orgUsers: Array<Record<string, unknown>>,
): InsertBatches {
  const batches: InsertBatches = { workspace: [], notification: [], project: [] }

  for (const d of dists) {
    if ((src.score as number) < (d.min_score as number)) continue
    collectDistInsert(d, src, itemId, orgUsers, batches)
  }

  return batches
}

function collectDistInsert(
  d: Record<string, unknown>,
  src: Record<string, unknown>,
  itemId: string,
  orgUsers: Array<Record<string, unknown>>,
  batches: InsertBatches,
): void {
  if (d.target_type === 'workspace') {
    batches.workspace.push({
      workspace_id: d.target_id,
      title: src.title,
      content: buildContent(src),
      source_url: src.url ?? null,
      entry_type: 'feed',
    })
    return
  }
  if (d.target_type === 'notification') {
    for (const u of orgUsers) {
      batches.notification.push({
        organization_id: src.organization_id as string,
        user_id: u.id as string,
        source_id: src.source_id as string,
        item_id: itemId,
        type: 'new_item',
        title: src.title as string,
        body: (src.summary as string) ?? null,
      })
    }
    return
  }
  if (d.target_type === 'project') {
    batches.project.push({
      project_id: d.target_id,
      organization_id: src.organization_id,
      content: buildContent(src),
      memory_type: 'feed_item',
      source_url: src.url ?? null,
      metadata: { feed_source_id: src.source_id, item_id: itemId, title: src.title },
    })
  }
}

async function flushBatches(batches: InsertBatches): Promise<void> {
  if (batches.workspace.length > 0) {
    const { error } = await supabaseAdmin.from('knowledge_entries').insert(batches.workspace)
    if (error) log.error('[distributor] workspace inject failed', { error: error.message })
  }
  if (batches.notification.length > 0) {
    const { error } = await supabaseAdmin.from('feed_notifications').insert(batches.notification)
    if (error) log.error('[distributor] notification insert failed', { error: error.message })
  }
  if (batches.project.length > 0) {
    const { error } = await supabaseAdmin.from('project_memory').insert(batches.project)
    if (error) log.error('[distributor] project memory inject failed', { error: error.message })
  }
}
