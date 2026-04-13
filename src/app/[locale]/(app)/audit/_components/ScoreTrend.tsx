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
      <div style={{ marginBottom: 24 }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid var(--border)',
        }}>
          <span style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
            color: 'var(--text-tertiary)',
          }}>
            Score-Verlauf
          </span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', padding: '20px 0' }}>
          Mindestens 2 Runs für den Trend erforderlich.
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
    <div style={{ marginBottom: 24 }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid var(--border)',
      }}>
        <span style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
          color: 'var(--text-tertiary)',
        }}>
          Score-Verlauf
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
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
          className="h-32"
        />
      ) : (
        <div className="h-32" />
      )}

      {/* Threshold legend */}
      <div style={{ display: 'flex', gap: 14, marginTop: 6, flexWrap: 'wrap' }}>
        {[
          { label: '90% Prod', color: 'var(--status-production)' },
          { label: '80% Stable', color: 'var(--status-stable)' },
          { label: '60% Risky', color: 'var(--status-risky)' },
        ].map(({ label, color }) => (
          <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text-tertiary)' }}>
            <span style={{ width: 10, height: 2, background: color, display: 'inline-block', borderRadius: 1 }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
