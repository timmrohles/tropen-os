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
    id:         string
    title:      string
    goal:       string | null
    status:     string
    created_at: string
    cards:      { count: number }[]
  }

  let workspaces: WsRow[] = []
  if (ids.length > 0) {
    const { data } = await supabaseAdmin
      .from('workspaces')
      .select('id, title, goal, status, created_at, cards(count)')
      .in('id', ids)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    workspaces = (data ?? []) as WsRow[]
  }

  return <WorkspacesList workspaces={workspaces} />
}
