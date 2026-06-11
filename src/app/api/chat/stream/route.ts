export const maxDuration = 60
import { NextResponse } from 'next/server'
import { streamText } from 'ai'
import { anthropic } from '@/lib/llm/anthropic'
import { withAuth } from '@/lib/auth/route-guards'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { buildWorkspaceContext, buildCardContext, buildContextSnapshot, buildPresentationContext } from '@/lib/context-builder'
import { resolveWorkflow } from '@/lib/capability-resolver'
import { logRoutingDecision } from '@/lib/qa/routing-logger'
import { selectModel } from '@/lib/model-selector'
import { checkBudget, budgetExhaustedResponse } from '@/lib/budget'
import { apiError } from '@/lib/api-error'

const { modelId: DEFAULT_MODEL } = selectModel('chat')

type StreamBody = {
  workspaceId:   string
  cardId?:       string
  content:       string
  capabilityId?: string
  outcomeId?:    string
  mode?:         'presentation'
}

async function resolveCapabilityModel(
  capabilityId: string | undefined,
  outcomeId: string | undefined,
  userId: string,
  orgId: string
): Promise<{ modelId: string; systemPrompt: string | null }> {
  if (!capabilityId || !outcomeId) {
    return { modelId: DEFAULT_MODEL, systemPrompt: null }
  }
  try {
    const plan = await resolveWorkflow(capabilityId, outcomeId, userId, orgId)
    if (plan.available) {
      return { modelId: plan.model_id, systemPrompt: plan.system_prompt }
    }
  } catch {
    // non-blocking — fall back to default model
  }
  return { modelId: DEFAULT_MODEL, systemPrompt: null }
}

async function buildSystemPrompt(
  workspaceId: string,
  cardId: string | undefined,
  mode: 'presentation' | undefined,
  capabilitySystemPrompt: string | null
): Promise<string> {
  const baseSystemPrompt = cardId
    ? await buildCardContext(cardId)
    : mode === 'presentation'
      ? await buildPresentationContext(workspaceId)
      : await buildWorkspaceContext(workspaceId)
  // Both prompts are DB-sourced (admin-controlled), not user input — safe to concatenate
  return [capabilitySystemPrompt, baseSystemPrompt].filter(Boolean).join('\n\n')
}

async function loadHistory(
  workspaceId: string,
  cardId: string | undefined,
  scope: 'card' | 'workspace'
): Promise<{ role: 'user' | 'assistant'; content: string }[]> {
  let query = supabaseAdmin
    .from('workspace_messages')
    .select()
    .eq('workspace_id', workspaceId)
    .eq('scope', scope)
    .order('created_at', { ascending: true })
    .limit(20)

  if (cardId) {
    query = query.eq('card_id', cardId)
  } else {
    query = query.is('card_id', null)
  }

  const { data } = await query
  return (data ?? []).map((m: Record<string, unknown>) => ({
    role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
    content: m.content as string,
  }))
}

async function saveAssistantMessage(
  workspaceId: string,
  cardId: string | undefined,
  scope: 'card' | 'workspace',
  content: string,
  contextSnapshot: unknown,
  tokensInput: number | null,
  tokensOutput: number | null,
  userId: string
): Promise<void> {
  await supabaseAdmin.from('workspace_messages').insert({
    workspace_id: workspaceId,
    card_id: cardId ?? null,
    scope,
    role: 'assistant',
    content,
    context_snapshot: contextSnapshot,
    model: 'claude-sonnet-4.6',
    tokens_input: tokensInput,
    tokens_output: tokensOutput,
    user_id: userId,
  })
}

async function saveErrorMessage(
  workspaceId: string,
  cardId: string | undefined,
  scope: 'card' | 'workspace',
  contextSnapshot: unknown,
  userId: string
): Promise<void> {
  try {
    await supabaseAdmin.from('workspace_messages').insert({
      workspace_id: workspaceId,
      card_id: cardId ?? null,
      scope,
      role: 'system',
      content: 'Es ist ein Fehler aufgetreten. Bitte versuche es erneut.',
      context_snapshot: contextSnapshot,
      user_id: userId,
    })
  } catch {
    // Ignore DB error during error handling
  }
}

export const POST = withAuth(async (req, { auth }) => {
  let body: StreamBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { workspaceId, cardId, content, capabilityId, outcomeId, mode } = body
  const userId = auth.id

  if (!workspaceId || !content) {
    return NextResponse.json({ error: 'workspaceId and content are required' }, { status: 400 })
  }

  const budget = await checkBudget(auth.organization_id, 'claude-sonnet', workspaceId)
  if (!budget.allowed) return budgetExhaustedResponse(budget.reason)

  try {
    const scope = cardId ? 'card' : 'workspace'
    const contextSnapshot = await buildContextSnapshot(workspaceId, cardId)

    await supabaseAdmin.from('workspace_messages').insert({
      workspace_id: workspaceId,
      card_id: cardId ?? null,
      scope: scope as 'workspace' | 'card',
      role: 'user',
      content: content.trim(),
      context_snapshot: contextSnapshot,
      user_id: userId,
    })

    const { modelId, systemPrompt: capabilitySystemPrompt } = await resolveCapabilityModel(
      capabilityId, outcomeId, auth.id, auth.organization_id
    )
    const systemPrompt = await buildSystemPrompt(workspaceId, cardId, mode, capabilitySystemPrompt)
    const historyMessages = await loadHistory(workspaceId, cardId, scope as 'card' | 'workspace')

    const apiMessages: { role: 'user' | 'assistant'; content: string }[] = [
      ...historyMessages,
      { role: 'user', content: content.trim() },
    ]

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

          await saveAssistantMessage(
            workspaceId, cardId, scope as 'card' | 'workspace',
            accumulatedText, contextSnapshot, tokensInput, tokensOutput, userId
          )

          logRoutingDecision({
            taskType, modelSelected: modelId, routingReason,
            latencyMs: Date.now() - streamStart, status: 'success', userId,
          })

          controller.close()
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler'

          logRoutingDecision({
            taskType, modelSelected: modelId, routingReason,
            latencyMs: Date.now() - streamStart, status: 'error', errorMessage, userId,
          })

          await saveErrorMessage(workspaceId, cardId, scope as 'card' | 'workspace', contextSnapshot, userId)
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
    return apiError(err)
  }
})
