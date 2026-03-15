'use client'

import type { Card, CardType, CardStatus } from '@/db/schema'

const MONO = "'DM Mono', 'Courier New', monospace"

const TYPE_COLORS: Record<CardType, string> = {
  input: '#00C9A7',
  process: '#7C6FF7',
  output: '#F7A44A',
}

const TYPE_LABELS: Record<CardType, string> = {
  input: 'INPUT',
  process: 'PROCESS',
  output: 'OUTPUT',
}

const STATUS_COLORS: Record<CardStatus, string> = {
  waiting: '#444444',
  active: '#00C9A7',
  review: '#F7A44A',
  done: '#7C6FF7',
  archived: '#1e1e1e',
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
    <>
      <style>{`
        @keyframes ws-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
      <article
        style={{
          position: 'absolute',
          left: card.positionX,
          top: card.positionY,
          width: 200,
          background: '#0e0e0e',
          border: `1px solid ${selected ? typeColor : '#1e1e1e'}`,
          borderRadius: 6,
          padding: '12px',
          cursor: 'grab',
          userSelect: 'none',
          fontFamily: MONO,
          color: '#e0e0e0',
          zIndex: selected ? 10 : 1,
          boxShadow: selected
            ? `0 0 0 1px ${typeColor}33`
            : '0 2px 8px rgba(0,0,0,0.4)',
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}
        onMouseDown={(e) => {
          e.stopPropagation()
          onDragStart(e)
        }}
        onClick={(e) => {
          e.stopPropagation()
          onSelect()
        }}
        aria-selected={selected}
        aria-label={`Karte: ${card.title}`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onSelect()
          }
        }}
      >
        {/* Header row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}>
          <span style={{
            fontSize: 9,
            color: typeColor,
            background: `${typeColor}1a`,
            border: `1px solid ${typeColor}33`,
            padding: '1px 6px',
            borderRadius: 3,
            fontFamily: MONO,
            letterSpacing: '0.08em',
            fontWeight: 600,
          }}>
            {TYPE_LABELS[card.type]}
          </span>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: STATUS_COLORS[card.status],
              display: 'inline-block',
              animation: card.status === 'active' ? 'ws-pulse 2s ease-in-out infinite' : undefined,
              flexShrink: 0,
            }}
            title={card.status}
            aria-label={`Status: ${card.status}`}
          />
        </div>

        {/* Title */}
        <p style={{
          fontSize: 13,
          fontWeight: 500,
          color: '#e0e0e0',
          fontFamily: MONO,
          marginBottom: 4,
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
            color: '#444444',
            fontFamily: MONO,
            lineHeight: 1.4,
            marginBottom: 8,
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
          <div style={{ marginBottom: 8 }}>
            {previewFields.map((f) => (
              <div key={f.key} style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 4,
                marginBottom: 3,
              }}>
                <span style={{ fontSize: 10, color: '#444444', fontFamily: MONO, flexShrink: 0 }}>
                  {f.label}
                </span>
                <span style={{
                  fontSize: 10,
                  color: '#e0e0e0',
                  fontFamily: MONO,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap' as const,
                  maxWidth: 90,
                }}>
                  {f.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Model badge */}
        {card.model && (
          <div style={{
            fontSize: 9,
            color: '#444444',
            background: '#1e1e1e',
            padding: '2px 6px',
            borderRadius: 3,
            fontFamily: MONO,
            display: 'inline-block',
            letterSpacing: '0.04em',
          }}>
            {card.model}
          </div>
        )}
      </article>
    </>
  )
}
