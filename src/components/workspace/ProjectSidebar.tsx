'use client'

import React from 'react'
import {
  Folder, Image as ImageIcon, FileText, Code as CodeIcon,
  Lock, CaretRight, CaretDown, PencilSimple, X, CheckSquare,
} from '@phosphor-icons/react'
import Parrot from '@/components/Parrot'
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
  jungleActive: boolean
  jungleLoading: boolean
  ungroupedCount: number

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

  // Callbacks - Jungle
  onOpenJungleModal: () => void
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
// Styles
// ─────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  // Search + Dropdown
  searchSection: { padding: '8px 10px 6px', position: 'relative' },
  searchBox: {
    display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4,
    background: '#1a1a1a', border: '1px solid #252525',
    borderRadius: 6, padding: '4px 6px', minHeight: 30, cursor: 'text',
  },
  activeBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 3,
    background: '#134e4a', border: '1px solid #14b8a6',
    color: '#14b8a6', fontSize: 10, padding: '1px 6px',
    borderRadius: 20, cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none',
  },
  badgeX: { opacity: 0.7, fontSize: 11 },
  searchInput: {
    flex: 1, minWidth: 40, background: 'transparent', border: 'none',
    color: '#ccc', fontSize: 12, outline: 'none',
  },
  filterIconBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: 13, padding: '0 2px', flexShrink: 0, lineHeight: 1,
  },
  filterDropdown: {
    position: 'absolute', top: '100%', left: 10, right: 10, marginTop: 2,
    background: '#161616', border: '1px solid #252525',
    borderRadius: 8, padding: '10px 12px',
    zIndex: 100, boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
    display: 'flex', flexDirection: 'column', gap: 10,
  },
  dropdownSection: { display: 'flex', flexDirection: 'column', gap: 6 },
  dropdownLabel: { fontSize: 10, color: '#555', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' },
  chipsRow: { display: 'flex', gap: 4, overflowX: 'auto' },
  chip: {
    flexShrink: 0, fontSize: 10, padding: '3px 8px', borderRadius: 20,
    border: '1px solid #2a2a2a', background: '#1a1a1a', color: '#555',
    cursor: 'pointer', whiteSpace: 'nowrap',
  },
  chipActive: { background: '#14b8a6', border: '1px solid #14b8a6', color: '#000', fontWeight: 600 },
  resetBtn: {
    fontSize: 10, color: '#3a3a3a', background: 'none', border: 'none',
    cursor: 'pointer', textAlign: 'left', padding: 0, textDecoration: 'underline',
  },

  // Projekt
  projectCreateRow: { padding: '6px 10px', borderBottom: '1px solid #1a1a1a' },
  projectCreateInput: {
    background: 'transparent', border: 'none',
    borderBottom: '1px solid #14b8a6', outline: 'none',
    color: '#ccc', fontSize: 12, width: '100%', padding: '2px 0',
  },
  projectFolder: {
    display: 'flex', alignItems: 'center', gap: 4,
    padding: '5px 10px 5px 8px', margin: '2px 6px', borderRadius: 6,
    cursor: 'pointer', transition: 'background 0.1s',
    border: '1px solid transparent',
  },
  projectDragOver: { border: '1px solid #14b8a6', background: '#0d2926' },
  projectToggle: {
    background: 'none', border: 'none', color: '#555',
    fontSize: 9, cursor: 'pointer', padding: '0 2px', flexShrink: 0, lineHeight: 1,
  },
  projectIcon: { fontSize: 12, flexShrink: 0 },
  projectName: {
    fontSize: 12, color: '#aaa', flex: 1, fontWeight: 500,
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  projectDeleteBtn: {
    background: 'none', border: 'none', color: '#3a3a3a',
    cursor: 'pointer', fontSize: 15, padding: '0 2px', flexShrink: 0, lineHeight: 1,
  },
  renameTitleBtn: {
    background: 'none', border: 'none', color: '#555',
    cursor: 'pointer', fontSize: 10, padding: '0 1px',
    flexShrink: 0, lineHeight: 1, opacity: 0.8,
  },
  renameInput: {
    background: 'transparent', border: 'none',
    borderBottom: '1px solid #14b8a6', outline: 'none',
    color: '#ccc', fontSize: 12, width: '100%',
    padding: '2px 0',
  },

  sectionDivider: {
    fontSize: 10, color: '#555', fontWeight: 600,
    textTransform: 'uppercase', letterSpacing: '0.06em',
    padding: '8px 16px 4px', marginTop: 4,
    borderTopWidth: '1px', borderTopStyle: 'solid', borderTopColor: '#1a1a1a',
    cursor: 'default', transition: 'color 0.1s, border-top-color 0.1s',
  },

  // Conversation List
  convList: { flex: 1, overflowY: 'auto', padding: '6px 0' },
  convEmpty: { fontSize: 12, color: '#555', padding: '14px 16px' },

  // Media Teaser
  mediaTeaserSection: {
    padding: '6px 0 2px', borderTop: '1px solid #161616', flexShrink: 0,
  },
  mediaTeaserLabel: {
    fontSize: 10, color: '#282828', fontWeight: 600,
    padding: '4px 14px 2px', letterSpacing: '0.04em',
  },
  mediaTeaserItem: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '4px 14px', opacity: 0.5, cursor: 'default',
  },
  mediaTeaserLock: { fontSize: 9, color: '#2a2a2a' },
  mediaTeaserIcon: { fontSize: 12, color: '#2a2a2a' },
  mediaTeaserName: { fontSize: 11, color: '#2a2a2a', flex: 1 },
  mediaTeaserSoon: { fontSize: 9, color: '#252525', fontStyle: 'italic' },

  // Jungle Bar
  jungleBar: {
    padding: '8px 10px', borderTop: '1px solid #1f6b4a',
  },
  jungleSplit: {
    display: 'flex', borderRadius: 8, overflow: 'hidden',
    background: 'var(--accent)',
  },
  jungleBtn: {
    flex: 1, background: 'transparent', border: 'none',
    color: '#000', fontSize: 15, fontWeight: 700,
    padding: '9px 0 9px 10px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 6,
    transition: 'opacity 0.15s',
  },
  jungleBtnDisabled: { opacity: 0.35, cursor: 'not-allowed' },
  selectModeBtn: {
    background: 'transparent', border: 'none', borderLeft: '1px solid rgba(0,0,0,0.2)',
    color: '#000', width: 38, cursor: 'pointer', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background 0.15s',
  },
  selectModeBtnActive: { background: 'rgba(0,0,0,0.18)', color: '#000' },
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
  jungleActive,
  jungleLoading,
  ungroupedCount,

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

  // Callbacks - Jungle
  onOpenJungleModal,
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
        <div style={s.projectCreateRow}>
          <input
            style={s.projectCreateInput}
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
      <div style={s.searchSection} ref={searchWrapRef}>
        <div style={s.searchBox} onClick={() => onSetDropdownOpen(true)}>
          {activePeriodLabel && (
            <span
              style={s.activeBadge}
              onClick={(e) => { e.stopPropagation(); onSetPeriodFilter('all') }}
            >
              {activePeriodLabel} <span style={s.badgeX}>×</span>
            </span>
          )}
          {taskFilter !== 'all' && (
            <span
              style={s.activeBadge}
              onClick={(e) => { e.stopPropagation(); onSetTaskFilter('all') }}
            >
              {taskFilter} <span style={s.badgeX}>×</span>
            </span>
          )}
          <input
            style={s.searchInput}
            placeholder={hasActiveFilters ? '' : 'Suchen…'}
            value={search}
            onChange={(e) => onSetSearch(e.target.value)}
            onFocus={() => onSetDropdownOpen(true)}
          />
          <button
            style={{ ...s.filterIconBtn, color: hasActiveFilters ? '#14b8a6' : '#444' }}
            onClick={(e) => { e.stopPropagation(); onSetDropdownOpen(!dropdownOpen) }}
            title="Filter"
          >▾</button>
        </div>

        {dropdownOpen && (
          <div style={s.filterDropdown}>
            <div style={s.dropdownSection}>
              <div style={s.dropdownLabel}>Zeitraum</div>
              <div style={s.chipsRow}>
                {PERIODS.map((p) => (
                  <button
                    key={p.value}
                    style={periodFilter === p.value ? { ...s.chip, ...s.chipActive } : s.chip}
                    onClick={() => onSetPeriodFilter(p.value)}
                  >{p.label}</button>
                ))}
              </div>
            </div>
            <div style={s.dropdownSection}>
              <div style={s.dropdownLabel}>Task-Typ</div>
              <div style={{ ...s.chipsRow, flexWrap: 'wrap' }}>
                {TASK_TYPES.map((t) => (
                  <button
                    key={t.value}
                    style={taskFilter === t.value ? { ...s.chip, ...s.chipActive } : s.chip}
                    onClick={() => onSetTaskFilter(t.value)}
                  >{t.label}</button>
                ))}
              </div>
            </div>
            {hasActiveFilters && (
              <button
                style={s.resetBtn}
                onClick={() => { onSetPeriodFilter('all'); onSetTaskFilter('all') }}
              >Filter zurücksetzen</button>
            )}
          </div>
        )}
      </div>

      {/* Conversation List mit Projekten */}
      <div style={s.convList}>

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
                if (dragConvId) onAssignToProject(dragConvId, project.id)
                else onSetDragOverId(null)
              }}
            >
              <div
                style={{ ...s.projectFolder, ...(isDragOver ? s.projectDragOver : {}) }}
                onMouseEnter={() => onSetHoveredProjectId(project.id)}
                onMouseLeave={() => onSetHoveredProjectId(null)}
              >
                <button
                  style={s.projectToggle}
                  onClick={() => onSetCollapsedProjects((prev) => {
                    const next = new Set(prev)
                    if (next.has(project.id)) next.delete(project.id)
                    else next.add(project.id)
                    return next
                  })}
                >{isCollapsed ? <CaretRight size={10} /> : <CaretDown size={10} />}</button>
                <span style={s.projectIcon}><Folder size={13} weight="duotone" /></span>
                {editingProjectId === project.id ? (
                  <input
                    ref={projectRenameInputRef}
                    style={s.renameInput}
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
                    style={s.projectName}
                    onDoubleClick={(e) => {
                      e.stopPropagation()
                      onSetEditingProjectId(project.id)
                      onSetEditingProjectName(project.name)
                    }}
                  >{project.name}</span>
                )}
                {editingProjectId !== project.id && (
                  <button
                    style={{ ...s.renameTitleBtn, opacity: hoveredProjectId === project.id ? 0.8 : 0.2 }}
                    onMouseDown={(e) => {
                      e.stopPropagation()
                      onSetEditingProjectId(project.id)
                      onSetEditingProjectName(project.name)
                    }}
                    title="Umbenennen"
                  ><PencilSimple size={11} /></button>
                )}
                <button
                  style={s.projectDeleteBtn}
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
                  style={{
                    ...s.sectionDivider,
                    ...(dragOverId === 'none' ? { borderTopColor: '#14b8a6', color: '#14b8a6' } : {}),
                  }}
                  onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; onSetDragOverId('none') }}
                  onDragLeave={() => onSetDragOverId(null)}
                  onDrop={(e) => {
                    e.preventDefault()
                    if (dragConvId) onAssignToProject(dragConvId, null)
                    else onSetDragOverId(null)
                  }}
                >Ohne Projekt</div>
              )}
              {ungrouped.length === 0 && projects.length === 0 && (
                <div style={s.convEmpty}>
                  {search || hasActiveFilters ? 'Keine Treffer' : 'Noch keine Unterhaltungen'}
                </div>
              )}
              {ungrouped.map((conv) => renderConvItem(conv, false))}
            </>
          )
        })()}
      </div>

      {/* Medien-Ordner Teaser */}
      <div style={s.mediaTeaserSection}>
        <div style={s.mediaTeaserLabel}>── Automatische Ordner ──</div>
        {[
          { icon: <ImageIcon size={13} weight="duotone" />, label: 'Bilder' },
          { icon: <FileText size={13} weight="duotone" />, label: 'Dokumente' },
          { icon: <CodeIcon size={13} weight="duotone" />, label: 'Code' },
        ].map((item) => (
          <div
            key={item.label}
            style={s.mediaTeaserItem}
            title="Sobald Datei-Upload verfügbar, sortiert Toro deine Chats automatisch nach Medientypen."
          >
            <span style={s.mediaTeaserLock}><Lock size={11} /></span>
            <span style={s.mediaTeaserIcon}>{item.icon}</span>
            <span style={s.mediaTeaserName}>{item.label}</span>
            <span style={s.mediaTeaserSoon}>coming soon</span>
          </div>
        ))}
      </div>

      {/* Ordnung im Dschungel */}
      <div style={s.jungleBar}>
        <div style={{ ...s.jungleSplit, ...(!jungleActive ? { opacity: 0.35 } : {}) }}>
          <button
            style={{ ...s.jungleBtn, ...(!jungleActive ? s.jungleBtnDisabled : {}) }}
            disabled={!jungleActive || jungleLoading}
            onClick={onOpenJungleModal}
            title={jungleActive
              ? 'Toro analysiert deine Chats und schlägt eine sinnvolle Struktur vor'
              : `Noch ${5 - ungroupedCount} Chats ohne Projekt nötig`}
          >
            <Parrot size={16} />
            {jungleLoading ? 'analysiert…' : 'Ordnung im Dschungel'}
          </button>
          <button
            style={{ ...s.selectModeBtn, ...(selectMode ? s.selectModeBtnActive : {}) }}
            onClick={() => { onSetSelectMode((v) => !v); onSetSelectedIds(new Set()) }}
            title="Chats auswählen"
          >
            <CheckSquare size={15} weight={selectMode ? 'fill' : 'regular'} />
          </button>
        </div>
      </div>
    </>
  )
}
