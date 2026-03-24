'use client'

import React, { useState } from 'react'
import {
  ThumbsUp, ThumbsDown, Copy, BookmarkSimple,
  ArrowUpRight, Link, Eye, ArrowCounterClockwise, Check, CircleNotch,
} from '@phosphor-icons/react'

interface MessageActionsProps {
  messageId: string
  content: string
  isBookmarked: boolean
  bookmarkLoading: boolean
  flagState: 'idle' | 'confirm' | 'done'
  isLastMessage: boolean
  hasArtifact?: boolean
  artifactUrl?: string
  isRegenerating?: boolean
  onBookmark: () => void
  onFlag: () => void
  onPerspectives?: () => void
  onRegenerate?: () => void
  onShareToChat?: () => void
}

export default function MessageActions({
  content,
  isBookmarked,
  bookmarkLoading,
  flagState,
  isLastMessage,
  hasArtifact = false,
  artifactUrl,
  isRegenerating = false,
  onBookmark,
  onFlag,
  onPerspectives,
  onRegenerate,
  onShareToChat,
}: MessageActionsProps) {
  const [thumbsUp, setThumbsUp] = useState(false)
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    }).catch(() => null)
  }

  return (
    <div
      role="toolbar"
      aria-label="Antwort-Aktionen"
      className={`message-actions${isLastMessage ? ' message-actions--visible' : ''}`}
    >
      {/* Feedback */}
      <button
        className={`message-action-btn${thumbsUp ? ' message-action-btn--active' : ''}`}
        onClick={() => setThumbsUp(v => !v)}
        aria-label="Antwort hilfreich"
        title="Hilfreich"
      >
        <ThumbsUp size={13} weight={thumbsUp ? 'fill' : 'regular'} />
      </button>

      {flagState === 'done' ? (
        <span className="message-action-done">Gemeldet</span>
      ) : (
        <button
          className={`message-action-btn${flagState === 'confirm' ? ' message-action-btn--danger' : ''}`}
          onClick={onFlag}
          aria-label="Antwort als fehlerhaft melden"
          title="Fehlerhaft melden (Art. 14 KI-VO)"
        >
          <ThumbsDown size={13} weight={flagState === 'confirm' ? 'fill' : 'regular'} />
        </button>
      )}

      <span className="message-action-separator" aria-hidden="true" />

      {/* Kopieren */}
      <button
        className={`message-action-btn${copied ? ' message-action-btn--active' : ''}`}
        onClick={handleCopy}
        aria-label="Antwort kopieren"
        title="Kopieren"
      >
        {copied ? <Check size={13} weight="bold" /> : <Copy size={13} weight="regular" />}
      </button>

      {/* Lesezeichen */}
      <button
        className={`message-action-btn${isBookmarked ? ' message-action-btn--active' : ''}`}
        onClick={onBookmark}
        disabled={bookmarkLoading}
        aria-label={isBookmarked ? 'Lesezeichen entfernen' : 'Lesezeichen setzen'}
        title={isBookmarked ? 'Lesezeichen entfernen' : 'Lesezeichen'}
      >
        <BookmarkSimple size={13} weight={isBookmarked ? 'fill' : 'regular'} />
      </button>

      {/* In Chat */}
      <button
        className="message-action-btn"
        onClick={onShareToChat}
        aria-label="In neuen Chat übernehmen"
        title="In Chat"
      >
        <ArrowUpRight size={13} weight="regular" />
      </button>

      {/* Link — nur bei Artefakten */}
      {hasArtifact && artifactUrl && (
        <button
          className="message-action-btn"
          onClick={() => navigator.clipboard.writeText(artifactUrl).catch(() => null)}
          aria-label="Link zum Artefakt kopieren"
          title="Artefakt-Link kopieren"
        >
          <Link size={13} weight="regular" />
        </button>
      )}

      {/* Perspektiven */}
      <button
        className="message-action-btn"
        onClick={onPerspectives}
        aria-label="Perspektiven zu dieser Antwort"
        title="Perspektiven"
      >
        <Eye size={13} weight="regular" />
      </button>

      {/* Neu generieren */}
      <button
        className={`message-action-btn${isRegenerating ? ' message-action-btn--active' : ''}`}
        onClick={isLastMessage && !isRegenerating ? onRegenerate : undefined}
        disabled={!isLastMessage || isRegenerating}
        aria-label="Antwort neu generieren"
        title={isLastMessage ? 'Neu generieren' : 'Nur die letzte Antwort kann neu generiert werden'}
        style={{ opacity: isLastMessage ? 1 : 0.35 }}
      >
        {isRegenerating
          ? <CircleNotch size={13} className="spin" />
          : <ArrowCounterClockwise size={13} weight="regular" />
        }
      </button>
    </div>
  )
}
