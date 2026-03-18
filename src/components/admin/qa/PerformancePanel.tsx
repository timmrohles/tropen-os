'use client'

import { BarChart, ProgressBar } from '@tremor/react'
import type { PerformanceResponse } from '@/types/qa'
import { SectionCard, Skeleton, s } from './QaShared'

const ps: Record<string, React.CSSProperties> = {
  grid4: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 },
  grid3: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 },
  grid5: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 },
  stack: { display: 'flex', flexDirection: 'column', gap: 12 },
}

export function PerformancePanel({ data, loading }: { data: PerformanceResponse | null; loading: boolean }) {
  const lhScores = data?.lighthouse
    ? [
        { label: 'Performance', val: data.lighthouse.performance },
        { label: 'Accessibility', val: data.lighthouse.accessibility },
        { label: 'Best Practices', val: data.lighthouse.bestPractices },
        { label: 'SEO', val: data.lighthouse.seo },
      ]
    : []

  return (
    <div style={ps.stack}>
      {/* Lighthouse */}
      <SectionCard
        title="Lighthouse Scores"
        action={
          data?.lighthouse ? (
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Letzter Run:{' '}
              {new Date(data.lighthouse.runAt).toLocaleString('de-DE', {
                dateStyle: 'short',
                timeStyle: 'short',
              })}
            </span>
          ) : null
        }
      >
        {loading ? (
          <div style={{ ...ps.grid4, marginTop: 8 }}>
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={96} />)}
          </div>
        ) : data?.lighthouse ? (
          <div style={{ ...ps.grid4, marginTop: 8 }}>
            {lhScores.map((l) => {
              const color = l.val >= 90 ? 'emerald' : l.val >= 75 ? 'yellow' : 'red'
              const textColor = l.val >= 90 ? 'var(--accent)' : l.val >= 75 ? 'var(--warning)' : 'var(--error)'
              return (
                <div key={l.label}>
                  <div style={s.kpiLabel}>{l.label}</div>
                  <div style={{ fontSize: 36, fontWeight: 600, marginBottom: 12, color: textColor }}>
                    {l.val}
                  </div>
                  <ProgressBar value={l.val} color={color as 'emerald' | 'yellow' | 'red'} />
                </div>
              )
            })}
          </div>
        ) : (
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Noch kein Lighthouse-Run vorhanden.</p>
        )}
      </SectionCard>

      {/* Web Vitals */}
      <div style={ps.grid3}>
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={s.kpiCard}>
                <Skeleton height={12} width={112} />
                <div style={{ marginTop: 8 }}><Skeleton height={40} width={80} /></div>
                <div style={{ marginTop: 8 }}><Skeleton height={12} width={64} /></div>
              </div>
            ))
          : data?.webVitals
            ? [
                {
                  desc: 'Largest Contentful Paint',
                  val: `${(data.webVitals.lcpMs / 1000).toFixed(1)}s`,
                  target: '<2.5s',
                  ok: data.webVitals.lcpMs <= 2500,
                },
                {
                  desc: 'Interaction to Next Paint',
                  val: `${data.webVitals.inpMs}ms`,
                  target: '<200ms',
                  ok: data.webVitals.inpMs <= 200,
                },
                {
                  desc: 'Cumulative Layout Shift',
                  val: data.webVitals.cls.toFixed(2),
                  target: '<0.1',
                  ok: data.webVitals.cls <= 0.1,
                },
              ].map((v) => (
                <div key={v.desc} style={s.kpiCard}>
                  <div style={s.kpiLabel}>{v.desc}</div>
                  <div
                    style={{
                      fontSize: 36,
                      fontWeight: 600,
                      lineHeight: 1,
                      marginBottom: 8,
                      color: v.ok ? 'var(--accent)' : 'var(--error)',
                    }}
                  >
                    {v.val}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Ziel: {v.target}</div>
                </div>
              ))
            : (
              <div style={{ gridColumn: 'span 3', ...s.kpiCard }}>
                <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Noch keine Web-Vitals-Daten vorhanden.</p>
              </div>
            )}
      </div>

      {/* API Latency */}
      <SectionCard title="API Latenz pro Modell (ms)">
        {loading ? (
          <Skeleton height={208} />
        ) : (
          <BarChart
            className="h-52 mt-2"
            data={data?.latencyByModel ?? []}
            index="model"
            categories={['p50', 'p95']}
            colors={['emerald', 'blue']}
            yAxisWidth={48}
            showLegend
          />
        )}
      </SectionCard>

      {/* LangSmith */}
      {(loading || data?.langsmith) && (
        <SectionCard title="LangSmith -- LLM-Observability (letzte 7 Tage)">
          {loading ? (
            <div style={ps.grid5}>
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={64} />)}
            </div>
          ) : data?.langsmith ? (
            <div style={ps.grid5}>
              {[
                { label: 'LLM Runs', value: data.langsmith.totalRuns.toLocaleString('de-DE'), sub: '7 Tage' },
                { label: 'p50 Latenz', value: `${data.langsmith.p50LatencyMs}ms`, sub: 'Median' },
                { label: 'p95 Latenz', value: `${data.langsmith.p95LatencyMs}ms`, sub: '95. Perzentil' },
                { label: 'Tokens gesamt', value: data.langsmith.totalTokens.toLocaleString('de-DE'), sub: 'Input + Output' },
                { label: 'Avg. Tokens/Run', value: data.langsmith.avgTokensPerRun.toLocaleString('de-DE'), sub: 'Durchschnitt' },
              ].map((item) => (
                <div key={item.label}>
                  <div style={s.kpiLabel}>{item.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--text-primary)' }}>{item.value}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{item.sub}</div>
                </div>
              ))}
            </div>
          ) : null}
        </SectionCard>
      )}
    </div>
  )
}
