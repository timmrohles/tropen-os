'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import type { ChatMessageType, Project, Conversation } from '@/hooks/useWorkspaceState'
import type { ChipItem } from '@/lib/workspace-types'
import EmptyState from './EmptyState'
import IntentionGate from './IntentionGate'
import FocusedFlow from './FocusedFlow'
import QuickChips from './QuickChips'
import ChatMessage from './ChatMessage'
import ChatInput from './ChatInput'
import ChatHeaderStrip, { type ChatHeaderStripHandle } from './ChatHeaderStrip'
import ContextBar from './ContextBar'
import BookmarksDrawer from './BookmarksDrawer'
import SearchDrawer from './SearchDrawer'
import MemorySaveModal from './MemorySaveModal'
import ShareModal from './ShareModal'

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
  contextPercent: number
  activeConvProjectId: string | null
  showMemoryModal: boolean
  onSetShowMemoryModal: (v: boolean) => void
  conversations: Conversation[]
  shareModalConvId: string | null
  onSetShareModalConvId: (id: string | null) => void
  memoryExtracting?: boolean
  chips: ChipItem[]
  setChips: React.Dispatch<React.SetStateAction<ChipItem[]>>
  pendingIntention: 'focused' | 'open' | null
  onSetPendingIntention: React.Dispatch<React.SetStateAction<'focused' | 'open' | null>>
  pendingCurrentProjectId: string | null
  onSetPendingCurrentProjectId: React.Dispatch<React.SetStateAction<string | null>>
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
  projects,
  workspaceId,
  organizationId,
  onNewConversation,
  onSetInput,
  onSendMessage,
  onAssignToProject: _onAssignToProject,
  contextPercent,
  activeConvProjectId,
  showMemoryModal,
  onSetShowMemoryModal,
  conversations,
  shareModalConvId,
  onSetShareModalConvId,
  memoryExtracting = false,
  chips,
  setChips: _setChips,
  pendingIntention,
  onSetPendingIntention,
  pendingCurrentProjectId,
  onSetPendingCurrentProjectId,
}: ChatAreaProps) {
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set())
  const [bookmarksDrawerOpen, setBookmarksDrawerOpen] = useState(false)
  const [searchDrawerOpen, setSearchDrawerOpen] = useState(false)
  const headerRef = useRef<ChatHeaderStripHandle>(null)

  // IntentionGate: lokale Auswahl — wird bei jedem Wechsel zu activeConvId=null zurückgesetzt
  const [intentionChoice, setIntentionChoice] = useState<'focused' | 'open' | null>(null)
  useEffect(() => {
    if (!activeConvId) setIntentionChoice(null)
  }, [activeConvId])

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
      {activeConvId ? (
        <>
          <ChatHeaderStrip
            ref={headerRef}
            conversationId={activeConvId}
            workspaceId={workspaceId}
            onOpenBookmarks={() => setBookmarksDrawerOpen(true)}
            onOpenSearch={() => setSearchDrawerOpen(true)}
          />
          {activeConvId && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ContextBar percent={contextPercent} />
              {activeConvProjectId && (
                <button
                  onClick={() => onSetShowMemoryModal(true)}
                  title="Ins Gedächtnis speichern"
                  aria-label="Ins Gedächtnis speichern"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-tertiary)',
                    fontSize: 16,
                    padding: '2px 6px',
                    borderRadius: 6,
                    lineHeight: 1,
                    flexShrink: 0,
                  }}
                >
                  🧠
                </button>
              )}
            </div>
          )}

          <div className="carea-messages" aria-live="polite" aria-label="Chat-Verlauf" role="log">
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

          <QuickChips
            chips={[...chips, { label: 'Prompt verfeinern', prompt: 'Hilf mir, meinen nächsten Prompt zu formulieren.' }]}
            onSelect={(prompt) => {
              onSetInput(prompt)
              onSendMessage({ preventDefault: () => {} } as React.FormEvent)
            }}
            disabled={sending}
          />

          {routing && (
            <div className="carea-routing-meta">
              <span>{routing.model}</span>
              <span className="carea-routing-dot">·</span>
              <span>{routing.model_class}</span>
              <span className="carea-routing-dot">·</span>
              <span>{routing.task_type}</span>
              <span className="carea-routing-dot">·</span>
              <span>🌱</span>
              {memoryExtracting && (
                <>
                  <span className="carea-routing-dot">·</span>
                  <span style={{ color: 'var(--accent)', fontStyle: 'italic' }}>
                    Gedächtnis wird gespeichert…
                  </span>
                </>
              )}
            </div>
          )}
          <div className="carea-input-wrap">
            <ChatInput
              input={input}
              setInput={onSetInput}
              sending={sending}
              onSubmit={onSendMessage}
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

          {activeConvProjectId && (
            <MemorySaveModal
              open={showMemoryModal}
              onClose={() => onSetShowMemoryModal(false)}
              projectId={activeConvProjectId}
              conversationId={activeConvId}
            />
          )}
          {shareModalConvId && (
            <ShareModal
              convId={shareModalConvId}
              convTitle={conversations.find(c => c.id === shareModalConvId)?.title ?? null}
              onClose={() => onSetShareModalConvId(null)}
            />
          )}
        </>
      ) : intentionChoice === 'open' ? (
        <EmptyState
          onNewConversation={onNewConversation}
          input={input}
          setInput={onSetInput}
          sending={sending}
          onSubmit={onSendMessage}
        />
      ) : intentionChoice === 'focused' ? (
        <FocusedFlow
          projects={projects}
          workspaceId={workspaceId ?? ''}
          input={input}
          setInput={onSetInput}
          sending={sending}
          onSubmit={onSendMessage}
          onSetPendingIntention={onSetPendingIntention}
          onSetPendingCurrentProjectId={onSetPendingCurrentProjectId}
        />
      ) : (
        <IntentionGate onSelect={setIntentionChoice} />
      )}
    </div>
  )
}
