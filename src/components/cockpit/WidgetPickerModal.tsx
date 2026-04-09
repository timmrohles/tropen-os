'use client'

import { useEffect } from 'react'
import {
  Rss, Bird, Clock, FolderSimple, Sparkle,
  Users, CurrencyEur, Lightning, ArrowRight, X, ShieldCheck,
} from '@phosphor-icons/react'
import { WIDGET_CATALOG, type WidgetMeta } from '@/lib/cockpit/widgetCatalog'
import type { ElementType } from 'react'

const WIDGET_ICONS: Record<string, ElementType> = {
  feed_highlights:     Rss,
  toro_recommendation: Bird,
  recent_activity:     Clock,
  project_status:      FolderSimple,
  artifact_overview:   Sparkle,
  team_activity:       Users,
  budget_usage:        CurrencyEur,
  quick_actions:       Lightning,
  code_health:         ShieldCheck,
}

interface Props {
  existing: string[]
  isAdmin: boolean
  onAdd: (widget: WidgetMeta) => void
  onClose: () => void
}

export function WidgetPickerModal({ existing, isAdmin, onAdd, onClose }: Props) {
  const available = WIDGET_CATALOG.filter(w =>
    !existing.includes(w.type) && (!w.adminOnly || isAdmin)
  )

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Widget hinzufügen"
    >
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Widget hinzufügen</h2>
          <button
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Schließen"
          >
            <X size={16} weight="bold" aria-hidden="true" />
          </button>
        </div>

        {available.length === 0 ? (
          <p style={{ padding: '24px 20px', color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>
            Alle verfügbaren Widgets sind bereits im Cockpit.
          </p>
        ) : (
          <div className="widget-picker-list">
            {available.map(widget => {
              const Icon = WIDGET_ICONS[widget.type] ?? Lightning
              return (
                <button
                  key={widget.type}
                  className="widget-picker-item"
                  onClick={() => { onAdd(widget); onClose() }}
                >
                  <div className="widget-picker-icon">
                    <Icon size={18} weight="bold" aria-hidden="true" />
                  </div>
                  <div className="widget-picker-info">
                    <span className="widget-picker-label">{widget.label}</span>
                    <span className="widget-picker-size">
                      {widget.size === 'small' ? 'Klein' : 'Mittel'}
                      {widget.adminOnly && ' · Nur Admins'}
                    </span>
                  </div>
                  <ArrowRight size={14} weight="bold" color="var(--text-tertiary)" aria-hidden="true" />
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
