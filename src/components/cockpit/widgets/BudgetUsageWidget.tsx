'use client'

import { useEffect, useState } from 'react'
import { Link } from '@/i18n/navigation'
import { WidgetSkeleton } from './Shared'

interface BudgetData {
  usedPercent: number
  usedEur: number
  limitEur: number | null
}

export function BudgetUsageWidget() {
  const [budget, setBudget] = useState<BudgetData | null>(null)
  const [loading, setLoading] = useState(true)
  const [forbidden, setForbidden] = useState(false)

  useEffect(() => {
    fetch('/api/cockpit/budget')
      .then(r => {
        if (r.status === 403) { setForbidden(true); return null }
        return r.ok ? r.json() : Promise.reject()
      })
      .then(d => { if (d) { setBudget(d); setLoading(false) } })
      .catch(() => setLoading(false))
  }, [])

  if (forbidden) return null
  if (loading) return <WidgetSkeleton rows={2} />

  const percent = budget?.usedPercent ?? 0
  const isCritical = percent >= 95
  const isWarning = percent >= 80
  const barColor = isCritical
    ? 'var(--error)'
    : isWarning
    ? 'var(--warning, #d97706)'
    : 'var(--accent)'

  return (
    <div className="widget-content">
      <div className="widget-budget-main">
        <span className="widget-budget-percent" style={{ color: barColor }}>
          {percent}%
        </span>
        <span className="widget-budget-label">Budget genutzt</span>
      </div>

      <div
        className="widget-budget-bar"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${percent}% Budget genutzt`}
      >
        <div
          className="widget-budget-fill"
          style={{ width: `${Math.min(percent, 100)}%`, background: barColor }}
        />
      </div>

      <div className="widget-budget-detail">
        <span>€{(budget?.usedEur ?? 0).toFixed(2)} von</span>
        <span>{budget?.limitEur == null ? 'kein Limit' : `€${budget.limitEur.toFixed(2)}`}</span>
      </div>

      <Link href="/settings#kosten" className="widget-more-link">Details →</Link>
    </div>
  )
}
