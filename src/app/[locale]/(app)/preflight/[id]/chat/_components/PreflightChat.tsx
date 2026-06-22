'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { PaperPlaneTilt, ChatCircle, Robot } from '@phosphor-icons/react'

type Msg = { role: 'user' | 'assistant'; content: string }

export function PreflightChat({ projectId }: { projectId: string }) {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    fetch(`/api/preflight/projects/${projectId}/chat`)
      .then(r => r.json())
      .then((d: { messages?: Msg[] }) =>
        setMessages((d.messages ?? []).map((m: Msg) => ({ role: m.role, content: m.content })))
      )
      .catch(() => {})
  }, [projectId])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = useCallback(async () => {
    const content = input.trim()
    if (!content || streaming) return
    setInput('')
    setMessages(m => [...m, { role: 'user', content }, { role: 'assistant', content: '' }])
    setStreaming(true)
    try {
      const res = await fetch(`/api/preflight/projects/${projectId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      if (!res.body) throw new Error('kein Stream')
      const reader = res.body.getReader()
      const dec = new TextDecoder()
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = dec.decode(value, { stream: true })
        setMessages(m => {
          const c = [...m]
          c[c.length - 1] = { role: 'assistant', content: c[c.length - 1].content + chunk }
          return c
        })
      }
    } catch {
      setMessages(m => {
        const c = [...m]
        c[c.length - 1] = { role: 'assistant', content: 'Es ist ein Fehler aufgetreten. Bitte erneut versuchen.' }
        return c
      })
    } finally {
      setStreaming(false)
    }
  }, [input, streaming, projectId])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void send()
    }
  }

  const isEmpty = messages.length === 0

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 160px)',
        minHeight: 480,
      }}
    >
      {/* ── Message area ─────────────────────────────────────────────────── */}
      <div
        className="carea-messages"
        style={{ flex: 1 }}
        aria-live="polite"
        aria-label="Chat-Verlauf"
      >
        {isEmpty && (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <ChatCircle size={32} weight="fill" color="var(--text-tertiary)" aria-hidden="true" />
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: '12px 0 6px' }}>
              Toro ist bereit
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: 0, lineHeight: 1.5 }}>
              Beschreibe deine Idee — Toro hilft dir, die Kernaussage zu schärfen und technische Stolpersteine früh zu erkennen.
            </p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isUser = msg.role === 'user'
          const isStreamingAssistant = !isUser && streaming && i === messages.length - 1

          return (
            <div
              key={i}
              className={`cmsg ${isUser ? 'cmsg--user' : 'cmsg--assistant'}`}
            >
              {/* Assistant avatar */}
              {!isUser && (
                <div className="cmsg-avatar-toro" aria-hidden="true">
                  <Robot size={16} weight="fill" color="var(--accent)" />
                </div>
              )}

              {/* Bubble */}
              <div className="cmsg-bubble-wrap">
                <div className={`cmsg-bubble ${isUser ? 'cmsg-bubble--user' : 'cmsg-bubble--assistant'}`}>
                  {isStreamingAssistant && msg.content === '' ? (
                    <span style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '2px 0' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-tertiary)', animation: 'searching-pulse 1.2s ease infinite', animationDelay: '0ms' }} />
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-tertiary)', animation: 'searching-pulse 1.2s ease infinite', animationDelay: '200ms' }} />
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-tertiary)', animation: 'searching-pulse 1.2s ease infinite', animationDelay: '400ms' }} />
                    </span>
                  ) : (
                    <span
                      className="cmsg-content"
                      style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                    >
                      {msg.content}
                    </span>
                  )}
                </div>
              </div>

              {/* User avatar */}
              {isUser && (
                <div className="cmsg-avatar-user" aria-hidden="true">
                  Du
                </div>
              )}
            </div>
          )
        })}

        <div ref={endRef} />
      </div>

      {/* ── Input row ────────────────────────────────────────────────────── */}
      <div className="carea-input-wrap">
        <div className="carea-input-inner">
          <div
            style={{
              display: 'flex',
              gap: 8,
              alignItems: 'flex-end',
              background: 'var(--bg-surface-solid)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '10px 12px',
            }}
          >
            <textarea
              ref={textareaRef}
              className="input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Deine Frage oder Idee …"
              rows={1}
              disabled={streaming}
              aria-label="Nachricht eingeben"
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                resize: 'none',
                padding: 0,
                fontSize: 14,
                lineHeight: 1.5,
                outline: 'none',
                minHeight: 22,
                maxHeight: 160,
                overflowY: 'auto',
                boxShadow: 'none',
              }}
            />
            <button
              className="btn btn-primary"
              onClick={() => void send()}
              disabled={streaming || !input.trim()}
              aria-label="Senden"
              style={{
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13,
                padding: '6px 14px',
                opacity: streaming || !input.trim() ? 0.5 : 1,
                cursor: streaming || !input.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              <PaperPlaneTilt size={14} weight="fill" aria-hidden="true" />
              {streaming ? 'Sendet …' : 'Senden'}
            </button>
          </div>
          <p className="chat-ai-disclaimer">
            Enter senden · Shift + Enter neue Zeile · Toro kann Fehler machen.
          </p>
        </div>
      </div>
    </div>
  )
}
