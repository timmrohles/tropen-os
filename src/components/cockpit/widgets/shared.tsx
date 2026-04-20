'use client'

import { Link } from '@/i18n/navigation'

interface SkeletonProps { rows?: number }

export function WidgetSkeleton({ rows = 3 }: SkeletonProps) {
  return (
    <div className="widget-content widget-skeleton">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="widget-skeleton-row" />
      ))}
    </div>
  )
}

interface EmptyProps {
  text: string
  actionLabel?: string
  actionHref?: string
}

export function WidgetEmpty({ text, actionLabel, actionHref }: EmptyProps) {
  return (
    <div className="widget-empty">
      <p>{text}</p>
      {actionLabel && actionHref && (
        <Link href={actionHref} className="widget-action-link">
          {actionLabel} →
        </Link>
      )}
    </div>
  )
}

export function formatRelativeDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'gerade eben'
  if (diffMins < 60) return `vor ${diffMins} Min.`
  if (diffHours < 24) return `vor ${diffHours} Std.`
  if (diffDays === 1) return 'gestern'
  if (diffDays < 7) return `vor ${diffDays} Tagen`
  return date.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })
}
