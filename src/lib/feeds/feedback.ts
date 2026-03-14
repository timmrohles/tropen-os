// src/lib/feeds/feedback.ts
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'

const log = createLogger('feeds:feedback')

export async function recordNotRelevant(itemId: string): Promise<void> {
  const { data: item } = await supabaseAdmin
    .from('feed_items')
    .select('source_id, organization_id')
    .eq('id', itemId)
    .maybeSingle()
  if (!item) return

  await supabaseAdmin
    .from('feed_items')
    .update({ status: 'not_relevant' })
    .eq('id', itemId)

  const { count } = await supabaseAdmin
    .from('feed_items')
    .select('id', { count: 'exact', head: true })
    .eq('source_id', item.source_id as string)
    .eq('status', 'not_relevant')

  if ((count ?? 0) % 5 === 0) {
    log.info('[feedback] threshold crossed — Stage 2 prompt will be enriched', {
      sourceId: item.source_id,
      notRelevantCount: count,
    })
  }
}
