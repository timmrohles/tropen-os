// src/lib/feeds/ttl-cleanup.ts
// Archives expired feed items.

import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'

const log = createLogger('feeds:ttl-cleanup')

export async function runTtlCleanup(): Promise<{ archived: number }> {
  const now = new Date().toISOString()

  const { data: expired } = await supabaseAdmin
    .from('feed_items')
    .select('id, summary')
    .lt('expires_at', now)
    .not('status', 'eq', 'archived')
    .not('status', 'eq', 'deleted')
    .limit(200)

  if (!expired?.length) return { archived: 0 }

  const ids = (expired as Record<string, unknown>[]).map((r) => r.id as string)

  const { error } = await supabaseAdmin
    .from('feed_items')
    .update({
      status: 'archived',
      content: null,           // free up space
    })
    .in('id', ids)

  if (error) log.error('[ttl-cleanup] update failed', { error: error.message })
  else log.info('[ttl-cleanup] archived expired items', { count: ids.length })

  return { archived: ids.length }
}
