'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { createCard } from '@/actions/cards'
import type { Card, CardType } from '@/db/schema'

const MONO = "'DM Mono', 'Courier New', monospace"

const TYPE_OPTIONS: { value: CardType; label: string; color: string }[] = [
  { value: 'input', label: 'Input', color: '#00C9A7' },
  { value: 'process', label: 'Process', color: '#7C6FF7' },
  { value: 'output', label: 'Output', color: '#F7A44A' },
]

const s: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(4px)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modal: {
    background: '#0e0e0e',
    border: '1px solid #1e1e1e',
    borderRadius: 8,
    padding: '28px 28px',
    width: '100%',
    maxWidth: 440,
    fontFamily: MONO,
    color: '#e0e0e0',
    position: 'relative',
  },
  heading: {
    fontSize: 16,
    fontWeight: 600,
    color: '#e0e0e0',
    fontFamily: MONO,
    marginBottom: 24,
    letterSpacing: '0.02em',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    background: 'transparent',
    border: 'none',
    color: '#444444',
    fontSize: 18,
    cursor: 'pointer',
    lineHeight: 1,
    padding: 4,
    fontFamily: MONO,
  },
  fieldGroup: {
    marginBottom: 18,
  },
  label: {
    display: 'block',
    fontSize: 11,
    color: '#444444',
    marginBottom: 6,
    fontFamily: MONO,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
  },
  required: {
    color: '#7C6FF7',
    marginLeft: 2,
  },
  input: {
    width: '100%',
    background: '#080808',
    border: '1px solid #1e1e1e',
    borderRadius: 4,
    padding: '8px 12px',
    color: '#e0e0e0',
    fontSize: 13,
    fontFamily: MONO,
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  textarea: {
    width: '100%',
    background: '#080808',
    border: '1px solid #1e1e1e',
    borderRadius: 4,
    padding: '8px 12px',
    color: '#e0e0e0',
    fontSize: 13,
    fontFamily: MONO,
    outline: 'none',
    boxSizing: 'border-box' as const,
    resize: 'vertical' as const,
    minHeight: 64,
  },
  typeRow: {
    display: 'flex',
    gap: 8,
  },
  typeBtn: {
    flex: 1,
    padding: '7px 0',
    background: '#080808',
    border: '1px solid #1e1e1e',
    borderRadius: 4,
    fontSize: 11,
    fontFamily: MONO,
    cursor: 'pointer',
    letterSpacing: '0.06em',
    transition: 'border-color 0.15s',
  },
  actions: {
    display: 'flex',
    gap: 12,
    marginTop: 24,
    alignItems: 'center',
  },
  submitBtn: {
    padding: '9px 20px',
    background: '#7C6FF7',
    color: '#e0e0e0',
    border: 'none',
    borderRadius: 4,
    fontSize: 13,
    fontFamily: MONO,
    cursor: 'pointer',
    letterSpacing: '0.02em',
    transition: 'opacity 0.15s',
  },
  cancelBtn: {
    padding: '9px 16px',
    background: 'transparent',
    color: '#444444',
    border: '1px solid #1e1e1e',
    borderRadius: 4,
    fontSize: 13,
    fontFamily: MONO,
    cursor: 'pointer',
    letterSpacing: '0.02em',
  },
  errorMsg: {
    fontSize: 12,
    color: '#F7A44A',
    fontFamily: MONO,
    marginTop: 8,
  },
}

interface Props {
  workspaceId: string
  onCreated: (card: Card) => void
  onClose: () => void
}

export default function CardForm({ workspaceId, onCreated, onClose }: Props) {
  const [title, setTitle] = useState('')
  const [type, setType] = useState<CardType>('input')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      setError('Titel ist erforderlich')
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        const { createClient } = await import('@/utils/supabase/client')
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        const card = await createCard({
          workspaceId,
          title: title.trim(),
          type,
          description: description.trim() || undefined,
          status: 'waiting',
          model: 'claude',
          positionX: 80 + Math.floor(Math.random() * 200),
          positionY: 80 + Math.floor(Math.random() * 200),
          fields: [],
          sortOrder: 0,
          createdBy: user?.id,
        })
        onCreated(card)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Fehler beim Erstellen')
      }
    })
  }

  return (
    <div
      style={s.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="card-form-heading"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={s.modal}>
        <h2 id="card-form-heading" style={s.heading}>Neue Karte</h2>
        <button
          type="button"
          style={s.closeBtn}
          onClick={onClose}
          aria-label="Schließen"
        >
          ×
        </button>

        <form onSubmit={handleSubmit}>
          <div style={s.fieldGroup}>
            <label htmlFor="cf-title" style={s.label}>
              Titel<span style={s.required}>*</span>
            </label>
            <input
              id="cf-title"
              ref={titleRef}
              type="text"
              required
              value={title}
              onChange={(e) => { setTitle(e.target.value); setError(null) }}
              placeholder="Karten-Titel"
              style={s.input}
              aria-required="true"
            />
          </div>

          <div style={s.fieldGroup}>
            <label style={s.label}>
              Typ<span style={s.required}>*</span>
            </label>
            <div style={s.typeRow} role="group" aria-label="Karten-Typ wählen">
              {TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setType(opt.value)}
                  style={{
                    ...s.typeBtn,
                    borderColor: type === opt.value ? opt.color : '#1e1e1e',
                    color: type === opt.value ? opt.color : '#444444',
                  }}
                  aria-pressed={type === opt.value}
                  aria-label={`Typ: ${opt.label}`}
                >
                  {opt.label.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div style={s.fieldGroup}>
            <label htmlFor="cf-desc" style={s.label}>Beschreibung</label>
            <textarea
              id="cf-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Kurze Beschreibung (optional)"
              style={s.textarea}
            />
          </div>

          {error && <p style={s.errorMsg} role="alert">{error}</p>}

          <div style={s.actions}>
            <button
              type="submit"
              disabled={isPending}
              style={{ ...s.submitBtn, opacity: isPending ? 0.6 : 1 }}
              aria-busy={isPending}
            >
              {isPending ? 'Erstellt…' : 'Karte erstellen'}
            </button>
            <button type="button" style={s.cancelBtn} onClick={onClose}>
              Abbrechen
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
