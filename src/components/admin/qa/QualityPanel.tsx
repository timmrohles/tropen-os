'use client'

import { Badge, ProgressBar } from '@tremor/react'
import type { QualityResponse } from '@/types/qa'
import { SectionCard, KpiCard, Skeleton, s, modelColor, MODEL_TREMOR_COLORS } from './QaShared'

const ps: Record<string, React.CSSProperties> = {
  grid4: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 },
  stack: { display: 'flex', flexDirection: 'column', gap: 12 },
  stackGap3: { display: 'flex', flexDirection: 'column', gap: 12 },
}

export function QualityPanel({ data, loading }: { data: QualityResponse | null; loading: boolean }) {
  return (
    <div style={ps.stack}>
      {/* Model score cards */}
      <div style={ps.grid4}>
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={s.kpiCard}>
                <Skeleton height={12} width={112} />
                <div style={{ marginTop: 12 }}><Skeleton height={40} width={64} /></div>
                <div style={{ marginTop: 12 }}><Skeleton height={8} /></div>
                <div style={{ marginTop: 12 }}><Skeleton height={12} width={80} /></div>
              </div>
            ))
          : (data?.modelScores ?? []).map((m) => {
              const barColor = MODEL_TREMOR_COLORS[m.model] ?? 'emerald'
              return (
                <div key={m.model} style={s.kpiCard}>
                  <div style={s.kpiLabel}>{m.model}</div>
                  <div
                    style={{
                      fontSize: 36,
                      fontWeight: 600,
                      lineHeight: 1,
                      marginBottom: 12,
                      color: modelColor(m.model),
                    }}
                  >
                    {m.qualityScore}
                  </div>
                  <ProgressBar value={m.qualityScore} color={barColor} className="mb-3" />
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>Starken</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {m.strengths.join(', ') || '--'}
                  </div>
                </div>
              )
            })}
      </div>

      {/* Bias & Fairness table */}
      <SectionCard
        title="Bias & Fairness -- Scores"
        action={
          data?.lastEvalRun ? (
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Letzte Prufung:{' '}
              {new Date(data.lastEvalRun).toLocaleDateString('de-DE', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}
            </span>
          ) : (
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Schwelle: 95</span>
          )
        }
      >
        {loading ? (
          <div style={ps.stackGap3}>
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={32} />)}
          </div>
        ) : (
          <div className="table-scroll">
            <table style={{ width: '100%' }}>
              <thead>
                <tr>
                  {['Kategorie', 'Score', 'Schwelle', 'Status', 'Visualisierung'].map((h) => (
                    <th key={h} style={s.thCell}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data?.biasScores ?? []).map((b) => (
                  <tr key={b.category} style={s.trBorder}>
                    <td style={{ ...s.tdCell, fontSize: 14, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                      {b.category}
                    </td>
                    <td style={{ ...s.tdCell, fontSize: 14, fontWeight: 600, color: b.pass ? 'var(--accent)' : 'var(--error)' }}>
                      {b.score}
                    </td>
                    <td style={{ ...s.tdCell, fontSize: 14, color: 'var(--text-muted)' }}>
                      {b.threshold}
                    </td>
                    <td style={s.tdCell}>
                      <Badge color={b.pass ? 'emerald' : 'red'}>{b.pass ? 'Pass' : 'Fail'}</Badge>
                    </td>
                    <td style={{ ...s.tdCell, width: 192 }}>
                      <ProgressBar value={b.score} color={b.pass ? 'emerald' : 'red'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* Hallucination rate */}
      <SectionCard title="Hallucination Rate -- letzte Eval-Runde">
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={40} width={96} />)}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
            {(data?.modelScores ?? []).map((m) => (
              <div key={m.model}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>{m.model}</div>
                <div style={{ fontSize: 24, fontWeight: 600, color: modelColor(m.model) }}>
                  {m.hallucinationRate}%
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>Hallucination Rate</div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  )
}
