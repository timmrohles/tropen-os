'use client'

import { AreaChart, Badge, BarChart } from '@tremor/react'
import type { OverviewResponse } from '@/types/qa'
import { SectionCard, KpiCard, Skeleton, s } from './QaShared'

const ps: Record<string, React.CSSProperties> = {
  grid4: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 },
  grid2: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 },
  stack: { display: 'flex', flexDirection: 'column', gap: 12 },
  compItem: { display: 'flex', alignItems: 'center', gap: 8 },
}

export function OverviewPanel({ data, loading }: { data: OverviewResponse | null; loading: boolean }) {
  const pass = data?.complianceSnapshot.filter(c => c.status === 'pass').length ?? 0
  const total = data?.complianceSnapshot.length ?? 0

  return (
    <div style={ps.stack}>
      <div style={ps.grid4}>
        <KpiCard
          label="Avg. Output Quality"
          value={data ? `${data.kpis.avgQualityScore}%` : '--'}
          sub="alle Modelle, diese Woche"
          loading={loading}
        />
        <KpiCard
          label="Routing Accuracy"
          value={data ? `${data.kpis.routingAccuracy}%` : '--'}
          sub="korrekte Modellwahl"
          loading={loading}
        />
        <KpiCard
          label="Avg. Latenz (p50)"
          value={data ? `${data.kpis.avgLatencyP50}ms` : '--'}
          sub="End-to-End inkl. Routing"
          valueColor="var(--warning)"
          loading={loading}
        />
        <KpiCard
          label="Error Rate"
          value={data ? `${data.kpis.errorRate}%` : '--'}
          sub="letzte 7 Tage"
          valueColor={data && data.kpis.errorRate > 5 ? 'var(--error)' : 'var(--accent)'}
          loading={loading}
        />
      </div>

      <div style={ps.grid2}>
        <SectionCard title="Output Quality -- Verlauf">
          {loading ? (
            <Skeleton height={176} />
          ) : (
            <AreaChart
              className="h-44"
              data={data?.qualityTrend ?? []}
              index="week"
              categories={['claude-sonnet-4', 'gpt-4o', 'gemini-1.5-pro', 'mistral-large']}
              colors={['emerald', 'blue', 'yellow', 'violet']}
              yAxisWidth={32}
              minValue={75}
              showLegend={false}
              showGradient={false}
            />
          )}
        </SectionCard>

        <SectionCard
          title="Error Rate -- letzte 7 Tage"
          action={
            data && !loading ? (
              <Badge color={data.kpis.errorRate <= 2 ? 'emerald' : data.kpis.errorRate <= 5 ? 'yellow' : 'red'}>
                {data.kpis.errorRate <= 2 ? 'Normal' : data.kpis.errorRate <= 5 ? 'Erhoht' : 'Kritisch'}
              </Badge>
            ) : null
          }
        >
          {loading ? (
            <Skeleton height={176} />
          ) : (
            <BarChart
              className="h-44"
              data={data?.errorRateWeek ?? []}
              index="day"
              categories={['Error Rate']}
              colors={['emerald']}
              yAxisWidth={32}
              showLegend={false}
            />
          )}
        </SectionCard>
      </div>

      <SectionCard
        title="EU AI Act -- Schnellstatus"
        action={
          !loading && data ? (
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{pass}/{total} bestanden</span>
          ) : null
        }
      >
        {loading ? (
          <div style={ps.grid4}>
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} height={20} width={96} />
            ))}
          </div>
        ) : (
          <div style={ps.grid4}>
            {(data?.complianceSnapshot ?? []).map((c) => (
              <div key={c.article} style={ps.compItem}>
                <span
                  style={{
                    color:
                      c.status === 'pass'
                        ? 'var(--accent)'
                        : c.status === 'warn'
                          ? 'var(--warning)'
                          : 'var(--error)',
                  }}
                >
                  {c.status === 'pass' ? '+' : c.status === 'warn' ? 'o' : 'x'}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color: c.status === 'pass' ? 'var(--text-secondary)' : 'var(--text-primary)',
                  }}
                >
                  {c.article}
                </span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  )
}
