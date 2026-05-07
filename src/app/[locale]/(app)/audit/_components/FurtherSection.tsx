'use client'

import React, { useState } from 'react'
import { ArrowsClockwise } from '@phosphor-icons/react'
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

// ── SubSectionLabel — inline (kein import von SectionLabel — RSC-Modul-ID-Konflikt) ──

function SubSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 12,
      fontFamily: 'var(--font-mono, monospace)', fontSize: 12,
      color: 'var(--accent)', marginTop: 12, marginBottom: 8, letterSpacing: '0.02em',
    }}>
      <span style={{ width: 28, height: 1, background: 'rgba(63,74,85,0.3)', flexShrink: 0 }} aria-hidden="true" />
      {children}
    </span>
  )
}

// ── FurtherSection — Weitere Findings mit Severity-Sub-Trennern ───────────────

export function FurtherSection({ furtherHigh, furtherMedium, furtherLow, runId, onFixed, onDeferred, isCommitteeStale, reviewRunAt }: {
  furtherHigh: EnrichedFinding[]
  furtherMedium: EnrichedFinding[]
  furtherLow: EnrichedFinding[]
  runId?: string | null
  onFixed?: (ids: string[]) => void
  onDeferred?: (ids: string[]) => void
  isCommitteeStale?: boolean
  reviewRunAt?: string | null
}) {
  const total = furtherHigh.length + furtherMedium.length + furtherLow.length
  const [open, setOpen] = useState(true)

  return (
    <div style={{ background: '#ffffff', border: '1px solid var(--accent)', borderRadius: 8, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, width: '100%',
          padding: '9px 14px', background: 'var(--accent)', border: 'none', cursor: 'pointer', textAlign: 'left',
          borderBottom: open ? '1px solid rgba(255,255,255,0.10)' : 'none',
        }}
      >
        <ArrowsClockwise size={14} weight="bold" color="rgba(255,255,255,0.80)" aria-hidden="true" />
        <span style={{ fontSize: 11, fontWeight: 700, color: '#ffffff', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>
          WEITERE FINDINGS
        </span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: 400 }}>
          · {total} Findings
        </span>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: 'rgba(255,255,255,0.65)' }}>
          {open ? '▲' : '▼'}
        </span>
      </button>

      {open && (
        <>
          {furtherHigh.length > 0 && (
            <>
              <div style={{ padding: '8px 14px 4px', borderBottom: '1px solid var(--border)' }}>
                <SubSectionLabel>Hohe Severity</SubSectionLabel>
              </div>
              {clusterFindings(furtherHigh).map(cluster => (
                <FindingClusterRow key={cluster.ruleId} cluster={cluster} runId={runId} onFixed={onFixed} onDeferred={onDeferred} />
              ))}
            </>
          )}
          {furtherMedium.length > 0 && (
            <>
              <div style={{ padding: '8px 14px 4px', borderBottom: '1px solid var(--border)', borderTop: furtherHigh.length > 0 ? '1px solid var(--border)' : 'none' }}>
                <SubSectionLabel>Mittlere Severity</SubSectionLabel>
              </div>
              {clusterFindings(furtherMedium).map(cluster => (
                <FindingClusterRow key={cluster.ruleId} cluster={cluster} runId={runId} onFixed={onFixed} onDeferred={onDeferred} />
              ))}
            </>
          )}
          {furtherLow.length > 0 && (
            <>
              <div style={{ padding: '8px 14px 4px', borderBottom: '1px solid var(--border)', borderTop: (furtherHigh.length + furtherMedium.length) > 0 ? '1px solid var(--border)' : 'none' }}>
                <SubSectionLabel>Niedrige Severity</SubSectionLabel>
              </div>
              {clusterFindings(furtherLow).map(cluster => (
                <FindingClusterRow key={cluster.ruleId} cluster={cluster} runId={runId} onFixed={onFixed} onDeferred={onDeferred} />
              ))}
            </>
          )}
          {isCommitteeStale && reviewRunAt && [...furtherHigh, ...furtherMedium, ...furtherLow].some(f => (f as Record<string, unknown>).avg_confidence != null) && (
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
        </>
      )}
    </div>
  )
}
