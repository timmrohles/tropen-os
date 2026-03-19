import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import SharedChatClient from './SharedChatClient'

export default async function SharedChatPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  // Auth prüfen — nicht eingeloggt → Login mit Redirect
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/login?next=/s/${token}`)
  }

  return <SharedChatClient token={token} />
}
