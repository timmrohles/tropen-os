'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ChartBar, TreePalm, SignOut, Gear, Plus,
  ArrowsMerge, FolderSimple, FolderOpen, Trash, Books,
} from '@phosphor-icons/react'
import ProjectSidebar from './ProjectSidebar'
import Papierkorb from './Papierkorb'
import type { Project } from '@/hooks/useWorkspaceState'

function NavItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  const pathname = usePathname()
  const active = pathname === href || pathname.startsWith(href + '/')
  return (
    <Link href={href} className={`lnav-item${active ? ' lnav-item--active' : ''}`}>
      {icon}
      <span>{label}</span>
    </Link>
  )
}

type LeftNavProps = {
  workspaceName: string
  userInitial: string
  userFullName: string
  userEmail: string
  handleLogout: () => void
  onNewConversation: () => void
  onNewProject: () => void
  trashCount: number
  trashOpen: boolean
  trashConvs: Array<{ id: string; title: string | null }>
  trashLoading: boolean
  onToggleTrash: () => void
  onRestoreConv: (id: string) => void
  onHardDeleteConv: (id: string) => void
  // Edit mode
  selectMode: boolean
  selectedArr: string[]
  onEnterEditMode: () => void
  onClearSelection: () => void
  onOpenMergeModal: () => void
  onBulkSoftDelete: () => void
  onBulkAssignToProject: (projectId: string | null) => void
  projects: Project[]
} & Omit<React.ComponentProps<typeof ProjectSidebar>, 'projects'>

export default function LeftNav({
  userInitial,
  userFullName,
  userEmail,
  handleLogout,
  onNewConversation,
  onNewProject: _onNewProject,
  trashCount,
  trashOpen,
  trashConvs,
  trashLoading,
  onToggleTrash,
  onRestoreConv,
  onHardDeleteConv,
  workspaceName: _workspaceName,
  selectMode,
  selectedArr,
  onEnterEditMode,
  onClearSelection,
  onOpenMergeModal,
  onBulkSoftDelete,
  onBulkAssignToProject,
  projects,
  ...projectSidebarProps
}: LeftNavProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeAction, setActiveAction] = useState<'merge' | 'move' | 'delete' | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Reset action state when exiting edit mode
  useEffect(() => {
    if (!selectMode) {
      setActiveAction(null)
      setDeleteConfirm(false)
    }
  }, [selectMode])

  useEffect(() => {
    if (!menuOpen) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  function handleFertig() {
    onClearSelection()
    setActiveAction(null)
    setDeleteConfirm(false)
  }

  function handleMergeClick() {
    setActiveAction('merge')
    onOpenMergeModal()
  }

  function handleMoveClick() {
    setActiveAction(v => v === 'move' ? null : 'move')
    setDeleteConfirm(false)
  }

  function handleDeleteClick() {
    setActiveAction('delete')
    setDeleteConfirm(false)
  }

  function handleConfirmDelete() {
    onBulkSoftDelete()
    setDeleteConfirm(false)
    setActiveAction(null)
    onClearSelection()
  }

  const canMerge = selectedArr.length >= 2
  const canAct = selectedArr.length >= 1

  return (
    <nav className="lnav">
      {/* Logo */}
      <div className="lnav-logo">
        <TreePalm size={22} color="var(--accent)" weight="fill" />
        <span className="lnav-logo-text">Tropen OS</span>
      </div>

      {/* Navigation */}
      <div className="lnav-section">
        <span className="lnav-section-label t-dezent">Navigation</span>
        <NavItem href="/dashboard" icon={<ChartBar size={22} weight="fill" />} label="Dashboard" />
        <NavItem href="/projects" icon={<FolderOpen size={22} weight="fill" />} label="Projekte" />
        <NavItem href="/knowledge" icon={<Books size={22} weight="fill" />} label="Wissen" />

      </div>

      <div className="lnav-divider" />

      {/* Chats header – always visible */}
      <div className="lnav-chats-header">
        <span className="lnav-section-label t-dezent" style={{ padding: '10px 10px 6px' }}>Chats</span>
        <button
          className="lnav-edit-btn"
          onClick={selectMode ? handleFertig : onEnterEditMode}
        >
          {selectMode ? 'Fertig' : 'Bearbeiten'}
        </button>
      </div>

      {/* Scrollable conv list */}
      <div className="lnav-conv-list sidebar-scroll">
        <ProjectSidebar {...projectSidebarProps} projects={projects} selectMode={selectMode} />
        <Papierkorb
          trashCount={trashCount}
          trashOpen={trashOpen}
          trashConvs={trashConvs}
          trashLoading={trashLoading}
          onToggle={onToggleTrash}
          onRestore={onRestoreConv}
          onHardDelete={onHardDeleteConv}
        />
      </div>

      {/* Action buttons – only in edit mode */}
      {selectMode && (
        <div className="lnav-action-area">
          {activeAction !== 'delete' && (
            <button
              className={`lnav-action-btn${canMerge ? '' : ' lnav-action-btn--disabled'}`}
              disabled={!canMerge}
              onClick={handleMergeClick}
            >
              <ArrowsMerge size={14} />
              Zusammenführen
            </button>
          )}
          {activeAction !== 'merge' && activeAction !== 'delete' && (
            <button
              className={`lnav-action-btn${activeAction === 'move' ? ' lnav-action-btn--active' : ''}${canAct ? '' : ' lnav-action-btn--disabled'}`}
              disabled={!canAct}
              onClick={handleMoveClick}
            >
              <FolderSimple size={14} />
              Verschieben
            </button>
          )}
          {activeAction === 'move' && (
            <div className="lnav-move-list">
              <button
                className="lnav-move-item"
                onClick={() => { onBulkAssignToProject(null); handleFertig() }}
              >
                Kein Projekt
              </button>
              {projects.map((p) => (
                <button
                  key={p.id}
                  className="lnav-move-item"
                  onClick={() => { onBulkAssignToProject(p.id); handleFertig() }}
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}
          {activeAction !== 'merge' && activeAction !== 'move' && (
            <>
              {deleteConfirm ? (
                <div className="lnav-delete-confirm">
                  <span className="lnav-delete-confirm-label">{selectedArr.length} löschen?</span>
                  <button className="lnav-delete-confirm-yes" onClick={handleConfirmDelete}>Ja</button>
                  <button className="lnav-delete-confirm-no" onClick={() => { setDeleteConfirm(false); setActiveAction(null) }}>Nein</button>
                </div>
              ) : (
                <button
                  className={`lnav-action-btn lnav-action-btn--danger${canAct ? '' : ' lnav-action-btn--disabled'}`}
                  disabled={!canAct}
                  onClick={handleDeleteClick}
                >
                  <Trash size={14} />
                  Löschen
                </button>
              )}
            </>
          )}
          {activeAction === 'delete' && !deleteConfirm && (
            <div className="lnav-delete-confirm">
              <span className="lnav-delete-confirm-label">{selectedArr.length} Chat{selectedArr.length !== 1 ? 's' : ''} löschen?</span>
              <button className="lnav-delete-confirm-yes" onClick={handleConfirmDelete}>Ja</button>
              <button className="lnav-delete-confirm-no" onClick={() => setActiveAction(null)}>Nein</button>
            </div>
          )}
        </div>
      )}

      {/* Neuer Chat */}
      <button className="lnav-new-chat-btn" onClick={onNewConversation}>
        <Plus size={16} weight="bold" />
        Neuer Chat
      </button>

      {/* User bar with dropdown */}
      <div ref={menuRef} style={{ position: 'relative', flexShrink: 0 }}>
        {menuOpen && (
          <div className="lnav-user-menu">
            <Link href="/settings" className="lnav-menu-link" onClick={() => setMenuOpen(false)}>
              <Gear size={15} /> Einstellungen
            </Link>
            <div className="lnav-menu-divider" />
            <button className="lnav-menu-logout" onClick={() => { setMenuOpen(false); handleLogout() }}>
              <SignOut size={15} /> Abmelden
            </button>
          </div>
        )}
        <div className="lnav-user-bar" onClick={() => setMenuOpen(v => !v)}>
          <div className="lnav-user-avatar">{userInitial}</div>
          <div className="lnav-user-info">
            <span className="lnav-user-name">{userFullName || userEmail}</span>
            <span className="lnav-user-sub">{userEmail}</span>
          </div>
          <span className="lnav-user-chevron">{menuOpen ? '▴' : '▾'}</span>
        </div>
      </div>
    </nav>
  )
}
