'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import type { Card } from '@/db/schema'
import type { CardHistoryEntry } from '@/types/workspace-plan-c.types'
import { createCardSchema, updateCardSchema } from '@/lib/validators/cards'
import { writeCardSnapshot, mapCard, mapCardHistory } from '@/lib/card-history'
import type { CardField, CardWithHistory } from '@/types/cards'
import { AppError } from '@/lib/errors'

// ---------------------------------------------------------------------------
// createCard
// ---------------------------------------------------------------------------
export async function createCard(input: unknown): Promise<Card> {
  const parsed = createCardSchema.parse(input)

  const { data: newCard, error } = await supabaseAdmin
    .from('cards')
    .insert({
      workspace_id: parsed.workspaceId,
      type: parsed.type,
      title: parsed.title,
      description: parsed.description ?? null,
      status: parsed.status,
      model: parsed.model,
      position_x: parsed.positionX,
      position_y: parsed.positionY,
      fields: parsed.fields as unknown as Record<string, unknown>[],
      sort_order: parsed.sortOrder ?? 0,
      created_by: parsed.createdBy,
    })
    .select()
    .single()

  if (error) throw new Error(`createCard failed: ${error.message}`)
  const card = mapCard(newCard)
  await writeCardSnapshot(card, 'created', parsed.createdBy)
  return card
}

// ---------------------------------------------------------------------------
// getCard
// ---------------------------------------------------------------------------
export async function getCard(id: string): Promise<CardWithHistory> {
  const { data: cardRow, error } = await supabaseAdmin
    .from('cards')
    .select()
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error || !cardRow) throw new AppError('Card not found', 'NOT_FOUND', 404)
  const card = mapCard(cardRow)

  const { data: historyRows } = await supabaseAdmin
    .from('card_history')
    .select()
    .eq('card_id', id)
    .order('created_at', { ascending: false })
    .limit(10)

  const recentHistory = (historyRows ?? []).map(mapCardHistory)
  return { ...card, recentHistory }
}

// ---------------------------------------------------------------------------
// listCards
// ---------------------------------------------------------------------------
export async function listCards(workspaceId: string): Promise<Card[]> {
  const { data, error } = await supabaseAdmin
    .from('cards')
    .select()
    .eq('workspace_id', workspaceId)
    .is('deleted_at', null)
    .neq('status', 'archived')
    .order('sort_order', { ascending: true })
    .order('position_y', { ascending: true })

  if (error) throw new Error(`listCards failed: ${error.message}`)
  return (data ?? []).map(mapCard)
}

// ---------------------------------------------------------------------------
// updateCard
// ---------------------------------------------------------------------------
export async function updateCard(
  id: string,
  input: unknown,
  userId: string,
  changeReason?: string
): Promise<Card> {
  const parsed = updateCardSchema.parse(input)

  const { data: currentRow, error: fetchError } = await supabaseAdmin
    .from('cards')
    .select()
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (fetchError || !currentRow) throw new AppError('Card not found', 'NOT_FOUND', 404)
  const currentCard = mapCard(currentRow)
  await writeCardSnapshot(currentCard, changeReason ?? 'updated', userId)

  const updateValues: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (parsed.title !== undefined) updateValues.title = parsed.title
  if (parsed.description !== undefined) updateValues.description = parsed.description
  if (parsed.status !== undefined) updateValues.status = parsed.status
  if (parsed.model !== undefined) updateValues.model = parsed.model
  if (parsed.fields !== undefined) updateValues.fields = parsed.fields
  if (parsed.sortOrder !== undefined) updateValues.sort_order = parsed.sortOrder

  const { data: updatedRow, error: updateError } = await supabaseAdmin
    .from('cards')
    .update(updateValues)
    .eq('id', id)
    .select()
    .single()

  if (updateError || !updatedRow) throw new Error(`updateCard failed: ${updateError?.message}`)
  return mapCard(updatedRow)
}

// ---------------------------------------------------------------------------
// updateCardField
// ---------------------------------------------------------------------------
export async function updateCardField(
  cardId: string,
  fieldKey: string,
  value: string,
  userId: string
): Promise<Card> {
  const { data: cardRow, error: fetchError } = await supabaseAdmin
    .from('cards')
    .select()
    .eq('id', cardId)
    .is('deleted_at', null)
    .single()

  if (fetchError || !cardRow) throw new AppError('Card not found', 'NOT_FOUND', 404)
  const card = mapCard(cardRow)

  const now = new Date().toISOString()
  const existingFields = (card.fields ?? []) as CardField[]
  const fieldIndex = existingFields.findIndex((f) => f.key === fieldKey)

  let updatedFields: CardField[]
  if (fieldIndex >= 0) {
    updatedFields = existingFields.map((f, i) =>
      i === fieldIndex ? { ...f, value, updatedAt: now } : f
    )
  } else {
    updatedFields = [...existingFields, { key: fieldKey, label: fieldKey, value, updatedAt: now }]
  }

  await writeCardSnapshot(card, `field updated: ${fieldKey}`, userId)

  const { data: updatedRow, error: updateError } = await supabaseAdmin
    .from('cards')
    .update({ fields: updatedFields as unknown as Record<string, unknown>[], updated_at: new Date().toISOString() })
    .eq('id', cardId)
    .select()
    .single()

  if (updateError || !updatedRow) throw new Error(`updateCardField failed: ${updateError?.message}`)
  return mapCard(updatedRow)
}

// ---------------------------------------------------------------------------
// updateCardStatus
// ---------------------------------------------------------------------------
export async function updateCardStatus(
  cardId: string,
  status: Card['status'],
  userId: string
): Promise<Card> {
  const { data: cardRow, error: fetchError } = await supabaseAdmin
    .from('cards')
    .select()
    .eq('id', cardId)
    .is('deleted_at', null)
    .single()

  if (fetchError || !cardRow) throw new AppError('Card not found', 'NOT_FOUND', 404)
  const card = mapCard(cardRow)
  await writeCardSnapshot(card, `status: ${card.status} → ${status}`, userId)

  const { data: updatedRow, error: updateError } = await supabaseAdmin
    .from('cards')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', cardId)
    .select()
    .single()

  if (updateError || !updatedRow) throw new Error(`updateCardStatus failed: ${updateError?.message}`)
  return mapCard(updatedRow)
}

// ---------------------------------------------------------------------------
// updateCardPosition — no history snapshot
// ---------------------------------------------------------------------------
export async function updateCardPosition(
  cardId: string,
  x: number,
  y: number
): Promise<{ id: string; positionX: number; positionY: number }> {
  const { data, error } = await supabaseAdmin
    .from('cards')
    .update({ position_x: x, position_y: y, updated_at: new Date().toISOString() })
    .eq('id', cardId)
    .select('id, position_x, position_y')
    .single()

  if (error || !data) throw new AppError('Card not found', 'NOT_FOUND', 404)
  return { id: data.id, positionX: data.position_x, positionY: data.position_y }
}

// ---------------------------------------------------------------------------
// archiveCard
// ---------------------------------------------------------------------------
export async function archiveCard(cardId: string, userId: string): Promise<Card> {
  const { data: cardRow, error: fetchError } = await supabaseAdmin
    .from('cards')
    .select()
    .eq('id', cardId)
    .is('deleted_at', null)
    .single()

  if (fetchError || !cardRow) throw new AppError('Card not found', 'NOT_FOUND', 404)
  const card = mapCard(cardRow)
  await writeCardSnapshot(card, 'archived', userId)

  const { data: updatedRow, error: updateError } = await supabaseAdmin
    .from('cards')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('id', cardId)
    .select()
    .single()

  if (updateError || !updatedRow) throw new Error(`archiveCard failed: ${updateError?.message}`)
  return mapCard(updatedRow)
}

// ---------------------------------------------------------------------------
// getCardHistory
// ---------------------------------------------------------------------------
export async function getCardHistory(
  cardId: string,
  options?: { from?: Date; to?: Date; limit?: number }
): Promise<CardHistoryEntry[]> {
  const limit = options?.limit ?? 50

  let query = supabaseAdmin
    .from('card_history')
    .select()
    .eq('card_id', cardId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (options?.from) query = query.gte('created_at', options.from.toISOString())
  if (options?.to) query = query.lte('created_at', options.to.toISOString())

  const { data, error } = await query
  if (error) throw new Error(`getCardHistory failed: ${error.message}`)
  return (data ?? []).map(mapCardHistory)
}

// ---------------------------------------------------------------------------
// getCardSnapshot
// ---------------------------------------------------------------------------
export async function getCardSnapshot(
  cardId: string,
  at: Date
): Promise<CardHistoryEntry | null> {
  const { data } = await supabaseAdmin
    .from('card_history')
    .select()
    .eq('card_id', cardId)
    .lte('created_at', at.toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return data ? mapCardHistory(data) : null
}
