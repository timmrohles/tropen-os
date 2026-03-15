'use client'

import React from 'react'
import {
  Folder, Image as ImageIcon, FileText, Code as CodeIcon,
  Lock, CaretRight, CaretDown, PencilSimple, X, CheckSquare,
} from '@phosphor-icons/react'
import ConvItem from './ConvItem'
import { PERIODS, TASK_TYPES } from '@/hooks/useWorkspaceState'
import type { Conversation, Project, PeriodValue, TaskValue } from '@/hooks/useWorkspaceState'

// ─────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────

interface ProjectSidebarProps {
  // Data
  conversations: Conversation[]
  projects: Project[]
  filteredConvs: Conversation[]
  search: string
  periodFilter: PeriodValue
  taskFilter: TaskValue
  dropdownOpen: boolean
  hasActiveFilters: boolean
  activePeriodLabel: string | undefined
  creatingProject: boolean
  newProjectName: string
  collapsedProjects: Set<string>
  editingProjectId: string | null
  editingProjectName: string
  hoveredProjectId: string | null
  dragConvId: string | null
  dragOverId: string | null
  selectMode: boolean
  // Refs
  searchWrapRef: React.RefObject<HTMLDivElement>
  projectRenameInputRef: React.RefObject<HTMLInputElement>
  escapeProjectEditRef: React.MutableRefObject<boolean>

  // ConvItem Props
  activeConvId: string | null
  hoveredId: string | null
  confirmDeleteId: string | null
  deleting: boolean
  editingConvId: string | null
  editingTitle: string
  contextMenuId: string | null
  selectedIds: Set<string>
  renameInputRef: React.RefObject<HTMLInputElement>
  escapeEditRef: React.MutableRefObject<boolean>

  // Callbacks - Filter/Search
  onSetSearch: (v: string) => void
  onSetPeriodFilter: (v: PeriodValue) => void
  onSetTaskFilter: (v: TaskValue) => void
  onSetDropdownOpen: (v: boolean) => void

  // Callbacks - Projekte
  onSetCreatingProject: (v: boolean) => void
  onSetNewProjectName: (v: string) => void
  onCreateProject: () => void
  onSetCollapsedProjects: (fn: (prev: Set<string>) => Set<string>) => void
  onSetEditingProjectId: (id: string | null) => void
  onSetEditingProjectName: (name: string) => void
  onRenameProject: (id: string, name: string) => void
  onDeleteProject: (id: string) => void
  onSetHoveredProjectId: (id: string | null) => void
  onSetDragConvId: (id: string | null) => void
  onSetDragOverId: (id: string | null) => void
  onAssignToProject: (convId: string, projectId: string | null) => void

  // Callbacks - Select
  onSetSelectMode: (fn: (prev: boolean) => boolean) => void
  onSetSelectedIds: (ids: Set<string>) => void

  // Callbacks - ConvItem
  onSetActiveConvId: (id: string | null) => void
  onSetHoveredId: (id: string | null) => void
  onSetConfirmDeleteId: (id: string | null) => void
  onDeleteConversation: (id: string) => void
  onRenameConversation: (id: string, title: string) => void
  onStartEdit: (id: string, title: string) => void
  onCancelEdit: () => void
  onToggleSelect: (id: string) => void
  onSetContextMenuId: (id: string | null) => void
  onSetMenuAnchor: (anchor: { top: number; right: number } | null) => void
  onSetContextMenuSubmenu: (v: boolean) => void
}

// ─────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────

export default function ProjectSidebar({
  // Data
  projects,
  filteredConvs,
  search,
  periodFilter,
  taskFilter,
  dropdownOpen,
  hasActiveFilters,
  activePeriodLabel,
  creatingProject,
  newProjectName,
  collapsedProjects,
  editingProjectId,
  editingProjectName,
  hoveredProjectId,
  dragConvId,
  dragOverId,
  selectMode,

  // Refs
  searchWrapRef,
  projectRenameInputRef,
  escapeProjectEditRef,

  // ConvItem props
  activeConvId,
  hoveredId,
  confirmDeleteId,
  deleting,
  editingConvId,
  editingTitle,
  contextMenuId,
  selectedIds,
  renameInputRef,
  escapeEditRef,

  // Callbacks - Filter/Search
  onSetSearch,
  onSetPeriodFilter,
  onSetTaskFilter,
  onSetDropdownOpen,

  // Callbacks - Projekte
  onSetCreatingProject,
  onSetNewProjectName,
  onCreateProject,
  onSetCollapsedProjects,
  onSetEditingProjectId,
  onSetEditingProjectName,
  onRenameProject,
  onDeleteProject,
  onSetHoveredProjectId,
  onSetDragConvId,
  onSetDragOverId,
  onAssignToProject,

  // Callbacks - Select
  onSetSelectMode,
  onSetSelectedIds,

  // Callbacks - ConvItem
  onSetActiveConvId,
  onSetHoveredId,
  onSetConfirmDeleteId,
  onDeleteConversation,
  onRenameConversation,
  onStartEdit,
  onCancelEdit,
  onToggleSelect,
  onSetContextMenuId,
  onSetMenuAnchor,
  onSetContextMenuSubmenu,
}: ProjectSidebarProps) {

  function renderConvItem(conv: Conversation, indented: boolean) {
    return (
      <ConvItem
        key={conv.id}
        conv={conv}
        indented={indented}
        activeConvId={activeConvId}
        hoveredId={hoveredId}
        confirmDeleteId={confirmDeleteId}
        deleting={deleting}
        editingConvId={editingConvId}
        editingTitle={editingTitle}
        contextMenuId={contextMenuId}
        selectMode={selectMode}
        selectedIds={selectedIds}
        renameInputRef={renameInputRef}
        escapeEditRef={escapeEditRef}
        onSelectConv={(id) => { onSetActiveConvId(id); onSetConfirmDeleteId(null) }}
        onHover={onSetHoveredId}
        onConfirmDelete={onSetConfirmDeleteId}
        onCancelDelete={() => onSetConfirmDeleteId(null)}
        onDelete={onDeleteConversation}
        onRename={onRenameConversation}
        onStartEdit={onStartEdit}
        onCancelEdit={onCancelEdit}
        onToggleSelect={onToggleSelect}
        onContextMenu={(id, anchor) => {
          onSetContextMenuId(id)
          onSetMenuAnchor(anchor)
          onSetContextMenuSubmenu(false)
        }}
        onDragStart={onSetDragConvId}
        onDragEnd={() => { onSetDragConvId(null); onSetDragOverId(null) }}
      />
    )
  }

  return (
    <>
      {/* Project Create Input */}
      {creatingProject && (
        <div className="ps-project-create-row">
          <input
            className="ps-project-create-input"
            placeholder="Projektname…"
            value={newProjectName}
            onChange={(e) => onSetNewProjectName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); onCreateProject() }
              if (e.key === 'Escape') { onSetCreatingProject(false); onSetNewProjectName('') }
            }}
            autoFocus
          />
        </div>
      )}

      {/* Suchfeld mit Filter-Dropdown */}
      <div className="ps-search-section" ref={searchWrapRef}>
        <div className="ps-search-box" onClick={() => onSetDropdownOpen(true)}>
          {activePeriodLabel && (
            <span
              className="ps-active-badge"
              onClick={(e) => { e.stopPropagation(); onSetPeriodFilter('all') }}
            >
              {activePeriodLabel} <span className="ps-badge-x">×</span>
            </span>
          )}
          {taskFilter !== 'all' && (
            <span
              className="ps-active-badge"
              onClick={(e) => { e.stopPropagation(); onSetTaskFilter('all') }}
            >
              {taskFilter} <span className="ps-badge-x">×</span>
            </span>
          )}
          <input
            className="ps-search-input"
            placeholder={hasActiveFilters ? '' : 'Suchen…'}
            value={search}
            onChange={(e) => onSetSearch(e.target.value)}
            onFocus={() => onSetDropdownOpen(true)}
          />
          <button
            className={`ps-filter-icon-btn${hasActiveFilters ? ' ps-filter-icon-btn--active' : ''}`}
            onClick={(e) => { e.stopPropagation(); onSetDropdownOpen(!dropdownOpen) }}
            title="Filter"
          >▾</button>
        </div>

        {dropdownOpen && (
          <div className="ps-filter-dropdown">
            <div className="ps-dropdown-section">
              <div className="ps-dropdown-label">Zeitraum</div>
              <div className="ps-chips-row">
                {PERIODS.map((p) => (
                  <button
                    key={p.value}
                    className={`ps-chip${periodFilter === p.value ? ' ps-chip--active' : ''}`}
                    onClick={() => onSetPeriodFilter(p.value)}
                  >{p.label}</button>
                ))}
              </div>
            </div>
            <div className="ps-dropdown-section">
              <div className="ps-dropdown-label">Task-Typ</div>
              <div className="ps-chips-row ps-chips-row--wrap">
                {TASK_TYPES.map((t) => (
                  <button
                    key={t.value}
                    className={`ps-chip${taskFilter === t.value ? ' ps-chip--active' : ''}`}
                    onClick={() => onSetTaskFilter(t.value)}
                  >{t.label}</button>
                ))}
              </div>
            </div>
            {hasActiveFilters && (
              <button
                className="ps-reset-btn"
                onClick={() => { onSetPeriodFilter('all'); onSetTaskFilter('all') }}
              >Filter zurücksetzen</button>
            )}
          </div>
        )}
      </div>

      {/* Conversation List mit Projekten */}
      <div className="ps-conv-list">

        {/* Projekt-Ordner */}
        {projects.map((project) => {
          const projectConvs = filteredConvs.filter((c) => c.project_id === project.id)
          const isCollapsed = collapsedProjects.has(project.id)
          const isDragOver = dragOverId === project.id
          return (
            <div
              key={project.id}
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; onSetDragOverId(project.id) }}
              onDragLeave={(e) => {
                const rel = e.relatedTarget as Node | null
                if (!rel || !e.currentTarget.contains(rel)) onSetDragOverId(null)
              }}
              onDrop={(e) => {
                e.preventDefault()
                const convId = e.dataTransfer.getData('text/plain') || dragConvId
                if (convId) onAssignToProject(convId, project.id)
                onSetDragOverId(null)
              }}
            >
              <div
                className={`ps-project-folder${isDragOver ? ' ps-project-folder--drag-over' : ''}`}
                onMouseEnter={() => onSetHoveredProjectId(project.id)}
                onMouseLeave={() => onSetHoveredProjectId(null)}
              >
                <button
                  className="ps-project-toggle"
                  onClick={() => onSetCollapsedProjects((prev) => {
                    const next = new Set(prev)
                    if (next.has(project.id)) next.delete(project.id)
                    else next.add(project.id)
                    return next
                  })}
                >{isCollapsed ? <CaretRight size={10} /> : <CaretDown size={10} />}</button>
                <span className="ps-project-icon"><Folder size={13} weight="fill" /></span>
                {editingProjectId === project.id ? (
                  <input
                    ref={projectRenameInputRef}
                    className="ps-rename-input"
                    defaultValue={editingProjectName}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); onRenameProject(project.id, projectRenameInputRef.current?.value ?? '') }
                      if (e.key === 'Escape') { escapeProjectEditRef.current = true; onSetEditingProjectId(null) }
                    }}
                    onBlur={() => {
                      if (escapeProjectEditRef.current) { escapeProjectEditRef.current = false; return }
                      onRenameProject(project.id, projectRenameInputRef.current?.value ?? '')
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span
                    className="ps-project-name"
                    onDoubleClick={(e) => {
                      e.stopPropagation()
                      onSetEditingProjectId(project.id)
                      onSetEditingProjectName(project.title)
                    }}
                  >{project.title}</span>
                )}
                {editingProjectId !== project.id && (
                  <button
                    className={`ps-rename-title-btn${hoveredProjectId === project.id ? ' ps-rename-title-btn--visible' : ''}`}
                    onMouseDown={(e) => {
                      e.stopPropagation()
                      onSetEditingProjectId(project.id)
                      onSetEditingProjectName(project.title)
                    }}
                    title="Umbenennen"
                  ><PencilSimple size={11} /></button>
                )}
                <button
                  className="ps-project-delete-btn"
                  onClick={(e) => { e.stopPropagation(); onDeleteProject(project.id) }}
                  title="Projekt löschen"
                ><X size={12} /></button>
              </div>
              {!isCollapsed && projectConvs.map((conv) => renderConvItem(conv, true))}
            </div>
          )
        })}

        {/* Ohne Projekt */}
        {(() => {
          const ungrouped = filteredConvs.filter((c) => !c.project_id)
          return (
            <>
              {projects.length > 0 && (
                <div
                  className={`ps-section-divider${dragOverId === 'none' ? ' ps-section-divider--drag-over' : ''}`}
                  onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; onSetDragOverId('none') }}
                  onDragLeave={() => onSetDragOverId(null)}
                  onDrop={(e) => {
                    e.preventDefault()
                    const convId = e.dataTransfer.getData('text/plain') || dragConvId
                    if (convId) onAssignToProject(convId, null)
                    onSetDragOverId(null)
                  }}
                >Ohne Projekt</div>
              )}
              {ungrouped.length === 0 && projects.length === 0 && (
                <div className="ps-conv-empty">
                  {search || hasActiveFilters ? 'Keine Treffer' : 'Noch keine Unterhaltungen'}
                </div>
              )}
              {ungrouped.map((conv) => renderConvItem(conv, false))}
            </>
          )
        })()}
      </div>

      {/* Medien-Ordner Teaser */}
      <div className="ps-media-teaser-section">
        <div className="ps-media-teaser-label">── Automatische Ordner ──</div>
        {[
          { icon: <ImageIcon size={13} weight="fill" />, label: 'Bilder' },
          { icon: <FileText size={13} weight="fill" />, label: 'Dokumente' },
          { icon: <CodeIcon size={13} weight="fill" />, label: 'Code' },
        ].map((item) => (
          <div
            key={item.label}
            className="ps-media-teaser-item"
            title="Sobald Datei-Upload verfügbar, sortiert Toro deine Chats automatisch nach Medientypen."
          >
            <span className="ps-media-teaser-lock"><Lock size={11} /></span>
            <span className="ps-media-teaser-icon">{item.icon}</span>
            <span className="ps-media-teaser-name">{item.label}</span>
            <span className="ps-media-teaser-soon">coming soon</span>
          </div>
        ))}
      </div>

      {/* Select Mode */}
      <div className="ps-jungle-bar">
        <button
          className={`ps-select-mode-btn${selectMode ? ' ps-select-mode-btn--active' : ''}`}
          onClick={() => { onSetSelectMode((v) => !v); onSetSelectedIds(new Set()) }}
          title="Chats auswählen"
        >
          <CheckSquare size={15} weight={selectMode ? 'fill' : 'regular'} />
        </button>
      </div>
    </>
  )
}
