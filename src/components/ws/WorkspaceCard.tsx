'use client'

import type { Card, CardType, CardStatus } from '@/db/schema'

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

const STATUS_COLORS: Record<CardStatus, string> = {
  draft:      'var(--text-tertiary)',
  ready:      'var(--accent)',
  stale:      '#F59E0B',
  processing: '#8B5CF6',
  error:      '#EF4444',
}

const STATUS_LABELS: Record<CardStatus, string> = {
  draft:      'Entwurf',
  ready:      'Bereit',
  stale:      'Veraltet',
  processing: 'In Bearbeitung',
  error:      'Fehler',
}

interface CardField {
  key: string
  label: string
  value?: string
}

interface Props {
  card: Card
  selected: boolean
  onSelect: () => void
  onDragStart: (e: React.MouseEvent) => void
}

export default function WorkspaceCard({ card, selected, onSelect, onDragStart }: Props) {
  const typeColor = TYPE_COLORS[card.type]
  const fields = (card.fields ?? []) as CardField[]
  const previewFields = fields.filter((f) => f.value).slice(0, 2)

  return (
    <article
      style={{
        position: 'absolute',
        left: card.positionX,
        top: card.positionY,
        width: 220,
        background: 'var(--bg-surface)',
        border: `1.5px solid ${selected ? typeColor : 'var(--border)'}`,
        borderRadius: 10,
        padding: '12px 14px',
        cursor: 'grab',
        userSelect: 'none',
        zIndex: selected ? 10 : 1,
        boxShadow: selected
          ? `0 4px 16px rgba(0,0,0,0.12), 0 0 0 2px ${typeColor}22`
          : '0 1px 4px rgba(0,0,0,0.06)',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
      onMouseDown={(e) => { e.stopPropagation(); onDragStart(e) }}
      onClick={(e) => { e.stopPropagation(); onSelect() }}
      aria-selected={selected}
      aria-label={`Karte: ${card.title}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect() }
      }}
    >
      {/* Header: type + status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{
          fontSize: 10,
          fontWeight: 600,
          color: typeColor,
          background: `${typeColor}18`,
          border: `1px solid ${typeColor}30`,
          padding: '1px 7px',
          borderRadius: 4,
        }}>
          {TYPE_LABELS[card.type]}
        </span>
        <span
          title={STATUS_LABELS[card.status]}
          aria-label={`Status: ${STATUS_LABELS[card.status]}`}
          style={{
            fontSize: 10,
            color: STATUS_COLORS[card.status],
          }}
        >
          {STATUS_LABELS[card.status]}
        </span>
      </div>

      {/* Title */}
      <p style={{
        fontSize: 13,
        fontWeight: 600,
        color: 'var(--text-primary)',
        marginBottom: card.description ? 4 : 0,
        lineHeight: 1.35,
        overflow: 'hidden',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical' as const,
      }}>
        {card.title}
      </p>

      {/* Description */}
      {card.description && (
        <p style={{
          fontSize: 11,
          color: 'var(--text-secondary)',
          lineHeight: 1.4,
          marginBottom: previewFields.length > 0 ? 8 : 0,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical' as const,
        }}>
          {card.description}
        </p>
      )}

      {/* Fields preview */}
      {previewFields.length > 0 && (
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 4 }}>
          {previewFields.map((f) => (
            <div key={f.key} style={{ display: 'flex', justifyContent: 'space-between', gap: 4, marginBottom: 3 }}>
              <span style={{ fontSize: 10, color: 'var(--text-tertiary)', flexShrink: 0 }}>{f.label}</span>
              <span style={{
                fontSize: 10,
                color: 'var(--text-secondary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap' as const,
                maxWidth: 110,
              }}>
                {f.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </article>
  )
}
