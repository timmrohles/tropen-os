'use client'

import React from 'react'
import { DotsThreeVertical } from '@phosphor-icons/react'
import { type Conversation, formatDate } from '@/hooks/useWorkspaceState'

interface ConvItemProps {
  conv: Conversation
  indented: boolean
  activeConvId: string | null
  hoveredId: string | null
  confirmDeleteId: string | null
  deleting: boolean
  editingConvId: string | null
  editingTitle: string
  contextMenuId: string | null
  selectMode: boolean
  selectedIds: Set<string>
  renameInputRef: React.RefObject<HTMLInputElement>
  escapeEditRef: React.MutableRefObject<boolean>
  onSelectConv: (id: string) => void
  onHover: (id: string | null) => void
  onConfirmDelete: (id: string) => void
  onCancelDelete: () => void
  onDelete: (id: string) => void
  onRename: (id: string, title: string) => void
  onStartEdit: (id: string, title: string) => void
  onCancelEdit: () => void
  onToggleSelect: (id: string) => void
  onContextMenu: (id: string | null, anchor: { top: number; right: number } | null) => void
  onDragStart: (id: string) => void
  onDragEnd: () => void
}

export default function ConvItem({
  conv,
  indented,
  activeConvId,
  hoveredId,
  confirmDeleteId,
  deleting,
  editingConvId,
  editingTitle,
  contextMenuId,
  selectMode,
  selectedIds,
  renameInputRef,
  escapeEditRef,
  onSelectConv,
  onHover,
  onConfirmDelete: _onConfirmDelete,
  onCancelDelete,
  onDelete,
  onRename,
  onStartEdit,
  onCancelEdit,
  onToggleSelect,
  onContextMenu,
  onDragStart,
  onDragEnd,
}: ConvItemProps) {
  const isActive = activeConvId === conv.id
  const isConfirming = confirmDeleteId === conv.id
  const isHovered = hoveredId === conv.id
  const isEditing = editingConvId === conv.id
  const hasContextMenu = contextMenuId === conv.id
  const isChecked = selectedIds.has(conv.id)

  if (isConfirming) {
    return (
      <div className="ci-confirm">
        <span className="ci-confirm-text">Löschen?</span>
        <button className="ci-confirm-yes" onClick={() => onDelete(conv.id)} disabled={deleting}>Ja</button>
        <button className="ci-confirm-no" onClick={() => onCancelDelete()}>Nein</button>
      </div>
    )
  }

  return (
    <div
      className={`ci${indented ? ' ci--indented' : ''}${isActive ? ' ci--active' : ''}${selectMode ? ' ci--select-mode' : ''}`}
      onClick={() => {
        if (selectMode) { onToggleSelect(conv.id); return }
        if (!isEditing) { onSelectConv(conv.id) }
      }}
      onMouseEnter={() => onHover(conv.id)}
      onMouseLeave={() => onHover(null)}
      draggable={!isEditing && !selectMode}
      onDragStart={(e) => { e.stopPropagation(); e.dataTransfer.setData('text/plain', conv.id); e.dataTransfer.effectAllowed = 'move'; onDragStart(conv.id) }}
      onDragEnd={() => onDragEnd()}
    >
      <input
        type="checkbox"
        className="ci-checkbox"
        checked={isChecked}
        draggable={false}
        onMouseDown={(e) => e.stopPropagation()}
        onChange={() => onToggleSelect(conv.id)}
        onClick={(e) => e.stopPropagation()}
      />
      {!selectMode && (
        <div className="ci-drag" onMouseDown={(e) => e.stopPropagation()}>⠿</div>
      )}
      <div className="ci-body">
        {isEditing ? (
          <input
            ref={renameInputRef}
            className="ci-rename-input"
            defaultValue={editingTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); onRename(conv.id, renameInputRef.current?.value ?? '') }
              if (e.key === 'Escape') { escapeEditRef.current = true; onCancelEdit() }
            }}
            onBlur={() => {
              if (escapeEditRef.current) { escapeEditRef.current = false; return }
              onRename(conv.id, renameInputRef.current?.value ?? '')
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div className="ci-title-row">
            <div
              className="ci-title"
              onDoubleClick={(e) => {
                e.stopPropagation()
                onStartEdit(conv.id, conv.title ?? 'Unterhaltung')
              }}
            >{conv.title ?? 'Unterhaltung'}</div>
          </div>
        )}
        <div className="ci-meta">
          <span className="ci-date">{formatDate(conv.created_at)}</span>
          {conv.task_type && <span className="ci-badge">{conv.task_type}</span>}
        </div>
      </div>
      {!isEditing && (
        <button
          className={`ci-menu-btn${hasContextMenu ? ' ci-menu-btn--active' : ''}`}
          onMouseDown={(e) => {
            e.stopPropagation()
            if (hasContextMenu) {
              onContextMenu(null, null)
            } else {
              const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect()
              onContextMenu(conv.id, { top: rect.bottom + 4, right: window.innerWidth - rect.right })
            }
          }}
          title="Optionen"
        >
          <DotsThreeVertical size={16} weight="bold" />
        </button>
      )}
    </div>
  )
}
