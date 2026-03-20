'use client'

import { useState } from 'react'
import { X, ArrowRight, Sparkle } from '@phosphor-icons/react'

interface BuilderMessage {
  role: 'user' | 'assistant'
  content: string
}

interface PromptBuilderModalProps {
  open: boolean
  originalPrompt: string
  onClose: () => void
  onAccept: (refinedPrompt: string) => void
}

export default function PromptBuilderModal({
  open,
  originalPrompt,
  onClose,
  onAccept,
}: PromptBuilderModalProps) {
  const [history, setHistory] = useState<BuilderMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [started, setStarted] = useState(false)
  const [input, setInput] = useState('')
  const [finalPrompt, setFinalPrompt] = useState<string | null>(null)

  async function runStep(userAnswer?: string) {
    const newHistory = userAnswer
      ? [...history, { role: 'user' as const, content: userAnswer }]
      : history

    setHistory(newHistory)
    setLoading(true)

    try {
      const res = await fetch('/api/chat/prompt-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originalPrompt, history: newHistory }),
      })
      if (!res.ok) throw new Error('Request failed')
      const data = await res.json() as
        | { type: 'question'; message: string }
        | { type: 'final'; refinedPrompt: string }

      if (data.type === 'final') {
        setFinalPrompt(data.refinedPrompt)
      } else {
        setHistory(prev => [...prev, { role: 'assistant', content: data.message }])
      }
    } catch {
      setHistory(prev => [...prev, {
        role: 'assistant',
        content: 'Entschuldigung, es gab einen Fehler. Versuche es erneut.',
      }])
    } finally {
      setLoading(false)
    }
  }

  function handleStart() {
    setStarted(true)
    runStep()
  }

  function handleAnswer(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || loading) return
    const answer = input.trim()
    setInput('')
    runStep(answer)
  }

  function handleAccept() {
    if (finalPrompt) {
      onAccept(finalPrompt)
      handleClose()
    }
  }

  function handleClose() {
    setHistory([])
    setStarted(false)
    setInput('')
    setFinalPrompt(null)
    onClose()
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.4)',
          zIndex: 200,
        }}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Prompt verfeinern"
        style={{
          position: 'fixed',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(480px, 90vw)',
          background: 'var(--bg-surface)',
          borderRadius: 12,
          border: '1px solid var(--border)',
          padding: 24,
          zIndex: 201,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          maxHeight: '80vh',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkle size={18} color="var(--accent)" weight="fill" aria-hidden="true" />
            <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
              Prompt verfeinern
            </span>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleClose}
            aria-label="Schließen"
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        {/* Original prompt */}
        <div style={{
          padding: '10px 14px',
          background: 'var(--bg-base)',
          borderRadius: 8,
          fontSize: 13,
          color: 'var(--text-secondary)',
        }}>
          {originalPrompt}
        </div>

        {/* Conversation */}
        {history.length > 0 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            overflowY: 'auto',
            maxHeight: 240,
          }}>
            {history.map((msg, i) => (
              <div
                key={i}
                style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  background: msg.role === 'user' ? 'var(--active-bg)' : 'var(--bg-base)',
                  color: msg.role === 'user' ? 'var(--text-inverse)' : 'var(--text-primary)',
                  padding: '8px 12px',
                  borderRadius: 8,
                  fontSize: 13,
                  maxWidth: '85%',
                }}
              >
                {msg.content}
              </div>
            ))}
          </div>
        )}

        {/* Final prompt result */}
        {finalPrompt && (
          <div style={{
            padding: '12px 14px',
            background: 'var(--accent-light)',
            borderRadius: 8,
            fontSize: 13,
            color: 'var(--text-primary)',
            border: '1px solid var(--accent)',
          }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', display: 'block', marginBottom: 4 }}>
              VERFEINERTER PROMPT
            </span>
            {finalPrompt}
          </div>
        )}

        {/* Actions */}
        {!started && (
          <button className="btn btn-primary" onClick={handleStart}>
            <Sparkle size={14} weight="fill" /> Verfeinern starten
          </button>
        )}

        {started && !finalPrompt && (
          <form onSubmit={handleAnswer} style={{ display: 'flex', gap: 8 }}>
            <input
              className="input"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={loading ? 'Toro denkt…' : 'Deine Antwort…'}
              disabled={loading}
              autoFocus
              style={{ flex: 1, fontSize: 13, padding: '8px 12px' }}
            />
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={loading || !input.trim()}
              aria-label="Senden"
            >
              <ArrowRight size={14} weight="bold" />
            </button>
          </form>
        )}

        {finalPrompt && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" onClick={handleClose} style={{ flex: 1 }}>
              Abbrechen
            </button>
            <button className="btn btn-primary" onClick={handleAccept} style={{ flex: 1 }}>
              Prompt verwenden
            </button>
          </div>
        )}
      </div>
    </>
  )
}
