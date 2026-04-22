'use client'

import { useEffect, useState } from 'react'
import { WidgetSkeleton, WidgetEmpty, formatRelativeDate } from './Shared'

interface TeamActivityItem {
  id: string
  user_name: string
  action: string
  created_at: string
}

export function TeamActivityWidget() {
  const [items, setItems] = useState<TeamActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [forbidden, setForbidden] = useState(false)

  useEffect(() => {
    fetch('/api/cockpit/team-activity')
      .then(r => {
        if (r.status === 403) { setForbidden(true); return null }
        return r.ok ? r.json() : Promise.reject()
      })
      .then(d => { if (d) { setItems(d.items ?? []); setLoading(false) } })
      .catch(() => setLoading(false))
  }, [])

  if (forbidden) return null
  if (loading) return <WidgetSkeleton rows={4} />

  if (items.length === 0) {
    return <WidgetEmpty text="Keine Team-Aktivität heute." />
  }

  return (
    <div className="widget-content widget-content--list">
      {items.map(item => (
        <div key={item.id} className="widget-list-item">
          <div className="widget-team-avatar" aria-hidden="true">
            {item.user_name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="widget-list-item-info">
            <span className="widget-list-item-title">{item.user_name}</span>
            <span className="widget-list-item-meta">
              {item.action} · {formatRelativeDate(item.created_at)}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
