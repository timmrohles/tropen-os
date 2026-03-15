'use client'

import type { WorkspaceWithDetails } from '@/types/workspace'
import type { WorkspaceMeta } from '@/types/workspace'

const MONO = "'DM Mono', 'Courier New', monospace"

const s: Record<string, React.CSSProperties> = {
  panel: {
    width: 280,
    height: '100%',
    background: '#0e0e0e',
    borderLeft: '1px solid #1e1e1e',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: MONO,
    color: '#e0e0e0',
    flexShrink: 0,
    overflowY: 'auto' as const,
    scrollbarWidth: 'thin' as const,
  },
  header: {
    padding: '14px 16px',
    borderBottom: '1px solid #1e1e1e',
    flexShrink: 0,
  },
  panelTitle: {
    fontSize: 11,
    color: '#444444',
    fontFamily: MONO,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
  },
  section: {
    padding: '12px 16px',
    borderBottom: '1px solid #1e1e1e',
  },
  fieldLabel: {
    fontSize: 10,
    color: '#444444',
    fontFamily: MONO,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    marginBottom: 4,
    display: 'block',
  },
  fieldValue: {
    fontSize: 12,
    color: '#e0e0e0',
    fontFamily: MONO,
    lineHeight: 1.5,
  },
  fieldEmpty: {
    fontSize: 12,
    color: '#1e1e1e',
    fontFamily: MONO,
    fontStyle: 'italic' as const,
  },
  domainBadge: {
    fontSize: 10,
    padding: '2px 8px',
    borderRadius: 3,
    fontFamily: MONO,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    border: '1px solid #1e1e1e',
    color: '#444444',
    display: 'inline-block',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
  },
  stat: {
    background: '#080808',
    border: '1px solid #1e1e1e',
    borderRadius: 4,
    padding: '8px 10px',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 600,
    color: '#e0e0e0',
    fontFamily: MONO,
    lineHeight: 1,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: '#444444',
    fontFamily: MONO,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
  },
}

function MetaField({ label, value }: { label: string; value?: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <span style={s.fieldLabel}>{label}</span>
      {value ? (
        <p style={s.fieldValue}>{value}</p>
      ) : (
        <p style={s.fieldEmpty}>—</p>
      )}
    </div>
  )
}

interface Props {
  workspace: WorkspaceWithDetails
}

export default function SiloPanel({ workspace }: Props) {
  const meta = (workspace.meta ?? {}) as WorkspaceMeta

  const totalCards = workspace.cards.length
  const activeCards = workspace.cards.filter((c) => c.status === 'active').length
  const doneCards = workspace.cards.filter((c) => c.status === 'done').length
  const waitingCards = workspace.cards.filter((c) => c.status === 'waiting').length

  return (
    <aside
      style={s.panel}
      role="complementary"
      aria-label="Workspace-Silo"
    >
      <div style={s.header}>
        <p style={s.panelTitle}>Silo</p>
      </div>

      {/* Overview */}
      <div style={s.section}>
        <span style={s.fieldLabel}>Workspace</span>
        <p style={{ ...s.fieldValue, marginBottom: 8, fontWeight: 500 }}>
          {workspace.title}
        </p>
        {workspace.domain && (
          <span style={s.domainBadge}>{workspace.domain}</span>
        )}
      </div>

      {/* Stats */}
      <div style={s.section}>
        <span style={s.fieldLabel}>Karten-Übersicht</span>
        <div style={s.statsGrid}>
          <div style={s.stat}>
            <p style={s.statValue}>{totalCards}</p>
            <p style={s.statLabel}>Gesamt</p>
          </div>
          <div style={s.stat}>
            <p style={{ ...s.statValue, color: '#00C9A7' }}>{activeCards}</p>
            <p style={s.statLabel}>Aktiv</p>
          </div>
          <div style={s.stat}>
            <p style={{ ...s.statValue, color: '#7C6FF7' }}>{doneCards}</p>
            <p style={s.statLabel}>Fertig</p>
          </div>
          <div style={s.stat}>
            <p style={{ ...s.statValue, color: '#444444' }}>{waitingCards}</p>
            <p style={s.statLabel}>Wartend</p>
          </div>
        </div>
      </div>

      {/* Meta */}
      <div style={s.section}>
        <span style={s.fieldLabel}>Kontext</span>
        <div style={{ marginTop: 8 }}>
          <MetaField label="Ziel" value={workspace.goal ?? undefined} />
          <MetaField label="Kontext" value={meta.context} />
          <MetaField label="Ton" value={meta.tone} />
          <MetaField label="Sprache" value={meta.language} />
          <MetaField label="Zielgruppe" value={meta.target_audience} />
        </div>
      </div>

      {/* Participants */}
      {workspace.participants.length > 0 && (
        <div style={s.section}>
          <span style={s.fieldLabel}>
            Teilnehmer ({workspace.participants.length})
          </span>
          {workspace.participants.map((p) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <div style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: '#1e1e1e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                color: '#444444',
                fontFamily: MONO,
                flexShrink: 0,
              }}>
                {(p.user.name ?? p.user.email ?? '?').charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 11, color: '#e0e0e0', fontFamily: MONO, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                  {p.user.name ?? p.user.email ?? p.userId}
                </p>
                <p style={{ fontSize: 10, color: '#444444', fontFamily: MONO }}>
                  {p.role}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </aside>
  )
}
