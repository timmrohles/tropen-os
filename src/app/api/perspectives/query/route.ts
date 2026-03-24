import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'
import { z } from 'zod'

const logger = createLogger('api:perspectives:query')

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? ''

const bodySchema = z.object({
  avatarIds:      z.array(z.string().uuid()).min(1).max(5),
  scope:          z.enum(['last_5','last_10','last_20','full','custom']),
  conversationId: z.string().uuid().optional(),
  customText:     z.string().max(4000).optional(),
  outputMode:     z.enum(['drawer','chat']).default('drawer'),
})

interface AvatarRow {
  id: string
  name: string
  emoji: string
  system_prompt: string
  model_id: string
  context_default: string
  is_tabula_rasa: boolean
}

interface HistoryMsg {
  role: 'user' | 'assistant'
  content: string
}

function scopeLimit(scope: string): number {
  switch (scope) {
    case 'last_5':  return 5
    case 'last_10': return 10
    case 'last_20': return 20
    case 'full':    return 100
    default:        return 10
  }
}

// Stream a single avatar's response, encoding each chunk as an SSE event
async function streamAvatar(
  avatar: AvatarRow,
  history: HistoryMsg[],
  encoder: TextEncoder,
  controller: ReadableStreamDefaultController,
) {
  const send = (obj: Record<string, unknown>) => {
    controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`))
  }

  const messages = history.map(m => ({ role: m.role, content: m.content }))

  let response: Response
  try {
    response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: avatar.model_id,
        max_tokens: 1024,
        system: avatar.system_prompt,
        messages,
        stream: true,
      }),
    })
  } catch (err) {
    send({ avatarId: avatar.id, error: String(err) })
    return 0
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => '')
    send({ avatarId: avatar.id, error: `HTTP ${response.status}: ${errText.slice(0, 200)}` })
    return 0
  }

  const reader = response.body!.getReader()
  const dec = new TextDecoder()
  let buf = ''
  let tokensOut = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += dec.decode(value, { stream: true })
    const lines = buf.split('\n')
    buf = lines.pop() ?? ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const raw = line.slice(6).trim()
      if (!raw || raw === '[DONE]') continue
      let parsed: Record<string, unknown>
      try { parsed = JSON.parse(raw) as Record<string, unknown> } catch { continue }

      const type = parsed.type as string | undefined
      if (type === 'content_block_delta') {
        const delta = (parsed.delta as { type?: string; text?: string } | undefined)
        if (delta?.type === 'text_delta' && delta.text) {
          send({ avatarId: avatar.id, delta: delta.text })
        }
      } else if (type === 'message_delta') {
        const usage = (parsed.usage as { output_tokens?: number } | undefined)
        tokensOut = usage?.output_tokens ?? tokensOut
      }
    }
  }

  send({ avatarId: avatar.id, done: true, tokensUsed: tokensOut })
  return tokensOut
}

// POST /api/perspectives/query
// Parallel SSE streaming — one chunk stream per avatar, tagged with avatarId
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userRow } = await supabaseAdmin
    .from('users').select('organization_id').eq('id', user.id).single()
  if (!userRow) return NextResponse.json({ error: 'User nicht gefunden' }, { status: 404 })

  let rawBody: unknown
  try { rawBody = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const parsed = bodySchema.safeParse(rawBody)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 })

  const { avatarIds, scope, conversationId, customText, outputMode: _outputMode } = parsed.data

  // Load avatars (verify they're visible to this user)
  const { data: avatars, error: avatarError } = await supabaseAdmin
    .from('perspective_avatars')
    .select('id, name, emoji, system_prompt, model_id, context_default, is_tabula_rasa')
    .in('id', avatarIds)
    .is('deleted_at', null)
    .eq('is_active', true)
    .or(
      `scope.eq.system,` +
      `and(scope.eq.org,organization_id.eq.${userRow.organization_id}),` +
      `and(scope.eq.user,user_id.eq.${user.id})`
    )

  if (avatarError || !avatars?.length) {
    return NextResponse.json({ error: 'Keine gültigen Avatare gefunden' }, { status: 404 })
  }

  // Budget check
  const { data: budgetOk } = await supabaseAdmin.rpc('check_and_reserve_budget', {
    org_id: userRow.organization_id,
    p_workspace_id: null,
    estimated_cost: 0.01 * avatars.length,
  })
  if (!budgetOk) {
    return NextResponse.json({ error: 'Monatliches Budget erreicht' }, { status: 402 })
  }

  // Load conversation history
  let fullHistory: HistoryMsg[] = []
  if (conversationId) {
    const limit = scope === 'custom' ? 10 : scopeLimit(scope)
    const { data: rows } = await supabaseAdmin
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(limit)
    fullHistory = (rows ?? []).map(r => ({ role: r.role as 'user' | 'assistant', content: r.content }))
  } else if (customText) {
    fullHistory = [{ role: 'user', content: customText }]
  }

  if (fullHistory.length === 0) {
    return NextResponse.json({ error: 'Kein Kontext für Perspectives-Anfrage' }, { status: 400 })
  }

  logger.info('perspectives query start', {
    userId: user.id,
    avatarCount: avatars.length,
    scope,
    conversationId: conversationId ?? null,
  })

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`))
      }

      try {
        // Parallel — alle Avatare gleichzeitig anfragen
        await Promise.all(
          (avatars as AvatarRow[]).map(async (avatar) => {
            // Tabula Rasa bekommt NIE Projekt-Kontext — nur letzten User-Turn
            const history: HistoryMsg[] = avatar.is_tabula_rasa
              ? fullHistory.slice(-1)
              : fullHistory
            await streamAvatar(avatar, history, encoder, controller)
          })
        )
      } catch (err) {
        logger.error('perspectives stream error', { error: String(err) })
        send({ error: 'Stream-Fehler', details: String(err) })
      } finally {
        send({ done: true })
        controller.close()
      }
    },
  })

  return new NextResponse(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
