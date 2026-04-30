import { redirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { createClient } from '@/utils/supabase/server'
import { listCards } from '@/actions/cards'
import { listConnections } from '@/actions/connections'
import Canvas from '@/components/ws/Canvas'
import type { WorkspaceWithDetails, ParticipantWithUser } from '@/types/workspace'

export default async function CanvasPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>
}) {
  const locale = await getLocale()
  const { workspaceId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const [cards, connectionsWithCards, wsRow, participantRows] = await Promise.all([
    listCards(workspaceId),
    listConnections(workspaceId),
    supabase
      .from('workspaces')
      .select('id, title, domain, goal, meta, department_id, status, created_by, created_at, updated_at, deleted_at')
      .eq('id', workspaceId)
      .is('deleted_at', null)
      .maybeSingle(),
    supabase
      .from('workspace_participants')
      .select('id, workspace_id, user_id, role, joined_at')
      .eq('workspace_id', workspaceId),
  ])

  if (!wsRow.data) redirect(`/${locale}/workspaces`)

  const ws = wsRow.data
  const connections = connectionsWithCards.map(({ fromCard: _f, toCard: _t, ...conn }) => conn)

   
  const workspace: WorkspaceWithDetails = {
    id: ws.id,
    title: ws.title,
    domain: (ws.domain ?? 'custom') as WorkspaceWithDetails['domain'],
    goal: ws.goal ?? null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    meta: (ws.meta ?? {}) as any,
    departmentId: ws.department_id ?? null,
    templateId: null,
    description: null,
    createdBy: ws.created_by ?? null,
    createdAt: new Date(ws.created_at),
    updatedAt: new Date(ws.updated_at),
    deletedAt: ws.deleted_at ? new Date(ws.deleted_at) : null,
     
    participants: (participantRows.data ?? []).map((p) => ({
      id: p.id,
      workspaceId: p.workspace_id,
      userId: p.user_id,
      role: p.role as 'admin' | 'member' | 'viewer',
      joinedAt: new Date(p.joined_at),
      user: { id: p.user_id, name: null, email: '' },
    })) as unknown as ParticipantWithUser[],
    cards,
    department: null,
  }

  return (
    <Canvas
      initialCards={cards}
      initialConnections={connections}
      workspaceId={workspaceId}
      initialWorkspace={workspace}
    />
  )
}
