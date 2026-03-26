'use client'

import React, { useState } from 'react'
import {
  ThumbsUp, ThumbsDown, BookmarkSimple,
  SpeakerHigh, SpeakerSlash, CircleNotch,
} from '@phosphor-icons/react'
import { useTTS } from '@/hooks/useTTS'

interface MessageActionsProps {
  content: string
  isBookmarked: boolean
  bookmarkLoading: boolean
  flagState: 'idle' | 'confirm' | 'done'
  isLastMessage: boolean
  onBookmark: () => void
  onFlag: () => void
}

export default function MessageActions({
  content,
  isBookmarked,
  bookmarkLoading,
  flagState,
  isLastMessage,
  onBookmark,
  onFlag,
}: MessageActionsProps) {
  const [thumbsUp, setThumbsUp] = useState(false)
  const { state: ttsState, speak, stop } = useTTS()

  return (
    <div
      role="toolbar"
      aria-label="Antwort-Aktionen"
      className={`message-actions${isLastMessage ? ' message-actions--visible' : ''}`}
    >
      {/* Hilfreich */}
      <button
        className={`message-action-btn${thumbsUp ? ' message-action-btn--active' : ''}`}
        onClick={() => setThumbsUp(v => !v)}
        aria-label="Antwort hilfreich"
        title="Hilfreich"
      >
        <ThumbsUp size={13} weight={thumbsUp ? 'fill' : 'bold'} />
      </button>

      {/* Fehlerhaft */}
      {flagState === 'done' ? (
        <span className="message-action-done">Gemeldet</span>
      ) : (
        <button
          className={`message-action-btn${flagState === 'confirm' ? ' message-action-btn--danger' : ''}`}
          onClick={onFlag}
          aria-label="Antwort als fehlerhaft melden"
          title="Fehlerhaft melden (Art. 14 KI-VO)"
        >
          <ThumbsDown size={13} weight={flagState === 'confirm' ? 'fill' : 'bold'} />
        </button>
      )}

      {/* Lesezeichen */}
      <button
        className={`message-action-btn${isBookmarked ? ' message-action-btn--active' : ''}`}
        onClick={onBookmark}
        disabled={bookmarkLoading}
        aria-label={isBookmarked ? 'Lesezeichen entfernen' : 'Lesezeichen setzen'}
        title={isBookmarked ? 'Lesezeichen entfernen' : 'Lesezeichen'}
      >
        <BookmarkSimple size={13} weight={isBookmarked ? 'fill' : 'bold'} />
      </button>

      {/* TTS — Vorlesen */}
      <button
        className={`message-action-btn${ttsState === 'playing' ? ' message-action-btn--active' : ''}`}
        onClick={() => ttsState === 'playing' ? stop() : speak(content)}
        disabled={ttsState === 'loading'}
        aria-label={
          ttsState === 'playing' ? 'Vorlesen stoppen' :
          ttsState === 'loading' ? 'Wird geladen…' :
          'Vorlesen'
        }
        title={
          ttsState === 'playing' ? 'Stoppen' :
          ttsState === 'loading' ? 'Laden…' :
          'Vorlesen'
        }
      >
        {ttsState === 'loading' && <CircleNotch size={13} weight="bold" className="spin" aria-hidden="true" />}
        {ttsState === 'playing' && <SpeakerSlash size={13} weight="bold" aria-hidden="true" />}
        {(ttsState === 'idle' || ttsState === 'error') && <SpeakerHigh size={13} weight="bold" aria-hidden="true" />}
      </button>
    </div>
  )
}
