import { NextRequest, NextResponse } from 'next/server'
import { streamText } from 'ai'
import { anthropic } from '@/lib/llm/anthropic'
import { getAuthUser } from '@/lib/api/projects'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { buildWorkspaceContext, buildCardContext, buildContextSnapshot } from '@/lib/context-builder'
import { resolveWorkflow } from '@/lib/capability-resolver'
import { logRoutingDecision } from '@/lib/qa/routing-logger'
import { selectModel } from '@/lib/model-selector'

const { modelId: DEFAULT_MODEL } = selectModel('chat')

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

    const routingReason = capabilityId ? `capability:${capabilityId}` : 'direct'
    const taskType = cardId ? 'card-chat' : 'workspace-chat'
    const streamStart = Date.now()

    const encoder = new TextEncoder()

    const readable = new ReadableStream({
      async start(controller) {
        try {
          const result = streamText({
            model: anthropic(modelId),
            system: systemPrompt,
            messages: apiMessages,
            maxOutputTokens: 2048,
          })

          for await (const chunk of result.textStream) {
            accumulatedText += chunk
            controller.enqueue(encoder.encode(chunk))
          }

          const usage = await result.usage
          tokensInput = usage.inputTokens ?? null
          tokensOutput = usage.outputTokens ?? null

          // Save complete response to DB
          await supabaseAdmin.from('workspace_messages').insert({
            workspace_id: workspaceId,
            card_id: cardId ?? null,
            scope: scope as 'workspace' | 'card',
            role: 'assistant',
            content: accumulatedText,
            context_snapshot: contextSnapshot,
            model: 'claude-sonnet-4.6',
            tokens_input: tokensInput,
            tokens_output: tokensOutput,
            user_id: userId,
          })

          logRoutingDecision({
            taskType,
            modelSelected: modelId,
            routingReason,
            latencyMs: Date.now() - streamStart,
            status: 'success',
            userId,
          })

          controller.close()
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler'

          logRoutingDecision({
            taskType,
            modelSelected: modelId,
            routingReason,
            latencyMs: Date.now() - streamStart,
            status: 'error',
            errorMessage,
            userId,
          })

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
