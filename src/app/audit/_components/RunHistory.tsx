import Link from 'next/link'
import { TrendUp, TrendDown, Minus, Brain } from '@phosphor-icons/react/dist/ssr'

interface RunSummary {
  id: string
  project_name: string
  percentage: number
  status: string
  total_findings: number
  critical_findings: number
  created_at: string
  review_type?: string | null
  review_cost_eur?: number | null
  models_used?: string[] | null
}

interface ReviewRunSummary {
  id: string
  run_id: string
  findings_count: number
  cost_eur: number | null
  models_used: string[] | null
  quorum_met: boolean
  created_at: string
}

interface RunHistoryProps {
  runs: RunSummary[]
  reviewRuns?: ReviewRunSummary[]
  selectedRunId?: string
}

const STATUS_COLOR: Record<string, string> = {
  production_grade: 'var(--status-production)',
  stable: 'var(--status-stable)',
  risky: 'var(--status-risky)',
  prototype: 'var(--status-prototype)',
}

const STATUS_LABEL: Record<string, string> = {
  production_grade: 'Production Grade',
  stable: 'Stable',
  risky: 'Risky',
  prototype: 'Prototype',
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
    + ', '
    + d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

export default function RunHistory({ runs, reviewRuns = [], selectedRunId }: RunHistoryProps) {
  if (runs.length === 0) {
    return null
  }

  // Group review runs by audit run id
  const reviewsByRunId = reviewRuns.reduce<Record<string, ReviewRunSummary[]>>((acc, rr) => {
    if (!acc[rr.run_id]) acc[rr.run_id] = []
    acc[rr.run_id].push(rr)
    return acc
  }, {})

  return (
    <div className="card" style={{ padding: '20px 24px', marginBottom: 24 }}>
      <div className="card-header" style={{ marginBottom: 12 }}>
        <span className="card-header-label">Run-Historie</span>
        <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{runs.length} Runs</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {runs.map((run, idx) => {
          const prevRun = runs[idx + 1]
          const delta = prevRun ? run.percentage - prevRun.percentage : null
          const isSelected = run.id === selectedRunId
          const color = STATUS_COLOR[run.status] ?? 'var(--text-secondary)'
          const runReviews = reviewsByRunId[run.id] ?? []

          return (
            <div key={run.id}>
              <Link
                href={`/audit?runId=${run.id}`}
                className="list-row"
                style={{
                  textDecoration: 'none',
                  display: 'grid',
                  gridTemplateColumns: '1fr 80px 80px 60px',
                  gap: 8,
                  alignItems: 'center',
                  background: isSelected ? 'var(--accent-light)' : undefined,
                  borderLeft: isSelected ? `3px solid var(--accent)` : '3px solid transparent',
                }}
              >
                <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>
                    {formatDate(run.created_at)}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                    {run.critical_findings > 0 && (
                      <span style={{ color: 'var(--error)', marginRight: 6 }}>
                        {run.critical_findings} krit.
                      </span>
                    )}
                    {run.total_findings} Findings
                  </span>
                </span>

                <span style={{
                  fontSize: 11, padding: '2px 7px', borderRadius: 10,
                  background: `color-mix(in srgb, ${color} 15%, transparent)`,
                  color,
                  fontWeight: 600, textAlign: 'center',
                }}>
                  {STATUS_LABEL[run.status] ?? run.status}
                </span>

                <span style={{ fontSize: 14, fontWeight: 700, color, textAlign: 'right' }}>
                  {run.percentage.toFixed(1)}%
                </span>

                <span style={{
                  fontSize: 12, display: 'flex', alignItems: 'center', gap: 2,
                  justifyContent: 'flex-end',
                  color: delta === null ? 'var(--text-tertiary)'
                    : delta > 0 ? 'var(--accent)'
                    : delta < 0 ? 'var(--error)'
                    : 'var(--text-tertiary)',
                }}>
                  {delta === null ? null
                    : delta > 0 ? <TrendUp size={12} weight="bold" aria-hidden="true" />
                    : delta < 0 ? <TrendDown size={12} weight="bold" aria-hidden="true" />
                    : <Minus size={12} weight="bold" aria-hidden="true" />}
                  {delta !== null && delta !== 0 && `${delta > 0 ? '+' : ''}${delta.toFixed(1)}%`}
                </span>
              </Link>

              {/* Deep Review sub-entries */}
              {runReviews.map((rr) => (
                <div
                  key={rr.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    gap: 8,
                    alignItems: 'center',
                    padding: '5px 12px 5px 28px',
                    borderLeft: '3px solid transparent',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--accent)' }}>
                    <Brain size={11} weight="fill" aria-hidden="true" />
                    Deep Review · {formatDate(rr.created_at)}
                    <span style={{ color: 'var(--text-tertiary)' }}>
                      · {rr.findings_count} Findings
                      {rr.cost_eur != null && ` · €${rr.cost_eur.toFixed(3)}`}
                    </span>
                  </span>
                  {!rr.quorum_met && (
                    <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                      kein Quorum
                    </span>
                  )}
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
