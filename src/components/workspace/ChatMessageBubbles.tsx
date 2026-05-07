'use client'

// Sub-components for ChatMessage — split out to keep ChatMessage.tsx under 300 lines.

import type { ChatMessageType } from '@/hooks/useWorkspaceState'
import ParrotIcon from '@/components/ParrotIcon'
import MessageActions from './MessageActions'
import ActionLayer from './ActionLayer'
import ThinkingBlock from './ThinkingBlock'
import { makeMdComponents, renderAssistantContent } from './ChatRenderers'
import FlagPanel from './FlagPanel'

// ─── UserBubble ───────────────────────────────────────────────────────────────

interface UserBubbleProps {
  content: string
  userInitial: string
}

export function UserBubble({ content, userInitial }: UserBubbleProps) {
  return (
    <div className="cmsg cmsg--user">
      <div className="cmsg-bubble-wrap">
        <div className="cmsg-bubble cmsg-bubble--user">
          <div className="cmsg-content">{content}</div>
        </div>
      </div>
      <div className="cmsg-avatar-user">{userInitial}</div>
    </div>
  )
}

// ─── AssistantBubble ──────────────────────────────────────────────────────────

export interface AssistantBubbleProps {
  msg: ChatMessageType
  showActions: boolean
  isLastAssistantMessage: boolean
  isStreaming: boolean
  displayContent: string
  conversationId?: string
  organizationId?: string
  actionLayerOpen: boolean
  flagState: 'idle' | 'confirm' | 'done'
  flagReason: string
  bookmarkLoading: boolean
  isBookmarked: boolean
  mdComponents: ReturnType<typeof makeMdComponents>
  onArtifactSaved?: () => void
  onSendDirect?: (text: string) => void
  isInSplitView: boolean
  onBookmark: () => void
  onFlag: () => void
  onFlagReasonChange: (v: string) => void
  onFlagSubmit: () => void
  onFlagCancel: () => void
  onAction: (id: string) => void
  onToggleActionLayer: () => void
}

export function AssistantBubble({
  msg, showActions, isLastAssistantMessage, isStreaming,
  displayContent, conversationId, organizationId,
  actionLayerOpen, flagState, flagReason, bookmarkLoading, isBookmarked,
  mdComponents, onArtifactSaved, onSendDirect, isInSplitView,
  onBookmark, onFlag, onFlagReasonChange, onFlagSubmit, onFlagCancel,
  onAction, onToggleActionLayer,
}: AssistantBubbleProps) {
  const artifactContext = showActions && organizationId && conversationId
    ? { conversationId, organizationId, messageId: msg.id ?? undefined, onSaved: onArtifactSaved, onSendDirect, isInSplitView }
    : undefined

  return (
    <div className="cmsg cmsg--assistant">
      <div className="cmsg-avatar-toro"><ParrotIcon size={22} /></div>
      <div className="cmsg-bubble-wrap">
        <div className="cmsg-bubble cmsg-bubble--assistant">
          {msg.thinking && <ThinkingBlock content={msg.thinking} />}
          <div className="cmsg-content">
            {renderAssistantContent(displayContent, mdComponents, artifactContext)}
          </div>
          {msg.pending && <span className="animate-pulse" style={{ opacity: 0.6 }}>▋</span>}
          {showActions && (
            <MessageActions
              content={msg.content}
              isBookmarked={isBookmarked}
              bookmarkLoading={bookmarkLoading}
              flagState={flagState}
              isLastMessage={isLastAssistantMessage}
              onBookmark={onBookmark}
              onFlag={onFlag}
            />
          )}
          {showActions && actionLayerOpen && (
            <ActionLayer
              isLastMessage={isLastAssistantMessage}
              isStreaming={isStreaming && isLastAssistantMessage}
              onAction={onAction}
              onClose={onToggleActionLayer}
            />
          )}
          {flagState === 'confirm' && showActions && (
            <FlagPanel
              flagReason={flagReason}
              onReasonChange={onFlagReasonChange}
              onFlag={onFlagSubmit}
              onCancel={onFlagCancel}
            />
          )}
        </div>

        {/* ToroBadge — außen rechts an der Blase */}
        {showActions && (
          <button
            className={`toro-avatar-badge${actionLayerOpen ? ' toro-avatar-badge--active' : ''}`}
            onClick={onToggleActionLayer}
            aria-label="Toro-Aktionen öffnen"
            title="Was soll ich damit tun?"
            aria-expanded={actionLayerOpen}
            aria-haspopup="menu"
          >
            <ParrotIcon size={14} />
          </button>
        )}
      </div>
    </div>
  )
}
