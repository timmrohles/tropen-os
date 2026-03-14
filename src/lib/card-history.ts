import { supabaseAdmin } from '@/lib/supabase-admin'
import type { Card } from '@/db/schema'
import type { CardHistoryEntry } from '@/types/workspace-plan-c.types'

// Internal helper — NOT exported for client use.
// card_history is APPEND ONLY: never update, never delete.

export async function writeCardSnapshot(
  card: Card,
  changeReason: string,
  triggeredBy?: string,
): Promise<CardHistoryEntry> {
  const { data, error } = await supabaseAdmin
    .from('card_history')
    .insert({
      card_id: card.id,
      workspace_id: card.workspaceId,
      snapshot: card as unknown as Record<string, unknown>,
      change_reason: changeReason,
      changed_by: triggeredBy ?? null,
    })
    .select()
    .single()

  if (error) throw new Error(`writeCardSnapshot failed: ${error.message}`)
  return mapCardHistory(data)
}

// ---------------------------------------------------------------------------
// Mappers: snake_case DB → camelCase TypeScript
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
    positionX: (row.position_x as number) ?? null,
    positionY: (row.position_y as number) ?? null,
    fields: (row.fields as Record<string, unknown>[]) ?? null,
    sortOrder: (row.sort_order as number) ?? 0,
    createdBy: (row.created_by as string) ?? null,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
    deletedAt: row.deleted_at ? new Date(row.deleted_at as string) : null,
  }
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
