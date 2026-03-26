'use server'

import { generateText } from 'ai'
import { anthropic } from '@/lib/llm/anthropic'
import { supabaseAdmin } from '@/lib/supabase-admin'
import type { WorkspaceMessage } from '@/db/schema'
import { AppError } from '@/lib/errors'
import { buildWorkspaceContext, buildCardContext, buildContextSnapshot } from '@/lib/context-builder'
import type { SendMessageInput } from '@/types/chat'

// ---------------------------------------------------------------------------
// Mapper
// ---------------------------------------------------------------------------
function mapMessage(row: Record<string, unknown>): WorkspaceMessage {
  return {
    id: row.id as string,
    workspaceId: row.workspace_id as string,
    cardId: (row.card_id as string) ?? null,
    scope: row.scope as WorkspaceMessage['scope'],
    role: row.role as WorkspaceMessage['role'],
    content: row.content as string,
    contextSnapshot: (row.context_snapshot as Record<string, unknown>) ?? {},
    model: (row.model as string) ?? null,
    tokensInput: (row.tokens_input as number) ?? null,
    tokensOutput: (row.tokens_output as number) ?? null,
    userId: (row.user_id as string) ?? null,
    createdAt: new Date(row.created_at as string),
  }
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isValidUuid(val: string): boolean {
  return UUID_REGEX.test(val)
}

function validateSendMessageInput(input: SendMessageInput): void {
  if (!input.workspaceId || !isValidUuid(input.workspaceId)) {
    throw new AppError('VALIDATION_ERROR', 'workspaceId must be a valid UUID', 400)
  }
  if (input.cardId !== undefined && !isValidUuid(input.cardId)) {
    throw new AppError('VALIDATION_ERROR', 'cardId must be a valid UUID', 400)
  }
  if (!input.content || typeof input.content !== 'string' || input.content.trim().length < 1) {
    throw new AppError('VALIDATION_ERROR', 'content must be a non-empty string', 400)
  }
  if (!input.userId || !isValidUuid(input.userId)) {
    throw new AppError('VALIDATION_ERROR', 'userId must be a valid UUID', 400)
  }
}

// ---------------------------------------------------------------------------
// sendMessage
// ---------------------------------------------------------------------------
export async function sendMessage(input: SendMessageInput): Promise<WorkspaceMessage> {
  validateSendMessageInput(input)

  const scope = input.cardId ? 'card' : 'workspace'

  // Build context snapshot
  const contextSnapshot = await buildContextSnapshot(input.workspaceId, input.cardId)

  // Insert user message
  const { data: userMsgRow, error: userInsertError } = await supabaseAdmin
    .from('workspace_messages')
    .insert({
      workspace_id: input.workspaceId,
      card_id: input.cardId ?? null,
      scope: scope as 'workspace' | 'card',
      role: 'user',
      content: input.content.trim(),
      context_snapshot: contextSnapshot,
      user_id: input.userId,
    })
    .select()
    .single()

  if (userInsertError || !userMsgRow) throw new Error(`Failed to insert user message: ${userInsertError?.message}`)
  const userMessage = mapMessage(userMsgRow)

  try {
    // Build system prompt
    const systemPrompt = input.cardId
      ? await buildCardContext(input.cardId)
      : await buildWorkspaceContext(input.workspaceId)

    // Load last 20 messages
    let historyQuery = supabaseAdmin
      .from('workspace_messages')
      .select()
      .eq('workspace_id', input.workspaceId)
      .eq('scope', scope)
      .order('created_at', { ascending: true })
      .limit(20)

    if (input.cardId) {
      historyQuery = historyQuery.eq('card_id', input.cardId)
    } else {
      historyQuery = historyQuery.is('card_id', null)
    }

    const { data: historyRows } = await historyQuery
    const historyForApi = (historyRows ?? []).filter((m: Record<string, unknown>) => m.id !== userMessage.id)

    const apiMessages: { role: 'user' | 'assistant'; content: string }[] = [
      ...historyForApi.map((m: Record<string, unknown>) => ({
        role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.content as string,
      })),
      { role: 'user', content: input.content.trim() },
    ]

    // Call Anthropic API
    const { text: assistantText, usage } = await generateText({
      model: anthropic('claude-sonnet-4-6'),
      system: systemPrompt,
      messages: apiMessages,
      maxOutputTokens: 2048,
    })

    const tokensInput = usage.inputTokens ?? null
    const tokensOutput = usage.outputTokens ?? null

    const { data: assistantRow, error: assistantError } = await supabaseAdmin
      .from('workspace_messages')
      .insert({
        workspace_id: input.workspaceId,
        card_id: input.cardId ?? null,
        scope: scope as 'workspace' | 'card',
        role: 'assistant',
        content: assistantText,
        context_snapshot: contextSnapshot,
        model: 'claude-sonnet-4-6',
        tokens_input: tokensInput,
        tokens_output: tokensOutput,
        user_id: input.userId,
      })
      .select()
      .single()

    if (assistantError || !assistantRow) throw new Error(`Failed to insert assistant message: ${assistantError?.message}`)
    return mapMessage(assistantRow)
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler'

    const { data: sysRow } = await supabaseAdmin
      .from('workspace_messages')
      .insert({
        workspace_id: input.workspaceId,
        card_id: input.cardId ?? null,
        scope: scope as 'workspace' | 'card',
        role: 'system',
        content: `Fehler beim Generieren der Antwort: ${errorMessage}`,
        context_snapshot: contextSnapshot,
        user_id: input.userId,
      })
      .select()
      .single()

    return mapMessage(sysRow!)
  }
}

// ---------------------------------------------------------------------------
// getMessages
// ---------------------------------------------------------------------------
export async function getMessages(
  workspaceId: string,
  options?: {
    cardId?: string
    scope?: string
    limit?: number
    before?: Date
  },
): Promise<WorkspaceMessage[]> {
  const limit = options?.limit ?? 50

  let query = supabaseAdmin
    .from('workspace_messages')
    .select()
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true })
    .limit(limit)

  if (options?.cardId) query = query.eq('card_id', options.cardId)
  if (options?.scope) query = query.eq('scope', options.scope)
  if (options?.before) query = query.lt('created_at', options.before.toISOString())

  const { data, error } = await query
  if (error) throw new Error(`getMessages failed: ${error.message}`)
  return (data ?? []).map(mapMessage)
}

// ---------------------------------------------------------------------------
// getMessagesAt
// ---------------------------------------------------------------------------
export async function getMessagesAt(
  workspaceId: string,
  at: Date,
  cardId?: string,
): Promise<WorkspaceMessage[]> {
  let query = supabaseAdmin
    .from('workspace_messages')
    .select()
    .eq('workspace_id', workspaceId)
    .lt('created_at', at.toISOString())
    .order('created_at', { ascending: true })

  if (cardId) {
    query = query.eq('card_id', cardId).eq('scope', 'card')
  } else {
    query = query.eq('scope', 'workspace')
  }

  const { data } = await query
  return (data ?? []).map(mapMessage)
}

// ---------------------------------------------------------------------------
// getContextSnapshot
// ---------------------------------------------------------------------------
export async function getContextSnapshot(
  workspaceId: string,
  at: Date,
): Promise<Record<string, unknown> | null> {
  const { data } = await supabaseAdmin
    .from('workspace_messages')
    .select()
    .eq('workspace_id', workspaceId)
    .lt('created_at', at.toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!data) return null
  return (data.context_snapshot as Record<string, unknown>) ?? null
}
