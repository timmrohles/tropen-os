'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import type { ChatMessageType, Project } from '@/hooks/useWorkspaceState'
import EmptyState from './EmptyState'
import ChatMessage from './ChatMessage'
import ChatInput from './ChatInput'
import ChatHeaderStrip, { type ChatHeaderStripHandle } from './ChatHeaderStrip'
import ContextBar from './ContextBar'
import BookmarksDrawer from './BookmarksDrawer'
import SearchDrawer from './SearchDrawer'

interface ChatAreaProps {
  activeConvId: string | null
  messages: ChatMessageType[]
  input: string
  sending: boolean
  error: string
  routing: { task_type: string; agent: string; model_class: string; model: string } | null
  messagesEndRef: React.RefObject<HTMLDivElement>
  userInitial: string
  projects: Project[]
  workspaceId?: string
  organizationId?: string
  onNewConversation: () => void
  onSetInput: (v: string) => void
  onSendMessage: (e: React.FormEvent) => void
  onAssignToProject: (convId: string, projectId: string | null) => Promise<void>
  activeAgentId?: string | null
  onSetActiveAgentId?: (id: string | null) => void
  contextPercent: number
}

export default function ChatArea({
  activeConvId,
  messages,
  input,
  sending,
  error,
  routing,
  messagesEndRef,
  userInitial,
  projects: _projects,
  workspaceId,
  organizationId,
  onNewConversation,
  onSetInput,
  onSendMessage,
  onAssignToProject: _onAssignToProject,
  activeAgentId,
  onSetActiveAgentId,
  contextPercent,
}: ChatAreaProps) {
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set())
  const [bookmarksDrawerOpen, setBookmarksDrawerOpen] = useState(false)
  const [searchDrawerOpen, setSearchDrawerOpen] = useState(false)
  const headerRef = useRef<ChatHeaderStripHandle>(null)

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
    headerRef.current?.refresh()
  }

  function handleArtifactSaved() {
    headerRef.current?.refresh()
  }

  return (
    <div className="carea">
      {!activeConvId ? (
        <EmptyState
          onNewConversation={onNewConversation}
          input={input}
          setInput={onSetInput}
          sending={sending}
          onSubmit={onSendMessage}
        />
      ) : (
        <>
          <ChatHeaderStrip
            ref={headerRef}
            conversationId={activeConvId}
            workspaceId={workspaceId}
            onOpenBookmarks={() => setBookmarksDrawerOpen(true)}
            onOpenSearch={() => setSearchDrawerOpen(true)}
          />
          {activeConvId && <ContextBar percent={contextPercent} />}

          <div className="carea-messages">
            {messages.map((msg, i) => (
              <ChatMessage
                key={msg.id ?? i}
                msg={msg}
                userInitial={userInitial}
                conversationId={activeConvId}
                organizationId={organizationId}
                bookmarkedIds={bookmarkedIds}
                onBookmarkChange={handleBookmarkChange}
                onArtifactSaved={handleArtifactSaved}
              />
            ))}
            {error && <div className="carea-error">{error}</div>}
            <div ref={messagesEndRef} />
          </div>

          {routing && (
            <div className="carea-routing-meta">
              <span>{routing.model}</span>
              <span className="carea-routing-dot">·</span>
              <span>{routing.model_class}</span>
              <span className="carea-routing-dot">·</span>
              <span>{routing.task_type}</span>
              <span className="carea-routing-dot">·</span>
              <span>🌱</span>
            </div>
          )}
          <div className="carea-input-wrap">
            <ChatInput
              input={input}
              setInput={onSetInput}
              sending={sending}
              onSubmit={onSendMessage}
              activeAgentId={activeAgentId ?? null}
              onSetActiveAgentId={onSetActiveAgentId ?? null}
            />
          </div>

          <BookmarksDrawer
            open={bookmarksDrawerOpen}
            onClose={() => setBookmarksDrawerOpen(false)}
            conversationId={activeConvId}
            onUseAsPrompt={(text) => { onSetInput(text); setBookmarksDrawerOpen(false) }}
          />
          <SearchDrawer
            open={searchDrawerOpen}
            onClose={() => setSearchDrawerOpen(false)}
            workspaceId={workspaceId}
          />
        </>
      )}
    </div>
  )
}
