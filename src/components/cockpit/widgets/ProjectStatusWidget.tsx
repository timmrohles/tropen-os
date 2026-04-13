'use client'

import { useEffect, useState } from 'react'
import { Link } from '@/i18n/navigation'
import { FolderSimple } from '@phosphor-icons/react'
import { WidgetSkeleton, WidgetEmpty, formatRelativeDate } from './shared'

interface Project {
  id: string
  title: string
  emoji: string | null
  chat_count: number
  updated_at: string
}

export function ProjectStatusWidget() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/cockpit/projects')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { setProjects(d.projects ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <WidgetSkeleton rows={3} />

  if (projects.length === 0) {
    return (
      <WidgetEmpty
        text="Noch keine Projekte."
        actionLabel="Projekt anlegen"
        actionHref="/projekte"
      />
    )
  }

  return (
    <div className="widget-content widget-content--list">
      {projects.map(project => (
        <Link key={project.id} href="/projekte" className="widget-list-item">
          {project.emoji ? (
            <span aria-hidden="true" style={{ fontSize: 14, lineHeight: 1 }}>{project.emoji}</span>
          ) : (
            <FolderSimple size={14} weight="bold" color="var(--text-tertiary)" aria-hidden="true" />
          )}
          <div className="widget-list-item-info">
            <span className="widget-list-item-title">{project.title}</span>
            <span className="widget-list-item-meta">
              {project.chat_count} Chats · {formatRelativeDate(project.updated_at)}
            </span>
          </div>
        </Link>
      ))}
      <Link href="/projekte" className="widget-more-link">Alle Projekte →</Link>
    </div>
  )
}
