export const maxDuration = 60
import { NextResponse } from 'next/server'
import { streamText } from 'ai'
import { anthropic } from '@/lib/llm/anthropic'
import { withPreflightProjectAccess } from '@/lib/auth/route-guards'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { ensurePreflightConversation } from '@/lib/api/preflight'
import { buildPreflightSystemPrompt } from '@/lib/preflight/system-prompt'
import { checkBudget, budgetExhaustedResponse } from '@/lib/budget'
import { selectModel } from '@/lib/model-selector'
import { apiError } from '@/lib/api-error'

const { modelId: MODEL } = selectModel('chat')

// GET — Verlauf der Pre-Flight-Conversation (initiales Laden des Surface)
export const GET = withPreflightProjectAccess(async (_req, { preflightProject: project }) => {
  if (!project.conversation_id) return NextResponse.json({ messages: [] })
  const { data, error } = await supabaseAdmin
    .from('messages')
    .select('role, content, created_at')
    .eq('conversation_id', project.conversation_id)
    .order('created_at', { ascending: true })
    .limit(100)
  if (error) return apiError(error)
  return NextResponse.json({ messages: data ?? [] })
})

// POST — eine User-Nachricht → Toro streamt; beide Nachrichten persistiert
export const POST = withPreflightProjectAccess(async (req, { auth, preflightProject: project }) => {
  let body: { content?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Ungültiger JSON-Body' }, { status: 400 }) }
  const content = (body.content ?? '').trim()
  if (!content) return NextResponse.json({ error: 'content fehlt' }, { status: 400 })

  const budget = await checkBudget(auth.organization_id, 'claude-sonnet')
  if (!budget.allowed) return budgetExhaustedResponse(budget.reason)

  const conversationId = await ensurePreflightConversation(
    { id: project.id, name: project.name, conversation_id: project.conversation_id }, auth.id,
  )

  await supabaseAdmin.from('messages').insert({
    conversation_id: conversationId, role: 'user', content, task_type: 'chat',
  })

  const { data: hist } = await supabaseAdmin
    .from('messages').select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true }).limit(20)
  const apiMessages = (hist ?? []).map((m: { role: string; content: string }) => ({
    role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
    content: m.content,
  }))

  const system = buildPreflightSystemPrompt({ name: project.name, pivots: project.pivots })
  const encoder = new TextEncoder()
  let acc = ''

  const readable = new ReadableStream({
    async start(controller) {
      try {
        const result = streamText({ model: anthropic(MODEL), system, messages: apiMessages, maxOutputTokens: 2048 })
        for await (const chunk of result.textStream) { acc += chunk; controller.enqueue(encoder.encode(chunk)) }
        const usage = await result.usage
        await supabaseAdmin.from('messages').insert({
          conversation_id: conversationId, role: 'assistant', content: acc, model_used: MODEL,
          task_type: 'chat', tokens_input: usage.inputTokens ?? null, tokens_output: usage.outputTokens ?? null,
        })
        controller.close()
      } catch (err) { controller.error(err) }
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Transfer-Encoding': 'chunked', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' },
  })
})
