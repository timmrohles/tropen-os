'use server'

/**
 * NOTE: This file requires @anthropic-ai/sdk.
 * Install with: pnpm add @anthropic-ai/sdk
 * The package is not yet in package.json — add it before using this module.
 */

import Anthropic from '@anthropic-ai/sdk'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { buildWorkspaceContext, buildCardContext, buildContextSnapshot } from '@/lib/context-builder'
import type { SendMessageInput } from '@/types/chat'

// ---------------------------------------------------------------------------
// Anthropic client
// ---------------------------------------------------------------------------
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ---------------------------------------------------------------------------
// streamMessage
// ---------------------------------------------------------------------------
export async function streamMessage(input: SendMessageInput): Promise<ReadableStream> {
  const scope = input.cardId ? 'card' : 'workspace'

  // Build context snapshot
  const contextSnapshot = await buildContextSnapshot(input.workspaceId, input.cardId)

  // Insert user message
  await supabaseAdmin.from('workspace_messages').insert({
    workspace_id: input.workspaceId,
    card_id: input.cardId ?? null,
    scope: scope as 'workspace' | 'card',
    role: 'user',
    content: input.content.trim(),
    context_snapshot: contextSnapshot,
    user_id: input.userId,
  })

  // Build system prompt
  const systemPrompt = input.cardId
    ? await buildCardContext(input.cardId)
    : await buildWorkspaceContext(input.workspaceId)

  // Load last 20 messages for same scope + cardId
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

  const { data: historyMessages } = await historyQuery

  const apiMessages: { role: 'user' | 'assistant'; content: string }[] = [
    ...(historyMessages ?? []).map((m: Record<string, unknown>) => ({
      role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: m.content as string,
    })),
    { role: 'user', content: input.content.trim() },
  ]

  // Create readable stream that wraps Anthropic streaming
  return new ReadableStream({
    async start(controller) {
      let accumulatedText = ''
      let tokensInput: number | null = null
      let tokensOutput: number | null = null

      try {
        const stream = anthropic.messages.stream({
          model: 'claude-sonnet-4-6',
          system: systemPrompt,
          messages: apiMessages,
          max_tokens: 2048,
        })

        for await (const event of stream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            const chunk = event.delta.text
            accumulatedText += chunk
            controller.enqueue(new TextEncoder().encode(chunk))
          }
        }

        // Get final message for usage stats
        const finalMessage = await stream.finalMessage()
        tokensInput = finalMessage.usage?.input_tokens ?? null
        tokensOutput = finalMessage.usage?.output_tokens ?? null

        // Save complete response to DB
        await supabaseAdmin.from('workspace_messages').insert({
          workspace_id: input.workspaceId,
          card_id: input.cardId ?? null,
          scope: scope as 'workspace' | 'card',
          role: 'assistant',
          content: accumulatedText,
          context_snapshot: contextSnapshot,
          model: 'claude-sonnet-4-6',
          tokens_input: tokensInput,
          tokens_output: tokensOutput,
          user_id: input.userId,
        })

        controller.close()
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler'

        // Save error as system message
        try {
          await supabaseAdmin.from('workspace_messages').insert({
            workspace_id: input.workspaceId,
            card_id: input.cardId ?? null,
            scope: scope as 'workspace' | 'card',
            role: 'system',
            content: `Fehler beim Generieren der Antwort: ${errorMessage}`,
            context_snapshot: contextSnapshot,
            user_id: input.userId,
          })
        } catch {
          // Ignore DB error during error handling
        }

        controller.error(err)
      }
    },
  })
}
