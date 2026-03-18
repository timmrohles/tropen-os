'use client'

import type { Card, CardStatus } from '@/db/schema'
import type { WorkspaceWithDetails } from '@/types/workspace'

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

function countByStatus(cards: Card[]): Partial<Record<CardStatus, number>> {
  return cards.reduce<Partial<Record<CardStatus, number>>>((acc, card) => {
    acc[card.status] = (acc[card.status] ?? 0) + 1
    return acc
  }, {})
}

const DISPLAYED_STATUSES: CardStatus[] = ['draft', 'ready', 'processing', 'stale', 'error']

interface Props {
  workspace: WorkspaceWithDetails
  onAddCard: () => void
  siloOpen: boolean
  onToggleSilo: () => void
}

export default function TopBar({ workspace, onAddCard, siloOpen, onToggleSilo }: Props) {
  const counts = countByStatus(workspace.cards)

  return (
    <div
      role="toolbar"
      aria-label="Workspace-Steuerleiste"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '0 20px',
        height: 48,
        background: 'var(--bg-nav)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
        userSelect: 'none',
      }}
    >
      {/* Left: title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
        <span style={{
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--text-primary)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {workspace.title}
        </span>
        {workspace.department && (
          <span style={{
            fontSize: 11,
            color: 'var(--text-tertiary)',
            background: 'var(--bg-base)',
            border: '1px solid var(--border)',
            padding: '1px 8px',
            borderRadius: 4,
            flexShrink: 0,
          }}>
            {workspace.department.name}
          </span>
        )}
      </div>

      {/* Middle: status counters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }} aria-label="Karten-Übersicht">
        {DISPLAYED_STATUSES.map((status) => {
          const count = counts[status] ?? 0
          if (count === 0) return null
          return (
            <div
              key={status}
              title={STATUS_LABELS[status]}
              style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-secondary)' }}
            >
              <span style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: STATUS_COLORS[status],
                flexShrink: 0,
                display: 'inline-block',
              }} aria-hidden="true" />
              <span>{count} {STATUS_LABELS[status]}</span>
            </div>
          )
        })}
      </div>

      {/* Right: actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={onAddCard}
          aria-label="Neue Karte hinzufügen"
        >
          + Karte hinzufügen
        </button>
        <button
          type="button"
          className={siloOpen ? 'btn btn-ghost btn-sm' : 'btn btn-ghost btn-sm'}
          onClick={onToggleSilo}
          aria-pressed={siloOpen}
          style={siloOpen ? { background: 'var(--accent-light)', color: 'var(--accent)' } : undefined}
        >
          Workspace-Info
        </button>
      </div>
    </div>
  )
}
