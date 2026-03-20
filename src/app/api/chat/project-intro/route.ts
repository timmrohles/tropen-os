import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { anthropic } from '@/lib/llm/anthropic'
import { getAuthUser } from '@/lib/api/projects'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { loadProjectContext } from '@/lib/project-context'
import { modelFor } from '@/lib/model-selector'
import { buildProjectIntroPrompt } from './project-intro-prompt'
import { createLogger } from '@/lib/logger'

const log = createLogger('project-intro')

export async function POST(req: NextRequest) {
  const me = await getAuthUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let conversationId: string
  try {
    const body = await req.json() as { conversationId: string }
    conversationId = body.conversationId
    if (!conversationId) throw new Error('missing conversationId')
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  // Load conversation + project
  const { data: conv } = await supabaseAdmin
    .from('conversations')
    .select('id, project_id, workspace_id')
    .eq('id', conversationId)
    .single()

  if (!conv?.project_id) {
    return NextResponse.json({ error: 'Not a project conversation' }, { status: 400 })
  }

  // Load project title
  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('title')
    .eq('id', conv.project_id)
    .is('deleted_at', null)
    .single()

  // Load project context + last conversation messages in parallel
  const [projectCtx, { data: lastConvMessages }] = await Promise.all([
    loadProjectContext(conv.project_id),
    supabaseAdmin
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(6),
  ])

  const prompt = buildProjectIntroPrompt({
    projectTitle: project?.title ?? 'Projekt',
    instructions: projectCtx.instructions,
    memoryEntries: projectCtx.memoryEntries,
    lastMessages: (lastConvMessages ?? []).reverse() as Array<{ role: string; content: string }>,
  })

  try {
    const { text } = await generateText({
      model: anthropic(modelFor('project_intro')),
      prompt,
      maxOutputTokens: 512,
    })
    return NextResponse.json({ message: text })
  } catch (err) {
    log.error('project-intro generation failed', { error: String(err) })
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}
