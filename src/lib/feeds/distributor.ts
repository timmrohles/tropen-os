// src/lib/feeds/distributor.ts
// After Stage 3, inject high-scoring items into linked projects/workspaces.

import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'

const log = createLogger('feeds:distributor')

export async function distributeItem(itemId: string): Promise<void> {
  const { data: item } = await supabaseAdmin
    .from('feed_items')
    .select('source_id, score, stage, title, summary, key_facts, url')
    .eq('id', itemId)
    .maybeSingle()

  if (!item || (item as Record<string, unknown>).stage as number < 3) return

  const src = item as Record<string, unknown>

  const { data: dists } = await supabaseAdmin
    .from('feed_distributions')
    .select('*')
    .eq('source_id', src.source_id as string)
    .eq('auto_inject', true)

  for (const dist of dists ?? []) {
    const d = dist as Record<string, unknown>
    if ((src.score as number) < (d.min_score as number)) continue

    if (d.target_type === 'workspace') {
      const content = [
        src.summary,
        ...(Array.isArray(src.key_facts) ? (src.key_facts as string[]).map((f) => `• ${f}`) : []),
        src.url ? `Quelle: ${src.url}` : '',
      ].filter(Boolean).join('\n')

      const { error } = await supabaseAdmin.from('knowledge_entries').insert({
        workspace_id: d.target_id,
        title: src.title,
        content,
        source_url: src.url ?? null,
        entry_type: 'feed',
      })
      if (error) log.error('[distributor] workspace inject failed', { error: error.message })
    }
    // project inject: add to project_knowledge (Plan D — not yet implemented)
  }
}
