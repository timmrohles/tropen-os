import { supabaseAdmin } from '@/lib/supabase-admin'
import type { CardHistoryEntry } from '@/types/workspace-plan-c.types'

// Internal helper — NOT exported for client use.
// card_history is APPEND ONLY: never update, never delete.

// Accepts a raw snake_case DB row — keeps the stored snapshot faithful to
// the actual DB state without requiring a typed intermediary.
export async function writeCardSnapshot(
  card: Record<string, unknown>,
  changeReason: string,
  changedBy?: string,
): Promise<CardHistoryEntry> {
  const { data, error } = await supabaseAdmin
    .from('card_history')
    .insert({
      card_id: card['id'] as string,
      workspace_id: card['workspace_id'] as string,
      snapshot: card,
      change_reason: changeReason,
      changed_by: changedBy ?? null,
    })
    .select()
    .single()

  if (error) throw new Error(`writeCardSnapshot failed: ${error.message}`)
  return mapCardHistory(data)
}

export function mapCardHistory(row: Record<string, unknown>): CardHistoryEntry {
  return {
    id: row.id as string,
    cardId: row.card_id as string,
    workspaceId: (row.workspace_id as string) ?? null,
    snapshot: (row.snapshot as Record<string, unknown>) ?? {},
    changedBy: (row.changed_by as string) ?? null,
    changeReason: (row.change_reason as string) ?? null,
    createdAt: row.created_at as string,
  }
}
