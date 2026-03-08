'use client'

import { useEffect, useState } from 'react'
import useWorkspaceState from '@/hooks/useWorkspaceState'
import WorkspaceLayout from '@/components/workspace/WorkspaceLayout'

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const [workspaceId, setWorkspaceId] = useState('')

  useEffect(() => {
    params.then((p) => setWorkspaceId(p.id))
  }, [params])

  const state = useWorkspaceState(workspaceId)

  if (!workspaceId) return null

  return <WorkspaceLayout {...state} />
}
