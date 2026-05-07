'use client'

import React, { useState } from 'react'
import { ClockCounterClockwise } from '@phosphor-icons/react'
import { type EnrichedFinding, clusterFindings, SEV_DOT } from './audit-findings-utils'

// ── DeferredSection ────────────────────────────────────────────────────────────

export function DeferredSection({ findings, onActivate }: {
  findings: EnrichedFinding[]
  onActivate: (ids: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const clusters = clusterFindings(findings)

  return (
    <div style={{ background: '#ffffff', border: '1px solid var(--accent)', borderRadius: 8, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, width: '100%',
          padding: '9px 14px', background: 'var(--accent)', border: 'none', cursor: 'pointer',
          textAlign: 'left', borderBottom: open ? '1px solid rgba(255,255,255,0.10)' : 'none',
        }}
      >
        <ClockCounterClockwise size={14} weight="bold" color="rgba(255,255,255,0.80)" aria-hidden="true" />
        <span style={{ fontSize: 11, fontWeight: 700, color: '#ffffff', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>
          AUFGESCHOBENE FINDINGS
        </span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: 400 }}>
          · {findings.length} Finding{findings.length !== 1 ? 's' : ''}
        </span>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: 'rgba(255,255,255,0.65)' }}>
          {open ? '▲' : '▼'}
        </span>
      </button>

      {open && (
        <>
          {clusters.map(cluster => (
            <div key={cluster.ruleId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderBottom: '1px solid var(--border)' }}>
              <span className={`severity-dot ${SEV_DOT[cluster.severity] ?? ''}`} aria-label={cluster.severity} style={{ flexShrink: 0 }} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {cluster.title}
                </div>
                {cluster.findings.length > 1 ? (
                  <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginTop: 1 }}>
                    {cluster.findings.length} Dateien betroffen
                  </div>
                ) : cluster.findings[0].file_path ? (
                  <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {cluster.findings[0].file_path}
                  </div>
                ) : null}
              </div>
              <button
                onClick={() => onActivate(cluster.findings.map(f => f.id))}
                style={{ fontSize: 11, color: 'var(--teal)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline', textUnderlineOffset: 2, flexShrink: 0 }}
              >
                Aktivieren
              </button>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
