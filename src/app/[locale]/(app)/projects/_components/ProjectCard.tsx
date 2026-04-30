'use client'

import { createElement } from 'react'
import { Brain, ChatCircle, DotsThree, ShareNetwork } from '@phosphor-icons/react'
import { type Project, formatRelDate, getProjectIcon } from './types'

export function ProjectCard({
  project, isSelected, onClick, onChatStart, onSaveToWorkspace,
}: {
  project: Project
  isSelected: boolean
  onClick: () => void
  onChatStart: () => void
  onSaveToWorkspace: () => void
}) {
  const memCount = project.project_memory?.[0]?.count ?? 0
  return (
    <div
      className={`card project-card${isSelected ? ' project-card--selected' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick()}
      aria-pressed={isSelected}
      aria-label={`Projekt ${project.title} öffnen`}
    >
      <div className="project-card-header">
        {createElement(getProjectIcon(project.emoji), { size: 18, weight: 'fill', className: 'project-card-emoji', 'aria-hidden': 'true' })}
        <span className="project-card-title">{project.title}</span>
        <button
          className="btn-icon project-card-menu"
          onClick={e => { e.stopPropagation(); onSaveToWorkspace() }}
          aria-label="In Workspace ablegen"
          title="In Workspace ablegen"
        >
          <ShareNetwork size={15} weight="bold" />
        </button>
        <button
          className="btn-icon project-card-menu"
          onClick={e => { e.stopPropagation(); onClick() }}
          aria-label="Projekt-Optionen"
          title="Optionen"
        >
          <DotsThree size={16} weight="bold" />
        </button>
      </div>

      {project.context && (
        <p className="project-card-desc">{project.context}</p>
      )}

      <div className="project-card-meta">
        {memCount > 0 && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Brain size={11} weight="fill" aria-hidden="true" />
            {memCount} {memCount === 1 ? 'Erinnerung' : 'Erinnerungen'}
          </span>
        )}
        <span>{formatRelDate(project.updated_at)}</span>
      </div>

      <button
        className="btn btn-ghost btn-sm project-card-chat-btn"
        onClick={e => { e.stopPropagation(); onChatStart() }}
        aria-label={`Chat in Projekt ${project.title} starten`}
      >
        <ChatCircle size={14} weight="bold" aria-hidden="true" />
        Chat starten
      </button>
    </div>
  )
}
