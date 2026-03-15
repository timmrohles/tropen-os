'use client'

import { useState, useEffect, useRef, useTransition } from 'react'

const MONO = "'DM Mono', 'Courier New', monospace"

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

const s: Record<string, React.CSSProperties> = {
  panel: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    fontFamily: MONO,
    overflow: 'hidden',
  },
  messages: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '12px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    scrollbarWidth: 'thin' as const,
  },
  msgUser: {
    alignSelf: 'flex-end',
    maxWidth: '80%',
    padding: '8px 12px',
    borderRadius: '8px 8px 2px 8px',
    fontSize: 12,
    fontFamily: MONO,
    lineHeight: 1.5,
    wordBreak: 'break-word' as const,
  },
  msgAssistant: {
    alignSelf: 'flex-start',
    maxWidth: '85%',
    padding: '8px 12px',
    borderRadius: '8px 8px 8px 2px',
    fontSize: 12,
    fontFamily: MONO,
    lineHeight: 1.5,
    wordBreak: 'break-word' as const,
    background: '#0e0e0e',
    border: '1px solid #1e1e1e',
    color: '#e0e0e0',
  },
  inputRow: {
    display: 'flex',
    gap: 8,
    padding: '8px 12px',
    borderTop: '1px solid #1e1e1e',
    background: '#0e0e0e',
  },
  input: {
    flex: 1,
    background: '#080808',
    border: '1px solid #1e1e1e',
    borderRadius: 4,
    padding: '7px 10px',
    color: '#e0e0e0',
    fontSize: 12,
    fontFamily: MONO,
    outline: 'none',
    resize: 'none' as const,
    minHeight: 34,
    maxHeight: 120,
    overflow: 'auto' as const,
  },
  sendBtn: {
    padding: '7px 14px',
    background: '#7C6FF7',
    color: '#e0e0e0',
    border: 'none',
    borderRadius: 4,
    fontSize: 12,
    fontFamily: MONO,
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'opacity 0.15s',
    alignSelf: 'flex-end',
  },
  empty: {
    color: '#444444',
    fontSize: 12,
    fontFamily: MONO,
    textAlign: 'center' as const,
    padding: '24px 0',
  },
  streaming: {
    color: '#444444',
    fontSize: 11,
    fontFamily: MONO,
    padding: '4px 12px',
    alignSelf: 'flex-start',
  },
}

interface Props {
  workspaceId: string
  cardId?: string
  color: string
  placeholder?: string
}

export default function ChatPanel({ workspaceId, cardId, color, placeholder }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [isPending, startTransition] = useTransition()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streaming])

  // Load initial messages
  useEffect(() => {
    if (!workspaceId) return
    const params = new URLSearchParams({ workspaceId })
    if (cardId) params.set('cardId', cardId)

    fetch(`/api/chat/messages?${params.toString()}`)
      .then((r) => r.ok ? r.json() : [])
      .then((data: Message[]) => {
        if (Array.isArray(data)) setMessages(data)
      })
      .catch(() => {/* silent — messages are optional */})
  }, [workspaceId, cardId])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleSend() {
    const text = input.trim()
    if (!text || streaming || isPending) return
    setInput('')

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])
    setStreaming(true)

    startTransition(async () => {
      try {
        const assistantId = crypto.randomUUID()
        let accumulated = ''

        const resp = await fetch('/api/chat/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workspaceId,
            cardId: cardId ?? null,
            message: text,
          }),
        })

        if (!resp.ok || !resp.body) {
          setMessages((prev) => [
            ...prev,
            {
              id: assistantId,
              role: 'assistant',
              content: 'Fehler beim Laden der Antwort.',
              createdAt: new Date().toISOString(),
            },
          ])
          setStreaming(false)
          return
        }

        // Add placeholder assistant message
        setMessages((prev) => [
          ...prev,
          { id: assistantId, role: 'assistant', content: '', createdAt: new Date().toISOString() },
        ])

        const reader = resp.body.getReader()
        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          accumulated += chunk
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: accumulated } : m
            )
          )
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: 'Verbindungsfehler.',
            createdAt: new Date().toISOString(),
          },
        ])
      } finally {
        setStreaming(false)
        inputRef.current?.focus()
      }
    })
  }

  const userBgColor = `${color}33` // 20% opacity hex

  return (
    <div style={s.panel}>
      <div
        style={s.messages}
        role="log"
        aria-live="polite"
        aria-label="Chat-Nachrichten"
      >
        {messages.length === 0 && !streaming && (
          <p style={s.empty}>
            {placeholder ?? 'Starte ein Gespräch…'}
          </p>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            style={
              msg.role === 'user'
                ? { ...s.msgUser, background: userBgColor, color: '#e0e0e0', border: `1px solid ${color}33` }
                : s.msgAssistant
            }
          >
            {msg.content || (streaming && msg.role === 'assistant' ? '▋' : '')}
          </div>
        ))}

        {streaming && (
          <div style={s.streaming} aria-live="polite" aria-busy="true">
            KI schreibt…
          </div>
        )}

        <div ref={messagesEndRef} aria-hidden="true" />
      </div>

      <div style={s.inputRow}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? 'Nachricht eingeben…'}
          style={s.input}
          rows={1}
          aria-label="Nachricht eingeben"
          aria-multiline="true"
          disabled={streaming}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!input.trim() || streaming}
          style={{
            ...s.sendBtn,
            opacity: !input.trim() || streaming ? 0.5 : 1,
          }}
          aria-label="Nachricht senden"
          aria-busy={streaming}
        >
          ↑
        </button>
      </div>
    </div>
  )
}
