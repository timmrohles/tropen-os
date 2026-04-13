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
  openFindings?: number
  highOpenFindings?: number
  criticalOpenFindings?: number
  isFirstRun?: boolean
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

const THRESHOLDS = [
  { pct: 60, label: 'Risky' },
  { pct: 80, label: 'Stable' },
  { pct: 90, label: 'Prod. Grade' },
]

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function getStatusExplanation(
  percentage: number,
  status: Status,
  open: number,
  high: number,
  critical: number,
): { text: string; nextStep: string; nextHref: string } {
  if (status === 'production_grade') {
    return {
      text: 'Dein Projekt erfüllt Industriestandards. Regelmäßige Audits halten das Niveau.',
      nextStep: open > 0 ? `${open} offene Findings — prüfe ob sie noch relevant sind.` : 'Keine offenen Findings. Weiter so!',
      nextHref: '#findings-table',
    }
  }
  if (status === 'stable') {
    const gap = (90 - percentage).toFixed(1)
    return {
      text: `Solide und produktionsfähig. Noch ${gap}% bis Production Grade.`,
      nextStep: open > 0 ? `${open} offene Findings prüfen.` : 'Keine offenen Findings — starte einen Deep Review.',
      nextHref: '#findings-table',
    }
  }
  if (status === 'risky') {
    const target = percentage < 80 ? 80 : 90
    const targetLabel = percentage < 80 ? 'Stable' : 'Production Grade'
    const gap = (target - percentage).toFixed(1)
    return {
      text: `Noch ${gap}% bis ${targetLabel}. Offene Punkte in kritischen Bereichen bremsen den Score.`,
      nextStep: critical > 0
        ? `${critical} kritische Findings zuerst beheben.`
        : high > 0
          ? `${high} High-Findings angehen — sie haben den größten Score-Impact.`
          : `${open} offene Findings prüfen.`,
      nextHref: '#findings-table',
    }
  }
  return {
    text: 'Dein Projekt braucht grundlegende Verbesserungen bevor es produktionsreif ist.',
    nextStep: critical > 0 ? `Mit ${critical} kritischen Findings starten.` : 'Mit den rot markierten Kategorien starten.',
    nextHref: '#findings-table',
  }
}

export default function ScoreHero({
  percentage, status, delta, lastRunAt, projectName,
  reviewType, reviewCostEur,
  openFindings = 0, highOpenFindings = 0, criticalOpenFindings = 0,
  isFirstRun = false,
}: ScoreHeroProps) {
  const color = STATUS_COLOR[status]
  const bg = STATUS_BG[status]
  const hasDelta = delta !== null && delta !== 0
  const explanation = getStatusExplanation(percentage, status, openFindings, highOpenFindings, criticalOpenFindings)

  return (
    <>
      {isFirstRun && (
        <div style={{
          padding: '12px 16px', marginBottom: 16,
          borderRadius: 6, background: 'var(--accent-light)',
          borderLeft: '3px solid var(--accent)',
        }}>
          <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 2, color: 'var(--text-primary)' }}>
            Dein erster Audit ist fertig!
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
            Der Score basiert auf automatischen Checks. Für eine tiefere Analyse klicke auf &bdquo;Deep Review&ldquo; —
            4 KI-Modelle prüfen deinen Code unabhängig.
          </p>
        </div>
      )}

      <div style={{ marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid var(--border)' }}>
        {/* Row 1: score + status inline + delta + meta */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
          <span style={{ fontSize: 42, fontWeight: 800, color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
            {percentage.toFixed(1)}%
          </span>

          <span style={{ fontSize: 15, fontWeight: 600, color }}>
            {STATUS_LABEL[status]}
          </span>

          {hasDelta && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              fontSize: 13, fontWeight: 500,
              color: delta! > 0 ? 'var(--accent)' : 'var(--error)',
            }}>
              {delta! > 0
                ? <TrendUp size={13} weight="bold" aria-hidden="true" />
                : <TrendDown size={13} weight="bold" aria-hidden="true" />}
              {delta! > 0 ? '+' : ''}{delta!.toFixed(1)}%
            </span>
          )}
          {!hasDelta && delta !== null && (
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
              — keine Änderung
            </span>
          )}

          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-tertiary)' }}>
            {projectName} · {formatDate(lastRunAt)}
          </span>

          {reviewType === 'multi_model' && (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 3,
              background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
              color: 'var(--accent)', letterSpacing: '0.03em',
            }}>
              Deep{reviewCostEur != null ? ` · €${reviewCostEur.toFixed(3)}` : ''}
            </span>
          )}
        </div>

        {/* Progress bar — thin (4px) */}
        <div style={{ height: 4, borderRadius: 2, background: 'var(--border)', overflow: 'hidden', marginBottom: 6 }}>
          <div style={{
            height: '100%',
            width: `${Math.min(100, percentage)}%`,
            background: color,
            borderRadius: 2,
            transition: 'width 0.6s ease',
          }} />
        </div>
        <div style={{ position: 'relative', height: 18, marginBottom: 10 }}>
          {THRESHOLDS.map(({ pct, label }) => (
            <span key={pct} style={{
              position: 'absolute', left: `${pct}%`,
              fontSize: 10, color: 'var(--text-tertiary)',
              transform: 'translateX(-50%)',
              top: 1, textAlign: 'center', lineHeight: 1.4,
              whiteSpace: 'nowrap',
            }}>
              {pct}% {label}
            </span>
          ))}
        </div>

        {/* Explanation + next step */}
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
          {explanation.text}
        </p>
        {openFindings > 0 && (
          <p style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, margin: '3px 0 0' }}>
            Nächster Schritt:{' '}
            <a href={explanation.nextHref} style={{ color: 'var(--accent)', textDecoration: 'none' }}>
              {explanation.nextStep} →
            </a>
          </p>
        )}
      </div>
    </>
  )
}
