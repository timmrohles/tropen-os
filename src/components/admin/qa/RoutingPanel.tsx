'use client'

import { Badge, BarList } from '@tremor/react'
import type { RoutingResponse, QaRunType } from '@/types/qa'
import { SectionCard, KpiCard, Skeleton, s, modelColor, latencyColor } from './QaShared'

const ps: Record<string, React.CSSProperties> = {
  grid3: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 },
  stack: { display: 'flex', flexDirection: 'column', gap: 12 },
  actionRow: { display: 'flex', alignItems: 'center', gap: 12 },
  codeTag: {
    fontSize: 12,
    background: 'var(--bg-surface)',
    color: 'var(--text-secondary)',
    padding: '2px 8px',
    borderRadius: 4,
    border: '1px solid var(--border)',
  },
}

export function RoutingPanel({
  data,
  loading,
  onRun,
  running,
}: {
  data: RoutingResponse | null
  loading: boolean
  onRun: (type: QaRunType) => void
  running: boolean
}) {
  return (
    <div style={ps.stack}>
      <div style={ps.grid3}>
        <KpiCard
          label="Routing Decisions heute"
          value={data ? data.stats.decisionsToday.toLocaleString('de-DE') : '--'}
          sub=""
          valueColor="var(--text-primary)"
          loading={loading}
        />
        <KpiCard
          label="Accuracy"
          value={data ? `${data.stats.accuracy}%` : '--'}
          sub="korrekte Modellwahl"
          loading={loading}
        />
        <KpiCard
          label="Avg. Routing Overhead"
          value={data ? `${data.stats.avgOverheadMs}ms` : '--'}
          sub="zusatzliche Latenz"
          loading={loading}
        />
      </div>

      <SectionCard
        title="Live Routing Log"
        action={
          <div style={ps.actionRow}>
            <button
              onClick={() => onRun('routing')}
              disabled={running}
              className="btn btn-primary btn-sm"
              style={running ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
            >
              {running ? 'Lauft...' : 'Test ausfuhren'}
            </button>
            <Badge color="emerald">Live</Badge>
          </div>
        }
      >
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height={32} />)}
          </div>
        ) : (
          <div className="table-scroll">
            <table style={{ width: '100%' }}>
              <thead>
                <tr>
                  {['Zeit', 'Task-Typ', 'Modell', 'Routing-Grund', 'Latenz', 'Status'].map((h) => (
                    <th key={h} style={s.thCell}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data?.log ?? []).map((r) => (
                  <tr
                    key={r.id}
                    style={{
                      ...s.trBorder,
                      opacity: r.status === 'success' ? 1 : 0.6,
                    }}
                  >
                    <td style={{ ...s.tdCell, fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      {r.time}
                    </td>
                    <td style={{ ...s.tdCell, fontSize: 14, color: 'var(--text-primary)' }}>
                      {r.taskType}
                    </td>
                    <td style={{ ...s.tdCell, fontSize: 14, color: modelColor(r.model) }}>
                      {r.model}
                    </td>
                    <td style={s.tdCell}>
                      <code style={ps.codeTag}>{r.routingReason}</code>
                    </td>
                    <td style={{ ...s.tdCell, fontSize: 14, ...latencyColor(r.status, r.latencyMs) }}>
                      {r.status === 'success' && r.latencyMs !== null ? `${r.latencyMs}ms` : r.status}
                    </td>
                    <td style={s.tdCell}>
                      <Badge color={r.status === 'success' ? 'emerald' : r.status === 'timeout' ? 'yellow' : 'red'}>
                        {r.status === 'success' ? 'OK' : r.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <SectionCard title="Modell-Verteilung -- heute">
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={32} />)}
          </div>
        ) : (
          <BarList data={data?.stats.modelDistribution ?? []} className="mt-2" color="emerald" />
        )}
      </SectionCard>
    </div>
  )
}
