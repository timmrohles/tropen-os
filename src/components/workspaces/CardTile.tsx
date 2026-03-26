'use client'

import { Warning, Tray, ArrowsClockwise, Export as ExportIcon, ChatCircle } from '@phosphor-icons/react'
import type { CanvasCard } from '@/app/workspaces/[id]/CanvasClient'

const ROLE_CONFIG = {
  input:   { label: 'Eingabe',   color: 'var(--accent)',          bg: 'var(--accent-light)',    Icon: Tray },
  process: { label: 'Analyse',   color: 'var(--tropen-process)',  bg: 'var(--tropen-process-bg)', Icon: ArrowsClockwise },
  output:  { label: 'Ergebnis',  color: 'var(--tropen-output)',   bg: 'var(--tropen-output-bg)',  Icon: ExportIcon },
} as const

const STATUS_CONFIG = {
  draft:      { label: 'Entwurf',       color: 'var(--text-tertiary)' },
  ready:      { label: 'Bereit',        color: 'var(--accent)'        },
  stale:      { label: 'Veraltet',      color: 'var(--warning)'       },
  processing: { label: 'Verarbeitung',  color: 'var(--accent)'        },
  error:      { label: 'Fehler',        color: 'var(--error)'         },
} as const

interface Props {
  card: CanvasCard
  onClick?: () => void
}

export default function CardTile({ card, onClick }: Props) {
  const roleKey = (card.role ?? 'input') as keyof typeof ROLE_CONFIG
  const statusKey = (card.status ?? 'draft') as keyof typeof STATUS_CONFIG
  const roleConfig = ROLE_CONFIG[roleKey] ?? ROLE_CONFIG.input
  const statusConfig = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.draft
  const { Icon } = roleConfig

  return (
    <button
      type="button"
      className="card"
      onClick={onClick}
      style={{
        padding: '16px 18px',
        textAlign: 'left',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {/* Role badge + status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 11,
          fontWeight: 600,
          padding: '2px 8px',
          borderRadius: 99,
          background: roleConfig.bg,
          color: roleConfig.color,
        }}>
          <Icon size={11} weight="fill" aria-hidden="true" />
          {roleConfig.label}
        </span>
        <span style={{ fontSize: 11, color: statusConfig.color, fontWeight: 500 }}>
          {statusConfig.label}
        </span>
      </div>

      {/* Title */}
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>
        {card.title}
      </div>

      {/* Description */}
      {card.description && (
        <div style={{
          fontSize: 12,
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical' as const,
        }}>
          {card.description}
        </div>
      )}

      {/* Stale warning */}
      {card.status === 'stale' && card.stale_reason && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 5, fontSize: 11, color: 'var(--warning)', marginTop: 2 }}>
          <Warning size={13} weight="fill" style={{ flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
          <span style={{ lineHeight: 1.4 }}>{card.stale_reason}</span>
        </div>
      )}

      {/* Sources count */}
      {Array.isArray(card.sources) && card.sources.length > 0 && (
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
          {card.sources.length} {card.sources.length === 1 ? 'Quelle' : 'Quellen'}
        </div>
      )}

      {/* Chat artifact badge */}
      {card.source === 'chat_artifact' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
          <ChatCircle size={11} weight="fill" color="var(--text-tertiary)" aria-hidden="true" />
          <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>Aus Chat</span>
        </div>
      )}
    </button>
  )
}
