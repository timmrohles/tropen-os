'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import type { ChatMessageType, Project, Conversation } from '@/hooks/useWorkspaceState'
import type { ChipItem, AttachmentData, GuidedAction } from '@/lib/workspace-types'
import { detectParallelIntent } from '@/lib/chat/detect-parallel-intent'
import ParallelConfirmBubble from './ParallelConfirmBubble'
import IntentionGate from './IntentionGate'
import FocusedFlow from './FocusedFlow'
import ChatMessage from './ChatMessage'
import ChatInput from './ChatInput'
import ChatHeaderStrip, { type ChatHeaderStripHandle } from './ChatHeaderStrip'
import ArtifactsView from './ArtifactsView'
import ContextBar from './ContextBar'
import ChatContextStrip from './ChatContextStrip'
import BookmarksDrawer from './BookmarksDrawer'
import SearchDrawer from './SearchDrawer'
import MemorySaveModal from './MemorySaveModal'
import ShareModal from './ShareModal'
import PerspectiveMessage from './PerspectiveMessage'
import { usePerspectives } from '@/hooks/usePerspectives'
import { useArtifactsView } from '@/hooks/useArtifactsView'
import { useAssistantName } from '@/hooks/useAssistantName'
import { useParallelTabs } from '@/hooks/useParallelTabs'
import type { CompareModel } from './ModelComparePopover'
import type { PromptBuilderPanelProps } from './ChatInput'

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
  searchDrawerOpen?: boolean
  onSearchDrawerClose?: () => void
  onOpenSearch?: () => void
  onOpenInNewTab?: () => void
  canOpenNewTab?: boolean
  onOpenParallelTabs?: (items: Array<{ convId: string; title: string }>) => void
  onSendDirectToConv?: (text: string, convId: string) => void
  onSendDirectToNewConv?: (text: string, convId: string, overrideClientPrefs?: Record<string, unknown>, displayText?: string) => void
  showHeaderTitle?: boolean
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
  onOpenInNewTab,
  canOpenNewTab = false,
  onOpenParallelTabs,
  onSendDirectToConv,
  onSendDirectToNewConv,
  showHeaderTitle = true,
}: ChatAreaProps) {
  const assistantName = useAssistantName()
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set())
  const [bookmarksDrawerOpen, setBookmarksDrawerOpen] = useState(false)
  const headerRef = useRef<ChatHeaderStripHandle>(null)

  // Prompt-Builder context — last user message + recent history
  const lastUserMsg = messages.filter(m => m.role === 'user').at(-1)
  const pbRecentMessages = React.useMemo(
    () => messages.slice(-6).map(m => ({ role: m.role, content: m.content })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [messages.length]
  )

  // ── Perspectives ──────────────────────────────────────
  const { avatarCache, perspectiveMsg, loadAvatars, startPerspective } = usePerspectives(activeConvId, onRefreshMessages)

  // Artefakte-Übersicht
  const { artifactsView, setArtifactsView, artifactsViewItems, artifactsViewLoading, openArtifactsView } = useArtifactsView(activeConvId)

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

  // ── Parallel tabs + model compare ────────────────────
  const {
    parallelConfirm,
    setParallelConfirm,
    parallelLoading,
    handleParallelConfirm,
    handleModelCompare,
  } = useParallelTabs({
    workspaceId,
    input,
    onOpenParallelTabs,
    onSendDirectToNewConv,
  })

  // Intercept submit: handle @-mention and parallel-tab intent
  async function handleChatSubmit(e: React.FormEvent) {
    const trimmed = input.trim()

    // @-mention → perspective
    const mentionMatch = trimmed.match(/^@([^\s]+)\s*([\s\S]*)$/)
    if (mentionMatch) {
      const mentionName = mentionMatch[1]
      const afterMention = mentionMatch[2]?.trim() || undefined
      const avs = avatarCache ?? await loadAvatars()
      const avatar = avs.find(a => a.name.toLowerCase() === mentionName.toLowerCase())
      if (avatar) {
        e.preventDefault()
        onSetInput('')
        await startPerspective(avatar, afterMention)
        return
      }
    }

    // Parallel-tabs detection (only when tab feature is available and active conversation exists)
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

  // Shared input section — plain function, NOT a component (avoids remount-on-render)
  function renderInput(onSubmit: (e: React.FormEvent) => void) {
    return (
      <div className="carea-input-wrap">
        <div className="carea-input-inner">
          <ChatInput input={input} setInput={onSetInput} sending={sending} onSubmit={onSubmit}
            attachmentRef={attachmentRef} onOpenNewTab={canOpenNewTab ? onOpenInNewTab : undefined}
            canOpenNewTab={canOpenNewTab} avatarMentions={avatarCache ?? undefined} onMentionLoad={loadAvatars}
            promptBuilderProps={activeConvId && lastUserMsg ? {
              conversationId: activeConvId,
              userMessage: lastUserMsg.content,
              recentMessages: pbRecentMessages,
              onSend: (prompt: string) => onSendDirect(prompt),
            } satisfies PromptBuilderPanelProps : undefined}
            onModelCompare={canOpenNewTab && !isMobile ? (models: CompareModel[]) => { void handleModelCompare(models) } : undefined}
          />
          <p className="chat-ai-disclaimer">
            {assistantName}s Antworten sind KI-generiert und können Fehler enthalten. Prüfe wichtige Informationen immer selbst.
          </p>
        </div>
      </div>
    )
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
              showTitle={showHeaderTitle}
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
            <ContextBar percent={contextPercent} />
          )}

          {/* Artefakte-Übersicht */}
          {artifactsView && (
            <ArtifactsView
              items={artifactsViewItems}
              loading={artifactsViewLoading}
              conversationId={activeConvId}
              organizationId={organizationId}
              onSendDirect={onSendDirect}
              onBack={() => setArtifactsView(false)}
            />
          )}

          <div className="carea-messages" aria-live="polite" aria-label="Chat-Verlauf" role="log" style={artifactsView ? { display: 'none' } : undefined}>
            {(() => {
              return messages.map((msg, i) => {
              const isLast = i === messages.length - 1
              const isLastAssistant = isLast && msg.role === 'assistant'
              const showResetDivider = contextStartIndex > 0 && i === contextStartIndex
              return (
                <React.Fragment key={msg.id ?? `pending-${i}`}>
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
                    onGuidedAction={onGuidedAction}
                    onGenerateImage={onGenerateImage}
                    isInSplitView={isInSplitView}
                    suggestionsEnabled={suggestionsEnabled}
                    onMemorize={activeConvProjectId ? () => onSetShowMemoryModal(true) : undefined}
                    onOpenInNewTab={canOpenNewTab ? onOpenInNewTab : undefined}
                    perspectives={avatarCache}
                    onLoadAvatars={loadAvatars}
                    onPerspective={msg.role === 'assistant' && !msg.pending && msg.id && !perspectiveMsg
                      ? (avatar) => startPerspective(avatar)
                      : undefined}
                  />
                </React.Fragment>
              )
            })})()}

            {/* Parallel-tabs confirmation bubble */}
            {parallelConfirm && (
              <ParallelConfirmBubble
                intent={parallelConfirm.intent}
                loading={parallelLoading}
                onConfirm={() => { void handleParallelConfirm() }}
                onDeny={handleParallelDeny}
              />
            )}

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
          {/* Inline perspective response */}
          {perspectiveMsg && (
            <PerspectiveMessage
              avatarEmoji={perspectiveMsg.avatarEmoji}
              avatarName={perspectiveMsg.avatarName}
              text={perspectiveMsg.text}
              pending={!perspectiveMsg.done}
            />
          )}

          {renderInput(handleChatSubmit)}

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
          assistantName={assistantName}
        />
      ) : intentionChoice === 'guided' ? (
        <>
          <div className="carea-messages" aria-live="polite" aria-label="Chat-Verlauf" role="log">
            <div className="intention-guided-start">
              <p>Geführter Modus — {assistantName} stellt dir gezielte Fragen. Schreib einfach los.</p>
            </div>
          </div>
          {renderInput(handleChatSubmit)}
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
            assistantName={assistantName}
          />
          {renderInput(onSendMessage)}
        </>
      )}
    </div>
  )
}
