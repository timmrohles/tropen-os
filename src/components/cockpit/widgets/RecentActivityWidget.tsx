'use client'

import { useEffect, useState } from 'react'
import { ChatCircle, FolderSimple, Sparkle, ArrowRight } from '@phosphor-icons/react'
import type { ElementType } from 'react'
import { Link } from '@/i18n/navigation'
import { WidgetSkeleton, WidgetEmpty, formatRelativeDate } from './shared'

interface ActivityItem {
  id: string
  type: 'conversation' | 'artifact'
  title: string | null
  updated_at: string
}

const TYPE_CONFIG: Record<string, { icon: ElementType; label: string; href: string }> = {
  conversation: { icon: ChatCircle,   label: 'Chat',     href: '/chat' },
  artifact:     { icon: Sparkle,      label: 'Artefakt', href: '/artefakte' },
  project:      { icon: FolderSimple, label: 'Projekt',  href: '/projekte' },
}

export function RecentActivityWidget() {
  const [items, setItems] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/cockpit/recent-activity')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { setItems(d.items ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <WidgetSkeleton rows={4} />

  if (items.length === 0) {
    return (
      <WidgetEmpty
        text="Noch keine Aktivität."
        actionLabel="Chat starten"
        actionHref="/chat"
      />
    )
  }

  return (
    <div className="widget-content widget-content--list">
      {items.map(item => {
        const config = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.conversation
        const Icon = config.icon
        return (
          <Link key={item.id} href={config.href} className="widget-list-item">
            <Icon size={14} weight="bold" color="var(--text-tertiary)" aria-hidden="true" />
            <div className="widget-list-item-info">
              <span className="widget-list-item-title">
                {item.title ?? `${config.label}`}
              </span>
              <span className="widget-list-item-meta">
                {config.label} · {formatRelativeDate(item.updated_at)}
              </span>
            </div>
            <ArrowRight size={12} weight="bold" color="var(--text-tertiary)" aria-hidden="true" />
          </Link>
        )
      })}
    </div>
  )
}
