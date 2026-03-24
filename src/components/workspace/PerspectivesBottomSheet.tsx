'use client'

import React, { useEffect, useRef, useState } from 'react'
import { ArrowsOut, ArrowsIn, X, CopySimple, ArrowBendUpLeft } from '@phosphor-icons/react'

interface Avatar {
  id: string
  name: string
  emoji: string
  context_default: string
}

interface AvatarResponse {
  avatarId: string
  text: string
  done: boolean
  tokensUsed: number
  error?: string
}

interface PerspectivesBottomSheetProps {
  avatarIds: string[]
  avatars: Avatar[]
  conversationId: string
  onClose: () => void
  onRefreshMessages: () => void
}

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
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null)

  // Determine scope from the first avatar's context_default (or fallback)
  const scopeFromAvatar = avatars[0]?.context_default ?? 'last_10'
  const scope = (['last_5', 'last_10', 'last_20', 'full'] as const).includes(scopeFromAvatar as never)
    ? scopeFromAvatar as 'last_5' | 'last_10' | 'last_20' | 'full'
    : 'last_10'

  useEffect(() => {
    const abort = new AbortController()
    abortRef.current = abort

    async function stream() {
      try {
        const res = await fetch('/api/perspectives/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatarIds, scope, conversationId }),
          signal: abort.signal,
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` })) as { error: string }
          setGlobalError(err.error ?? `HTTP ${res.status}`)
          setStreaming(false)
          return
        }

        const reader = res.body!.getReader()
        readerRef.current = reader
        const dec = new TextDecoder()
        let buf = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buf += dec.decode(value, { stream: true })
          const lines = buf.split('\n')
          buf = lines.pop() ?? ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const raw = line.slice(6).trim()
            if (!raw || raw === '[DONE]') continue
            let parsed: Record<string, unknown>
            try { parsed = JSON.parse(raw) as Record<string, unknown> } catch { continue }

            if (parsed.done === true && !parsed.avatarId) {
              setStreaming(false)
              continue
            }

            const avatarId = parsed.avatarId as string | undefined
            if (!avatarId) continue

            if (parsed.error) {
              setResponses(prev => {
                const next = new Map(prev)
                const cur = next.get(avatarId) ?? { avatarId, text: '', done: false, tokensUsed: 0 }
                next.set(avatarId, { ...cur, error: parsed.error as string, done: true })
                return next
              })
              continue
            }

            if (parsed.delta) {
              setResponses(prev => {
                const next = new Map(prev)
                const cur = next.get(avatarId) ?? { avatarId, text: '', done: false, tokensUsed: 0 }
                next.set(avatarId, { ...cur, text: cur.text + (parsed.delta as string) })
                return next
              })
            }

            if (parsed.done === true) {
              setResponses(prev => {
                const next = new Map(prev)
                const cur = next.get(avatarId) ?? { avatarId, text: '', done: false, tokensUsed: 0 }
                next.set(avatarId, { ...cur, done: true, tokensUsed: (parsed.tokensUsed as number) ?? cur.tokensUsed })
                return next
              })
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setGlobalError(String(err))
        }
      } finally {
        setStreaming(false)
      }
    }

    stream()

    return () => {
      abort.abort()
      readerRef.current?.cancel().catch(() => null)
    }
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
      if (res.ok) {
        onRefreshMessages()
      }
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
      {/* Backdrop */}
      <div
        className="persp-sheet-backdrop"
        onClick={() => { abortRef.current?.abort(); onClose() }}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        className="persp-sheet"
        style={{ height: sheetHeight }}
        role="dialog"
        aria-label="Perspectives"
        aria-modal="true"
      >
        {/* Header */}
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

        {/* Global error */}
        {globalError && (
          <div className="persp-sheet-error">{globalError}</div>
        )}

        {/* Avatar response cards */}
        <div className="persp-sheet-body">
          {avatars.map(avatar => {
            const resp = responses.get(avatar.id)
            const text = resp?.text ?? ''
            const done = resp?.done ?? false
            const err = resp?.error

            return (
              <div key={avatar.id} className={`persp-avatar-card${done ? ' persp-avatar-card--done' : ''}`}>
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
                      onClick={() => handleCopy(avatar.id, text)}
                      aria-label="Antwort kopieren"
                      title="Kopieren"
                    >
                      <CopySimple size={13} weight="bold" aria-hidden="true" />
                      {copied === avatar.id ? 'Kopiert!' : 'Kopieren'}
                    </button>
                    <button
                      className="persp-card-action-btn persp-card-action-btn--primary"
                      onClick={() => handlePostToChat(avatar, text)}
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
          })}
        </div>
      </div>
    </>
  )
}
