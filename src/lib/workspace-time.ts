// src/lib/workspace-time.ts
// Time-travel: reconstruct workspace or card state at a given point in time.
// Uses context_snapshot from workspace_messages and card_history snapshots.

import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * Returns the workspace context_snapshot from the nearest message
 * sent at or before `at`.
 * Returns null if no messages exist before that time.
 */
export async function getWorkspaceAt(
  workspaceId: string,
  at: Date
): Promise<Record<string, unknown> | null> {
  const { data } = await supabaseAdmin
    .from('workspace_messages')
    .select('context_snapshot')
    .eq('workspace_id', workspaceId)
    .lte('created_at', at.toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!data?.context_snapshot) return null
  return data.context_snapshot as Record<string, unknown>
}

/**
 * Returns the card history snapshot at or before `at`.
 * Returns null if no history exists for that card before that time.
 */
export async function getCardHistoryAt(
  cardId: string,
  at: Date
): Promise<{ snapshot: Record<string, unknown>; createdAt: string } | null> {
  const { data } = await supabaseAdmin
    .from('card_history')
    .select('snapshot, created_at')
    .eq('card_id', cardId)
    .lte('created_at', at.toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!data?.snapshot) return null
  return {
    snapshot: data.snapshot as Record<string, unknown>,
    createdAt: data.created_at as string,
  }
}
