import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLogger } from '@/lib/logger'
import { z } from 'zod'

const logger = createLogger('api:perspectives:post-to-chat')

const bodySchema = z.object({
  conversationId: z.string().uuid(),
  content:        z.string().min(1).max(8000),
})

// POST /api/perspectives/post-to-chat
// Inserts an assistant message (Perspectives response) into a conversation
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let rawBody: unknown
  try { rawBody = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const parsed = bodySchema.safeParse(rawBody)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 })

  const { conversationId, content } = parsed.data

  // Verify the conversation belongs to the current user
  const { data: conv } = await supabaseAdmin
    .from('conversations')
    .select('id, user_id')
    .eq('id', conversationId)
    .eq('user_id', user.id)
    .single()

  if (!conv) return NextResponse.json({ error: 'Konversation nicht gefunden' }, { status: 404 })

  const { error } = await supabaseAdmin
    .from('messages')
    .insert({
      conversation_id: conversationId,
      role: 'assistant',
      content,
    })

  if (error) {
    logger.error('post-to-chat insert failed', { conversationId, error: error.message })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  logger.info('perspectives message posted', { conversationId, userId: user.id, contentLength: content.length })
  return NextResponse.json({ ok: true })
}
