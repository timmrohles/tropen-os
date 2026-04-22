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
  const { data: item } = await supabaseAdmin
    .from('feed_items')
    .select('source_id, organization_id, score, stage, title, summary, key_facts, url')
    .eq('id', itemId)
    .maybeSingle()

  if (!item || (item as Record<string, unknown>).stage as number < 3) return

  const src = item as Record<string, unknown>

  const { data: dists } = await supabaseAdmin
    .from('feed_distributions')
    .select('*')
    .eq('source_id', src.source_id as string)
    .eq('auto_inject', true)

  // Pre-fetch org users once if any notification-type distribution exists
  const needsNotification = (dists ?? []).some(d => (d as Record<string, unknown>).target_type === 'notification')
  let orgUsers: Array<Record<string, unknown>> = []
  if (needsNotification) {
    const { data } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('organization_id', src.organization_id as string)
    orgUsers = (data as Array<Record<string, unknown>> | null) ?? []
  }

  // Accumulate inserts by type — batch after loop to avoid N+1
  const workspaceInserts: Array<Record<string, unknown>> = []
  const notificationInserts: Array<Record<string, unknown>> = []
  const projectMemoryInserts: Array<Record<string, unknown>> = []

  for (const dist of dists ?? []) {
    const d = dist as Record<string, unknown>
    if ((src.score as number) < (d.min_score as number)) continue

    if (d.target_type === 'workspace') {
      workspaceInserts.push({
        workspace_id: d.target_id,
        title: src.title,
        content: buildContent(src),
        source_url: src.url ?? null,
        entry_type: 'feed',
      })
    } else if (d.target_type === 'notification') {
      for (const u of orgUsers) {
        notificationInserts.push({
          organization_id: src.organization_id as string,
          user_id: u.id as string,
          source_id: src.source_id as string,
          item_id: itemId,
          type: 'new_item',
          title: src.title as string,
          body: (src.summary as string) ?? null,
        })
      }
    } else if (d.target_type === 'project') {
      projectMemoryInserts.push({
        project_id: d.target_id,
        organization_id: src.organization_id,
        content: buildContent(src),
        memory_type: 'feed_item',
        source_url: src.url ?? null,
        metadata: {
          feed_source_id: src.source_id,
          item_id: itemId,
          title: src.title,
        },
      })
    }
  }

  if (workspaceInserts.length > 0) {
    const { error } = await supabaseAdmin.from('knowledge_entries').insert(workspaceInserts)
    if (error) log.error('[distributor] workspace inject failed', { error: error.message })
  }
  if (notificationInserts.length > 0) {
    const { error } = await supabaseAdmin.from('feed_notifications').insert(notificationInserts)
    if (error) log.error('[distributor] notification insert failed', { error: error.message })
  }
  if (projectMemoryInserts.length > 0) {
    const { error } = await supabaseAdmin.from('project_memory').insert(projectMemoryInserts)
    if (error) log.error('[distributor] project memory inject failed', { error: error.message })
  }
}
