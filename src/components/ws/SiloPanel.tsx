'use client'

import type { WorkspaceWithDetails } from '@/types/workspace'
import type { WorkspaceMeta } from '@/types/workspace'

interface Props {
  workspace: WorkspaceWithDetails
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <div style={{ marginBottom: 10 }}>
      <span style={{
        display: 'block',
        fontSize: 10, fontWeight: 700,
        color: 'var(--text-tertiary)',
        textTransform: 'uppercase',
        letterSpacing: '0.07em',
        marginBottom: 2,
      }}>
        {label}
      </span>
      <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5, margin: 0 }}>
        {value}
      </p>
    </div>
  )
}

function StatBox({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div style={{
      background: 'var(--bg-base)',
      border: '1px solid var(--border-medium)',
      borderRadius: 8,
      padding: '10px 12px',
    }}>
      <p style={{
        fontSize: 22, fontWeight: 700,
        color: color ?? 'var(--text-primary)',
        lineHeight: 1, marginBottom: 2,
      }}>
        {value}
      </p>
      <p style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </p>
    </div>
  )
}

export default function SiloPanel({ workspace }: Props) {
  const meta = (workspace.meta ?? {}) as WorkspaceMeta

  const totalCards   = workspace.cards.length
  const activeCards  = workspace.cards.filter((c) => c.status === 'processing').length
  const doneCards    = workspace.cards.filter((c) => c.status === 'ready').length
  const waitingCards = workspace.cards.filter((c) => c.status === 'draft').length

  const hasContext = workspace.goal || meta.context || meta.tone || meta.language || meta.target_audience
  const hasParticipants = workspace.participants.length > 0

  return (
    <aside
      role="complementary"
      aria-label="Workspace-Info"
      style={{
        width: 280,
        height: '100%',
        background: 'var(--bg-surface-solid)',
        borderLeft: '1px solid var(--border-medium)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        overflowY: 'auto',
        scrollbarWidth: 'thin',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Workspace-Info
        </p>
      </div>

      {/* Workspace title */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 4 }}>
          Workspace
        </span>
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.35 }}>
          {workspace.title}
        </p>
      </div>

      {/* Stats */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
        <span className="card-section-label" style={{ padding: 0, marginBottom: 10 }}>
          Karten-Übersicht
        </span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <StatBox label="Gesamt"  value={totalCards} />
          <StatBox label="Aktiv"   value={activeCards}  color="var(--tropen-process, #8B5CF6)" />
          <StatBox label="Fertig"  value={doneCards}    color="var(--accent)" />
          <StatBox label="Wartend" value={waitingCards} color="var(--text-tertiary)" />
        </div>
      </div>

      {/* Context */}
      {hasContext && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
          <span className="card-section-label" style={{ padding: 0, marginBottom: 10 }}>
            Kontext
          </span>
          <InfoRow label="Ziel"        value={workspace.goal ?? undefined} />
          <InfoRow label="Kontext"     value={meta.context} />
          <InfoRow label="Ton"         value={meta.tone} />
          <InfoRow label="Sprache"     value={meta.language} />
          <InfoRow label="Zielgruppe"  value={meta.target_audience} />
        </div>
      )}

      {/* Participants */}
      {hasParticipants && (
        <div style={{ padding: '12px 16px' }}>
          <span className="card-section-label" style={{ padding: 0, marginBottom: 10 }}>
            Teilnehmer ({workspace.participants.length})
          </span>
          {workspace.participants.map((p) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'var(--accent-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: 'var(--accent)',
                flexShrink: 0,
              }}>
                {(p.user.name ?? p.user.email ?? '?').charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.user.name ?? p.user.email ?? p.userId}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
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
