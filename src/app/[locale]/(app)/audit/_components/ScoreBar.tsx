'use client'

import { useTranslations } from 'next-intl'
import { TrendUp, TrendDown, Checks } from '@phosphor-icons/react'
import { AppSection } from '@/components/app-ui/AppSection'

type Status = 'production_grade' | 'stable' | 'risky' | 'prototype'

const STATUS_LABEL: Record<Status, string> = {
  production_grade: 'Production Grade',
  stable: 'Stable',
  risky: 'Risky',
  prototype: 'Prototype',
}

const STATUS_COLOR: Record<Status, string> = {
  production_grade: 'var(--status-production)',
  stable: 'var(--status-stable)',
  risky: 'var(--warning)',
  prototype: 'var(--error)',
}

const THRESHOLDS = [
  { pct: 60, label: 'Risky' },
  { pct: 80, label: 'Stable' },
  { pct: 90, label: 'Prod.' },
]

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `vor ${mins}m`
  const hrs = Math.floor(diff / 3600000)
  if (hrs < 24) return `vor ${hrs}h`
  return `vor ${Math.floor(hrs / 24)}d`
}

interface ScoreBarProps {
  percentage: number
  status: Status
  delta: number | null
  lastRunAt: string
  projectName: string
  isFirstRun?: boolean
  hasExternalTools?: boolean
  percentileRank?: number | null
  isMultiModelReview?: boolean
}

export default function ScoreBar({
  percentage, status, delta, lastRunAt, projectName, isFirstRun, hasExternalTools,
  percentileRank, isMultiModelReview,
}: ScoreBarProps) {
  const t = useTranslations('audit')
  const color = STATUS_COLOR[status]
  const hasDelta = delta !== null && delta !== 0

  const coachKey = status === 'production_grade' ? 'scoreComment_production'
    : status === 'stable' ? 'scoreComment_stable'
    : status === 'risky' ? 'scoreComment_risky'
    : 'scoreComment_prototype'

  return (
    <AppSection
      header="Score"
      headerRight={
        <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11 }}>
          {projectName} · {formatRelative(lastRunAt)}
        </span>
      }
      style={{ marginBottom: 0, border: 'none', borderRadius: '4px 4px 0 0' }}
      headerStyle={{ background: '#5c6b78', color: '#ffffff' }}
      bodyStyle={{ background: '#ffffff' }}
    >
      <div style={{ padding: '20px 24px' }}>
        {/* Kompakte Status-Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap', marginBottom: 10 }}>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 700,
            color, lineHeight: 1, marginRight: 12,
          }}>
            {percentage.toFixed(1)}%
          </span>

          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600,
            color: 'var(--text-secondary)', marginRight: 12, letterSpacing: '0.02em',
          }}>
            {STATUS_LABEL[status]}
          </span>

          {hasDelta && (
            <>
              <span style={{ color: 'var(--text-secondary)', marginRight: 12, fontSize: 12 }}>│</span>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 3,
                fontSize: 12, fontWeight: 500, marginRight: 12,
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-mono)',
              }}>
                {delta! > 0
                  ? <TrendUp size={12} weight="bold" aria-hidden="true" />
                  : <TrendDown size={12} weight="bold" aria-hidden="true" />}
                {delta! > 0 ? '+' : ''}{delta!.toFixed(1)}% gegenüber letztem Audit
              </span>
            </>
          )}

          {percentileRank !== null && percentileRank !== undefined && (
            <>
              <span style={{ color: 'var(--text-secondary)', marginRight: 12, fontSize: 12 }}>│</span>
              <span
                title="Vergleich mit 49 öffentlich geprüften Repos"
                style={{
                  fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)',
                  marginRight: 12, cursor: 'help',
                }}
              >
                Top {percentileRank}% aller geprüften Repos
              </span>
            </>
          )}

          {isMultiModelReview && (
            <>
              <span style={{ color: 'var(--border-strong)', marginRight: 12, fontSize: 12 }}>│</span>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: 11, fontFamily: 'var(--font-mono)',
                color: 'var(--accent)', marginRight: 12,
              }}>
                <Checks size={12} weight="bold" aria-hidden="true" />
                4 KI-Modelle geprüft
              </span>
            </>
          )}

          {!hasExternalTools && (
            <>
              <span style={{ color: 'var(--border-strong)', marginRight: 12, fontSize: 12 }}>│</span>
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                {t('partialScore')}
              </span>
            </>
          )}
        </div>

        {/* Progress bar mit Threshold-Markierungen */}
        <div style={{ position: 'relative', marginBottom: 6 }}>
          <div style={{ height: 6, borderRadius: 2, background: 'var(--border)', overflow: 'visible' }}>
            <div style={{
              height: '100%', width: `${Math.min(100, percentage)}%`,
              background: color, borderRadius: 2, transition: 'width 0.5s ease',
            }} />
          </div>
          {THRESHOLDS.map(({ pct, label }) => (
            <div key={pct} style={{ position: 'absolute', left: `${pct}%`, top: 0, transform: 'translateX(-50%)' }}>
              <div style={{ width: 1, height: 6, background: 'var(--border-medium)' }} />
              <span style={{
                position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
                fontSize: 9, color: 'var(--text-tertiary)', whiteSpace: 'nowrap',
                fontFamily: 'var(--font-mono)',
              }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Coach-Kommentar — Plakat-Rest bewusst */}
        {!isFirstRun && (
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 16, lineHeight: 1.5 }}>
            {t(coachKey)}
          </p>
        )}
        {isFirstRun && (
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 16, lineHeight: 1.5 }}>
            {t('deltaFirst')}
          </p>
        )}
      </div>
    </AppSection>
  )
}
