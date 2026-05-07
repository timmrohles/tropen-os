'use client'

import React, { useEffect, useRef, useState } from 'react'
import { ArrowsOut, ArrowsIn, X, CopySimple, ArrowBendUpLeft } from '@phosphor-icons/react'
import {
  resolveScope, fetchSseStream, applyParsedEvent,
  type AvatarResponse,
} from './perspectives-sse'

interface Avatar {
  id: string
  name: string
  emoji: string
  context_default: string
}

interface PerspectivesBottomSheetProps {
  avatarIds: string[]
  avatars: Avatar[]
  conversationId: string
  onClose: () => void
  onRefreshMessages: () => void
}

// ─── AvatarResponseCard ───────────────────────────────────────────────────────

interface AvatarResponseCardProps {
  avatar: Avatar
  resp: AvatarResponse | undefined
  copied: string | null
  posting: string | null
  onCopy: (id: string, text: string) => void
  onPostToChat: (avatar: Avatar, text: string) => void
}

function AvatarResponseCard({ avatar, resp, copied, posting, onCopy, onPostToChat }: AvatarResponseCardProps) {
  const text = resp?.text ?? ''
  const done = resp?.done ?? false
  const err = resp?.error

  return (
    <div className={`persp-avatar-card${done ? ' persp-avatar-card--done' : ''}`}>
      <div className="persp-avatar-card-header">
        <span className="persp-avatar-card-emoji" aria-hidden="true">{avatar.emoji}</span>
        <span className="persp-avatar-card-name">{avatar.name}</span>
        {!done && !err && (
          <span className="persp-avatar-card-loading" aria-live="polite">
            <span className="persp-typing-dot" /><span className="persp-typing-dot" /><span className="persp-typing-dot" />
          </span>
        )}
        {done && resp && resp.tokensUsed > 0 && (
          <span className="persp-avatar-card-tokens">{resp.tokensUsed} Token</span>
        )}
      </div>

      {err ? (
        <div className="persp-avatar-card-error">{err}</div>
      ) : (
        <div className="persp-avatar-card-text">
          {text || (!done && <span className="persp-placeholder">Antwort wird generiert…</span>)}
        </div>
      )}

      {done && !err && text && (
        <div className="persp-avatar-card-actions">
          <button
            className="persp-card-action-btn"
            onClick={() => onCopy(avatar.id, text)}
            aria-label="Antwort kopieren"
            title="Kopieren"
          >
            <CopySimple size={13} weight="bold" aria-hidden="true" />
            {copied === avatar.id ? 'Kopiert!' : 'Kopieren'}
          </button>
          <button
            className="persp-card-action-btn persp-card-action-btn--primary"
            onClick={() => onPostToChat(avatar, text)}
            disabled={posting === avatar.id}
            aria-label="In Chat posten"
            title="Als Assistenten-Nachricht in den Chat einfügen"
          >
            <ArrowBendUpLeft size={13} weight="bold" aria-hidden="true" />
            {posting === avatar.id ? 'Wird gepostet…' : 'In Chat posten'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PerspectivesBottomSheet({
  avatarIds,
  avatars,
  conversationId,
  onClose,
  onRefreshMessages,
}: PerspectivesBottomSheetProps) {
  const [responses, setResponses] = useState<Map<string, AvatarResponse>>(
    new Map(avatarIds.map(id => [id, { avatarId: id, text: '', done: false, tokensUsed: 0 }]))
  )
  const [expanded, setExpanded] = useState(false)
  const [streaming, setStreaming] = useState(true)
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [posting, setPosting] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const scope = resolveScope(avatars[0]?.context_default ?? 'last_10')

  useEffect(() => {
    const abort = new AbortController()
    abortRef.current = abort

    fetchSseStream(
      '/api/perspectives/query',
      { avatarIds, scope, conversationId },
      abort.signal,
      (parsed) => {
        const avatarId = parsed.avatarId as string
        setResponses(prev => applyParsedEvent(prev, avatarId, parsed))
      },
      () => setStreaming(false),
      (msg) => { setGlobalError(msg); setStreaming(false) },
    ).catch(err => {
      if ((err as Error).name !== 'AbortError') setGlobalError(String(err))
    }).finally(() => setStreaming(false))

    return () => { abort.abort() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleCopy(avatarId: string, text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(avatarId)
      setTimeout(() => setCopied(null), 1800)
    } catch {
      // ignore
    }
  }

  async function handlePostToChat(avatar: Avatar, text: string) {
    if (!text.trim()) return
    setPosting(avatar.id)
    try {
      const content = `**${avatar.emoji} ${avatar.name}** *(Perspectives)*\n\n${text}`
      const res = await fetch('/api/perspectives/post-to-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, content }),
      })
      if (res.ok) onRefreshMessages()
    } catch {
      // ignore
    } finally {
      setPosting(null)
    }
  }

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { abortRef.current?.abort(); onClose() }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const sheetHeight = expanded ? '92vh' : '60vh'

  return (
    <>
      <div
        className="persp-sheet-backdrop"
        onClick={() => { abortRef.current?.abort(); onClose() }}
        aria-hidden="true"
      />
      <div
        className="persp-sheet"
        style={{ height: sheetHeight }}
        role="dialog"
        aria-label="Perspectives"
        aria-modal="true"
      >
        <div className="persp-sheet-header">
          <span className="persp-sheet-title">
            Perspectives
            {streaming && <span className="persp-sheet-streaming-dot" aria-hidden="true" />}
          </span>
          <div className="persp-sheet-header-actions">
            <button
              className="persp-sheet-icon-btn"
              onClick={() => setExpanded(v => !v)}
              aria-label={expanded ? 'Verkleinern' : 'Vollbild'}
              title={expanded ? 'Verkleinern' : 'Vollbild'}
            >
              {expanded
                ? <ArrowsIn size={16} weight="bold" aria-hidden="true" />
                : <ArrowsOut size={16} weight="bold" aria-hidden="true" />
              }
            </button>
            <button
              className="persp-sheet-icon-btn"
              onClick={() => { abortRef.current?.abort(); onClose() }}
              aria-label="Schließen"
              title="Schließen (Esc)"
            >
              <X size={16} weight="bold" aria-hidden="true" />
            </button>
          </div>
        </div>

        {globalError && <div className="persp-sheet-error">{globalError}</div>}

        <div className="persp-sheet-body">
          {avatars.map(avatar => (
            <AvatarResponseCard
              key={avatar.id}
              avatar={avatar}
              resp={responses.get(avatar.id)}
              copied={copied}
              posting={posting}
              onCopy={handleCopy}
              onPostToChat={handlePostToChat}
            />
          ))}
        </div>
      </div>
    </>
  )
}
