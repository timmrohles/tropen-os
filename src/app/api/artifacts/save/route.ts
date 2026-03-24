import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { validateBody } from '@/lib/validators'
import { createArtifactSchema } from '@/lib/validators/artifacts'
import { createLogger } from '@/lib/logger'

const logger = createLogger('api:artifacts:save')

// POST /api/artifacts/save
// Saves an artifact and, when the conversation has a current_project_id that
// maps to a workspace, auto-creates a workspace card (source='chat_artifact').
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: body, error: validationError } = await validateBody(req, createArtifactSchema)
  if (validationError) return validationError

  // Verify user belongs to the org
  const { data: membership } = await supabaseAdmin
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .eq('organization_id', body.organizationId)
    .single()

  if (!membership) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Save the artifact
  const { data: artifact, error: artifactError } = await supabaseAdmin
    .from('artifacts')
    .insert({
      message_id: body.messageId ?? null,
      conversation_id: body.conversationId,
      organization_id: body.organizationId,
      user_id: user.id,
      name: body.name,
      type: body.type,
      language: body.language ?? null,
      content: body.content,
    })
    .select()
    .single()

  if (artifactError) {
    logger.error('artifact insert failed', { error: artifactError.message, conversationId: body.conversationId })
    return NextResponse.json({ error: artifactError.message }, { status: 500 })
  }

  logger.info('artifact saved', { artifactId: artifact.id, type: body.type, conversationId: body.conversationId })

  // ── Auto-create workspace card if conversation is project-focused ──────────
  let workspaceCardId: string | null = null

  const { data: conv } = await supabaseAdmin
    .from('conversations')
    .select('current_project_id, intention')
    .eq('id', body.conversationId)
    .single()

  if (conv?.current_project_id && conv.intention === 'focused') {
    // Find a workspace linked to this project
    const { data: ws } = await supabaseAdmin
      .from('workspaces')
      .select('id')
      .eq('project_id', conv.current_project_id)
      .is('deleted_at', null)
      .limit(1)
      .maybeSingle()

    if (ws) {
      // Determine next sort_order
      const { data: lastCard } = await supabaseAdmin
        .from('cards')
        .select('sort_order')
        .eq('workspace_id', ws.id)
        .is('deleted_at', null)
        .order('sort_order', { ascending: false })
        .limit(1)
        .maybeSingle()

      const nextOrder = ((lastCard?.sort_order ?? 0) as number) + 1

      const { data: card } = await supabaseAdmin
        .from('cards')
        .insert({
          workspace_id: ws.id,
          organization_id: body.organizationId,
          title: body.name,
          content: { text: body.content },
          content_type: 'artifact',
          role: 'output',
          status: 'ready',
          source: 'chat_artifact',
          source_conversation_id: body.conversationId,
          sort_order: nextOrder,
          created_by: user.id,
        })
        .select('id')
        .single()

      workspaceCardId = card?.id ?? null
    }
  }

  return NextResponse.json({ artifact, workspaceCardId }, { status: 201 })
}
