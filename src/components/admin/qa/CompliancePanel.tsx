'use client'

import { Badge } from '@tremor/react'
import type { ComplianceResponse, QaRunType } from '@/types/qa'
import { SectionCard, KpiCard, StatusBadge, Skeleton, s } from './QaShared'

const ps: Record<string, React.CSSProperties> = {
  grid3: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 },
  stack: { display: 'flex', flexDirection: 'column', gap: 12 },
  openBox: {
    borderRadius: 8,
    background: 'var(--warning-bg)',
    border: '1px solid rgba(192, 122, 42, 0.2)',
    padding: 24,
  },
  openLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: 'var(--warning)',
    marginBottom: 16,
  },
  openItem: {
    display: 'flex',
    gap: 16,
    alignItems: 'flex-start',
  },
  openArticle: {
    fontSize: 12,
    color: 'var(--warning)',
    flexShrink: 0,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  openAction: {
    fontSize: 14,
    color: 'var(--text-secondary)',
    flex: 1,
  },
}

export function CompliancePanel({
  data,
  loading,
  onRun,
  running,
}: {
  data: ComplianceResponse | null
  loading: boolean
  onRun: (type: QaRunType) => void
  running: boolean
}) {
  return (
    <div style={ps.stack}>
      <div style={ps.grid3}>
        <KpiCard
          label="EU AI Act -- Bestanden"
          value={data ? `${data.summary.pass} / ${data.summary.total}` : '--'}
          sub="Checks bestanden"
          loading={loading}
        />
        <KpiCard
          label="EU AI Act -- Ausstehend"
          value={data ? String(data.summary.warn) : '--'}
          sub="Checks ausstehend"
          valueColor="var(--warning)"
          loading={loading}
        />
        <KpiCard
          label="EU AI Act -- Fehlend"
          value={data ? String(data.summary.fail) : '--'}
          sub="Checks fehlen"
          valueColor="var(--error)"
          loading={loading}
        />
      </div>

      <SectionCard
        title="Artikel-Checks"
        action={
          <button
            onClick={() => onRun('bias')}
            disabled={running}
            className="btn btn-primary btn-sm"
            style={running ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
          >
            {running ? 'Lauft...' : 'Test ausfuhren'}
          </button>
        }
      >
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} height={32} />)}
          </div>
        ) : (
          <div className="table-scroll">
            <table style={{ width: '100%' }}>
              <thead>
                <tr>
                  {['Artikel', 'Anforderung', 'Status', 'Notizen'].map((h) => (
                    <th key={h} style={s.thCell}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data?.items ?? []).map((c) => (
                  <tr key={c.id} style={s.trBorder}>
                    <td style={{ ...s.tdCell, fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>
                      {c.article}
                    </td>
                    <td style={{ ...s.tdCell, fontSize: 14, color: 'var(--text-primary)' }}>
                      {c.label}
                    </td>
                    <td style={s.tdCell}>
                      <StatusBadge status={c.status} />
                    </td>
                    <td style={{ ...s.tdCell, fontSize: 12, color: 'var(--text-muted)' }}>
                      {c.notes ?? '--'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {!loading && (data?.openActions ?? []).length > 0 && (
        <div style={ps.openBox}>
          <div style={ps.openLabel}>Offene Punkte</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {(data?.openActions ?? []).map((o) => (
              <div key={o.article} style={ps.openItem}>
                <span style={ps.openArticle}>{o.article}</span>
                <span style={ps.openAction}>{o.action}</span>
                <Badge color="yellow">{o.deadline}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
