import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getAuthUser } from '@/lib/api/projects'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { buildWorkspaceContext, buildCardContext, buildContextSnapshot } from '@/lib/context-builder'
import { resolveWorkflow } from '@/lib/capability-resolver'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const DEFAULT_MODEL = 'claude-sonnet-4-20250514'

export async function POST(req: NextRequest) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: {
    workspaceId:   string
    cardId?:       string
    content:       string
    capabilityId?: string
    outcomeId?:    string
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { workspaceId, cardId, content, capabilityId, outcomeId } = body
  const userId = me.id

  if (!workspaceId || !content) {
    return NextResponse.json(
      { error: 'workspaceId and content are required' },
      { status: 400 },
    )
  }

  try {
    const scope = cardId ? 'card' : 'workspace'

    // Build context snapshot
    const contextSnapshot = await buildContextSnapshot(workspaceId, cardId)

    // Insert user message
    await supabaseAdmin.from('workspace_messages').insert({
      workspace_id: workspaceId,
      card_id: cardId ?? null,
      scope: scope as 'workspace' | 'card',
      role: 'user',
      content: content.trim(),
      context_snapshot: contextSnapshot,
      user_id: userId,
    })

    // Capability + Outcome routing (optional — falls back to DEFAULT_MODEL)
    let modelId = DEFAULT_MODEL
    let capabilitySystemPrompt: string | null = null
    if (capabilityId && outcomeId) {
      try {
        const plan = await resolveWorkflow(capabilityId, outcomeId, me.id, me.organization_id)
        if (plan.available) {
          modelId = plan.model_id
          capabilitySystemPrompt = plan.system_prompt
        }
      } catch {
        // non-blocking — fall back to default model
      }
    }

    // Build system prompt
    const baseSystemPrompt = cardId
      ? await buildCardContext(cardId)
      : await buildWorkspaceContext(workspaceId)

    const systemPrompt = capabilitySystemPrompt
      ? `${capabilitySystemPrompt}\n\n${baseSystemPrompt}`
      : baseSystemPrompt

    // Load history
    let historyQuery = supabaseAdmin
      .from('workspace_messages')
      .select()
      .eq('workspace_id', workspaceId)
      .eq('scope', scope)
      .order('created_at', { ascending: true })
      .limit(20)

    if (cardId) {
      historyQuery = historyQuery.eq('card_id', cardId)
    } else {
      historyQuery = historyQuery.is('card_id', null)
    }

    const { data: historyMessages } = await historyQuery

    const apiMessages: { role: 'user' | 'assistant'; content: string }[] = [
      ...(historyMessages ?? []).map((m: Record<string, unknown>) => ({
        role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.content as string,
      })),
      { role: 'user', content: content.trim() },
    ]

    // Accumulate full response for DB save
    let accumulatedText = ''
    let tokensInput: number | null = null
    let tokensOutput: number | null = null

    const encoder = new TextEncoder()

    const readable = new ReadableStream({
      async start(controller) {
        try {
          const stream = anthropic.messages.stream({
            model: modelId,
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
              controller.enqueue(encoder.encode(chunk))
            }
          }

          const finalMessage = await stream.finalMessage()
          tokensInput = finalMessage.usage?.input_tokens ?? null
          tokensOutput = finalMessage.usage?.output_tokens ?? null

          // Save complete response to DB
          await supabaseAdmin.from('workspace_messages').insert({
            workspace_id: workspaceId,
            card_id: cardId ?? null,
            scope: scope as 'workspace' | 'card',
            role: 'assistant',
            content: accumulatedText,
            context_snapshot: contextSnapshot,
            model: 'claude-sonnet-4-6',
            tokens_input: tokensInput,
            tokens_output: tokensOutput,
            user_id: userId,
          })

          controller.close()
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler'

          try {
            await supabaseAdmin.from('workspace_messages').insert({
              workspace_id: workspaceId,
              card_id: cardId ?? null,
              scope: scope as 'workspace' | 'card',
              role: 'system',
              content: `Fehler beim Generieren der Antwort: ${errorMessage}`,
              context_snapshot: contextSnapshot,
              user_id: userId,
            })
          } catch {
            // Ignore DB error during error handling
          }

          controller.error(err)
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Interner Fehler'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
