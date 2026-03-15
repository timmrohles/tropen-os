'use client'

import React, { useEffect, useRef, useState } from 'react'
import { PaperPlaneTilt } from '@phosphor-icons/react'
import Link from 'next/link'
import ParrotIcon from './ParrotIcon'

// ─── Typen ────────────────────────────────────────────────────────────────────

interface Msg {
  role: 'user' | 'assistant'
  content: string
  pending?: boolean
  isCta?: boolean
}

// ─── Konstanten ───────────────────────────────────────────────────────────────

const MAX_MSGS = 5
const LS_KEY = 'toro_public_msgs'

const GREETING: Msg = {
  role: 'assistant',
  content: 'Hola! Ich bin Toro 🦜 – dein KI-Papagei von Tropen OS. Stell mir eine Frage zu Tropen OS, KI im Mittelstand oder dem AI Act. Ich beantworte sie gern.',
}

const CTA_MSG: Msg = {
  role: 'assistant',
  isCta: true,
  content: 'Du hast Toro kennengelernt 🦜 Mach weiter – kostenlos registrieren.',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getSentCount(): number {
  try {
    return parseInt(localStorage.getItem(LS_KEY) ?? '0', 10) || 0
  } catch {
    return 0
  }
}

function incSentCount(): number {
  try {
    const next = getSentCount() + 1
    localStorage.setItem(LS_KEY, String(next))
    return next
  } catch {
    return MAX_MSGS
  }
}

// ─── Komponente ───────────────────────────────────────────────────────────────

export default function ToroChatWidget() {
  const [msgs, setMsgs] = useState<Msg[]>([GREETING])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [sentCount, setSentCount] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const ctaTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setSentCount(getSentCount())
    return () => {
      abortRef.current?.abort()
      if (ctaTimerRef.current) clearTimeout(ctaTimerRef.current)
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  const limitReached = sentCount >= MAX_MSGS
  const remaining = MAX_MSGS - sentCount

  async function send() {
    const text = input.trim()
    if (!text || sending || limitReached) return

    const history = msgs
      .filter((m) => !m.pending && !m.isCta)
      .map((m) => ({ role: m.role, content: m.content }))

    setMsgs((prev) => [...prev, { role: 'user', content: text }])
    setInput('')
    setSending(true)

    const newCount = incSentCount()
    setSentCount(newCount)

    setMsgs((prev) => [...prev, { role: 'assistant', content: '', pending: true }])

    try {
      abortRef.current = new AbortController()
      const res = await fetch('/api/public/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
        signal: abortRef.current.signal,
      })

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: 'Fehler beim Senden.' }))
        setMsgs((prev) => [
          ...prev.slice(0, -1),
          { role: 'assistant', content: err.error ?? 'Etwas ist schiefgelaufen.' },
        ])
        setSending(false)
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6)
          if (data === '[DONE]') continue
          try {
            const parsed = JSON.parse(data)
            if (parsed.content) {
              fullContent += parsed.content
              setMsgs((prev) => [
                ...prev.slice(0, -1),
                { role: 'assistant', content: fullContent, pending: true },
              ])
            }
          } catch {
            // chunk ignorieren
          }
        }
      }

      setMsgs((prev) => [
        ...prev.slice(0, -1),
        { role: 'assistant', content: fullContent },
      ])

      if (newCount >= MAX_MSGS) {
        ctaTimerRef.current = setTimeout(() => {
          setMsgs((prev) => [...prev, CTA_MSG])
        }, 400)
      }
    } catch {
      setMsgs((prev) => [
        ...prev.slice(0, -1),
        { role: 'assistant', content: 'Verbindungsfehler. Bitte versuche es nochmal.' },
      ])
    } finally {
      setSending(false)
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="ptoro-wrap">
      <div className="ptoro-heading">
        <p className="ptoro-heading-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><ParrotIcon size={22} /> Frag Toro</p>
        <p className="ptoro-heading-sub">Kein Login. Kein Aufwand. Einfach fragen.</p>
      </div>

      <div className="ptoro-window">
        <div className="ptoro-messages">
          {msgs.map((msg, i) => (
            <div key={i} className={`cmsg${msg.role === 'user' ? ' cmsg--user' : ' cmsg--assistant'}`}>
              {msg.role === 'assistant' && (
                <div className="cmsg-avatar-toro"><ParrotIcon size={22} /></div>
              )}

              <div className={`cmsg-bubble${msg.role === 'user' ? ' cmsg-bubble--user' : ' cmsg-bubble--assistant'}`}>
                <div className="cmsg-content">
                  {msg.content}
                  {msg.pending && <span className="animate-pulse" style={{ opacity: 0.6 }}>▋</span>}
                </div>
                {msg.isCta && (
                  <Link href="/login" className="ptoro-cta-btn">
                    Kostenlos registrieren →
                  </Link>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="cmsg-avatar-user">G</div>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="ptoro-input-wrap">
          <div className="ptoro-input-row">
            <textarea
              className="ptoro-textarea"
              placeholder={
                limitReached
                  ? 'Du hast deine 5 Nachrichten für diese Session aufgebraucht.'
                  : 'Stell Toro eine Frage …'
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              disabled={sending || limitReached}
              rows={1}
            />
            <button
              className="ptoro-send"
              onClick={send}
              disabled={sending || limitReached || !input.trim()}
              aria-label="Senden"
            >
              <PaperPlaneTilt size={18} weight="fill" />
            </button>
          </div>

          {sentCount > 0 && !limitReached && (
            <div className="ptoro-counter">
              {remaining} von {MAX_MSGS} Nachrichten verbleibend
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
