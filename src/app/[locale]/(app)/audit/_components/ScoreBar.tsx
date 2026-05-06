'use client'

import { useTranslations } from 'next-intl'
import { TrendUp, TrendDown, Checks, ArrowRight } from '@phosphor-icons/react'
import { AppSection } from '@/components/app-ui/AppSection'
import { KillerStatusBadge } from '@/components/audit/KillerStatusBadge'

const POLISH_THRESHOLD = 70

// DSGVO question keys (Sprint 9c)
const DSGVO_KEYS = ['has_avv_supabase', 'has_avv_vercel', 'has_privacy_policy', 'data_location', 'has_deletion_process']
// KI-Act question keys (Sprint 9c)
const KI_ACT_KEYS = ['ki_risk_class', 'ki_transparency_label', 'ki_logging_enabled', 'ki_purpose_documented']

type Status = 'production_grade' | 'stable' | 'risky' | 'prototype'

const STATUS_COLOR: Record<Status, string> = {
  production_grade: 'var(--teal)',
  stable:           'var(--teal)',
  risky:            'var(--status-risky)',
  prototype:        'var(--error)',
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `vor ${mins}m`
  const hrs = Math.floor(diff / 3600000)
  if (hrs < 24) return `vor ${hrs}h`
  return `vor ${Math.floor(hrs / 24)}d`
}

function getCoachSubtext(killerCount: number, polishScore: number): string {
  if (killerCount > 0) {
    return killerCount === 1
      ? '1 Stopper blockiert Veröffentlichung'
      : `${killerCount} Stopper blockieren Veröffentlichung`
  }
  if (polishScore < POLISH_THRESHOLD) {
    return 'Keine Stopper, aber viel Polish offen — anschauen lohnt sich'
  }
  return 'Keine Stopper gefunden — Polish-Empfehlungen unten'
}

interface ScoreBarProps {
  percentage: number
  status: Status
  delta: number | null
  lastRunAt: string
  projectName: string
  isFirstRun?: boolean
  hasExternalTools?: boolean
  isMultiModelReview?: boolean
  killerCount?: number
  // Mini-Status-Daten (Sprint 9-Polish-3)
  complianceData?: Record<string, unknown>
  lighthouseUrl?: string | null
  hasProject?: boolean
}

export default function ScoreBar({
  percentage, status, delta, lastRunAt, projectName, isFirstRun, hasExternalTools,
  isMultiModelReview, killerCount = 0,
  complianceData, lighthouseUrl, hasProject,
}: ScoreBarProps) {
  const t = useTranslations('audit')
  const polishColor = STATUS_COLOR[status]
  const hasDelta = delta !== null && delta !== 0
  const isBlocked = killerCount > 0
  const coachSubtext = getCoachSubtext(killerCount, percentage)

  // Compliance-Counts für Mini-Status
  const dsgvoAnswered = complianceData
    ? DSGVO_KEYS.filter(k => complianceData[k] !== undefined && complianceData[k] !== null).length
    : 0
  const kiActAnswered = complianceData
    ? KI_ACT_KEYS.filter(k => complianceData[k] !== undefined && complianceData[k] !== null).length
    : 0
  const lighthouseSet = !!(lighthouseUrl?.trim())

  const showMiniStatus = hasProject && complianceData !== undefined

  return (
    <AppSection
      header="Veröffentlichungs-Check"
      headerRight={
        <span style={{ color: '#ffffff', fontSize: 11 }}>
          {projectName} · {formatRelative(lastRunAt)}
        </span>
      }
      dark
      style={{ marginBottom: 0, borderRadius: 8 }}
      headerStyle={{ background: 'var(--section-header-dark)', color: '#ffffff' }}
      bodyStyle={{ background: '#ffffff' }}
    >
      <div style={{ padding: '20px 24px' }}>
        {/* ── 60/40 Layout ─────────────────────────────────────────────────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: showMiniStatus ? '1fr auto' : '1fr',
          gap: 24,
          alignItems: 'start',
          marginBottom: 12,
        }}>

          {/* LINKS: Killer-Badge + Coach-Subtext + Polish-Score ─────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <KillerStatusBadge count={killerCount} polishScore={percentage} variant="full" />
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', lineHeight: 1.4 }}>
              {coachSubtext}
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700,
                color: 'var(--text-primary)', lineHeight: 1,
              }}>
                {percentage.toFixed(1)}%
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                Polish
              </span>
              {hasDelta && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 2,
                  fontSize: 11, fontWeight: 500,
                  color: delta! > 0 ? 'var(--teal)' : 'var(--error)',
                  fontFamily: 'var(--font-mono)',
                }}>
                  {delta! > 0
                    ? <TrendUp size={11} weight="bold" aria-hidden="true" />
                    : <TrendDown size={11} weight="bold" aria-hidden="true" />}
                  {delta! > 0 ? '+' : ''}{delta!.toFixed(1)}%
                </span>
              )}
              {isMultiModelReview && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 600,
                  color: 'var(--teal)', background: 'var(--teal-light)', padding: '2px 8px', borderRadius: 4,
                }}>
                  <Checks size={11} weight="bold" aria-hidden="true" />
                  4 Modelle
                </span>
              )}
            </div>
          </div>

          {/* RECHTS: Mini-Status "Was wir von dir brauchen" ──────────────── */}
          {showMiniStatus && (
            <div style={{ minWidth: 200 }}>
              <p style={{
                fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)',
                letterSpacing: '0.04em', color: 'var(--text-tertiary)',
                textTransform: 'uppercase', marginBottom: 8,
              }}>
                Was wir von dir brauchen
              </p>
              <MiniStatusList
                dsgvoAnswered={dsgvoAnswered}
                kiActAnswered={kiActAnswered}
                lighthouseSet={lighthouseSet}
              />
            </div>
          )}
        </div>

        {/* ── Coach-Nachrichten ──────────────────────────────────────────── */}
        {isFirstRun && (
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: 0, lineHeight: 1.5 }}>
            {t('deltaFirst')}
          </p>
        )}
        {!isFirstRun && !isBlocked && (
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: 0, lineHeight: 1.5 }}>
            {t('scoreComment_stable')}
          </p>
        )}
        {!isFirstRun && isBlocked && (
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: 0, lineHeight: 1.5 }}>
            {killerCount === 1
              ? 'Behebe den einen Stopper unten — danach ist deine App veröffentlichbar.'
              : `Behebe die ${killerCount} Stopper unten — dann ist deine App bereit.`}
          </p>
        )}

        {/* ── Ohne Lighthouse-Hinweis ─────────────────────────────────────── */}
        {!hasExternalTools && (
          <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: '8px 0 0', lineHeight: 1.4 }}>
            ohne Lighthouse · Wir prüfen was wir im Code sehen — keine Live-Performance-Messung.
          </p>
        )}
      </div>
    </AppSection>
  )
}

// ── MiniStatusList ─────────────────────────────────────────────────────────────

function MiniStatusList({
  dsgvoAnswered, kiActAnswered, lighthouseSet,
}: {
  dsgvoAnswered: number
  kiActAnswered: number
  lighthouseSet: boolean
}) {
  const rows: Array<{ id: string; label: string; status: string; done: boolean }> = [
    { id: 'dsgvo-stamm-daten', label: 'DSGVO', status: `${dsgvoAnswered}/5 beantwortet`, done: dsgvoAnswered === 5 },
    { id: 'eu-ai-act', label: 'EU AI Act', status: `${kiActAnswered}/4 beantwortet`, done: kiActAnswered === 4 },
    { id: 'lighthouse-url', label: 'Lighthouse-URL', status: lighthouseSet ? 'gesetzt ✓' : 'noch keine URL', done: lighthouseSet },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {rows.map((row, i) => (
        <a
          key={row.id}
          href={`#${row.id}`}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 0',
            borderTop: i > 0 ? '1px solid var(--border)' : 'none',
            textDecoration: 'none',
            color: 'inherit',
          }}
        >
          <span aria-hidden="true" style={{ fontSize: 11, flexShrink: 0 }}>📋</span>
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', flex: 1 }}>
            {row.label}
          </span>
          <span style={{
            fontSize: 11, color: row.done ? 'var(--teal)' : 'var(--text-tertiary)',
            fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap',
          }}>
            {row.status}
          </span>
          <ArrowRight size={11} color="var(--text-tertiary)" weight="bold" aria-hidden="true" />
        </a>
      ))}
    </div>
  )
}
