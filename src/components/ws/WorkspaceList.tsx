'use client'

import { Link } from '@/i18n/navigation'
import type { Workspace, WorkspaceDomain } from '@/db/schema'

const MONO = "'DM Mono', 'Courier New', monospace"

const DOMAIN_COLORS: Record<WorkspaceDomain, string> = {
  marketing: '#F7A44A',
  research: '#7C6FF7',
  learning: '#00C9A7',
  legal: '#e0e0e0',
  product: '#7C6FF7',
  custom: '#444444',
}

const DOMAIN_LABELS: Record<WorkspaceDomain, string> = {
  marketing: 'Marketing',
  research: 'Forschung',
  learning: 'Lernen',
  legal: 'Recht',
  product: 'Produkt',
  custom: 'Individuell',
}

function formatDate(date: Date | string | null): string {
  if (!date) return '–'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const s: Record<string, React.CSSProperties> = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 16,
  },
  card: {
    background: '#0e0e0e',
    border: '1px solid #1e1e1e',
    borderRadius: 6,
    padding: '20px',
    textDecoration: 'none',
    display: 'block',
    transition: 'border-color 0.15s',
    cursor: 'pointer',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: 500,
    color: '#e0e0e0',
    fontFamily: MONO,
    letterSpacing: '0.02em',
    lineHeight: 1.4,
    flex: 1,
  },
  domainBadge: {
    fontSize: 10,
    padding: '2px 8px',
    borderRadius: 3,
    fontFamily: MONO,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    flexShrink: 0,
    border: '1px solid',
  },
  description: {
    fontSize: 12,
    color: '#444444',
    fontFamily: MONO,
    lineHeight: 1.5,
    marginBottom: 16,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical' as const,
    overflow: 'hidden',
  },
  meta: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
  cardCount: {
    fontSize: 11,
    color: '#444444',
    fontFamily: MONO,
  },
  updatedAt: {
    fontSize: 11,
    color: '#1e1e1e',
    fontFamily: MONO,
  },
}

interface Props {
  workspaces: Workspace[]
}

export default function WorkspaceList({ workspaces }: Props) {
  return (
    <ul
      style={s.grid}
      aria-label="Workspaces"
    >
      {workspaces.map((ws) => {
        const domainColor = DOMAIN_COLORS[ws.domain] ?? '#444444'
        return (
          <li key={ws.id} style={{ listStyle: 'none' }}>
            <Link
              href={`/ws/${ws.id}/canvas`}
              style={s.card}
              aria-label={`Workspace ${ws.title} öffnen`}
            >
              <div style={s.cardHeader}>
                <span style={s.title}>{ws.title}</span>
                <span
                  style={{
                    ...s.domainBadge,
                    color: domainColor,
                    borderColor: domainColor,
                  }}
                >
                  {DOMAIN_LABELS[ws.domain]}
                </span>
              </div>
              {ws.description && (
                <p style={s.description}>{ws.description}</p>
              )}
              <div style={s.meta}>
                <span style={s.cardCount}>0 Karten</span>
                <span style={s.updatedAt}>
                  {formatDate(ws.updatedAt)}
                </span>
              </div>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
