'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { ChatHeaderStripHandle } from '@/components/workspace/ChatHeaderStrip'
import { detectParallelIntent } from '@/lib/chat/detect-parallel-intent'
import { usePerspectives } from '@/hooks/usePerspectives'
import { useArtifactsView } from '@/hooks/useArtifactsView'
import { useAssistantName } from '@/hooks/useAssistantName'
import { useParallelTabs } from '@/hooks/useParallelTabs'
import type { Conversation, Project } from '@/hooks/useWorkspaceState'

interface UseChatAreaStateOptions {
  activeConvId: string | null
  input: string
  workspaceId?: string
  canOpenNewTab: boolean
  conversations: Conversation[]
  projects: Project[]
  onRefreshMessages: () => void
  onSetInput: (v: string) => void
  onSendMessage: (e: React.FormEvent) => void
  onSendDirect: (text: string) => void
  onOpenParallelTabs?: (items: Array<{ convId: string; title: string }>) => void
  onSendDirectToNewConv?: (text: string, convId: string, overrideClientPrefs?: Record<string, unknown>, displayText?: string) => void
}

export function useChatAreaState({
  activeConvId,
  input,
  workspaceId,
  canOpenNewTab,
  conversations,
  projects,
  onRefreshMessages,
  onSetInput,
  onSendMessage,
  onSendDirect,
  onOpenParallelTabs,
  onSendDirectToNewConv,
}: UseChatAreaStateOptions) {
  const assistantName = useAssistantName()
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set())
  const [bookmarksDrawerOpen, setBookmarksDrawerOpen] = useState(false)
  const headerRef = useRef<ChatHeaderStripHandle>(null)

  const { avatarCache, perspectiveMsg, loadAvatars, startPerspective } = usePerspectives(activeConvId, onRefreshMessages)
  const { artifactsView, setArtifactsView, artifactsViewItems, artifactsViewLoading, openArtifactsView } = useArtifactsView(activeConvId)

  const activeConv = conversations.find(c => c.id === activeConvId) ?? null
  const isFocused = activeConv?.intention === 'focused' && !!activeConv.current_project_id
  const focusedProject = isFocused
    ? projects.find(p => p.id === activeConv!.current_project_id) ?? null
    : null

  const [intentionChoice, setIntentionChoice] = useState<'focused' | 'guided' | null>(null)
  useEffect(() => {
    if (!activeConvId) setIntentionChoice(null)
  }, [activeConvId])

  const {
    parallelConfirm,
    setParallelConfirm,
    parallelLoading,
    handleParallelConfirm,
  } = useParallelTabs({ workspaceId, input, onOpenParallelTabs, onSendDirectToNewConv })

  async function handleChatSubmit(e: React.FormEvent) {
    const trimmed = input.trim()
    const mentionMatch = trimmed.match(/^@([^\s]+)\s*([\s\S]*)$/)
    if (mentionMatch) {
      const mentionName = mentionMatch[1]
      const afterMention = mentionMatch[2]?.trim() || undefined
      const avs = avatarCache ?? await loadAvatars()
      const avatar = avs.find((a) => a.name.toLowerCase() === mentionName.toLowerCase())
      if (avatar) {
        e.preventDefault()
        onSetInput('')
        await startPerspective(avatar, afterMention)
        return
      }
    }
    if (onOpenParallelTabs && canOpenNewTab && activeConvId) {
      const intent = detectParallelIntent(trimmed)
      if (intent) {
        e.preventDefault()
        setParallelConfirm({ intent, originalInput: trimmed })
        return
      }
    }
    onSendMessage(e)
  }

  function handleParallelDeny() {
    if (!parallelConfirm) return
    const { originalInput } = parallelConfirm
    setParallelConfirm(null)
    onSendDirect(originalInput)
  }

  const fetchBookmarks = useCallback(async (convId: string) => {
    try {
      const res = await fetch(`/api/bookmarks?conversationId=${convId}`)
      if (res.ok) {
        const data: Array<{ message_id: string }> = await res.json()
        setBookmarkedIds(new Set(data.map((b) => b.message_id)))
      }
    } catch {
      // silently ignore
    }
  }, [])

  useEffect(() => {
    setBookmarkedIds(new Set())
    if (activeConvId) fetchBookmarks(activeConvId)
  }, [activeConvId, fetchBookmarks])

  function handleBookmarkChange(messageId: string, bookmarked: boolean) {
    setBookmarkedIds((prev) => {
      const next = new Set(prev)
      if (bookmarked) next.add(messageId)
      else next.delete(messageId)
      return next
    })
  }

  return {
    assistantName,
    bookmarkedIds,
    bookmarksDrawerOpen,
    setBookmarksDrawerOpen,
    headerRef,
    perspectiveMsg,
    artifactsView,
    setArtifactsView,
    artifactsViewItems,
    artifactsViewLoading,
    openArtifactsView,
    activeConv,
    isFocused,
    focusedProject,
    intentionChoice,
    setIntentionChoice,
    parallelConfirm,
    parallelLoading,
    handleParallelConfirm,
    handleChatSubmit,
    handleParallelDeny,
    handleBookmarkChange,
  }
}
