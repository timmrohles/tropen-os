// src/lib/feeds/token-budget.ts
// Budget check before Stage 2/3 calls.
// Reads feed_processing_log to estimate monthly token usage.

import { supabaseAdmin } from '@/lib/supabase-admin'

export async function checkBudget(sourceId: string): Promise<{
  withinBudget: boolean
  usedTokens: number
}> {
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const { data: rows } = await supabaseAdmin
    .from('feed_processing_log')
    .select('tokens_input, tokens_output')
    .eq('source_id', sourceId)
    .gte('processed_at', monthStart.toISOString())

  const usedTokens = (rows ?? []).reduce(
    (sum: number, r: Record<string, unknown>) =>
      sum + (r.tokens_input as number || 0) + (r.tokens_output as number || 0),
    0
  )

  // Default budget: 500k tokens/month per source
  const budgetTokens = 500_000
  return { withinBudget: usedTokens < budgetTokens, usedTokens }
}
