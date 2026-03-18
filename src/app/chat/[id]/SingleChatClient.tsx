'use client'

import useWorkspaceState from '@/hooks/useWorkspaceState'
import WorkspaceLayout from '@/components/workspace/WorkspaceLayout'

export default function SingleChatClient({
  workspaceId,
  convId,
}: {
  workspaceId: string
  convId: string
}) {
  const state = useWorkspaceState(workspaceId, convId)
  return <WorkspaceLayout {...state} />
}
