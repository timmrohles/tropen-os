'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChatCircle, X } from '@phosphor-icons/react'

type Platform = 'lovable' | 'bolt' | 'cursor' | 'other'

const RATING_OPTIONS: { key: string; label: string }[] = [
  { key: 'findings_helpful',  label: 'Die Findings sind hilfreich' },
  { key: 'findings_unclear',  label: 'Manche Findings ergeben keinen Sinn' },
  { key: 'missing_something', label: 'Mir fehlt etwas' },
  { key: 'other',             label: 'Anderes' },
]

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: 'lovable', label: 'Lovable' },
  { value: 'bolt',    label: 'Bolt' },
  { value: 'cursor',  label: 'Cursor' },
  { value: 'other',   label: 'Anderes' },
]

interface Props {
  runId?: string
}

export default function BetaFeedbackButton({ runId }: Props) {
  const [open,     setOpen]     = useState(false)
  const [ratings,  setRatings]  = useState<Record<string, boolean>>({})
  const [message,  setMessage]  = useState('')
  const [platform, setPlatform] = useState<Platform | ''>('')
  const [loading,  setLoading]  = useState(false)
  const [sent,     setSent]     = useState(false)

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  function toggleRating(key: string) {
    setRatings(prev => ({ ...prev, [key]: !prev[key] }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await fetch('/api/beta/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audit_run_id: runId ?? undefined,
          ratings,
          message: message || undefined,
          platform: platform || undefined,
        }),
      })
      setSent(true)
    } catch {
      // Fail silently — beta feedback is non-critical
    } finally {
      setLoading(false)
    }
  }

  const drawer = open ? (
    <div style={s.backdrop} onClick={() => setOpen(false)} aria-hidden="true">
      <aside
        style={s.drawer}
        role="dialog"
        aria-label="Feedback geben"
        aria-modal="true"
        onClick={e => e.stopPropagation()}
      >
        <div style={s.drawerHeader}>
          <span style={s.drawerTitle}>Feedback geben</span>
          <button
            onClick={() => setOpen(false)}
            aria-label="Schließen"
            style={s.closeBtn}
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        {sent ? (
          <div style={s.sentWrap}>
            <p style={s.sentTitle}>Danke für dein Feedback!</p>
            <p style={s.sentSub}>Das hilft uns enorm. Wir melden uns wenn wir Folgefragen haben.</p>
            <button className="btn btn-ghost" onClick={() => setOpen(false)} style={{ marginTop: 16 }}>
              Schließen
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={s.form}>
            <p style={s.question}>Wie war dein erster Scan?</p>
            <div style={s.checkGroup}>
              {RATING_OPTIONS.map(opt => (
                <label key={opt.key} style={s.checkRow}>
                  <input
                    type="checkbox"
                    checked={!!ratings[opt.key]}
                    onChange={() => toggleRating(opt.key)}
                    style={s.checkbox}
                  />
                  <span style={s.checkLabel}>{opt.label}</span>
                </label>
              ))}
            </div>

            <label htmlFor="fb-message" style={s.label}>
              Freitext <span style={s.optional}>(optional)</span>
            </label>
            <textarea
              id="fb-message"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Was fiel dir auf?"
              rows={3}
              style={s.textarea}
            />

            <p style={s.question}>Welches Tool nutzt du?</p>
            <div style={s.radioGroup}>
              {PLATFORMS.map(p => (
                <label key={p.value} style={s.radioRow}>
                  <input
                    type="radio"
                    name="platform"
                    value={p.value}
                    checked={platform === p.value}
                    onChange={() => setPlatform(p.value)}
                    style={s.radio}
                  />
                  <span style={s.radioLabel}>{p.label}</span>
                </label>
              ))}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={s.submitBtn}
            >
              {loading ? 'Wird gesendet…' : 'Senden'}
            </button>
          </form>
        )}
      </aside>
    </div>
  ) : null

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn btn-ghost"
        aria-label="Beta-Feedback geben"
        style={s.fab}
      >
        <ChatCircle size={14} weight="fill" aria-hidden="true" />
        Feedback geben
      </button>

      {typeof window !== 'undefined' && drawer
        ? createPortal(drawer, document.body)
        : null}
    </>
  )
}

const s: Record<string, React.CSSProperties> = {
  fab: {
    position: 'fixed',
    bottom: 24,
    right: 24,
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 13,
    boxShadow: '0 2px 8px rgba(26,23,20,0.12)',
  },
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(26,23,20,0.45)',
    backdropFilter: 'blur(2px)',
    zIndex: 200,
    display: 'flex',
    alignItems: 'stretch',
    justifyContent: 'flex-end',
  },
  drawer: {
    width: 360,
    maxWidth: '90vw',
    background: 'var(--bg-surface-solid)',
    borderLeft: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column' as const,
    animation: 'slideInRight 0.2s ease-out',
    overflowY: 'auto' as const,
  },
  drawerHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid var(--border)',
  },
  drawerTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text-tertiary)',
    padding: 4,
    borderRadius: 4,
    display: 'flex',
    alignItems: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 14,
    padding: '20px',
    flex: 1,
  },
  question: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-primary)',
    margin: 0,
  },
  checkGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
    marginTop: -4,
  },
  checkRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    cursor: 'pointer',
  },
  checkbox: {
    marginTop: 2,
    flexShrink: 0,
    accentColor: 'var(--accent)',
    width: 15,
    height: 15,
  },
  checkLabel: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    lineHeight: 1.4,
  },
  label: {
    fontSize: 12,
    fontWeight: 500,
    color: 'var(--text-secondary)',
  },
  optional: {
    fontWeight: 400,
    color: 'var(--text-tertiary)',
  },
  textarea: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid var(--border)',
    fontSize: 13,
    color: 'var(--text-primary)',
    background: 'var(--bg-surface)',
    resize: 'vertical' as const,
    boxSizing: 'border-box' as const,
    outline: 'none',
    fontFamily: 'inherit',
    lineHeight: 1.5,
    marginTop: -8,
  },
  radioGroup: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 8,
    marginTop: -4,
  },
  radioRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    cursor: 'pointer',
  },
  radio: {
    accentColor: 'var(--accent)',
    flexShrink: 0,
  },
  radioLabel: {
    fontSize: 13,
    color: 'var(--text-secondary)',
  },
  submitBtn: {
    width: '100%',
    marginTop: 4,
  },
  sentWrap: {
    padding: '32px 20px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-start',
  },
  sentTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: 'var(--accent)',
    margin: '0 0 8px',
  },
  sentSub: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    margin: 0,
    lineHeight: 1.6,
  },
}
