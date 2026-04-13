'use client'

import { useEffect, useState } from 'react'
import { Link } from '@/i18n/navigation'
import { WidgetSkeleton, WidgetEmpty, formatRelativeDate } from './shared'

interface CodeHealthData {
  hasAuditData: boolean
  score: number | null
  status: string | null
  lastAuditAt: string | null
  openFindings: number
  criticalCount: number
  highCount: number
  mediumCount: number
  lowCount: number
  scoreChange: number | null
  previousScore: number | null
}

function getScoreColor(score: number | null): string {
  if (score == null) return 'var(--text-tertiary)'
  if (score >= 85) return 'var(--accent)'
  if (score >= 70) return 'var(--text-primary)'
  if (score >= 50) return 'var(--text-secondary)'
  return 'var(--error)'
}

function getStatusLabel(status: string | null): string {
  switch (status) {
    case 'production_grade': return 'Production Grade'
    case 'stable':           return 'Stable'
    case 'risky':            return 'Risky'
    case 'prototype':        return 'Prototype'
    default:                 return ''
  }
}

function getStatusColor(status: string | null): string {
  switch (status) {
    case 'production_grade': return 'var(--accent)'
    case 'stable':           return 'var(--accent)'
    case 'risky':            return 'var(--text-secondary)'
    case 'prototype':        return 'var(--error)'
    default:                 return 'var(--text-tertiary)'
  }
}

export function CodeHealthWidget() {
  const [data, setData] = useState<CodeHealthData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/cockpit/code-health')
      .then(r => r.json() as Promise<CodeHealthData>)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <WidgetSkeleton rows={3} />

  if (!data?.hasAuditData) {
    return (
      <WidgetEmpty
        text="Noch kein Audit durchgeführt."
        actionLabel="Ersten Audit starten"
        actionHref="/audit"
      />
    )
  }

  const changePositive = data.scoreChange != null && data.scoreChange > 0
  const changeNegative = data.scoreChange != null && data.scoreChange < 0

  return (
    <div className="widget-content">
      {/* Score */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
        <span style={{
          fontSize: 28,
          fontWeight: 500,
          color: getScoreColor(data.score),
          fontFamily: 'var(--font-mono)',
          lineHeight: 1,
        }}>
          {data.score?.toFixed(1)}%
        </span>
        <span style={{ fontSize: 12, fontWeight: 500, color: getStatusColor(data.status) }}>
          {getStatusLabel(data.status)}
        </span>
        {data.scoreChange !== null && data.scoreChange !== 0 && (
          <span style={{
            fontSize: 11,
            color: changePositive ? 'var(--accent)' : changeNegative ? 'var(--error)' : 'var(--text-tertiary)',
          }}>
            {changePositive ? '+' : ''}{data.scoreChange.toFixed(1)}
          </span>
        )}
      </div>

      {/* Open findings */}
      <div style={{ marginTop: 12 }}>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          {data.openFindings} offene Findings
        </span>
        {(data.criticalCount > 0 || data.highCount > 0 || data.mediumCount > 0) && (
          <div style={{ display: 'flex', gap: 10, marginTop: 3, fontSize: 11, color: 'var(--text-tertiary)' }}>
            {data.criticalCount > 0 && <span style={{ color: 'var(--error)' }}>{data.criticalCount} kritisch</span>}
            {data.highCount > 0 && <span>{data.highCount} hoch</span>}
            {data.mediumCount > 0 && <span>{data.mediumCount} mittel</span>}
          </div>
        )}
      </div>

      {/* Last audit */}
      {data.lastAuditAt && (
        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-tertiary)' }}>
          Letzter Audit: {formatRelativeDate(data.lastAuditAt)}
        </div>
      )}

      <Link href="/audit" className="widget-more-link">Zum Audit →</Link>
      <Link href="/audit/scan" className="widget-more-link">Neues Projekt scannen →</Link>
    </div>
  )
}
