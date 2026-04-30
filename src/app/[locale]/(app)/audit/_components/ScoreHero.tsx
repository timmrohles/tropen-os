'use client'

import { useState, useRef, useEffect } from 'react'
import { TrendUp, TrendDown, Info, X } from '@phosphor-icons/react'
import { useTranslations } from 'next-intl'

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
  /** True when the scan is code-only and has no live DB access */
  codeOnlyMode?: boolean
  /** Whether a Schema Drift Check finding is present in the report */
  hasSchemaDriftFinding?: boolean
  /** False when no Lighthouse findings were found in this run — indicates partial measurement */
  hasExternalTools?: boolean
}

function ExternalToolsGapBadge({ t }: { t: ReturnType<typeof useTranslations<'audit'>> }) {
  const [tooltipVisible, setTooltipVisible] = useState(false)

  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 8 }}>
      <span style={{
        fontSize: 11, fontWeight: 500,
        color: 'var(--text-tertiary)',
        letterSpacing: '0.01em',
      }}>
        {t('partialScore')}
      </span>
      <button
        onMouseEnter={() => setTooltipVisible(true)}
        onMouseLeave={() => setTooltipVisible(false)}
        onFocus={() => setTooltipVisible(true)}
        onBlur={() => setTooltipVisible(false)}
        aria-label={t('partialScoreAriaLabel')}
        style={{
          background: 'none', border: 'none', cursor: 'help', padding: 0,
          color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center',
        }}
      >
        <Info size={13} weight="bold" aria-hidden="true" />
      </button>

      {tooltipVisible && (
        <div role="tooltip" style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          zIndex: 30,
          width: 300,
          padding: '10px 12px',
          background: 'var(--bg-tooltip)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(26,23,20,0.10)',
          fontSize: 12,
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
          pointerEvents: 'none',
        }}>
          <p style={{ margin: '0 0 6px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {t('partialScoreTooltipTitle')}
          </p>
          <p style={{ margin: 0 }}>
            {t('partialScoreTooltipBody')}
          </p>
        </div>
      )}
    </span>
  )
}

function RuntimeGapBadge({ hasSchemaDriftFinding }: { hasSchemaDriftFinding: boolean }) {
  const [tooltipVisible, setTooltipVisible] = useState(false)

  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <span style={{
        fontSize: 11, fontWeight: 500,
        color: 'var(--text-tertiary)',
        letterSpacing: '0.01em',
      }}>
        Nur Code-Analyse
      </span>
      <button
        onMouseEnter={() => setTooltipVisible(true)}
        onMouseLeave={() => setTooltipVisible(false)}
        onFocus={() => setTooltipVisible(true)}
        onBlur={() => setTooltipVisible(false)}
        aria-label="Erklärung: Nur Code-Analyse"
        style={{
          background: 'none', border: 'none', cursor: 'help', padding: 0,
          color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center',
        }}
      >
        <Info size={13} weight="bold" aria-hidden="true" />
      </button>

      {tooltipVisible && (
        <div role="tooltip" style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          zIndex: 30,
          width: 280,
          padding: '10px 12px',
          background: 'var(--bg-tooltip)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(26,23,20,0.10)',
          fontSize: 12,
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
          pointerEvents: 'none',
        }}>
          <p style={{ margin: '0 0 6px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Code-Only Scan aktiv
          </p>
          <p style={{ margin: 0 }}>
            Dieser Score basiert auf der Analyse deines Quellcodes. Änderungen die direkt
            in deinem Datenbank-Dashboard gemacht wurden (RLS-Policies, Indexes, Permissions)
            sind nicht erfasst.
          </p>
          {hasSchemaDriftFinding && (
            <p style={{ margin: '6px 0 0', color: 'var(--accent)' }}>
              <a href="#findings-table" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
                → Schema Drift Check ausführen
              </a>
            </p>
          )}
        </div>
      )}
    </span>
  )
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

// STATUS_BG kept for future use
// const STATUS_BG: Record<Status, string> = { ... }

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

function ScoreExplainPopover({ t }: { t: ReturnType<typeof useTranslations<'audit'>> }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function handleKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => { document.removeEventListener('mousedown', handleClick); document.removeEventListener('keydown', handleKey) }
  }, [open])

  return (
    <span ref={ref} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <button onClick={() => setOpen(v => !v)} style={{
        background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 0 4px',
        color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center',
      }} aria-label={t('scoreExplainTitle')}>
        <Info size={16} weight="bold" />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 30,
          width: 300, padding: '14px 16px', background: 'var(--bg-surface-solid)',
          border: '1px solid var(--border)', borderRadius: 8,
          boxShadow: '0 4px 12px rgba(26,23,20,0.10)', fontSize: 13, lineHeight: 1.6,
        }}>
          <p style={{ fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 8px' }}>
            {t('scoreExplainTitle')}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 10 }}>
            <span style={{ color: 'var(--status-prototype)' }}>{t('scoreExplainPrototype')}</span>
            <span style={{ color: 'var(--status-risky)' }}>{t('scoreExplainRisky')}</span>
            <span style={{ color: 'var(--status-stable)' }}>{t('scoreExplainStable')}</span>
            <span style={{ color: 'var(--status-production)' }}>{t('scoreExplainProduction')}</span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: 0 }}>
            {t('scoreExplainBody')}
          </p>
        </div>
      )}
    </span>
  )
}

export default function ScoreHero({
  percentage, status, delta, lastRunAt, projectName,
  reviewType, reviewCostEur,
  openFindings: _openFindings = 0, highOpenFindings: _highOpenFindings = 0, criticalOpenFindings: _criticalOpenFindings = 0,
  isFirstRun = false,
  codeOnlyMode: _codeOnlyMode = true,
  hasSchemaDriftFinding = false,
  hasExternalTools,
}: ScoreHeroProps) {
  const t = useTranslations('audit')
  const [onboardingDismissed, setOnboardingDismissed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      if (localStorage.getItem('audit-onboarding-dismissed') === 'true') setOnboardingDismissed(true)
    } catch { /* localStorage unavailable in private mode */ }
  }, [])

  function dismissOnboarding() {
    setOnboardingDismissed(true)
    try { localStorage.setItem('audit-onboarding-dismissed', 'true') } catch { /* ignore */ }
  }

  const color = STATUS_COLOR[status]
  const hasDelta = delta !== null && delta !== 0

  return (
    <>
      {isFirstRun && !onboardingDismissed && (
        <div style={{
          padding: '16px 20px', marginBottom: 16, borderRadius: 8,
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          position: 'relative',
        }}>
          <button onClick={dismissOnboarding} style={{
            position: 'absolute', top: 8, right: 8, background: 'none', border: 'none',
            cursor: 'pointer', color: 'var(--text-tertiary)', padding: 4,
          }} aria-label="Close">
            <X size={14} weight="bold" />
          </button>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 8px' }}>
            {t('onboardingTitle')}
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 12px', lineHeight: 1.5 }}>
            {t('onboardingScore', { score: Math.round(percentage) })}
          </p>
          <ol style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            <li>{t('onboardingStep1')}</li>
            <li>{t('onboardingStep2')}</li>
            <li>{t('onboardingStep3')}</li>
          </ol>
          <button className="btn btn-ghost btn-sm" onClick={dismissOnboarding} style={{ marginTop: 12, fontSize: 12 }}>
            {t('onboardingDismiss')}
          </button>
        </div>
      )}

      <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
        {/* Row 1: score + status inline + delta + meta */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
          <span style={{ fontSize: 42, fontWeight: 800, color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
            {percentage.toFixed(1)}%
          </span>
          <ScoreExplainPopover t={t} />

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
              {delta! > 0
                ? t('deltaPositive', { delta: delta!.toFixed(1) })
                : t('deltaNegative', { delta: delta!.toFixed(1) })}
            </span>
          )}
          {!hasDelta && delta !== null && (
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
              — keine Änderung
            </span>
          )}

          <span suppressHydrationWarning style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-tertiary)' }}>
            {projectName} · {formatDate(lastRunAt)}
          </span>

          {reviewType === 'multi_model' && (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 3,
              background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
              color: 'var(--accent)', letterSpacing: '0.03em',
            }}>
              Deep{reviewCostEur == null ? '' : ` · €${reviewCostEur.toFixed(3)}`}
            </span>
          )}
        </div>

        {/* Coach-Kommentar — kurze Einschätzung zur aktuellen Status-Lage */}
        {!isFirstRun && (
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.5 }}>
            {t(
              status === 'production_grade' ? 'scoreComment_production'
              : status === 'stable' ? 'scoreComment_stable'
              : status === 'risky' ? 'scoreComment_risky'
              : 'scoreComment_prototype'
            )}
          </p>
        )}

        {/* Runtime Gap Badge */}
        <div style={{ marginBottom: 8 }}>
          <RuntimeGapBadge hasSchemaDriftFinding={hasSchemaDriftFinding} />
          {mounted && !hasExternalTools && <ExternalToolsGapBadge t={t} />}
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

      </div>
    </>
  )
}
