'use client'

// IslandsRow — BP-9-Polish-3-Inseln + Polish-4-Fixes (2026-05-06)
// Drei Insel-Karten oberhalb Findings: Killer-Status / Polish-Score+Trend / Was-wir-brauchen
// Ersetzt ScoreBar. Projektname + Zeit jetzt im SectionLabel oberhalb (nicht in Insel).

import { TrendUp, TrendDown, ArrowRight, Checks, CheckCircle, XCircle, Warning } from '@phosphor-icons/react'

interface ScoreTrend {
  delta: number | null
  direction: 'up' | 'down' | 'stable' | 'first-audit'
  previousScore: number | null
  previousAuditDate: string | null
}

function formatRelativeDate(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `vor ${mins} Min.`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `vor ${hrs} Std.`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'gestern'
  if (days < 7) return `vor ${days} Tagen`
  if (days < 30) return `vor ${Math.floor(days / 7)} Wochen`
  return new Date(isoDate).toLocaleDateString('de-DE')
}

// ── Typen ──────────────────────────────────────────────────────────────────────

const POLISH_THRESHOLD = 70
const DSGVO_KEYS = ['has_avv_supabase', 'has_avv_vercel', 'has_privacy_policy', 'data_location', 'has_deletion_process']
const KI_ACT_KEYS = ['ki_risk_class', 'ki_transparency_label', 'ki_logging_enabled', 'ki_purpose_documented']

function getCoachSubtext(killerCount: number, polishScore: number): string {
  if (killerCount > 0) {
    return killerCount === 1
      ? '1 Stopper blockiert Veröffentlichung — zuerst beheben'
      : `${killerCount} Stopper blockieren Veröffentlichung — zuerst beheben`
  }
  if (polishScore < POLISH_THRESHOLD) {
    return 'Keine Stopper · Polish-Score noch ausbaufähig'
  }
  return 'Keine Stopper gefunden · Polish-Empfehlungen unten'
}

// ── IslandsRow Container ───────────────────────────────────────────────────────

interface IslandsRowProps {
  killerCount: number
  polishScore: number
  trend: ScoreTrend
  complianceData?: Record<string, unknown>
  lighthouseUrl?: string | null
  hasProject?: boolean
  isMultiModelReview?: boolean
}

export function IslandsRow({
  killerCount, polishScore, trend,
  complianceData, lighthouseUrl, hasProject,
  isMultiModelReview,
}: IslandsRowProps) {
  const dsgvoAnswered = complianceData
    ? DSGVO_KEYS.filter(k => complianceData[k] !== undefined && complianceData[k] !== null).length
    : 0
  const kiActAnswered = complianceData
    ? KI_ACT_KEYS.filter(k => complianceData[k] !== undefined && complianceData[k] !== null).length
    : 0
  const lighthouseSet = !!(lighthouseUrl?.trim())

  return (
    <div className="islands-row">
      {/* Insel 1: Veröffentlichungs-Check */}
      <KillerStatusIsland
        killerCount={killerCount}
        polishScore={polishScore}
      />

      {/* Insel 2: Polish-Score + Trend */}
      <PolishScoreIsland
        polishScore={polishScore}
        trend={trend}
        isMultiModelReview={isMultiModelReview}
      />

      {/* Insel 3: Was wir von dir brauchen — immer sichtbar */}
      <SelfInputIsland
        dsgvoAnswered={dsgvoAnswered}
        kiActAnswered={kiActAnswered}
        lighthouseSet={lighthouseSet}
        hasProject={hasProject}
      />
    </div>
  )
}

// ── Insel 1: KillerStatusIsland ───────────────────────────────────────────────

function KillerStatusIsland({ killerCount, polishScore }: {
  killerCount: number
  polishScore: number
}) {
  const coachSubtext = getCoachSubtext(killerCount, polishScore)
  const isBlocked = killerCount > 0
  const hasPolishConcern = !isBlocked && polishScore < POLISH_THRESHOLD

  const { icon, label } = isBlocked
    ? { icon: <XCircle size={28} weight="fill" color="#FF9090" aria-hidden="true" />, label: `${killerCount} Stopper` }
    : hasPolishConcern
      ? { icon: <Warning size={28} weight="fill" color="#FFD070" aria-hidden="true" />, label: 'Polish-Bedarf' }
      : { icon: <CheckCircle size={28} weight="fill" color="#ffffff" aria-hidden="true" />, label: 'Veröffentlichbar' }

  return (
    <article className="island island--centered">
      <p className="island__label">Veröffentlichungs-Check</p>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, paddingTop: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {icon}
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 32, fontWeight: 700, color: '#ffffff', lineHeight: 1 }}>
            {label}
          </span>
        </div>
        <p style={{ fontSize: 12, color: '#ffffff', margin: 'auto 0 0', lineHeight: 1.5, textAlign: 'center' }}>
          {coachSubtext}
        </p>
      </div>
    </article>
  )
}

// ── Insel 2: PolishScoreIsland ────────────────────────────────────────────────

function PolishScoreIsland({ polishScore, trend, isMultiModelReview }: {
  polishScore: number
  trend: ScoreTrend
  isMultiModelReview?: boolean
}) {
  return (
    <article className="island island--centered">
      <p className="island__label">Polish-Score</p>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, paddingTop: 20 }}>
        {/* Score + Delta + Badge — eng beieinander */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 32, fontWeight: 700, color: '#ffffff', lineHeight: 1 }}>
            {polishScore.toFixed(1)}%
          </span>

          {trend.direction !== 'first-audit' && trend.delta !== null && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 600, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
              {trend.delta > 0
                ? <TrendUp size={12} weight="bold" aria-hidden="true" />
                : <TrendDown size={12} weight="bold" aria-hidden="true" />}
              {trend.delta > 0 ? '+' : ''}{trend.delta.toFixed(1)}%
            </span>
          )}

          {isMultiModelReview && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#ffffff', background: 'rgba(0,0,0,0.20)', padding: '2px 7px', borderRadius: 4 }}>
              <Checks size={10} weight="bold" aria-hidden="true" />
              4 Modelle
            </span>
          )}
        </div>

        {/* Trend-Kontext-Text — immer am unteren Rand */}
        {trend.direction === 'first-audit' && (
          <p style={{ fontSize: 12, color: '#ffffff', margin: 'auto 0 0', lineHeight: 1.5, textAlign: 'center' }}>
            Erster Audit — das ist deine Baseline.
          </p>
        )}
        {trend.direction === 'stable' && trend.previousAuditDate && (
          <p style={{ fontSize: 12, color: '#ffffff', margin: 'auto 0 0', lineHeight: 1.5, textAlign: 'center' }}>
            Stabil vs. letzter Audit ({formatRelativeDate(trend.previousAuditDate)})
          </p>
        )}
        {(trend.direction === 'up' || trend.direction === 'down') && trend.previousAuditDate && (
          <p style={{ fontSize: 12, color: '#ffffff', margin: 'auto 0 0', lineHeight: 1.5, textAlign: 'center' }}>
            vs. letzter Audit ({formatRelativeDate(trend.previousAuditDate)})
          </p>
        )}
      </div>
    </article>
  )
}

// ── Insel 3: SelfInputIsland ──────────────────────────────────────────────────

function SelfInputIsland({ dsgvoAnswered, kiActAnswered, lighthouseSet, hasProject }: {
  dsgvoAnswered: number
  kiActAnswered: number
  lighthouseSet: boolean
  hasProject?: boolean
}) {
  const rows: Array<{ id: string; label: string; status: string; done: boolean }> = [
    { id: 'dsgvo-stamm-daten', label: 'DSGVO',      status: `${dsgvoAnswered}/5 beantwortet`, done: dsgvoAnswered === 5 },
    { id: 'eu-ai-act',         label: 'EU AI Act',   status: `${kiActAnswered}/4 beantwortet`, done: kiActAnswered === 4 },
    { id: 'lighthouse-url',    label: 'Lighthouse',  status: lighthouseSet ? 'URL gesetzt' : 'noch keine URL', done: lighthouseSet },
  ]

  return (
    <article className="island">
      <p className="island__label" style={{ alignSelf: 'center' }}>Was wir von dir brauchen</p>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
        {rows.map((row, i) => (
          <a
            key={row.id}
            href={`#${row.id}`}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '7px 0',
              borderTop: i > 0 ? '1px solid rgba(255,255,255,0.15)' : 'none',
              textDecoration: 'none', color: 'inherit',
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 500, color: '#ffffff', flex: 1 }}>
              {row.label}
            </span>
            <span style={{
              fontSize: 11, fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap',
              color: '#ffffff',
            }}>
              {row.status}
            </span>
            <ArrowRight size={11} color="rgba(255,255,255,0.65)" weight="bold" aria-hidden="true" />
          </a>
        ))}
      </div>
      {!hasProject && (
        <p style={{ fontSize: 12, color: '#ffffff', margin: '10px 0 0', lineHeight: 1.4, textAlign: 'center' }}>
          Verbinde ein externes Projekt, um Antworten zu speichern.
        </p>
      )}
    </article>
  )
}
