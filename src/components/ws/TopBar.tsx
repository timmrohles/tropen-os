'use client'

import type { Card, CardStatus } from '@/db/schema'
import type { WorkspaceWithDetails } from '@/types/workspace'

const MONO = "'DM Mono', 'Courier New', monospace"

const STATUS_COLORS: Record<CardStatus, string> = {
  waiting: '#444444',
  active: '#00C9A7',
  review: '#F7A44A',
  done: '#7C6FF7',
  archived: '#1e1e1e',
}

const STATUS_LABELS: Record<CardStatus, string> = {
  waiting: 'Wartend',
  active: 'Aktiv',
  review: 'Review',
  done: 'Fertig',
  archived: 'Archiviert',
}

function countByStatus(cards: Card[]): Partial<Record<CardStatus, number>> {
  return cards.reduce<Partial<Record<CardStatus, number>>>((acc, card) => {
    acc[card.status] = (acc[card.status] ?? 0) + 1
    return acc
  }, {})
}

const s: Record<string, React.CSSProperties> = {
  bar: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '0 20px',
    height: 48,
    background: '#0e0e0e',
    borderBottom: '1px solid #1e1e1e',
    fontFamily: MONO,
    flexShrink: 0,
    userSelect: 'none' as const,
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: 500,
    color: '#e0e0e0',
    fontFamily: MONO,
    letterSpacing: '0.02em',
    whiteSpace: 'nowrap' as const,
  },
  department: {
    fontSize: 11,
    color: '#444444',
    fontFamily: MONO,
    background: '#1e1e1e',
    padding: '2px 8px',
    borderRadius: 3,
    letterSpacing: '0.04em',
  },
  middle: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  counter: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    fontSize: 11,
    fontFamily: MONO,
    letterSpacing: '0.02em',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    flexShrink: 0,
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  addBtn: {
    padding: '5px 14px',
    background: '#7C6FF7',
    color: '#e0e0e0',
    border: 'none',
    borderRadius: 4,
    fontSize: 12,
    fontFamily: MONO,
    cursor: 'pointer',
    letterSpacing: '0.02em',
    transition: 'opacity 0.15s',
    whiteSpace: 'nowrap' as const,
  },
  siloBtn: {
    padding: '5px 14px',
    background: 'transparent',
    color: '#444444',
    border: '1px solid #1e1e1e',
    borderRadius: 4,
    fontSize: 12,
    fontFamily: MONO,
    cursor: 'pointer',
    letterSpacing: '0.02em',
    transition: 'color 0.15s, border-color 0.15s',
    whiteSpace: 'nowrap' as const,
  },
  siloBtnActive: {
    padding: '5px 14px',
    background: 'transparent',
    color: '#e0e0e0',
    border: '1px solid #7C6FF7',
    borderRadius: 4,
    fontSize: 12,
    fontFamily: MONO,
    cursor: 'pointer',
    letterSpacing: '0.02em',
    transition: 'color 0.15s, border-color 0.15s',
    whiteSpace: 'nowrap' as const,
  },
}

const DISPLAYED_STATUSES: CardStatus[] = ['waiting', 'active', 'review', 'done']

interface Props {
  workspace: WorkspaceWithDetails
  onAddCard: () => void
  siloOpen: boolean
  onToggleSilo: () => void
}

export default function TopBar({ workspace, onAddCard, siloOpen, onToggleSilo }: Props) {
  const counts = countByStatus(workspace.cards)

  return (
    <div style={s.bar} role="toolbar" aria-label="Workspace-Steuerleiste">
      <div style={s.left}>
        <span style={s.title}>{workspace.title}</span>
        {workspace.department && (
          <span style={s.department}>{workspace.department.name}</span>
        )}
      </div>

      <div style={s.middle} aria-label="Karten-Status-Übersicht">
        {DISPLAYED_STATUSES.map((status) => {
          const count = counts[status] ?? 0
          if (count === 0) return null
          return (
            <div key={status} style={s.counter} title={STATUS_LABELS[status]}>
              <div
                style={{
                  ...s.dot,
                  background: STATUS_COLORS[status],
                }}
                aria-hidden="true"
              />
              <span style={{ color: STATUS_COLORS[status] }}>{count}</span>
            </div>
          )
        })}
      </div>

      <div style={s.right}>
        <button
          type="button"
          style={s.addBtn}
          onClick={onAddCard}
          aria-label="Neue Karte hinzufügen"
        >
          + Karte
        </button>
        <button
          type="button"
          style={siloOpen ? s.siloBtnActive : s.siloBtn}
          onClick={onToggleSilo}
          aria-pressed={siloOpen}
          aria-label={siloOpen ? 'Silo schließen' : 'Silo öffnen'}
        >
          Silo
        </button>
      </div>
    </div>
  )
}
