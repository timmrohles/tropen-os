'use client'

import React, { useCallback, useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import type { ChatMessageType } from '@/hooks/useWorkspaceState'
import type { ChipItem, GuidedAction } from '@/lib/workspace-types'
import ParrotIcon from '@/components/ParrotIcon'
import { SaveArtifactModal } from './SaveArtifactModal'
import PostToWorkspaceModal from './PostToWorkspaceModal'
import MessageActions from './MessageActions'
import ActionLayer from './ActionLayer'
import SourcesBar from './SourcesBar'
import ThinkingBlock from './ThinkingBlock'
import { makeMdComponents, renderAssistantContent } from './ChatRenderers'
import FlagPanel from './FlagPanel'
import GuidedChatMessage from './GuidedChatMessage'
import SuggestionPillsSection from './SuggestionPillsSection'

interface ChatMessageProps {
  msg: ChatMessageType
  userInitial: string
  conversationId?: string
  organizationId?: string
  bookmarkedIds?: Set<string>
  onBookmarkChange?: (messageId: string, bookmarked: boolean) => void
  onArtifactSaved?: () => void
  onSendDirect?: (text: string) => void
  isLastMessage?: boolean
  isLastAssistantMessage?: boolean
  isStreaming?: boolean
  chips?: ChipItem[]
  onPerspectives?: (messageId: string) => void
  onRegenerate?: () => void
  onGuidedAction?: (action: GuidedAction) => void
  onGenerateImage?: (content: string) => void
  isInSplitView?: boolean
  suggestionsEnabled?: boolean
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ChatMessage({
  msg,
  userInitial,
  conversationId,
  organizationId,
  bookmarkedIds,
  onBookmarkChange,
  onArtifactSaved,
  onSendDirect,
  isLastMessage = false,
  isLastAssistantMessage = false,
  isStreaming = false,
  chips = [],
  onPerspectives,
  onRegenerate,
  onGuidedAction,
  onGenerateImage,
  isInSplitView = false,
  suggestionsEnabled = true,
}: ChatMessageProps) {
  // Hooks müssen vor jedem early return stehen (Rules of Hooks)
  const [bookmarkLoading, setBookmarkLoading] = useState(false)
  const [saveModal, setSaveModal] = useState<{ content: string; language: string | null } | null>(null)
  const [flagState, setFlagState] = useState<'idle' | 'confirm' | 'done'>('idle')
  const [flagReason, setFlagReason] = useState('')
  const [actionLayerOpen, setActionLayerOpen] = useState(false)
  const [workspaceModalOpen, setWorkspaceModalOpen] = useState(false)
  const router = useRouter()

  function handleAction(id: string) {
    switch (id) {
      case 'perspective':
        if (msg.id && onPerspectives) onPerspectives(msg.id)
        break
      case 'shorten':
        onSendDirect?.('Bitte kürze deine letzte Antwort auf das Wesentliche.')
        break
      case 'email':
        onSendDirect?.('Formuliere deine letzte Antwort als professionelle E-Mail. Für die Unterschrift verwende den Platzhalter "[Ihr Name]" — setze niemals deinen eigenen Namen ein.')
        break
      case 'translate':
        onSendDirect?.('Übersetze deine letzte Antwort ins Englische.')
        break
      case 'image':
        onGenerateImage?.(msg.content)
        break
      case 'regenerate':
        onRegenerate?.()
        break
      case 'post_to_workspace':
        setWorkspaceModalOpen(true)
        break
      case 'report':
        setFlagState(s => s === 'confirm' ? 'idle' : 'confirm')
        break
    }
    setActionLayerOpen(false)
  }

  // Hooks must be declared before any early returns (Rules of Hooks)
  const isUser = msg.role === 'user'
  const suggestionsMatch = isUser ? null : msg.content.match(/<suggestions>([\s\S]*?)<\/suggestions>/)
  const suggestions: string[] = React.useMemo(() => {
    if (!suggestionsMatch) return []
    try { return JSON.parse(suggestionsMatch[1]) as string[] } catch { return [] }
  }, [suggestionsMatch])
  const handleShareToChat = useCallback(async () => {
    try {
      const res = await fetch('/api/conversations/new-from-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: msg.content, source_message_id: msg.id }),
      })
      if (!res.ok) return
      const { conversation_id } = await res.json() as { conversation_id: string }
      router.push(`?conv=${conversation_id}`)
    } catch {
      // silently ignore
    }
  }, [msg.content, msg.id, router])

  // ── Guided Chat Mode rendering ───────────────────────────
  if ((msg.role === 'guided_picker' || msg.role === 'guided_step' || msg.role === 'guided_summary') && msg.guidedData && onGuidedAction && msg.id) {
    return <GuidedChatMessage msg={msg} onGuidedAction={onGuidedAction} />
  }

  const isBookmarked = msg.id ? (bookmarkedIds?.has(msg.id) ?? false) : false
  const showActions = !isUser && !msg.pending && !!conversationId && !!msg.id

  const displayContent = suggestionsMatch
    ? msg.content.replace(/<suggestions>[\s\S]*?<\/suggestions>/, '').trimEnd()
    : msg.content

  const hasArtifact = displayContent.includes('<artifact')

  async function handleBookmark() {
    if (!msg.id || !conversationId || bookmarkLoading) return
    setBookmarkLoading(true)
    try {
      if (isBookmarked) {
        await fetch('/api/bookmarks', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messageId: msg.id }),
        })
        onBookmarkChange?.(msg.id, false)
      } else {
        await fetch('/api/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messageId: msg.id,
            conversationId,
            contentPreview: msg.content.slice(0, 200),
          }),
        })
        onBookmarkChange?.(msg.id, true)
      }
    } finally {
      setBookmarkLoading(false)
    }
  }

  async function handleFlag() {
    if (!msg.id || flagState !== 'confirm') return
    await fetch(`/api/messages/${msg.id}/flag`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: flagReason }),
    })
    setFlagState('done')
    setFlagReason('')
  }

  function handleSaveArtifact(content: string, language: string | null) {
    if (!conversationId || !organizationId) return
    setSaveModal({ content, language })
  }

  const mdComponents = makeMdComponents(
    showActions && organizationId ? handleSaveArtifact : undefined
  )

  return (
    <>
      <div className={`cmsg${isUser ? ' cmsg--user' : ' cmsg--assistant'}`}>
        {!isUser && (
          <div className="cmsg-avatar-toro"><ParrotIcon size={22} /></div>
        )}

        <div className="cmsg-bubble-wrap">
          <div className={`cmsg-bubble${isUser ? ' cmsg-bubble--user' : ' cmsg-bubble--assistant'}`}>
            {!isUser && msg.thinking && <ThinkingBlock content={msg.thinking} />}
            <div className="cmsg-content">
              {isUser
                ? msg.content
                : renderAssistantContent(
                    displayContent,
                    mdComponents,
                    showActions && organizationId && conversationId
                      ? { conversationId, organizationId, messageId: msg.id ?? undefined, onSaved: onArtifactSaved, onSendDirect, isInSplitView }
                      : undefined
                  )
              }
            </div>
            {!isUser && msg.pending && (
              <span className="animate-pulse" style={{ opacity: 0.6 }}>▋</span>
            )}
            {showActions && (
              <MessageActions
                content={msg.content}
                isBookmarked={isBookmarked}
                bookmarkLoading={bookmarkLoading}
                flagState={flagState}
                isLastMessage={isLastAssistantMessage}
                onBookmark={handleBookmark}
                onFlag={() => setFlagState(s => s === 'confirm' ? 'idle' : 'confirm')}
              />
            )}
            {showActions && actionLayerOpen && (
              <ActionLayer
                isLastMessage={isLastAssistantMessage}
                isStreaming={isStreaming && isLastAssistantMessage}
                onAction={handleAction}
                onClose={() => setActionLayerOpen(false)}
              />
            )}

          {flagState === 'confirm' && showActions && (
            <FlagPanel
              flagReason={flagReason}
              onReasonChange={setFlagReason}
              onFlag={handleFlag}
              onCancel={() => { setFlagState('idle'); setFlagReason('') }}
            />
          )}
          </div>{/* /cmsg-bubble */}

          {/* ToroBadge — außen rechts an der Blase */}
          {showActions && (
            <button
              className={`toro-avatar-badge${actionLayerOpen ? ' toro-avatar-badge--active' : ''}`}
              onClick={() => setActionLayerOpen(v => !v)}
              aria-label="Toro-Aktionen öffnen"
              title="Was soll ich damit tun?"
              aria-expanded={actionLayerOpen}
              aria-haspopup="menu"
            >
              <ParrotIcon size={14} />
            </button>
          )}
        </div>{/* /cmsg-bubble-wrap */}

        {isUser && (
          <div className="cmsg-avatar-user">{userInitial}</div>
        )}
      </div>

      {!isUser && !msg.pending && msg.sources && msg.sources.length > 0 && (msg.link_previews ?? true) && (
        <SourcesBar sources={msg.sources} />
      )}

      {!isUser && (
        <SuggestionPillsSection
          suggestions={suggestions}
          suggestionsEnabled={suggestionsEnabled}
          chips={chips}
          isLastMessage={isLastMessage}
          onSendDirect={onSendDirect}
        />
      )}

      {workspaceModalOpen && conversationId && (
        <PostToWorkspaceModal
          conversationId={conversationId}
          conversationTitle={msg.role === 'assistant' ? undefined : undefined}
          onClose={() => setWorkspaceModalOpen(false)}
        />
      )}

      {saveModal && conversationId && organizationId && (
        <SaveArtifactModal
          content={saveModal.content}
          language={saveModal.language}
          conversationId={conversationId}
          organizationId={organizationId}
          onDone={() => {
            setSaveModal(null)
            onArtifactSaved?.()
          }}
          onCancel={() => setSaveModal(null)}
        />
      )}
    </>
  )
}

