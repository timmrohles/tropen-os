'use client'

import { TrendUp, TrendDown, Minus } from '@phosphor-icons/react'

type Status = 'production_grade' | 'stable' | 'risky' | 'prototype'

interface ScoreHeroProps {
  percentage: number
  status: Status
  delta: number | null
  lastRunAt: string
  projectName: string
  reviewType?: string | null
  reviewCostEur?: number | null
}

const STATUS_LABEL: Record<Status, string> = {
  production_grade: 'Production Grade',
  stable: 'Stable',
  risky: 'Risky',
  prototype: 'Prototype',
}

const STATUS_COLOR: Record<Status, string> = {
  production_grade: 'var(--status-production)',
  stable: 'var(--status-stable)',
  risky: 'var(--status-risky)',
  prototype: 'var(--status-prototype)',
}

const STATUS_BG: Record<Status, string> = {
  production_grade: 'var(--status-production-bg)',
  stable: 'var(--status-stable-bg)',
  risky: 'var(--status-risky-bg)',
  prototype: 'var(--status-prototype-bg)',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function ScoreHero({ percentage, status, delta, lastRunAt, projectName, reviewType, reviewCostEur }: ScoreHeroProps) {
  const color = STATUS_COLOR[status]
  const bg = STATUS_BG[status]
  const hasDelta = delta !== null && delta !== 0

  return (
    <div className="card" style={{ padding: '28px 32px', marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>

        {/* Score circle */}
        <div style={{
          width: 110, height: 110, borderRadius: '50%',
          border: `4px solid ${color}`,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          background: bg,
        }}>
          <span style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1 }}>
            {percentage.toFixed(1)}
          </span>
          <span style={{ fontSize: 11, color, fontWeight: 600, marginTop: 2 }}>%</span>
        </div>

        {/* Meta */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '3px 10px', borderRadius: 20,
              background: bg, color,
              fontSize: 12, fontWeight: 700, letterSpacing: '0.03em',
            }}>
              {STATUS_LABEL[status]}
            </span>

            {hasDelta && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 3,
                fontSize: 13, fontWeight: 600,
                color: delta > 0 ? 'var(--accent)' : 'var(--error)',
              }}>
                {delta > 0
                  ? <TrendUp size={14} weight="bold" aria-hidden="true" />
                  : <TrendDown size={14} weight="bold" aria-hidden="true" />}
                {delta > 0 ? '+' : ''}{delta.toFixed(1)}%
              </span>
            )}
            {!hasDelta && delta !== null && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 13, color: 'var(--text-tertiary)' }}>
                <Minus size={14} weight="bold" aria-hidden="true" />
                Keine Änderung
              </span>
            )}
          </div>

          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4 }}>
            {projectName}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
            Letzter Run: {formatDate(lastRunAt)}
          </div>
          {reviewType === 'multi_model' && (
            <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
                background: 'color-mix(in srgb, var(--accent) 15%, transparent)',
                color: 'var(--accent)', letterSpacing: '0.03em',
              }}>
                Deep Review
              </span>
              {reviewCostEur != null && (
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                  €{reviewCostEur.toFixed(3)}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div style={{ width: '100%', flexBasis: '100%' }}>
          <div style={{
            height: 8, borderRadius: 4,
            background: 'var(--border)',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${Math.min(100, percentage)}%`,
              background: color,
              borderRadius: 4,
              transition: 'width 0.6s ease',
            }} />
          </div>
          {/* Threshold markers */}
          <div style={{ position: 'relative', height: 14 }}>
            {[50, 70, 85].map((thresh) => (
              <span key={thresh} style={{
                position: 'absolute', left: `${thresh}%`,
                fontSize: 10, color: 'var(--text-tertiary)',
                transform: 'translateX(-50%)',
              }}>
                {thresh}%
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
