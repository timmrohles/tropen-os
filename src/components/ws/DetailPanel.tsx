'use client'

import { useState, useEffect, useTransition } from 'react'
import { updateCardStatus, updateCardField } from '@/actions/cards'
import type { Card, CardStatus, CardType } from '@/db/schema'
import ChatPanel from '@/components/ws/ChatPanel'

const MONO = "'DM Mono', 'Courier New', monospace"

const TYPE_COLORS: Record<CardType, string> = {
  input: '#00C9A7',
  process: '#7C6FF7',
  output: '#F7A44A',
}

const STATUS_OPTIONS: { value: CardStatus; label: string }[] = [
  { value: 'waiting', label: 'Wartend' },
  { value: 'active', label: 'Aktiv' },
  { value: 'review', label: 'Review' },
  { value: 'done', label: 'Fertig' },
  { value: 'archived', label: 'Archiviert' },
]

interface CardField {
  key: string
  label: string
  value?: string
}

const s: Record<string, React.CSSProperties> = {
  panel: {
    position: 'fixed',
    top: 0,
    right: 0,
    width: 320,
    height: '100vh',
    background: '#0e0e0e',
    borderLeft: '1px solid #1e1e1e',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 100,
    fontFamily: MONO,
    color: '#e0e0e0',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    padding: '14px 16px',
    borderBottom: '1px solid #1e1e1e',
    flexShrink: 0,
  },
  headerInfo: {
    flex: 1,
    minWidth: 0,
  },
  typeBadge: {
    fontSize: 9,
    padding: '2px 6px',
    borderRadius: 3,
    fontFamily: MONO,
    letterSpacing: '0.08em',
    fontWeight: 600,
    display: 'inline-block',
    marginBottom: 6,
    border: '1px solid',
  },
  title: {
    fontSize: 13,
    fontWeight: 500,
    color: '#e0e0e0',
    fontFamily: MONO,
    lineHeight: 1.35,
    marginBottom: 4,
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: '#444444',
    fontSize: 18,
    cursor: 'pointer',
    lineHeight: 1,
    padding: 4,
    fontFamily: MONO,
    flexShrink: 0,
  },
  body: {
    flex: 1,
    overflowY: 'auto' as const,
    scrollbarWidth: 'thin' as const,
  },
  section: {
    padding: '12px 16px',
    borderBottom: '1px solid #1e1e1e',
  },
  sectionTitle: {
    fontSize: 10,
    color: '#444444',
    fontFamily: MONO,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    marginBottom: 10,
  },
  label: {
    fontSize: 11,
    color: '#444444',
    fontFamily: MONO,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    display: 'block',
    marginBottom: 4,
  },
  select: {
    width: '100%',
    background: '#080808',
    border: '1px solid #1e1e1e',
    borderRadius: 4,
    padding: '6px 10px',
    color: '#e0e0e0',
    fontSize: 12,
    fontFamily: MONO,
    outline: 'none',
    cursor: 'pointer',
    appearance: 'none' as const,
  },
  fieldRow: {
    marginBottom: 10,
  },
  fieldInput: {
    width: '100%',
    background: '#080808',
    border: '1px solid #1e1e1e',
    borderRadius: 4,
    padding: '6px 10px',
    color: '#e0e0e0',
    fontSize: 12,
    fontFamily: MONO,
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.15s',
  },
  chatSection: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    borderTop: '1px solid #1e1e1e',
  },
  chatTitle: {
    fontSize: 10,
    color: '#444444',
    fontFamily: MONO,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    padding: '8px 16px',
    borderBottom: '1px solid #1e1e1e',
    flexShrink: 0,
  },
  chatWrap: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  savedIndicator: {
    fontSize: 10,
    color: '#00C9A7',
    fontFamily: MONO,
    marginTop: 4,
    height: 14,
  },
}

interface Props {
  card: Card
  workspaceId: string
  onClose: () => void
  onCardUpdate: (card: Card) => void
}

export default function DetailPanel({ card, workspaceId, onClose, onCardUpdate }: Props) {
  const [status, setStatus] = useState<CardStatus>(card.status)
  const [fields, setFields] = useState<CardField[]>((card.fields ?? []) as CardField[])
  const [savedField, setSavedField] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const typeColor = TYPE_COLORS[card.type]

  // Update local state when card prop changes
  useEffect(() => {
    setStatus(card.status)
    setFields((card.fields ?? []) as CardField[])
  }, [card.id, card.status, card.fields])

  // Escape key closes panel
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value as CardStatus
    setStatus(newStatus)
    startTransition(async () => {
      try {
        const { createClient } = await import('@/utils/supabase/client')
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        const updated = await updateCardStatus(card.id, newStatus, user?.id ?? 'unknown')
        onCardUpdate(updated)
      } catch {
        setStatus(card.status) // rollback
      }
    })
  }

  function handleFieldBlur(fieldKey: string, value: string) {
    startTransition(async () => {
      try {
        const { createClient } = await import('@/utils/supabase/client')
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        const updated = await updateCardField(card.id, fieldKey, value, user?.id ?? 'unknown')
        onCardUpdate(updated)
        setSavedField(fieldKey)
        setTimeout(() => setSavedField(null), 1500)
      } catch {
        // silent
      }
    })
  }

  function handleFieldChange(key: string, value: string) {
    setFields((prev) =>
      prev.map((f) => (f.key === key ? { ...f, value } : f))
    )
  }

  return (
    <aside
      style={s.panel}
      role="complementary"
      aria-label={`Detail: ${card.title}`}
    >
      {/* Header */}
      <div style={s.header}>
        <div style={s.headerInfo}>
          <span
            style={{
              ...s.typeBadge,
              color: typeColor,
              borderColor: `${typeColor}44`,
              background: `${typeColor}1a`,
            }}
          >
            {card.type.toUpperCase()}
          </span>
          <p style={s.title}>{card.title}</p>
          {card.description && (
            <p style={{ fontSize: 11, color: '#444444', fontFamily: MONO, lineHeight: 1.4 }}>
              {card.description}
            </p>
          )}
        </div>
        <button
          type="button"
          style={s.closeBtn}
          onClick={onClose}
          aria-label="Panel schließen"
        >
          ×
        </button>
      </div>

      <div style={s.body}>
        {/* Status */}
        <div style={s.section}>
          <p style={s.sectionTitle}>Status</p>
          <label htmlFor="dp-status" style={s.label}>Aktueller Status</label>
          <select
            id="dp-status"
            value={status}
            onChange={handleStatusChange}
            style={s.select}
            disabled={isPending}
            aria-busy={isPending}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Fields */}
        {fields.length > 0 && (
          <div style={s.section}>
            <p style={s.sectionTitle}>Felder</p>
            {fields.map((field) => (
              <div key={field.key} style={s.fieldRow}>
                <label
                  htmlFor={`dp-field-${field.key}`}
                  style={s.label}
                >
                  {field.label}
                </label>
                <input
                  id={`dp-field-${field.key}`}
                  type="text"
                  value={field.value ?? ''}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  onBlur={(e) => handleFieldBlur(field.key, e.target.value)}
                  style={s.fieldInput}
                />
                <div style={s.savedIndicator}>
                  {savedField === field.key ? 'Gespeichert' : ''}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Model info */}
        {card.model && (
          <div style={{ ...s.section, paddingBottom: 10 }}>
            <p style={s.sectionTitle}>Modell</p>
            <span style={{
              fontSize: 11,
              color: '#444444',
              background: '#1e1e1e',
              padding: '3px 8px',
              borderRadius: 3,
              fontFamily: MONO,
            }}>
              {card.model}
            </span>
          </div>
        )}
      </div>

      {/* Chat section */}
      <div style={s.chatSection}>
        <p style={s.chatTitle}>KI-Assistent</p>
        <div style={s.chatWrap}>
          <ChatPanel
            workspaceId={workspaceId}
            cardId={card.id}
            color={typeColor}
            placeholder={`Fragen zu "${card.title}"…`}
          />
        </div>
      </div>
    </aside>
  )
}
