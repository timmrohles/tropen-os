import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import SingleChatClient from './SingleChatClient'

export default async function SingleChatPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabaseAdmin
    .from('department_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  if (!membership?.workspace_id) redirect('/dashboard')

  const { id } = await params
  return <SingleChatClient workspaceId={membership.workspace_id} convId={id} />
}
