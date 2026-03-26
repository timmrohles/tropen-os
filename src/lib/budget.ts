// src/lib/budget.ts
// Centralised budget enforcement helper.
// All LLM-call routes import checkBudget() before invoking any model.
// Fail-open: if the RPC itself errors we allow the call — no service outage over a DB hiccup.

import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'

const log = createLogger('budget')

// Estimated cost per request in EUR — conservative upper bounds.
// Source: CLAUDE.md pricing section.
export const ESTIMATED_COSTS = {
  'claude-sonnet': 0.004,   // ~1 K tokens in+out
  'claude-haiku':  0.0004,  // ~1 K tokens in+out
  'dall-e-3':      0.04,    // 1024×1024 standard
  'tts':           0.008,   // ~500 chars (OpenAI tts-1)
  'perspectives':  0.01,    // per avatar (Haiku × N avatars handled at call site)
} as const

export type CostType = keyof typeof ESTIMATED_COSTS

/**
 * Checks whether the organisation has remaining budget for the given cost type.
 * Calls check_and_reserve_budget(org_id, p_workspace_id, estimated_cost).
 * p_workspace_id may be null for routes without a department context.
 *
 * Returns { allowed: true } on RPC error (fail-open).
 */
export async function checkBudget(
  organizationId: string,
  costType: CostType,
  workspaceId?: string | null,
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const estimatedCost = ESTIMATED_COSTS[costType]

    const { data, error } = await supabaseAdmin.rpc('check_and_reserve_budget', {
      org_id:        organizationId,
      p_workspace_id: workspaceId ?? null,
      estimated_cost: estimatedCost,
    })

    if (error) {
      log.error('Budget RPC error — failing open', { error: error.message, organizationId, costType })
      return { allowed: true }
    }

    if (!data) {
      log.warn('Budget exhausted', { organizationId, costType })
      return {
        allowed: false,
        reason: 'Das monatliche KI-Budget dieser Organisation ist aufgebraucht. Bitte wende dich an deinen Administrator.',
      }
    }

    return { allowed: true }
  } catch (err) {
    log.error('Budget check exception — failing open', { err: String(err), organizationId })
    return { allowed: true }
  }
}

/**
 * Standard 402 response for exhausted budget.
 * Frontend should display the message to the user.
 */
export function budgetExhaustedResponse(reason?: string) {
  return Response.json(
    {
      error:   'Budget erschöpft',
      code:    'BUDGET_EXHAUSTED',
      message: reason ?? 'Das monatliche KI-Budget dieser Organisation ist aufgebraucht. Bitte wende dich an deinen Administrator.',
    },
    { status: 402 },
  )
}
