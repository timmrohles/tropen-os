import React from 'react'
import { PencilSimple, FolderSimple, CaretRight, Trash } from '@phosphor-icons/react'

interface Project {
  id: string
  title: string
}

interface Conversation {
  id: string
  title: string | null
  project_id: string | null
}

interface ContextMenuProps {
  contextMenuId: string
  menuAnchor: { top: number; right: number }
  conversations: Conversation[]
  projects: Project[]
  contextMenuSubmenu: boolean
  contextMenuRef: React.RefObject<HTMLDivElement | null>
  onSetContextMenuId: (id: string | null) => void
  onSetMenuAnchor: (anchor: { top: number; right: number } | null) => void
  onSetContextMenuSubmenu: (fn: (v: boolean) => boolean) => void
  onSetEditingConvId: (id: string | null) => void
  onSetEditingTitle: (title: string) => void
  onSetConfirmDeleteId: (id: string | null) => void
  onAssignToProject: (convId: string, projectId: string | null) => void
}

export default function ContextMenu({
  contextMenuId,
  menuAnchor,
  conversations,
  projects,
  contextMenuSubmenu,
  contextMenuRef,
  onSetContextMenuId,
  onSetMenuAnchor,
  onSetContextMenuSubmenu,
  onSetEditingConvId,
  onSetEditingTitle,
  onSetConfirmDeleteId,
  onAssignToProject,
}: ContextMenuProps) {
  const menuConv = conversations.find((c) => c.id === contextMenuId)
  if (!menuConv) return null

  return (
    <div
      ref={contextMenuRef}
      className="wl-ctx-menu"
      style={{ position: 'fixed', top: menuAnchor.top, right: menuAnchor.right }}
      onClick={(e) => e.stopPropagation()}
    >
      <button className="wl-ctx-item" onMouseDown={(e) => {
        e.stopPropagation()
        onSetContextMenuId(null)
        onSetMenuAnchor(null)
        onSetEditingConvId(menuConv.id)
        onSetEditingTitle(menuConv.title ?? 'Unterhaltung')
      }}>
        <PencilSimple size={15} weight="bold" className="wl-ctx-icon" />
        Umbenennen
      </button>
      <button className="wl-ctx-item" onMouseDown={(e) => {
        e.stopPropagation()
        onSetContextMenuSubmenu((v) => !v)
      }}>
        <FolderSimple size={15} weight="bold" className="wl-ctx-icon" />
        Zu Projekt
        <CaretRight size={13} weight="bold" className="wl-ctx-caret" style={{ transform: contextMenuSubmenu ? 'rotate(90deg)' : undefined, transition: 'transform 0.15s' }} />
      </button>
      {contextMenuSubmenu && (
        <div className="wl-ctx-submenu">
          {projects.length === 0 ? (
            <div className="wl-ctx-item wl-ctx-item--disabled">Keine Projekte</div>
          ) : projects.map((p) => (
            <button key={p.id} className="wl-ctx-item" onMouseDown={(e) => {
              e.stopPropagation()
              onSetMenuAnchor(null)
              onAssignToProject(menuConv.id, p.id)
            }}>{p.title}</button>
          ))}
        </div>
      )}
      {menuConv.project_id && (
        <button className="wl-ctx-item" onMouseDown={(e) => {
          e.stopPropagation()
          onSetMenuAnchor(null)
          onAssignToProject(menuConv.id, null)
        }}>
          <FolderSimple size={15} weight="bold" className="wl-ctx-icon" />
          Aus Projekt entfernen
        </button>
      )}
      <div className="wl-ctx-divider" />
      <button className="wl-ctx-item wl-ctx-item--danger" onMouseDown={(e) => {
        e.stopPropagation()
        onSetContextMenuId(null)
        onSetMenuAnchor(null)
        onSetConfirmDeleteId(menuConv.id)
      }}>
        <Trash size={15} weight="bold" />
        Löschen
      </button>
    </div>
  )
}
