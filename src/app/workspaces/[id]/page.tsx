import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import CanvasClient from './CanvasClient'

export default async function WorkspaceCanvasPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: workspaceId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: ws } = await supabaseAdmin
    .from('workspaces')
    .select('id, title, goal, status, meta, department_id, created_by, created_at, updated_at')
    .eq('id', workspaceId)
    .is('deleted_at', null)
    .maybeSingle()

  // Participant-Check: nur Mitglieder dürfen den Canvas sehen
  const { data: participant } = await supabaseAdmin
    .from('workspace_participants')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!ws || !participant) redirect('/workspaces')

  const { data: cards } = await supabaseAdmin
    .from('cards')
    .select('id, title, description, role, type, status, stale_reason, sources, sort_order, content, capability_id, outcome_id, source, source_conversation_id, created_at, updated_at')
    .eq('workspace_id', workspaceId)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  return (
    <CanvasClient
      workspaceId={workspaceId}
      initialWorkspace={{
        id: ws.id,
        title: ws.title,
        goal: ws.goal ?? null,
        status: (ws.status ?? 'draft') as string,
        meta: (ws.meta ?? {}) as Record<string, unknown>,
      }}
      initialCards={(cards ?? []) as CanvasCard[]}
    />
  )
}

export type CanvasCard = {
  id: string
  title: string
  description: string | null
  role: string | null
  type: string | null
  status: string
  stale_reason: string | null
  sources: unknown[] | null
  sort_order: number
  content: unknown | null
  capability_id: string | null
  outcome_id: string | null
  source: 'manual' | 'chat_artifact' | null
  source_conversation_id: string | null
  created_at: string
  updated_at: string
}

export type CanvasWorkspace = {
  id: string
  title: string
  goal: string | null
  status: string
  meta: Record<string, unknown>
}
