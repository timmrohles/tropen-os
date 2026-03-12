import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('users').select('organization_id, role').eq('id', user.id).single()
  if (!profile?.organization_id) return null
  return { id: user.id, organization_id: profile.organization_id, role: profile.role } as {
    id: string; organization_id: string; role: string
  }
}

async function verifyProjectAccess(
  projectId: string,
  me: { id: string; organization_id: string; role: string }
): Promise<boolean> {
  if (me.role === 'superadmin') return true
  const { data: project } = await supabaseAdmin
    .from('projects').select('department_id').eq('id', projectId).is('deleted_at', null).single()
  if (!project) return false
  const { data } = await supabaseAdmin
    .from('departments').select('id')
    .eq('id', project.department_id).eq('organization_id', me.organization_id).single()
  return !!data
}

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
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    messages: [{
      role: 'user',
      content: `Analysiere dieses Gespräch und extrahiere die wichtigsten Erkenntnisse, Entscheidungen und offene Fragen.
Format: Kompakte Bullet-Liste, max. 5 Punkte. Jeder Punkt beginnt mit [Erkenntnis], [Entscheidung] oder [Offen].

Gespräch:
${convText}`,
    }],
  })

  const summary = (response.content[0] as { type: string; text: string }).text.trim()

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
