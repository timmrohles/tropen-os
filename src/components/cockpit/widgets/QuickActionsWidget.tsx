'use client'

import {
  ChatCircle, FolderPlus, RssSimple, Lightning, SquaresFour, SlidersHorizontal,
} from '@phosphor-icons/react'
import type { ElementType } from 'react'

interface QuickAction {
  label: string
  href: string
  icon: ElementType
  primary: boolean
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: 'Neuer Chat',    href: '/chat',       icon: ChatCircle,         primary: true  },
  { label: 'Neues Projekt', href: '/projekte',   icon: FolderPlus,         primary: false },
  { label: 'Feeds',         href: '/feeds',      icon: RssSimple,          primary: false },
  { label: 'Artefakte',     href: '/artefakte',  icon: Lightning,          primary: false },
  { label: 'Workspaces',    href: '/workspaces', icon: SquaresFour,        primary: false },
  { label: 'Einstellungen', href: '/settings',   icon: SlidersHorizontal,  primary: false },
]

export function QuickActionsWidget() {
  return (
    <div className="widget-content">
      <div className="widget-quick-grid">
        {QUICK_ACTIONS.map(action => {
          const Icon = action.icon
          return (
            <a
              key={action.href}
              href={action.href}
              className={`widget-quick-btn${action.primary ? ' widget-quick-btn--primary' : ''}`}
            >
              <Icon size={16} weight="bold" aria-hidden="true" />
              <span>{action.label}</span>
            </a>
          )
        })}
      </div>
    </div>
  )
}
