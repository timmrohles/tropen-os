'use client'

import { Warning, CheckCircle, Clock, Info } from '@phosphor-icons/react'
import type { PreflightResult } from '@/lib/preflight/types'
import { GapsSection } from './GapCard'
import { ArtifactBrowser } from './ArtifactBrowser'

interface Props {
  result: PreflightResult
}

function ResultSummaryBox({ summary }: { summary: PreflightResult['summary'] }) {
  return (
    <div style={{ padding: '24px 28px', background: 'var(--surface-tint)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border)', borderRadius: 8, marginBottom: 20 }}>
      <p style={{ margin: '0 0 6px', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Bevor du loslegst
      </p>
      <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3, fontFamily: 'var(--font-display)' }}>
        {summary.projectLabel}
      </h2>
      <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        {summary.headline}
      </p>
    </div>
  )
}

function ReifegradSignal({ gaps }: { gaps: PreflightResult['gaps'] }) {
  const { red, yellow, decidedCount, naCount } = gaps
  const hasBlockers = red.length > 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', background: hasBlockers ? 'var(--surface-warm)' : 'var(--teal-light)', borderWidth: '1px', borderStyle: 'solid', borderColor: hasBlockers ? 'var(--border)' : 'rgba(30,112,112,0.18)', borderRadius: 8, marginBottom: 24, flexWrap: 'wrap', rowGap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {hasBlockers ? (
          <Warning size={18} weight="fill" color="var(--error)" aria-hidden="true" />
        ) : (
          <CheckCircle size={18} weight="fill" color="var(--teal)" aria-hidden="true" />
        )}
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: hasBlockers ? 'var(--error)' : 'var(--teal)' }}>
          {hasBlockers ? `${red.length} offen — zuerst entscheiden` : 'Keine Blocker'}
        </span>
      </div>
      <span style={{ width: 1, height: 16, background: 'var(--border)', flexShrink: 0 }} aria-hidden="true" />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <CheckCircle size={14} weight="fill" color="var(--text-tertiary)" aria-hidden="true" />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)' }}>
          {decidedCount} entschieden
        </span>
      </div>
      {yellow.length > 0 && (
        <>
          <span style={{ width: 1, height: 16, background: 'var(--border)', flexShrink: 0 }} aria-hidden="true" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={14} weight="bold" color="var(--text-tertiary)" aria-hidden="true" />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)' }}>
              {yellow.length} geparkt
            </span>
          </div>
        </>
      )}
      {naCount > 0 && (
        <>
          <span style={{ width: 1, height: 16, background: 'var(--border)', flexShrink: 0 }} aria-hidden="true" />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-tertiary)' }}>
            {naCount} nicht relevant
          </span>
        </>
      )}
    </div>
  )
}

function ThinBanner() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '14px 18px', marginBottom: 20, borderRadius: 8, background: 'rgba(229,160,0,0.10)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--status-risky)' }}>
      <Warning size={18} weight="fill" color="var(--status-risky)" style={{ flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
      <div>
        <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: 'var(--status-risky)' }}>Dein Konzept ist sehr knapp.</p>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
          Die Analyse ist deshalb generisch und das Startpaket nur ein grobes Gerüst — noch nicht <i>dein</i> Fundament.
          Damit es konkret wird, sollte deine Beschreibung enthalten: <b>Was &amp; für wen</b> · <b>Kern-Funktionen</b> · <b>Nutzer &amp; Daten</b> · <b>Verkauf?</b>
          {' '}(Die geführte Entwicklung dazu kommt als Nächstes.)
        </p>
      </div>
    </div>
  )
}

function ReifegradLegend() {
  return (
    <p style={{ margin: '-18px 0 24px', fontSize: 10.5, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
      offen = zuerst entscheiden · entschieden = schon klar · geparkt = kann später · n.r. = trifft nicht zu
    </p>
  )
}

function CapabilityNote() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 24, padding: '12px 16px', borderRadius: 8, background: 'var(--surface-cool)', border: '1px solid var(--border)' }}>
      <Info size={16} weight="bold" color="var(--text-tertiary)" style={{ flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
      <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
        <b style={{ color: 'var(--text-secondary)' }}>Gut beurteilbar:</b> Architektur, Konventionen, Sicherheit &amp; rechtliche Trigger aus deinem Konzept.{' '}
        <b style={{ color: 'var(--text-secondary)' }}>Grenzen:</b> ersetzt keine Rechtsberatung, bewertet nicht deinen Markt/Geschäftsmodell, und sieht nur, was im Konzept steht.
      </p>
    </div>
  )
}

export function PreflightResult({ result }: Props) {
  const { summary, gaps } = result
  return (
    <div style={{ marginTop: 8 }}>
      {summary.thin && <ThinBanner />}
      <ResultSummaryBox summary={summary} />
      <ReifegradSignal gaps={gaps} />
      <ReifegradLegend />

      <GapsSection gaps={gaps} />

      <div style={{ marginTop: 8, marginBottom: 8 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent)', marginBottom: 12, letterSpacing: '0.02em' }}>
          <span style={{ width: 28, height: 1, background: 'rgba(45,122,80,0.3)', flexShrink: 0 }} />
          Dein Startpaket
        </span>
        <ArtifactBrowser result={result} />
      </div>

      <CapabilityNote />
    </div>
  )
}
