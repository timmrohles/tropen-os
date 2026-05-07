'use client'

import React, { useState } from 'react'
import { Lightning } from '@phosphor-icons/react'
import { type EnrichedFinding, clusterFindings } from './audit-findings-utils'
import { FindingClusterRow } from './FindingClusterRow'

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

// ── FindingSection ─────────────────────────────────────────────────────────────

export type SectionVariant = 'killer' | 'quick' | 'polish'

// Sprint 9-Polish-2: KI-Optik raus — "quick" nutzt linken Border-Strich statt blauen Hintergrund
const SECTION_STYLES: Record<SectionVariant, React.CSSProperties> = {
  killer: {
    background: '#ffffff',
    border: '1px solid var(--accent)',
    borderRadius: 8, overflow: 'hidden',
  },
  quick: {
    background: '#ffffff',
    border: '1px solid var(--accent)',
    borderRadius: 8, overflow: 'hidden',
  },
  polish: {
    background: '#ffffff',
    border: '1px solid var(--accent)',
    borderRadius: 8, overflow: 'hidden',
  },
}

export function FindingSection({
  icon, title, subtitle, findings, runId, variant, onBundle,
  bundlePrompt, bundleLoading, bundleError, bundleCopied, onCopyBundle, onClearBundle, onFixed, onDeferred,
  isCommitteeStale, reviewRunAt,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  findings: EnrichedFinding[]
  runId?: string | null
  variant: SectionVariant
  onBundle?: () => void
  bundlePrompt?: string | null
  bundleLoading?: boolean
  bundleError?: string
  bundleCopied?: boolean
  onCopyBundle?: () => void
  onClearBundle?: () => void
  onFixed?: (ids: string[]) => void
  onDeferred?: (ids: string[]) => void
  isCommitteeStale?: boolean
  reviewRunAt?: string | null
}) {
  const [open, setOpen] = useState(true)
  const clusters = clusterFindings(findings)

  return (
    <div style={SECTION_STYLES[variant]}>
      {/* Header als div — Bundle-Button braucht eigenen Klick-Bereich neben dem Toggle */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '9px 14px', background: 'var(--accent)',
        borderBottom: open ? '1px solid rgba(255,255,255,0.10)' : 'none',
      }}>
        {icon}
        <span style={{ fontSize: 11, fontWeight: 700, color: '#ffffff', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>
          {title}
        </span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: 400 }}>
          · {subtitle}
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          {onBundle && findings.length > 0 && (
            <button
              onClick={onBundle}
              className="btn btn-primary"
              style={{ fontSize: 11, padding: '3px 10px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              <Lightning size={11} weight="fill" aria-hidden="true" />
              Fix-Session starten
            </button>
          )}
          <button
            onClick={() => setOpen(v => !v)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 10, color: 'rgba(255,255,255,0.65)', padding: '2px 4px' }}
            aria-label={open ? 'Einklappen' : 'Aufklappen'}
          >
            {open ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {/* Inline-Bundle-Prompt */}
      {(bundleLoading || bundleError || bundlePrompt) && (
        <div style={{ borderBottom: open ? '1px solid var(--border)' : 'none' }}>
          {bundleLoading && <p style={{ margin: 0, padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-tertiary)' }}>Wird generiert…</p>}
          {bundleError && <p style={{ margin: 0, padding: '10px 14px', fontSize: 12, color: 'var(--error)' }}>⚠ {bundleError}</p>}
          {bundlePrompt && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, background: 'var(--accent)', overflow: 'hidden' }}>
              <div style={{ position: 'relative' }}>
                <button onClick={onClearBundle} aria-label="Schließen" style={{ position: 'absolute', top: 6, right: 10, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 1, padding: 2 }}>✕</button>
                <div style={{ color: 'var(--code-fg)', padding: '10px 28px 10px 14px', whiteSpace: 'pre-wrap', lineHeight: 1.5, maxHeight: 280, overflow: 'auto' }}>
                  {bundlePrompt}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, padding: '8px 14px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <button onClick={onCopyBundle} style={{ fontSize: 11, color: '#ffffff', background: 'var(--teal)', border: '1px solid var(--teal)', borderRadius: 4, cursor: 'pointer', padding: '3px 10px' }}>
                  {bundleCopied ? '✓ Kopiert' : 'Kopieren'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {open && clusters.map(cluster => (
        <FindingClusterRow key={cluster.ruleId} cluster={cluster} runId={runId} onFixed={onFixed} onDeferred={onDeferred} />
      ))}

      {open && isCommitteeStale && reviewRunAt && clusters.some(c => c.findings.some(f => (f as Record<string, unknown>).avg_confidence != null)) && (
        <div style={{
          padding: '5px 14px',
          fontSize: 11,
          color: 'var(--status-risky)',
          background: 'rgba(229,160,0,0.06)',
          borderTop: '1px solid var(--border)',
        }}>
          Komitee-Review-Stand: {formatRelativeDate(reviewRunAt)} · Code wurde seither geändert — Findings möglicherweise veraltet.
        </div>
      )}

      {open && variant === 'quick' && <SeverityLegendRow />}
    </div>
  )
}

function SeverityLegendRow() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16, padding: '6px 14px',
      background: 'var(--accent-light)', borderTop: '1px solid var(--border)',
    }}>
      {([
        { cls: 'severity-dot--critical', label: 'Kritisch' },
        { cls: 'severity-dot--high',     label: 'Hoch' },
        { cls: 'severity-dot--medium',   label: 'Mittel' },
        { cls: 'severity-dot--low',      label: 'Niedrig' },
        { cls: 'severity-dot--info',     label: 'Info' },
      ] as const).map(({ cls, label }) => (
        <span key={cls} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <span className={`severity-dot ${cls}`} aria-hidden="true" />
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{label}</span>
        </span>
      ))}
    </div>
  )
}
