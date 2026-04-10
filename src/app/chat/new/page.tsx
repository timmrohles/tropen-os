import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import SingleChatClient from '../[id]/SingleChatClient'

export default async function NewChatPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('department_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  if (!membership?.workspace_id) redirect('/dashboard')

  return <SingleChatClient workspaceId={membership.workspace_id} />
}
