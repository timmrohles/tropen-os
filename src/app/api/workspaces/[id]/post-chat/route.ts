import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { anthropic as anthropicProvider } from '@/lib/llm/anthropic'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'
import { getAuthUser, requireWorkspaceAccess } from '@/lib/api/workspaces'
import { MODEL_HAIKU } from '@/lib/llm/models'

const log = createLogger('api:workspaces:post-chat')
type Params = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Params) {
  const { id: workspaceId } = await params
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const workspace = await requireWorkspaceAccess(workspaceId, me)
  if (!workspace) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  let body: { conversation_id: string }
  try {
    body = await request.json()
    if (!body.conversation_id) throw new Error('missing conversation_id')
  } catch {
    return NextResponse.json({ error: 'Ungültige Daten' }, { status: 400 })
  }

  // Load conversation + messages
  const { data: conv } = await supabaseAdmin
    .from('conversations')
    .select('id, title')
    .eq('id', body.conversation_id)
    .is('deleted_at', null)
    .maybeSingle()

  if (!conv) return NextResponse.json({ error: 'Konversation nicht gefunden' }, { status: 404 })

  const { data: messages } = await supabaseAdmin
    .from('messages')
    .select('role, content')
    .eq('conversation_id', body.conversation_id)
    .order('created_at', { ascending: true })
    .limit(60)

  const msgs = (messages ?? []).filter(m => m.role === 'user' || m.role === 'assistant')
  if (msgs.length === 0) {
    return NextResponse.json({ error: 'Keine Nachrichten zum Zusammenfassen' }, { status: 400 })
  }

  // Build transcript for summary (last 20 exchanges max)
  const recent = msgs.slice(-20)
  const transcript = recent
    .map(m => `${m.role === 'user' ? 'Nutzer' : 'Toro'}: ${typeof m.content === 'string' ? m.content.slice(0, 400) : ''}`)
    .join('\n')

  // Generate summary with Haiku
  let summary = ''
  try {
    const { text } = await generateText({
      model: anthropicProvider(MODEL_HAIKU as string),
      maxOutputTokens: 200,
      messages: [
        {
          role: 'user',
          content: `Fasse das Ergebnis dieses Chat-Gesprächs in 2–3 prägnanten Sätzen zusammen. Fokus auf das Ergebnis, nicht auf den Prozess. Keine Einleitung, nur die Zusammenfassung.\n\n${transcript}`,
        },
      ],
    })
    summary = text.trim()
  } catch (e) {
    log.error('[post-chat] Summary generation failed', { error: String(e) })
    summary = conv.title ?? 'Chat-Ergebnis'
  }

  // Use conversation title or first user message as item title
  const itemTitle = conv.title
    ?? msgs.find(m => m.role === 'user')?.content?.toString().slice(0, 80)
    ?? 'Chat-Ergebnis'

  // Insert workspace_item
  const { data: item, error } = await supabaseAdmin
    .from('workspace_items')
    .insert({
      workspace_id: workspaceId,
      organization_id: me.organization_id,
      item_type: 'conversation',
      item_id: body.conversation_id,
      title: itemTitle,
      description: summary,
      added_by: me.id,
    })
    .select()
    .single()

  if (error) {
    log.error('[post-chat] Insert failed', { error: error.message, workspaceId })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(item, { status: 201 })
}
