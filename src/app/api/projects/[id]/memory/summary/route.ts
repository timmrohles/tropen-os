import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { anthropic } from '@/lib/llm/anthropic'
import { getAuthUser, verifyProjectAccess } from '@/lib/api/projects'

// POST /api/projects/[id]/memory/summary
// Body: { conversation_id }
// Loads messages, calls Haiku, saves as frozen summary
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
  const { id } = await params

  const allowed = await verifyProjectAccess(id, me)
  if (!allowed) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  let body: { conversation_id?: string }
  try { body = await request.json() }
  catch { return NextResponse.json({ error: 'Ungültiger Request-Body' }, { status: 400 }) }

  if (!body.conversation_id)
    return NextResponse.json({ error: 'conversation_id fehlt' }, { status: 400 })

  // Verify conversation belongs to this project
  const { data: conv } = await supabaseAdmin
    .from('conversations')
    .select('project_id')
    .eq('id', body.conversation_id)
    .single()
  if (!conv || conv.project_id !== id)
    return NextResponse.json({ error: 'Conversation gehört nicht zu diesem Projekt' }, { status: 403 })

  // Load messages
  const { data: messages } = await supabaseAdmin
    .from('messages')
    .select('role, content')
    .eq('conversation_id', body.conversation_id)
    .order('created_at')

  if (!messages?.length)
    return NextResponse.json({ error: 'Keine Nachrichten gefunden' }, { status: 404 })

  // Build conversation text (max 8000 chars — token-efficient for Haiku)
  const convText = messages
    .map(m => `${m.role === 'user' ? 'User' : 'Toro'}: ${m.content}`)
    .join('\n\n')
    .slice(0, 8000)

  // Call Haiku for structured summary
  const { text: summary } = await generateText({
    model: anthropic('claude-haiku-4-5-20251001'),
    maxOutputTokens: 400,
    messages: [{
      role: 'user',
      content: `Analysiere dieses Gespräch und extrahiere die wichtigsten Erkenntnisse, Entscheidungen und offene Fragen.
Format: Kompakte Bullet-Liste, max. 5 Punkte. Jeder Punkt beginnt mit [Erkenntnis], [Entscheidung] oder [Offen].

Gespräch:
${convText}`,
    }],
  })

  if (!summary)
    return NextResponse.json({ error: 'AI-Zusammenfassung fehlgeschlagen' }, { status: 500 })

  // Insert as frozen summary — APPEND ONLY
  const { data, error } = await supabaseAdmin
    .from('project_memory')
    .insert({
      project_id: id,
      type: 'summary',
      content: summary,
      source_conversation_id: body.conversation_id,
      importance: 'high',
      tags: ['auto-summary'],
      frozen: true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
