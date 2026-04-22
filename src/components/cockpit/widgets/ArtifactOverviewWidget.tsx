'use client'

import { useEffect, useState } from 'react'
import { Link } from '@/i18n/navigation'
import { WidgetSkeleton, WidgetEmpty } from './Shared'

interface ArtifactStats {
  thisWeek: number
  total: number
  recent: { id: string; title: string; type: string }[]
}

export function ArtifactOverviewWidget() {
  const [stats, setStats] = useState<ArtifactStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/cockpit/artifact-stats')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { setStats(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <WidgetSkeleton rows={2} />

  if (!stats || stats.total === 0) {
    return (
      <WidgetEmpty
        text="Noch keine Artefakte erstellt."
        actionLabel="Im Chat erstellen"
        actionHref="/chat"
      />
    )
  }

  return (
    <div className="widget-content">
      <div className="widget-stat-row" style={{ gap: 28 }}>
        <div className="widget-stat">
          <span className="widget-stat-value">{stats.thisWeek}</span>
          <span className="widget-stat-label">diese Woche</span>
        </div>
        <div className="widget-stat">
          <span className="widget-stat-value">{stats.total}</span>
          <span className="widget-stat-label">gesamt</span>
        </div>
      </div>
      {stats.recent.map(artifact => (
        <div key={artifact.id} className="widget-list-item" style={{ cursor: 'default' }}>
          <span className="widget-artifact-type">{artifact.type?.toUpperCase()}</span>
          <span className="widget-list-item-title">{artifact.title}</span>
        </div>
      ))}
      <Link href="/artefakte" className="widget-more-link">Alle Artefakte →</Link>
    </div>
  )
}
