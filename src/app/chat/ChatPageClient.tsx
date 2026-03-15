'use client'

import useWorkspaceState from '@/hooks/useWorkspaceState'
import WorkspaceLayout from '@/components/workspace/WorkspaceLayout'

export default function ChatPageClient({
  workspaceId,
  initialConvId,
}: {
  workspaceId: string
  initialConvId: string | null
}) {
  const state = useWorkspaceState(workspaceId, initialConvId)
  return <WorkspaceLayout {...state} />
}
