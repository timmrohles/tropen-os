import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import WorkspacesList from '@/components/workspaces/WorkspacesList'

export default async function WorkspacesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: participantRows } = await supabaseAdmin
    .from('workspace_participants')
    .select('workspace_id')
    .eq('user_id', user.id)

  const ids = (participantRows ?? []).map((r: { workspace_id: string }) => r.workspace_id)

  type WsRow = {
    id:          string
    title:       string
    goal:        string | null
    status:      string
    created_at:  string
    project_id:  string | null
    cards:       { count: number }[]
  }

  let workspaces: WsRow[] = []
  if (ids.length > 0) {
    const { data } = await supabaseAdmin
      .from('workspaces')
      .select('id, title, goal, status, created_at, project_id, cards(count)')
      .in('id', ids)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    workspaces = (data ?? []) as WsRow[]
  }

  // For workspaces linked to a project, fetch how many cards are 'ready' (=done)
  const projectLinkedIds = workspaces.filter(w => w.project_id).map(w => w.id)
  const doneCounts: Record<string, number> = {}

  if (projectLinkedIds.length > 0) {
    const { data: readyCards } = await supabaseAdmin
      .from('cards')
      .select('workspace_id')
      .in('workspace_id', projectLinkedIds)
      .eq('status', 'ready')
      .is('deleted_at', null)

    for (const row of readyCards ?? []) {
      doneCounts[row.workspace_id] = (doneCounts[row.workspace_id] ?? 0) + 1
    }
  }

  return <WorkspacesList workspaces={workspaces} doneCounts={doneCounts} />
}
