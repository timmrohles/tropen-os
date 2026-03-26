'use client'

import { Plus, X } from '@phosphor-icons/react'
import type { ComponentType } from 'react'
import { WIDGET_CATALOG } from '@/lib/cockpit/widgetCatalog'
import { FeedHighlightsWidget }     from './widgets/FeedHighlightsWidget'
import { ToroRecommendationWidget } from './widgets/ToroRecommendationWidget'
import { RecentActivityWidget }     from './widgets/RecentActivityWidget'
import { ProjectStatusWidget }      from './widgets/ProjectStatusWidget'
import { ArtifactOverviewWidget }   from './widgets/ArtifactOverviewWidget'
import { TeamActivityWidget }       from './widgets/TeamActivityWidget'
import { BudgetUsageWidget }        from './widgets/BudgetUsageWidget'
import { QuickActionsWidget }       from './widgets/QuickActionsWidget'

const WIDGET_COMPONENTS: Record<string, ComponentType> = {
  feed_highlights:     FeedHighlightsWidget,
  toro_recommendation: ToroRecommendationWidget,
  recent_activity:     RecentActivityWidget,
  project_status:      ProjectStatusWidget,
  artifact_overview:   ArtifactOverviewWidget,
  team_activity:       TeamActivityWidget,
  budget_usage:        BudgetUsageWidget,
  quick_actions:       QuickActionsWidget,
}

interface Widget {
  id: string
  widget_type: string
  position: number
  size: 'small' | 'medium' | 'large'
  is_visible: boolean
}

interface Props {
  widgets: Widget[]
  onAddWidget: () => void
  onRemoveWidget: (id: string) => void
}

export function CockpitGrid({ widgets, onAddWidget, onRemoveWidget }: Props) {
  const visible = widgets
    .filter(w => w.is_visible)
    .sort((a, b) => a.position - b.position)

  return (
    <div className="cockpit-grid">
      {visible.map(widget => (
        <CockpitWidgetSlot
          key={widget.id}
          widget={widget}
          onRemove={() => onRemoveWidget(widget.id)}
        />
      ))}
      {visible.length < 8 && (
        <button
          className="cockpit-add-slot"
          onClick={onAddWidget}
          aria-label="Widget hinzufügen"
        >
          <Plus size={20} weight="bold" aria-hidden="true" />
          <span>Widget hinzufügen</span>
        </button>
      )}
    </div>
  )
}

function CockpitWidgetSlot({ widget, onRemove }: { widget: Widget; onRemove: () => void }) {
  const meta = WIDGET_CATALOG.find(w => w.type === widget.widget_type)
  const WidgetComponent = WIDGET_COMPONENTS[widget.widget_type]

  return (
    <div className={`cockpit-widget-slot cockpit-widget-slot--${widget.size}`}>
      <div className="cockpit-widget-header">
        <span className="cockpit-widget-title">
          {meta?.label ?? widget.widget_type}
        </span>
        <button
          className="cockpit-widget-remove"
          onClick={onRemove}
          aria-label={`${meta?.label ?? widget.widget_type} entfernen`}
        >
          <X size={12} weight="bold" aria-hidden="true" />
        </button>
      </div>
      {WidgetComponent
        ? <WidgetComponent />
        : <p style={{ padding: '14px', color: 'var(--text-tertiary)', fontSize: 13, margin: 0 }}>Unbekanntes Widget</p>
      }
    </div>
  )
}
