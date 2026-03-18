'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { Tray, ArrowsClockwise, Export } from '@phosphor-icons/react'
import { createCard } from '@/actions/cards'
import type { Card, CardType } from '@/db/schema'

const TYPE_OPTIONS: { value: CardType; label: string; icon: React.ReactNode; description: string; examples: string; color: string }[] = [
  {
    value: 'input',
    label: 'Eingabe',
    icon: <Tray size={16} weight="fill" aria-hidden="true" />,
    description: 'Rohdaten, Dokumente, Briefings',
    examples: 'z.B. Marktdaten, Kundeninterviews, Briefing',
    color: 'var(--accent)',
  },
  {
    value: 'process',
    label: 'Analyse',
    icon: <ArrowsClockwise size={16} weight="fill" aria-hidden="true" />,
    description: 'KI verarbeitet, vergleicht, bewertet',
    examples: 'z.B. Wettbewerbscheck, SWOT, Zusammenfassung',
    color: 'var(--tropen-process, #8B5CF6)',
  },
  {
    value: 'output',
    label: 'Ergebnis',
    icon: <Export size={16} weight="fill" aria-hidden="true" />,
    description: 'Fertige Outputs und Deliverables',
    examples: 'z.B. Strategie-Dokument, Präsentation, E-Mail',
    color: 'var(--tropen-output, #F59E0B)',
  },
]

const inp: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg-base)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  padding: '8px 12px',
  color: 'var(--text-primary)',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box' as const,
  transition: 'border-color 0.15s',
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

  useEffect(() => { titleRef.current?.focus() }, [])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError('Bitte gib einen Titel ein'); return }
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
          status: 'draft',
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
      role="dialog"
      aria-modal="true"
      aria-labelledby="card-form-heading"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div style={{
        background: 'var(--bg-surface-solid)',
        border: '1px solid var(--border-medium)',
        borderRadius: 12,
        padding: '28px 28px',
        width: '100%',
        maxWidth: 460,
        position: 'relative',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      }}>
        <h2 id="card-form-heading" style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
          Neue Karte erstellen
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>
          Karten sind die Bausteine deines Workspaces — z.B. ein Dokument, eine Aufgabe oder ein Ergebnis.
        </p>
        <button
          type="button"
          className="btn-icon"
          onClick={onClose}
          aria-label="Schließen"
          style={{ position: 'absolute', top: 16, right: 16 }}
        >
          ×
        </button>

        <form onSubmit={handleSubmit}>
          {/* Title */}
          <div style={{ marginBottom: 18 }}>
            <label htmlFor="cf-title" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Titel *
            </label>
            <input
              id="cf-title"
              ref={titleRef}
              type="text"
              required
              value={title}
              onChange={(e) => { setTitle(e.target.value); setError(null) }}
              placeholder="z.B. Zielgruppenanalyse, Kampagnenbrief…"
              style={inp}
              aria-required="true"
            />
          </div>

          {/* Type */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
              Kartentyp *
            </label>
            <div style={{ display: 'flex', gap: 8 }} role="group" aria-label="Kartentyp wählen">
              {TYPE_OPTIONS.map((opt) => {
                const active = type === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setType(opt.value)}
                    aria-pressed={active}
                    style={{
                      flex: 1,
                      padding: '10px 10px',
                      background: active ? `${opt.color}12` : 'var(--bg-surface)',
                      border: `${active ? '2px' : '1px'} solid ${active ? opt.color : 'var(--border-medium)'}`,
                      borderRadius: 8,
                      cursor: 'pointer',
                      textAlign: 'left' as const,
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, color: active ? opt.color : 'var(--text-secondary)' }}>
                      {opt.icon}
                      <span style={{ fontSize: 12, fontWeight: 700, color: active ? opt.color : 'var(--text-primary)' }}>
                        {opt.label}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: 4 }}>
                      {opt.description}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-tertiary)', lineHeight: 1.3 }}>
                      {opt.examples}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: 18 }}>
            <label htmlFor="cf-desc" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Beschreibung <span style={{ fontWeight: 400, color: 'var(--text-tertiary)' }}>(optional)</span>
            </label>
            <textarea
              id="cf-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Kurze Erklärung, was diese Karte enthält oder bezweckt"
              style={{ ...inp, resize: 'vertical' as const, minHeight: 72 }}
            />
          </div>

          {error && (
            <p role="alert" style={{ fontSize: 13, color: '#EF4444', marginBottom: 12 }}>
              {error}
            </p>
          )}

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              type="submit"
              disabled={isPending}
              className="btn btn-primary"
              aria-busy={isPending}
            >
              {isPending ? 'Wird erstellt…' : 'Karte erstellen'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Abbrechen
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
