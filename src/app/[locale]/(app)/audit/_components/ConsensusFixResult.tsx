'use client'

import React from 'react'
import { WarningCircle, CheckCircle } from '@phosphor-icons/react'
import type { ConsensusFixData } from '@/hooks/useDeepFix'

interface Props {
  data: ConsensusFixData
}

const RISK_COLOR: Record<string, string> = {
  safe:     'var(--accent)',
  moderate: '#E5A000',
  critical: 'var(--error)',
}

const RISK_LABEL: Record<string, string> = {
  safe:     'Sicher',
  moderate: 'Moderat',
  critical: 'Kritisch',
}

export default function ConsensusFixResult({ data }: Props) {
  const riskColor = data.riskLevel ? RISK_COLOR[data.riskLevel] : undefined
  const successfulDrafts = data.drafts.filter((d) => !d.error)
  const failedDrafts     = data.drafts.filter((d) => !!d.error)

  return (
    <div
      className="card"
      style={{ padding: '12px 16px', marginTop: 10, borderLeft: '3px solid var(--accent)' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--accent)' }}>
          Konsens-Fix
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
          ~€{data.costEur.toFixed(3)} · {data.model}
        </span>
      </div>

      {/* Model draft badges */}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
        {successfulDrafts.map((d) => (
          <span
            key={d.providerId}
            style={{
              fontSize: 11, padding: '2px 7px', borderRadius: 4,
              background: 'var(--accent-light)', color: 'var(--accent)',
              display: 'flex', alignItems: 'center', gap: 3,
            }}
          >
            <CheckCircle size={10} weight="fill" aria-hidden="true" />
            {d.providerId.split('/').pop() ?? d.providerId} ({d.confidence})
          </span>
        ))}
        {failedDrafts.map((d) => (
          <span
            key={d.providerId}
            style={{
              fontSize: 11, padding: '2px 7px', borderRadius: 4,
              background: 'rgba(220,0,0,0.07)', color: 'var(--error)',
              display: 'flex', alignItems: 'center', gap: 3,
            }}
          >
            <WarningCircle size={10} weight="fill" aria-hidden="true" />
            {d.providerId.split('/').pop() ?? d.providerId} fehlgeschlagen
          </span>
        ))}
      </div>

      {/* Risk badge */}
      {data.riskLevel && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
          <WarningCircle size={12} weight="bold" color={riskColor} aria-hidden="true" />
          <span style={{ fontSize: 12, color: riskColor, fontWeight: 500 }}>
            Risiko: {RISK_LABEL[data.riskLevel] ?? data.riskLevel}
          </span>
          {data.riskReasons && data.riskReasons.length > 0 && (
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
              — {data.riskReasons[0]}
            </span>
          )}
        </div>
      )}

      {/* Judge explanation */}
      {data.judgeExplanation && (
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55, margin: '0 0 8px' }}>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Urteil: </span>
          {data.judgeExplanation}
        </p>
      )}

      {/* Fix explanation */}
      <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.55, margin: 0, whiteSpace: 'pre-wrap' }}>
        {data.explanation}
      </p>
    </div>
  )
}
