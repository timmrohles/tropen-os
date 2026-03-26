'use client'

import { useEffect } from 'react'
import useWorkspaceState from '@/hooks/useWorkspaceState'
import WorkspaceLayout from '@/components/workspace/WorkspaceLayout'

export default function SingleChatClient({
  workspaceId,
  convId,
}: {
  workspaceId: string
  convId?: string | null
}) {
  const state = useWorkspaceState(workspaceId, convId ?? null)

  // When starting from /chat/new and the first conversation is created, update the URL
  // without triggering a remount (router.replace would remount the component and wipe messages)
  useEffect(() => {
    if (!convId && state.activeConvId && !state.activeConvId.startsWith('temp-')) {
      window.history.replaceState(null, '', `/chat/${state.activeConvId}`)
    }
  }, [convId, state.activeConvId])

  return <WorkspaceLayout {...state} />
}
