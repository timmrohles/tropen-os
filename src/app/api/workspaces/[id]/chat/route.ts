import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { anthropic as anthropicProvider } from '@/lib/llm/anthropic'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { validateBody } from '@/lib/validators'
import { getAuthUser, requireWorkspaceAccess, canWriteWorkspace } from '@/lib/api/workspaces'
import { sendChatMessageSchema } from '@/lib/validators/workspace-plan-c'
import { buildWorkspaceContext, buildCardContext, buildContextSnapshot } from '@/lib/workspace-context'
import { createLogger } from '@/lib/logger'

const log = createLogger('api:workspaces:chat')
type Params = { params: Promise<{ id: string }> }

// GET /api/workspaces/[id]/chat?card_id=...&limit=50
export async function GET(request: Request, { params }: Params) {
  const { id } = await params
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const workspace = await requireWorkspaceAccess(id, me)
  if (!workspace) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  const { searchParams } = new URL(request.url)
  const cardId = searchParams.get('card_id')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 100)

  let query = supabaseAdmin
    .from('workspace_messages')
    .select('id, workspace_id, card_id, role, content, token_usage, created_at')
    .eq('workspace_id', id)
    .order('created_at', { ascending: true })
    .limit(limit)

  query = cardId ? query.eq('card_id', cardId) : query.is('card_id', null)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data ?? [] })
}

// POST /api/workspaces/[id]/chat
export async function POST(request: Request, { params }: Params) {
  const { id } = await params
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const canWrite = await canWriteWorkspace(id, me)
  if (!canWrite) return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })

  const { data: body, error: valErr } = await validateBody(request, sendChatMessageSchema)
  if (valErr) return valErr

  // Build system prompt
  let systemPrompt: string
  try {
    systemPrompt = body.cardId
      ? await buildCardContext(body.cardId)
      : await buildWorkspaceContext(id)
  } catch (err) {
    log.error('[chat] context build failed', { error: String(err) })
    return NextResponse.json({ error: 'Kontext-Aufbau fehlgeschlagen' }, { status: 500 })
  }

  // Load recent message history (last 20)
  let historyQuery = supabaseAdmin
    .from('workspace_messages')
    .select('role, content')
    .eq('workspace_id', id)
    .order('created_at', { ascending: false })
    .limit(20)

  historyQuery = body.cardId
    ? historyQuery.eq('card_id', body.cardId)
    : historyQuery.is('card_id', null)

  const { data: histRows } = await historyQuery
  const history = ((histRows ?? []) as Array<{ role: string; content: string }>)
    .reverse()
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))

  // Call Claude
  let assistantContent = ''
  let tokenUsage: Record<string, unknown> = {}

  try {
    const { text, usage } = await generateText({
      model: anthropicProvider('claude-sonnet-4-6'),
      maxOutputTokens: 2048,
      system: systemPrompt,
      messages: [
        ...history,
        { role: 'user', content: body.content },
      ],
    })
    assistantContent = text
    tokenUsage = { input: usage.inputTokens, output: usage.outputTokens }
  } catch (err) {
    log.error('[chat] Anthropic call failed', { error: String(err) })
    return NextResponse.json({ error: 'KI-Antwort fehlgeschlagen' }, { status: 500 })
  }

  // Build context snapshot with actual workspace data
  let contextSnapshot: Record<string, unknown> = {}
  try {
    const [{ data: wsData }, { data: cardData }] = await Promise.all([
      supabaseAdmin.from('workspaces').select('title, goal, status').eq('id', id).maybeSingle(),
      supabaseAdmin.from('cards').select('id, title, role, status').eq('workspace_id', id).is('deleted_at', null),
    ])
    if (wsData && cardData) {
      contextSnapshot = buildContextSnapshot(
        id,
        wsData as { title: string; goal: string | null; status: 'draft' | 'active' | 'exported' | 'locked' },
        cardData as Array<{ id: string; title: string; role: 'input' | 'process' | 'output'; status: 'draft' | 'ready' | 'stale' | 'processing' | 'error' }>,
        body.cardId
      )
    }
  } catch {
    // Non-fatal — empty snapshot is acceptable fallback
  }

  // Save both messages
  const { error: saveErr } = await supabaseAdmin.from('workspace_messages').insert([
    {
      workspace_id: id,
      card_id: body.cardId ?? null,
      role: 'user',
      content: body.content,
      context_snapshot: contextSnapshot,
      token_usage: null,
    },
    {
      workspace_id: id,
      card_id: body.cardId ?? null,
      role: 'assistant',
      content: assistantContent,
      context_snapshot: contextSnapshot,
      token_usage: tokenUsage,
    },
  ])
  if (saveErr) {
    log.error('[chat] message save failed', { error: saveErr.message, workspaceId: id })
  }

  return NextResponse.json({ content: assistantContent, token_usage: tokenUsage })
}
