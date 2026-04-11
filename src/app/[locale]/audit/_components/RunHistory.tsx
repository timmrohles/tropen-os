'use client'

import { useState } from 'react'
import Link from 'next/link'
import { TrendUp, TrendDown, Brain, CaretRight, CaretDown } from '@phosphor-icons/react'

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
  stable:           'var(--status-stable)',
  risky:            'var(--status-risky)',
  prototype:        'var(--status-prototype)',
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

function groupByDay(runs: RunSummary[]): Map<string, RunSummary[]> {
  const today = new Date().toDateString()
  const yesterday = new Date(Date.now() - 86400000).toDateString()
  const groups = new Map<string, RunSummary[]>()
  for (const run of runs) {
    const d = new Date(run.created_at).toDateString()
    const key = d === today ? 'today' : d === yesterday ? 'yesterday' : new Date(run.created_at).toISOString().split('T')[0]
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(run)
  }
  return groups
}

function dayLabel(key: string): string {
  if (key === 'today') return 'Heute'
  if (key === 'yesterday') return 'Gestern'
  return new Date(key).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function RunHistory({ runs, reviewRuns = [], selectedRunId }: RunHistoryProps) {
  const [filter, setFilter] = useState<'all' | 'auto' | 'deep'>('all')
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set(['today']))

  if (runs.length === 0) return null

  const reviewsByRunId = reviewRuns.reduce<Record<string, ReviewRunSummary[]>>((acc, rr) => {
    if (!acc[rr.run_id]) acc[rr.run_id] = []
    acc[rr.run_id].push(rr)
    return acc
  }, {})

  const filtered = runs.filter(run => {
    if (filter === 'deep') return run.review_type === 'multi_model'
    if (filter === 'auto') return run.review_type !== 'multi_model'
    return true
  })

  const grouped = groupByDay(filtered)

  function toggleDay(key: string) {
    setExpandedDays(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <div className="card" style={{ padding: '20px 24px', marginBottom: 24 }}>
      <div className="card-header" style={{ marginBottom: 12 }}>
        <span className="card-header-label">Run-Historie</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['all', 'auto', 'deep'] as const).map(f => (
            <button
              key={f}
              className={`chip${filter === f ? ' chip--active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'Alle' : f === 'auto' ? 'Auto' : 'Deep'}
            </button>
          ))}
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{filtered.length} Runs</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {[...grouped.entries()].map(([dayKey, dayRuns]) => {
          const isExpanded = expandedDays.has(dayKey)
          return (
            <div key={dayKey}>
              <button
                onClick={() => toggleDay(dayKey)}
                aria-expanded={isExpanded}
                style={{
                  width: '100%', textAlign: 'left',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '6px 0', border: 'none', background: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {isExpanded
                    ? <CaretDown size={10} weight="bold" aria-hidden="true" />
                    : <CaretRight size={10} weight="bold" aria-hidden="true" />}
                  {dayLabel(dayKey)}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{dayRuns.length} Runs</span>
              </button>

              {isExpanded && (
                <div>
                  {dayRuns.map((run, idx) => {
                    const prevRun = filtered[filtered.indexOf(run) + 1]
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
                            gridTemplateColumns: '40px 62px 1fr 52px 44px',
                            gap: 6, alignItems: 'center', fontSize: 12,
                            paddingLeft: 16,
                            background: isSelected ? 'var(--accent-light)' : undefined,
                            borderLeft: isSelected ? '2px solid var(--accent)' : '2px solid transparent',
                          }}
                        >
                          <span style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>
                            {formatTime(run.created_at)}
                          </span>
                          <span style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>
                            {run.total_findings} Find.
                          </span>
                          <span style={{
                            color: 'var(--text-tertiary)', fontSize: 11,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {run.review_type === 'multi_model' && (
                              <span style={{
                                fontSize: 9, fontWeight: 700, padding: '1px 4px', borderRadius: 3, marginRight: 4,
                                background: 'color-mix(in srgb, var(--accent) 15%, transparent)',
                                color: 'var(--accent)',
                              }}>Deep</span>
                            )}
                            {run.project_name}
                          </span>
                          <span style={{ fontWeight: 700, color, textAlign: 'right', fontSize: 13 }}>
                            {run.percentage.toFixed(1)}%
                          </span>
                          <span style={{
                            fontSize: 11, textAlign: 'right',
                            color: delta === null ? 'transparent'
                              : delta > 0 ? 'var(--accent)'
                              : delta < 0 ? 'var(--error)'
                              : 'var(--text-tertiary)',
                          }}>
                            {delta !== null && delta !== 0
                              ? `${delta > 0 ? '+' : ''}${delta.toFixed(1)}%`
                              : delta === 0 ? '—' : ''}
                          </span>
                        </Link>

                        {runReviews.map(rr => (
                          <div key={rr.id} style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '3px 8px 3px 32px', fontSize: 11, color: 'var(--accent)',
                          }}>
                            <Brain size={10} weight="fill" aria-hidden="true" />
                            <span>Deep Review · {formatTime(rr.created_at)}</span>
                            <span style={{ color: 'var(--text-tertiary)' }}>
                              · {rr.findings_count} Findings
                              {rr.cost_eur != null && ` · €${rr.cost_eur.toFixed(3)}`}
                            </span>
                            {!rr.quorum_met && (
                              <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>kein Quorum</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}

        {filtered.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center', padding: '12px 0' }}>
            Keine Runs für diesen Filter.
          </p>
        )}
      </div>
    </div>
  )
}
