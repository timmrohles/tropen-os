import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { listCards } from '@/actions/cards'
import { listConnections } from '@/actions/connections'
import Canvas from '@/components/ws/Canvas'

export default async function CanvasPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>
}) {
  const { workspaceId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [cards, connectionsWithCards] = await Promise.all([
    listCards(workspaceId),
    listConnections(workspaceId),
  ])

  // listConnections returns ConnectionWithCards — strip to plain Connection for Canvas
  const connections = connectionsWithCards.map(({ fromCard: _f, toCard: _t, ...conn }) => conn)

  return (
    <Canvas
      initialCards={cards}
      initialConnections={connections}
      workspaceId={workspaceId}
    />
  )
}
