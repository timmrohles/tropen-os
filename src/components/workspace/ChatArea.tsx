'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import type { ChatMessageType, Project, Conversation } from '@/hooks/useWorkspaceState'
import type { ChipItem, AttachmentData, GuidedAction } from '@/lib/workspace-types'
import IntentionGate from './IntentionGate'
import FocusedFlow from './FocusedFlow'
import ChatMessage from './ChatMessage'
import ChatInput from './ChatInput'
import ChatHeaderStrip, { type ChatHeaderStripHandle } from './ChatHeaderStrip'
import ArtifactRenderer from './ArtifactRenderer'
import type { ArtifactSegment } from '@/lib/chat/parse-artifacts'
import ContextBar from './ContextBar'
import ChatContextStrip from './ChatContextStrip'
import BookmarksDrawer from './BookmarksDrawer'
import SearchDrawer from './SearchDrawer'
import MemorySaveModal from './MemorySaveModal'
import ShareModal from './ShareModal'
import PerspectivesBar from './PerspectivesBar'

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
  onSendDirect: (text: string) => void
  onRegenerate: () => void
  onAssignToProject: (convId: string, projectId: string | null) => Promise<void>
  onRenameConversation?: (id: string, title: string) => void
  onDeleteConversation?: (id: string) => Promise<void>
  contextPercent: number
  activeConvProjectId: string | null
  onRefreshMessages: () => void
  showMemoryModal: boolean
  onSetShowMemoryModal: (v: boolean) => void
  conversations: Conversation[]
  shareModalConvId: string | null
  onSetShareModalConvId: (id: string | null) => void
  memoryExtracting?: boolean
  chips: ChipItem[]
  setChips: React.Dispatch<React.SetStateAction<ChipItem[]>>
  attachmentRef: React.MutableRefObject<AttachmentData | null>
  pendingIntention: 'focused' | 'guided' | null
  onSetPendingIntention: React.Dispatch<React.SetStateAction<'focused' | 'guided' | null>>
  pendingCurrentProjectId: string | null
  onSetPendingCurrentProjectId: React.Dispatch<React.SetStateAction<string | null>>
  onGuidedAction: (action: GuidedAction) => void
  onGenerateImage?: (content: string) => void
  userName?: string
  isInSplitView?: boolean
  isSearching?: boolean
  contextStartIndex?: number
  onContextReset?: () => void
  suggestionsEnabled?: boolean
  isMobile?: boolean
  // Search drawer controlled from WorkspaceLayout (header search button)
  searchDrawerOpen?: boolean
  onSearchDrawerClose?: () => void
  onOpenSearch?: () => void
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
  onSendDirect,
  onRegenerate,
  onAssignToProject,
  onRenameConversation,
  onDeleteConversation,
  contextPercent,
  activeConvProjectId,
  onRefreshMessages,
  showMemoryModal,
  onSetShowMemoryModal,
  conversations,
  shareModalConvId,
  onSetShareModalConvId,
  memoryExtracting = false,
  chips,
  setChips: _setChips,
  attachmentRef,
  pendingIntention,
  onSetPendingIntention,
  pendingCurrentProjectId,
  onSetPendingCurrentProjectId,
  onGuidedAction,
  onGenerateImage,
  userName,
  isInSplitView = false,
  isSearching = false,
  contextStartIndex = 0,
  onContextReset,
  suggestionsEnabled = true,
  isMobile = false,
  searchDrawerOpen = false,
  onSearchDrawerClose,
  onOpenSearch,
}: ChatAreaProps) {
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set())
  const [bookmarksDrawerOpen, setBookmarksDrawerOpen] = useState(false)
  const [perspectivesMessageId, setPerspectivesMessageId] = useState<string | null>(null)
  const headerRef = useRef<ChatHeaderStripHandle>(null)

  // Artefakte-Übersicht
  const [artifactsView, setArtifactsView] = useState(false)
  const [artifactsViewItems, setArtifactsViewItems] = useState<Array<{ id: string; name: string; type: string; language: string | null; content: string }>>([])
  const [artifactsViewLoading, setArtifactsViewLoading] = useState(false)

  useEffect(() => { if (!activeConvId) setArtifactsView(false) }, [activeConvId])

  async function openArtifactsView() {
    if (!activeConvId) return
    setArtifactsView(true)
    setArtifactsViewLoading(true)
    try {
      const res = await fetch(`/api/artifacts?conversationId=${activeConvId}`)
      if (res.ok) setArtifactsViewItems(await res.json())
    } finally {
      setArtifactsViewLoading(false)
    }
  }

  // Derive focused-mode context from the active conversation
  const activeConv = conversations.find(c => c.id === activeConvId) ?? null
  const isFocused = activeConv?.intention === 'focused' && !!activeConv.current_project_id
  const focusedProject = isFocused
    ? projects.find(p => p.id === activeConv!.current_project_id) ?? null
    : null

  // IntentionGate: lokale Auswahl — wird bei jedem Wechsel zu activeConvId=null zurückgesetzt
  const [intentionChoice, setIntentionChoice] = useState<'focused' | 'guided' | null>(null)
  useEffect(() => {
    if (!activeConvId) setIntentionChoice(null)
  }, [activeConvId])

  // Perspectives-Strip schließen wenn gesendet wird
  useEffect(() => {
    if (sending) setPerspectivesMessageId(null)
  }, [sending])

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

  return (
    <div className="carea">
      {activeConvId ? (
        <>
          {/* ChatHeaderStrip renders into #topbar-chat-slot via portal (desktop only) */}
          {!isMobile && (
            <ChatHeaderStrip
              ref={headerRef}
              conversationId={activeConvId}
              conversationTitle={activeConv?.title ?? null}
              projectId={activeConvProjectId}
              projects={projects}
              workspaceId={workspaceId}
              onOpenSearch={onOpenSearch}
              onRenameConversation={onRenameConversation}
              onAssignToProject={onAssignToProject}
              onDeleteConversation={onDeleteConversation}
              onSummarizeArtifacts={() => onSendDirect(
                'Bitte fasse unser gesamtes Gespräch als Dokument-Artefakt zusammen — mit den wichtigsten Themen, Erkenntnissen und Ergebnissen. Das Artefakt soll so aufbereitet sein, dass es eigenständig geteilt werden kann.'
              )}
              onShowArtifactsView={openArtifactsView}
            />
          )}

          {isFocused && focusedProject && (
            <ChatContextStrip
              projectName={focusedProject.title}
              workspaceId={workspaceId}
              driftDetected={activeConv?.drift_detected}
            />
          )}

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

          {/* Artefakte-Übersicht */}
          {artifactsView && (
            <div className="carea-messages" style={{ gap: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Artefakte dieses Chats
                </span>
                <button
                  onClick={() => setArtifactsView(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: 12, padding: '2px 6px', borderRadius: 4 }}
                >
                  ← Zurück zum Chat
                </button>
              </div>
              {artifactsViewLoading ? (
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Laden…</div>
              ) : artifactsViewItems.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Keine Artefakte in diesem Chat.</div>
              ) : (
                artifactsViewItems.map(art => (
                  <div key={art.id}>
                    <ArtifactRenderer
                      artifact={{
                        segType: 'artifact',
                        artifactType: art.type as ArtifactSegment['artifactType'],
                        name: art.name,
                        language: art.language ?? undefined,
                        content: art.content,
                      }}
                      conversationId={activeConvId ?? undefined}
                      organizationId={organizationId}
                      onSendDirect={onSendDirect}
                    />
                  </div>
                ))
              )}
            </div>
          )}

          <div className="carea-messages" aria-live="polite" aria-label="Chat-Verlauf" role="log" style={artifactsView ? { display: 'none' } : undefined}>
            {messages.map((msg, i) => {
              const isLast = i === messages.length - 1
              const isLastAssistant = isLast && msg.role === 'assistant'
              const showResetDivider = contextStartIndex > 0 && i === contextStartIndex
              return (
                <React.Fragment key={msg.id ?? i}>
                  {showResetDivider && (
                    <div className="context-reset-divider" role="separator">
                      <span>Neuer Kontext-Start</span>
                    </div>
                  )}
                  <ChatMessage
                    msg={msg}
                    userInitial={userInitial}
                    conversationId={activeConvId}
                    organizationId={organizationId}
                    bookmarkedIds={bookmarkedIds}
                    onBookmarkChange={handleBookmarkChange}
                    onArtifactSaved={() => headerRef.current?.refresh()}
                    onSendDirect={onSendDirect}
                    isLastMessage={isLast}
                    isLastAssistantMessage={isLastAssistant}
                    isStreaming={sending}
                    chips={isLast ? chips : []}
                    onRegenerate={onRegenerate}
                    onPerspectives={(id) => setPerspectivesMessageId(id)}
                    onGuidedAction={onGuidedAction}
                    onGenerateImage={onGenerateImage}
                    isInSplitView={isInSplitView}
                    suggestionsEnabled={suggestionsEnabled}
                  />
                </React.Fragment>
              )
            })}
            {contextPercent >= 80 && onContextReset && (
              <div className="context-warning" role="status">
                <span>Ich kann die ersten Teile unseres Gesprächs nicht mehr vollständig berücksichtigen.</span>
                <button className="btn btn-ghost btn-sm" onClick={onContextReset}>
                  Kontext zurücksetzen
                </button>
              </div>
            )}
            {error && <div className="carea-error">{error}</div>}
            <div ref={messagesEndRef} />
          </div>

          {isSearching && !routing && (
            <div className="carea-routing-meta carea-routing-meta--searching">
              <span className="carea-searching-dot" aria-hidden="true" />
              <span style={{ fontStyle: 'italic' }}>Suche im Web…</span>
            </div>
          )}
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
          {perspectivesMessageId && activeConvId && (
            <PerspectivesBar
              conversationId={activeConvId}
              onRefreshMessages={onRefreshMessages}
              onClose={() => setPerspectivesMessageId(null)}
            />
          )}

          <div className="carea-input-wrap">
            <div className="carea-input-inner">
              <ChatInput
                input={input}
                setInput={onSetInput}
                sending={sending}
                onSubmit={onSendMessage}
                attachmentRef={attachmentRef}
              />
              <p className="chat-ai-disclaimer">
                Toros Antworten sind KI-generiert und können Fehler enthalten.
                Prüfe wichtige Informationen immer selbst.
              </p>
            </div>
          </div>

          <BookmarksDrawer
            open={bookmarksDrawerOpen}
            onClose={() => setBookmarksDrawerOpen(false)}
            conversationId={activeConvId}
            onUseAsPrompt={(text) => { onSetInput(text); setBookmarksDrawerOpen(false) }}
          />
          <SearchDrawer
            open={searchDrawerOpen}
            onClose={() => onSearchDrawerClose?.()}
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
      ) : intentionChoice === 'guided' ? (
        <>
          <div className="carea-messages" aria-live="polite" aria-label="Chat-Verlauf" role="log">
            <div className="intention-guided-start">
              <p>Geführter Modus — Toro stellt dir gezielte Fragen. Schreib einfach los.</p>
            </div>
          </div>
          <div className="carea-input-wrap">
            <div className="carea-input-inner">
              <ChatInput
                input={input}
                setInput={onSetInput}
                sending={sending}
                onSubmit={onSendMessage}
                attachmentRef={attachmentRef}
              />
              <p className="chat-ai-disclaimer">
                Toros Antworten sind KI-generiert und können Fehler enthalten.
                Prüfe wichtige Informationen immer selbst.
              </p>
            </div>
          </div>
        </>
      ) : (
        <>
          <IntentionGate
            onFocused={() => setIntentionChoice('focused')}
            onGuided={() => {
              onSetPendingIntention('guided')
              setIntentionChoice('guided')
            }}
            userName={userName}
          />
          <div className="carea-input-wrap">
            <div className="carea-input-inner">
              <ChatInput
                input={input}
                setInput={onSetInput}
                sending={sending}
                onSubmit={onSendMessage}
                attachmentRef={attachmentRef}
              />
              <p className="chat-ai-disclaimer">
                Toros Antworten sind KI-generiert und können Fehler enthalten.
                Prüfe wichtige Informationen immer selbst.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
