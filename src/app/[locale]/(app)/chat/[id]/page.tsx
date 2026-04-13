import { redirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { createClient } from '@/utils/supabase/server'
import SingleChatClient from './SingleChatClient'

export default async function SingleChatPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
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

  const { id } = await params
  return <SingleChatClient workspaceId={membership.workspace_id} convId={id} />
}
