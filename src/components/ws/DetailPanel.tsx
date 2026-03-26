'use client'

import { useState, useEffect, useTransition } from 'react'
import { updateCardStatus, updateCardField } from '@/actions/cards'
import type { Card, CardStatus, CardType } from '@/db/schema'
import ChatPanel from '@/components/ws/ChatPanel'

const TYPE_COLORS: Record<CardType, string> = {
  input:   'var(--accent)',
  process: '#8B5CF6',
  output:  '#F59E0B',
}

const TYPE_LABELS: Record<CardType, string> = {
  input:   'Eingabe',
  process: 'Verarbeitung',
  output:  'Ergebnis',
}

const STATUS_OPTIONS: { value: CardStatus; label: string }[] = [
  { value: 'draft',      label: 'Entwurf' },
  { value: 'ready',      label: 'Bereit' },
  { value: 'processing', label: 'In Bearbeitung' },
  { value: 'stale',      label: 'Veraltet' },
  { value: 'error',      label: 'Fehler' },
]

interface CardField { key: string; label: string; value?: string }

const inp: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg-base)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  padding: '7px 10px',
  color: 'var(--text-primary)',
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box' as const,
  transition: 'border-color 0.15s',
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

  useEffect(() => {
    setStatus(card.status)
    setFields((card.fields ?? []) as CardField[])
  }, [card.id, card.status, card.fields])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
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
        setStatus(card.status)
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
    setFields((prev) => prev.map((f) => (f.key === key ? { ...f, value } : f)))
  }

  return (
    <aside
      role="complementary"
      aria-label={`Detail: ${card.title}`}
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: 340,
        height: '100vh',
        background: 'var(--bg-surface-solid)',
        borderLeft: '1px solid var(--border-medium)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
        padding: '16px 16px 14px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{
            fontSize: 10,
            fontWeight: 600,
            color: typeColor,
            background: `${typeColor}18`,
            border: `1px solid ${typeColor}30`,
            padding: '2px 8px',
            borderRadius: 4,
            display: 'inline-block',
            marginBottom: 8,
          }}>
            {TYPE_LABELS[card.type]}
          </span>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.35, marginBottom: card.description ? 4 : 0 }}>
            {card.title}
          </p>
          {card.description && (
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              {card.description}
            </p>
          )}
        </div>
        <button
          type="button"
          className="btn-icon"
          onClick={onClose}
          aria-label="Panel schließen"
          style={{ flexShrink: 0, marginTop: 2 }}
        >
          ×
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'thin' as const }}>
        {/* Status */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
          <p style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.07em', marginBottom: 8 }}>
            Status
          </p>
          <label htmlFor="dp-status" style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
            Aktueller Bearbeitungsstand
          </label>
          <select
            id="dp-status"
            value={status}
            onChange={handleStatusChange}
            disabled={isPending}
            aria-busy={isPending}
            style={{ ...inp, cursor: 'pointer', appearance: 'none' as const }}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Fields */}
        {fields.length > 0 && (
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.07em', marginBottom: 12 }}>
              Felder
            </p>
            {fields.map((field) => (
              <div key={field.key} style={{ marginBottom: 12 }}>
                <label htmlFor={`dp-field-${field.key}`} style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  {field.label}
                </label>
                <input
                  id={`dp-field-${field.key}`}
                  type="text"
                  value={field.value ?? ''}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  onBlur={(e) => handleFieldBlur(field.key, e.target.value)}
                  style={inp}
                />
                <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 3, height: 14 }}>
                  {savedField === field.key ? '✓ Gespeichert' : ''}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Model info */}
        {card.model && (
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.07em', marginBottom: 8 }}>
              KI-Modell
            </p>
            <span style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              background: 'var(--bg-base)',
              border: '1px solid var(--border)',
              padding: '3px 8px',
              borderRadius: 4,
              display: 'inline-block',
            }}>
              {card.model}
            </span>
          </div>
        )}
      </div>

      {/* Chat section */}
      <div style={{ borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', minHeight: 0, flex: '0 0 260px' }}>
        <p style={{
          fontSize: 11,
          color: 'var(--text-tertiary)',
          fontWeight: 600,
          textTransform: 'uppercase' as const,
          letterSpacing: '0.07em',
          padding: '10px 16px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          KI-Assistent — frag zu dieser Karte
        </p>
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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
