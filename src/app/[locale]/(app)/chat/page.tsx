import { redirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { createClient } from '@/utils/supabase/server'
import ChatListClient from './ChatPageClient'

export default async function ChatPage() {
  const locale = await getLocale()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const { data: membership } = await supabase
    .from('department_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  if (!membership?.workspace_id) redirect(`/${locale}/dashboard`)

  return <ChatListClient workspaceId={membership.workspace_id} />
}
