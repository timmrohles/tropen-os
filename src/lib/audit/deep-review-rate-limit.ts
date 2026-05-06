// src/lib/audit/deep-review-rate-limit.ts
// Rate-Limiting für Deep Review: 24h Cooldown + 10 Invocations/Monat pro User.
// Server-only — supabaseAdmin darf nie im Client genutzt werden.

import { supabaseAdmin } from '@/lib/supabase-admin'

export interface RateLimitStatus {
  allowed: boolean
  reason?: 'cooldown' | 'monthly-limit'
  cooldownExpires?: string  // ISO string
  usedThisMonth: number
  monthlyLimit: number
}

const MONTHLY_LIMIT = 10
const COOLDOWN_MS = 24 * 60 * 60 * 1000

export async function checkDeepReviewRateLimit(userId: string): Promise<RateLimitStatus> {
  const now = new Date()
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const dayAgo = new Date(now.getTime() - COOLDOWN_MS)

  const { data: recentRuns } = await supabaseAdmin
    .from('deep_review_invocations')
    .select('invoked_at')
    .eq('user_id', userId)
    .gte('invoked_at', monthAgo.toISOString())
    .order('invoked_at', { ascending: false })

  const allRuns = recentRuns ?? []
  const usedThisMonth = allRuns.length

  if (usedThisMonth >= MONTHLY_LIMIT) {
    return { allowed: false, reason: 'monthly-limit', usedThisMonth, monthlyLimit: MONTHLY_LIMIT }
  }

  const lastRun = allRuns[0]
  if (lastRun && new Date(lastRun.invoked_at) > dayAgo) {
    const expires = new Date(new Date(lastRun.invoked_at).getTime() + COOLDOWN_MS)
    return { allowed: false, reason: 'cooldown', cooldownExpires: expires.toISOString(), usedThisMonth, monthlyLimit: MONTHLY_LIMIT }
  }

  return { allowed: true, usedThisMonth, monthlyLimit: MONTHLY_LIMIT }
}

export async function recordDeepReviewInvocation(userId: string, runId: string, costEur?: number): Promise<void> {
  await supabaseAdmin.from('deep_review_invocations').insert({
    user_id: userId,
    run_id: runId,
    cost_eur: costEur ?? null,
  })
}
