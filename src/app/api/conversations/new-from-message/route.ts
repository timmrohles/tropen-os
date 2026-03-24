import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthUser } from '@/lib/api/projects'
import { createLogger } from '@/lib/logger'
import { z } from 'zod'

export const runtime = 'nodejs'

const log = createLogger('api/conversations/new-from-message')

const schema = z.object({
  content: z.string().min(1).max(50000),
  source_message_id: z.string().uuid().optional(),
})

// POST /api/conversations/new-from-message
// Creates a new conversation pre-seeded with a prior answer as context
export async function POST(req: Request) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid body' }, { status: 400 })
  }

  const { content, source_message_id } = parsed.data

  try {
    // Get workspaceId for the user's default workspace
    const { data: workspace } = await supabaseAdmin
      .from('workspaces')
      .select('id')
      .eq('organization_id', user.organization_id)
      .order('created_at')
      .limit(1)
      .maybeSingle()

    if (!workspace) {
      return NextResponse.json({ error: 'Kein Workspace gefunden' }, { status: 404 })
    }

    // Create conversation
    const { data: conv, error: convErr } = await supabaseAdmin
      .from('conversations')
      .insert({
        user_id: user.id,
        organization_id: user.organization_id,
        workspace_id: workspace.id,
        title: 'Fortsetzung',
      })
      .select('id')
      .single()

    if (convErr || !conv) {
      log.error('create conversation', { error: convErr })
      return NextResponse.json({ error: 'Konversation konnte nicht erstellt werden' }, { status: 500 })
    }

    // Seed with context message so Toro knows what this is about
    const contextText = `Der Nutzer möchte auf Basis folgender Antwort weiterarbeiten:\n\n${content.slice(0, 2000)}`
    await supabaseAdmin.from('messages').insert({
      conversation_id: conv.id,
      role: 'assistant',
      content: contextText,
      ...(source_message_id ? { metadata: { context_from_message_id: source_message_id } } : {}),
    })

    return NextResponse.json({ conversation_id: conv.id })
  } catch (err) {
    log.error('new-from-message', { err })
    return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 })
  }
}
