'use client'

import React from 'react'
import type { ChatMessageType } from '@/hooks/useWorkspaceState'
import type { ChipItem, GuidedAction } from '@/lib/workspace-types'
import type { ChatHeaderStripHandle } from './ChatHeaderStrip'
import type { ParallelIntent } from '@/lib/chat/detect-parallel-intent'
import ChatMessage from './ChatMessage'
import ParallelConfirmBubble from './ParallelConfirmBubble'

interface ChatMessageListProps {
  messages: ChatMessageType[]
  contextStartIndex: number
  userInitial: string
  conversationId: string
  organizationId?: string
  bookmarkedIds: Set<string>
  onBookmarkChange: (messageId: string, bookmarked: boolean) => void
  headerRef: React.RefObject<ChatHeaderStripHandle | null>
  onSendDirect: (text: string) => void
  sending: boolean
  chips: ChipItem[]
  onRegenerate: () => void
  onGuidedAction: (action: GuidedAction) => void
  onGenerateImage?: (content: string) => void
  isInSplitView: boolean
  suggestionsEnabled: boolean
  parallelConfirm: { intent: ParallelIntent; originalInput: string } | null
  parallelLoading: boolean
  onParallelConfirm: () => void
  onParallelDeny: () => void
  contextPercent: number
  onContextReset?: () => void
  error: string
  messagesEndRef: React.RefObject<HTMLDivElement>
  artifactsView: boolean
}

export default function ChatMessageList({
  messages,
  contextStartIndex,
  userInitial,
  conversationId,
  organizationId,
  bookmarkedIds,
  onBookmarkChange,
  headerRef,
  onSendDirect,
  sending,
  chips,
  onRegenerate,
  onGuidedAction,
  onGenerateImage,
  isInSplitView,
  suggestionsEnabled,
  parallelConfirm,
  parallelLoading,
  onParallelConfirm,
  onParallelDeny,
  contextPercent,
  onContextReset,
  error,
  messagesEndRef,
  artifactsView,
}: ChatMessageListProps) {
  return (
    <div
      className="carea-messages"
      aria-live="polite"
      aria-label="Chat-Verlauf"
      role="log"
      style={artifactsView ? { display: 'none' } : undefined}
    >
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
                conversationId={conversationId}
                organizationId={organizationId}
                bookmarkedIds={bookmarkedIds}
                onBookmarkChange={onBookmarkChange}
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
              />
            </React.Fragment>
          )
        })
      })()}

      {/* Parallel-tabs confirmation bubble */}
      {parallelConfirm && (
        <ParallelConfirmBubble
          intent={parallelConfirm.intent}
          loading={parallelLoading}
          onConfirm={onParallelConfirm}
          onDeny={onParallelDeny}
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
  )
}
