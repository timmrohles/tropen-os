'use client'

import React, { useEffect, useImperativeHandle, useRef, useState, useCallback, forwardRef } from 'react'
import { createPortal } from 'react-dom'
import { DotsThree, FolderSimple, MagnifyingGlass, PencilSimple, Trash, TextAlignLeft, SquaresFour, X } from '@phosphor-icons/react'
import ArtifactsDrawer from './ArtifactsDrawer'

interface ProjectItem {
  id: string
  title: string
}

interface ChatHeaderStripProps {
  conversationId: string | null
  conversationTitle?: string | null
  projectId?: string | null
  projects?: ProjectItem[]
  workspaceId?: string
  onOpenSearch?: () => void
  onRenameConversation?: (id: string, title: string) => void
  onAssignToProject?: (convId: string, projectId: string | null) => void
  onDeleteConversation?: (id: string) => void
  onSummarizeArtifacts?: () => void
  onShowArtifactsView?: () => void
}

export interface ChatHeaderStripHandle {
  refresh: () => void
}

const ChatHeaderStrip = forwardRef<ChatHeaderStripHandle, ChatHeaderStripProps>(
  function ChatHeaderStrip({
    conversationId,
    conversationTitle,
    projectId,
    projects = [],
    workspaceId,
    onOpenSearch,
    onRenameConversation,
    onAssignToProject,
    onDeleteConversation,
    onSummarizeArtifacts,
    onShowArtifactsView,
  }, ref) {
    const [artifactCount, setArtifactCount] = useState(0)
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [slotEl, setSlotEl] = useState<Element | null>(null)

    // Rename state
    const [editing, setEditing] = useState(false)
    const [editValue, setEditValue] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)

    // Menu state
    const [menuOpen, setMenuOpen] = useState(false)
    const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null)
    const menuBtnRef = useRef<HTMLButtonElement>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Project sub-menu
    const [projOpen, setProjOpen] = useState(false)

    useEffect(() => { setMounted(true) }, [])

    // Find the topbar slot after mount
    useEffect(() => {
      if (mounted) setSlotEl(document.getElementById('topbar-chat-slot'))
    }, [mounted])

    const fetchCounts = useCallback(async () => {
      if (!conversationId || conversationId.startsWith('temp-')) {
        setArtifactCount(0)
        return
      }
      try {
        const res = await fetch(`/api/artifacts?conversationId=${conversationId}`)
        if (res.ok) {
          const arts = await res.json()
          setArtifactCount(Array.isArray(arts) ? arts.length : 0)
        }
      } catch {
        // silently ignore
      }
    }, [conversationId])

    useImperativeHandle(ref, () => ({ refresh: fetchCounts }), [fetchCounts])

    useEffect(() => {
      setDrawerOpen(false)
      setEditing(false)
      setMenuOpen(false)
      setProjOpen(false)
      fetchCounts()
    }, [conversationId, fetchCounts])

    // Close menu on outside click
    useEffect(() => {
      if (!menuOpen) return
      function onDown(e: MouseEvent) {
        if (
          !menuBtnRef.current?.contains(e.target as Node) &&
          !dropdownRef.current?.contains(e.target as Node)
        ) {
          setMenuOpen(false)
          setProjOpen(false)
        }
      }
      document.addEventListener('mousedown', onDown)
      return () => document.removeEventListener('mousedown', onDown)
    }, [menuOpen])

    function handleMenuToggle() {
      if (!menuOpen) {
        const rect = menuBtnRef.current?.getBoundingClientRect()
        if (rect) setMenuPos({ top: rect.bottom + 4, left: rect.left })
      }
      setMenuOpen(v => !v)
      setProjOpen(false)
    }

    function startEdit() {
      setMenuOpen(false)
      setProjOpen(false)
      setEditValue(conversationTitle ?? '')
      setEditing(true)
      setTimeout(() => { inputRef.current?.focus(); inputRef.current?.select() }, 30)
    }

    function commitRename() {
      if (!conversationId) return
      const trimmed = editValue.trim()
      setEditing(false)
      if (trimmed && trimmed !== conversationTitle) {
        onRenameConversation?.(conversationId, trimmed)
      }
    }

    function cancelEdit() {
      setEditing(false)
      setEditValue(conversationTitle ?? '')
    }

    const activeProject = projects.find(p => p.id === projectId) ?? null

    if (!conversationId) return null

    // Dropdown portal to body — fixed position, no z-index conflicts
    const dropdown = mounted && menuOpen && menuPos ? createPortal(
      <div
        ref={dropdownRef}
        className="wl-conv-menu"
        role="menu"
        style={{ position: 'fixed', top: menuPos.top, left: menuPos.left, zIndex: 9999 }}
      >
        {onRenameConversation && (
          <button className="wl-conv-menu__item" role="menuitem" onClick={startEdit}>
            <PencilSimple size={13} weight="bold" aria-hidden="true" />
            Umbenennen
          </button>
        )}

        {onAssignToProject && (
          <button
            className="wl-conv-menu__item"
            role="menuitem"
            onClick={() => setProjOpen(v => !v)}
            style={{ justifyContent: 'space-between' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', columnGap: 8 }}>
              <FolderSimple size={13} weight="fill" aria-hidden="true" />
              {activeProject ? activeProject.title : 'Projekt zuordnen'}
            </span>
            <span style={{ fontSize: 11, opacity: 0.5 }}>›</span>
          </button>
        )}

        {projOpen && onAssignToProject && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 4 }}>
            {projects.map(p => (
              <button
                key={p.id}
                className="wl-conv-menu__item"
                role="menuitem"
                onClick={() => {
                  onAssignToProject(conversationId, p.id)
                  setMenuOpen(false)
                  setProjOpen(false)
                }}
                style={{ paddingLeft: 28, fontWeight: p.id === projectId ? 600 : 400, color: p.id === projectId ? 'var(--accent)' : undefined }}
              >
                <FolderSimple size={12} weight="fill" aria-hidden="true" />
                {p.title}
              </button>
            ))}
            {projectId && (
              <button
                className="wl-conv-menu__item"
                role="menuitem"
                onClick={() => {
                  onAssignToProject(conversationId, null)
                  setMenuOpen(false)
                  setProjOpen(false)
                }}
                style={{ paddingLeft: 28, color: 'rgba(255,255,255,0.65)' }}
              >
                <X size={12} weight="bold" aria-hidden="true" />
                Aus Projekt lösen
              </button>
            )}
            {projects.length === 0 && (
              <div style={{ padding: '6px 12px 6px 28px', color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>
                Keine Projekte
              </div>
            )}
          </div>
        )}

        {artifactCount > 0 && (
          <>
            <div className="wl-conv-menu__divider" />
            <button
              className="wl-conv-menu__item"
              role="menuitem"
              onClick={() => { setDrawerOpen(true); setMenuOpen(false) }}
            >
              {artifactCount} Artefakt{artifactCount === 1 ? '' : 'e'}
            </button>
            {onSummarizeArtifacts && (
              <button
                className="wl-conv-menu__item"
                role="menuitem"
                onClick={() => { setMenuOpen(false); onSummarizeArtifacts() }}
              >
                <TextAlignLeft size={13} weight="bold" aria-hidden="true" />
                Zusammenfassung
              </button>
            )}
            {onShowArtifactsView && (
              <button
                className="wl-conv-menu__item"
                role="menuitem"
                onClick={() => { setMenuOpen(false); onShowArtifactsView() }}
              >
                <SquaresFour size={13} weight="bold" aria-hidden="true" />
                Übersicht Artefakte
              </button>
            )}
          </>
        )}

        {onDeleteConversation && (
          <>
            <div className="wl-conv-menu__divider" />
            <button
              className="wl-conv-menu__item wl-conv-menu__item--danger"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false)
                onDeleteConversation(conversationId)
              }}
            >
              <Trash size={13} weight="bold" aria-hidden="true" />
              Löschen
            </button>
          </>
        )}
      </div>,
      document.body
    ) : null

    // Header content portaled into #topbar-chat-slot
    const headerContent = (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', minWidth: 0 }} aria-label="Chat-Kopfzeile">
        {/* Left: title + menu button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: '1 1 0%', minWidth: 0 }}>
          {editing ? (
            <input
              ref={inputRef}
              className="wl-conv-header__input"
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              onBlur={commitRename}
              onKeyDown={e => {
                if (e.key === 'Enter') commitRename()
                if (e.key === 'Escape') cancelEdit()
              }}
            />
          ) : (
            <span className="wl-conv-header__name" title={conversationTitle ?? 'Neue Unterhaltung'}>
              {conversationTitle ?? 'Neue Unterhaltung'}
            </span>
          )}

          {!editing && (
            <button
              ref={menuBtnRef}
              className="wl-conv-header__btn"
              onClick={handleMenuToggle}
              title="Chat-Optionen"
              aria-label="Chat-Optionen"
              aria-haspopup="true"
              aria-expanded={menuOpen}
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.18)',
                borderRadius: 5,
                padding: '2px 5px',
              }}
            >
              <DotsThree size={15} weight="bold" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Right: search */}
        <button
          className="wl-conv-header__btn"
          onClick={() => onOpenSearch?.()}
          title="Nachrichten durchsuchen"
          aria-label="Nachrichten durchsuchen"
        >
          <MagnifyingGlass size={14} weight="bold" aria-hidden="true" />
        </button>
      </div>
    )

    return (
      <>
        {mounted && slotEl && createPortal(headerContent, slotEl)}

        {dropdown}

        <ArtifactsDrawer
          conversationId={conversationId}
          workspaceId={workspaceId}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        />
      </>
    )
  }
)

export default ChatHeaderStrip
