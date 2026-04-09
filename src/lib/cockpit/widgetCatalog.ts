// Shared widget catalog — imported by both API routes and frontend components

export type WidgetSize = 'small' | 'medium' | 'large'

export interface WidgetMeta {
  type: string
  label: string
  size: WidgetSize
  adminOnly: boolean
}

export const WIDGET_CATALOG: WidgetMeta[] = [
  { type: 'feed_highlights',     label: 'Feed-Neuigkeiten',  size: 'medium', adminOnly: false },
  { type: 'toro_recommendation', label: 'Toro-Empfehlung',   size: 'medium', adminOnly: false },
  { type: 'recent_activity',     label: 'Zuletzt aktiv',     size: 'medium', adminOnly: false },
  { type: 'project_status',      label: 'Projekte',          size: 'small',  adminOnly: false },
  { type: 'artifact_overview',   label: 'Artefakte',         size: 'small',  adminOnly: false },
  { type: 'team_activity',       label: 'Team-Aktivität',    size: 'medium', adminOnly: true  },
  { type: 'budget_usage',        label: 'Kosten & Budget',   size: 'small',  adminOnly: true  },
  { type: 'quick_actions',       label: 'Schnellzugriff',    size: 'medium', adminOnly: false },
  { type: 'code_health',         label: 'Code Health',        size: 'small',  adminOnly: true  },
]

export const VALID_WIDGET_TYPES = new Set(WIDGET_CATALOG.map(w => w.type))

export const ROLE_PRESET_WIDGETS: Record<string, string[]> = {
  ceo:        ['budget_usage', 'team_activity', 'project_status', 'feed_highlights', 'toro_recommendation', 'recent_activity'],
  marketing:  ['feed_highlights', 'artifact_overview', 'recent_activity', 'toro_recommendation', 'project_status', 'quick_actions'],
  sales:      ['feed_highlights', 'toro_recommendation', 'recent_activity', 'project_status', 'artifact_overview', 'quick_actions'],
  operations: ['team_activity', 'budget_usage', 'project_status', 'recent_activity', 'feed_highlights', 'artifact_overview'],
  analyst:    ['feed_highlights', 'artifact_overview', 'recent_activity', 'toro_recommendation', 'project_status', 'quick_actions'],
  custom:     [],
}

export const ROLE_PRESETS = {
  ceo:        { label: 'Geschäftsführung' },
  marketing:  { label: 'Marketing'        },
  sales:      { label: 'Vertrieb'         },
  operations: { label: 'Operations'       },
  analyst:    { label: 'Analyse'          },
  custom:     { label: 'Selbst wählen'    },
} as const
