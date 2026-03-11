'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import useWorkspaceState from '@/hooks/useWorkspaceState'
import WorkspaceLayout from '@/components/workspace/WorkspaceLayout'

function ChatPageInner({ params }: { params: Promise<{ id: string }> }) {
  const [workspaceId, setWorkspaceId] = useState('')
  const searchParams = useSearchParams()
  const initialConvId = searchParams.get('conv')

  useEffect(() => {
    params.then((p) => setWorkspaceId(p.id))
  }, [params])

  const state = useWorkspaceState(workspaceId, initialConvId)

  if (!workspaceId) return null

  return <WorkspaceLayout {...state} />
}

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense>
      <ChatPageInner params={params} />
    </Suspense>
  )
}
