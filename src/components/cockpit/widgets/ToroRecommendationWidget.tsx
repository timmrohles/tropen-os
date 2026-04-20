'use client'

import { useEffect, useState } from 'react'
import { Bird } from '@phosphor-icons/react'
import { Link } from '@/i18n/navigation'
import { WidgetSkeleton } from './shared'

interface Recommendation {
  text: string
  actionLabel: string | null
  actionHref: string | null
}

export function ToroRecommendationWidget() {
  const [rec, setRec] = useState<Recommendation | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/cockpit/recommendation')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { setRec(d.recommendation ?? null); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <WidgetSkeleton rows={2} />

  if (!rec) {
    return (
      <div className="widget-empty">
        <Bird size={16} weight="fill" color="var(--accent)" aria-hidden="true" />
        <p>Alles im Griff heute.</p>
      </div>
    )
  }

  return (
    <div className="widget-content">
      <div className="widget-toro-rec">
        <Bird size={16} weight="fill" color="var(--accent)" aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} />
        <p className="widget-toro-text">{rec.text}</p>
      </div>
      {rec.actionHref && (
        <Link href={rec.actionHref} className="widget-action-link">
          {rec.actionLabel} →
        </Link>
      )}
    </div>
  )
}
