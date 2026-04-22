'use client'

import { useEffect, useState } from 'react'
import { Link } from '@/i18n/navigation'
import { WidgetSkeleton, WidgetEmpty, formatRelativeDate } from './Shared'

interface FeedItem {
  id: string
  title: string
  url: string | null
  source_name: string
  score: number
  published_at: string
}

export function FeedHighlightsWidget() {
  const [items, setItems] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/cockpit/feed-highlights')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { setItems(d.items ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <WidgetSkeleton rows={3} />

  if (items.length === 0) {
    return (
      <WidgetEmpty
        text="Keine neuen Artikel heute."
        actionLabel="Feeds einrichten"
        actionHref="/feeds"
      />
    )
  }

  return (
    <div className="widget-content">
      {items.map(item => (
        <a
          key={item.id}
          href={item.url ?? '/feeds'}
          target={item.url ? '_blank' : '_self'}
          rel="noopener noreferrer"
          className="widget-feed-item"
        >
          <div className="widget-feed-source">{item.source_name}</div>
          <p className="widget-feed-title">{item.title}</p>
          <div className="widget-feed-meta">
            <span className="widget-score-badge">{item.score}/10</span>
            <span>{formatRelativeDate(item.published_at)}</span>
          </div>
        </a>
      ))}
      <Link href="/feeds" className="widget-more-link">Alle Feeds öffnen →</Link>
    </div>
  )
}
