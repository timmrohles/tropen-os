import { supabaseAdmin } from '@/lib/supabase-admin'
import type { Card } from '@/db/schema'
import type { CardHistoryEntry } from '@/types/workspace-plan-c.types'

// ---------------------------------------------------------------------------
// Mapper: snake_case DB row → camelCase Card
// ---------------------------------------------------------------------------
export function mapCard(row: Record<string, unknown>): Card {
  return {
    id: row.id as string,
    workspaceId: row.workspace_id as string,
    type: row.type as Card['type'],
    title: row.title as string,
    description: (row.description as string) ?? null,
    status: row.status as Card['status'],
    model: (row.model as string) ?? null,
    positionX: (row.position_x as number) ?? 0,
    positionY: (row.position_y as number) ?? 0,
    fields: (row.fields as unknown[]) ?? [],
    sortOrder: (row.sort_order as number) ?? 0,
    createdBy: (row.created_by as string) ?? null,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
    deletedAt: row.deleted_at ? new Date(row.deleted_at as string) : null,
  }
}

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
