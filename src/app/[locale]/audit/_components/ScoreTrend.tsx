'use client'

import { useState, useEffect } from 'react'
import { AreaChart } from '@tremor/react'

interface RunSummary {
  id: string
  percentage: number
  status: string
  created_at: string
}

interface ScoreTrendProps {
  runs: RunSummary[]
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
}

export default function ScoreTrend({ runs }: ScoreTrendProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  if (runs.length < 2) {
    return (
      <div className="card" style={{ padding: '20px 24px', marginBottom: 24 }}>
        <div className="card-header" style={{ marginBottom: 12 }}>
          <span className="card-header-label">Score-Verlauf</span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center', padding: '24px 0' }}>
          Mindestens 2 Audit-Runs erforderlich für den Trend.
        </p>
      </div>
    )
  }

  const chartData = [...runs]
    .reverse()
    .map((r) => ({
      Datum: formatDate(r.created_at),
      'Score %': parseFloat(r.percentage.toFixed(1)),
    }))

  return (
    <div className="card" style={{ padding: '20px 24px', marginBottom: 24 }}>
      <div className="card-header" style={{ marginBottom: 16 }}>
        <span className="card-header-label">Score-Verlauf</span>
        <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
          {runs.length} Runs
        </span>
      </div>

      {mounted ? (
        <AreaChart
          data={chartData}
          index="Datum"
          categories={['Score %']}
          colors={['green']}
          valueFormatter={(v) => `${v.toFixed(1)}%`}
          showAnimation
          showLegend={false}
          minValue={0}
          maxValue={100}
          className="h-36"
        />
      ) : (
        <div className="h-36" />
      )}

      {/* Reference lines legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
        {[
          { label: '85% Production Grade', color: 'var(--status-production)' },
          { label: '70% Stable', color: 'var(--status-stable)' },
          { label: '50% Risky', color: 'var(--status-risky)' },
        ].map(({ label, color }) => (
          <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-tertiary)' }}>
            <span style={{ width: 12, height: 2, background: color, display: 'inline-block', borderRadius: 1 }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
