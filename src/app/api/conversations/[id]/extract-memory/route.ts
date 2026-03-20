// POST /api/conversations/[id]/extract-memory
// Fire-and-forget endpoint: extracts memories from a completed conversation and
// saves them to project_memory. Called internally after stream ends.
// Always returns 200 (caller does not await the result).

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthUser } from '@/lib/api/projects'
import { extractMemoryFromConversation, hashContent } from '@/lib/memory/memory-extractor'
import { createLogger } from '@/lib/logger'

const log = createLogger('extract-memory')

export const runtime = 'nodejs'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: conversationId } = await params

  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    // Load conversation + verify ownership
    const { data: conv } = await supabaseAdmin
      .from('conversations')
      .select('id, user_id, project_id')
      .eq('id', conversationId)
      .eq('user_id', me.id)
      .maybeSingle()

    if (!conv) {
      log.info('conversation not found or not owned', { conversationId })
      return NextResponse.json({ skipped: true, reason: 'not_found' })
    }
    if (!conv.project_id) {
      log.info('conversation has no project, skipping extraction', { conversationId })
      return NextResponse.json({ skipped: true, reason: 'no_project' })
    }

    // Load messages (last 30 — enough for meaningful extraction without blowing tokens)
    const { data: msgRows } = await supabaseAdmin
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .in('role', ['user', 'assistant'])
      .order('created_at', { ascending: true })
      .limit(30)

    const messages = (msgRows ?? []).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content as string,
    }))

    // Deduplication: skip if we already extracted from this exact content
    const contentHash = await hashContent(messages)
    const { data: existing } = await supabaseAdmin
      .from('memory_extraction_log')
      .select('id')
      .eq('content_hash', contentHash)
      .eq('conversation_id', conversationId)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ skipped: true, reason: 'already_extracted' })
    }

    // Run extraction
    const result = await extractMemoryFromConversation(messages)

    if (result.skipped) {
      await supabaseAdmin.from('memory_extraction_log').insert({
        conversation_id: conversationId,
        project_id: conv.project_id,
        content_hash: contentHash,
        memories_extracted: 0,
        status: 'skip',
        model_used: 'claude-haiku-4.5',
        tokens_input: 0,
        tokens_output: 0,
      })
      return NextResponse.json({ skipped: true, reason: 'trivial_conversation' })
    }

    // Save memories to project_memory (APPEND ONLY)
    if (result.memories.length > 0) {
      await supabaseAdmin.from('project_memory').insert(
        result.memories.map((m) => ({
          project_id: conv.project_id,
          type: m.type,
          content: m.content,
          importance: m.importance,
          tags: m.tags,
          source_conversation_id: conversationId,
        }))
      )
    }

    // Log extraction
    await supabaseAdmin.from('memory_extraction_log').insert({
      conversation_id: conversationId,
      project_id: conv.project_id,
      content_hash: contentHash,
      memories_extracted: result.memories.length,
      status: 'success',
      model_used: 'claude-haiku-4.5',
      tokens_input: result.tokensInput,
      tokens_output: result.tokensOutput,
    })

    return NextResponse.json({ extracted: result.memories.length })
  } catch (err) {
    // Log error but don't surface to caller — this is fire-and-forget
    const message = err instanceof Error ? err.message : String(err)
    await supabaseAdmin.from('memory_extraction_log').insert({
      conversation_id: conversationId,
      project_id: null,
      content_hash: 'error',
      memories_extracted: 0,
      status: 'error',
      error_message: message.slice(0, 500),
      model_used: 'claude-haiku-4.5',
    }).then(undefined, () => {/* ignore secondary failure */})

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
