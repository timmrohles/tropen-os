'use client'

import React, { useEffect, useState, useCallback, useImperativeHandle, forwardRef, useRef } from 'react'
import { Paperclip, BookmarkSimple, MagnifyingGlass, FolderSimple, X } from '@phosphor-icons/react'
import Link from 'next/link'
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
  onOpenBookmarks?: () => void
  onOpenSearch?: () => void
  onRenameConversation?: (id: string, title: string) => void
  onAssignToProject?: (convId: string, projectId: string | null) => void
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
    onOpenBookmarks,
    onOpenSearch,
    onRenameConversation,
    onAssignToProject,
  }, ref) {
    const [artifactCount, setArtifactCount] = useState(0)
    const [bookmarkCount, setBookmarkCount] = useState(0)
    const [drawerOpen, setDrawerOpen] = useState(false)

    // Rename state
    const [editing, setEditing] = useState(false)
    const [editValue, setEditValue] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)

    // Project dropdown state
    const [projOpen, setProjOpen] = useState(false)
    const projRef = useRef<HTMLDivElement>(null)

    const fetchCounts = useCallback(async () => {
      if (!conversationId || conversationId.startsWith('temp-')) {
        setArtifactCount(0)
        setBookmarkCount(0)
        return
      }
      try {
        const [artRes, bmRes] = await Promise.all([
          fetch(`/api/artifacts?conversationId=${conversationId}`),
          fetch(`/api/bookmarks?conversationId=${conversationId}`),
        ])
        if (artRes.ok) {
          const arts = await artRes.json()
          setArtifactCount(Array.isArray(arts) ? arts.length : 0)
        }
        if (bmRes.ok) {
          const bms = await bmRes.json()
          setBookmarkCount(Array.isArray(bms) ? bms.length : 0)
        }
      } catch {
        // silently ignore
      }
    }, [conversationId])

    useImperativeHandle(ref, () => ({ refresh: fetchCounts }), [fetchCounts])

    useEffect(() => {
      setDrawerOpen(false)
      setEditing(false)
      fetchCounts()
    }, [conversationId, fetchCounts])

    // Close project dropdown on outside click
    useEffect(() => {
      if (!projOpen) return
      function onDown(e: MouseEvent) {
        if (projRef.current && !projRef.current.contains(e.target as Node)) {
          setProjOpen(false)
        }
      }
      document.addEventListener('mousedown', onDown)
      return () => document.removeEventListener('mousedown', onDown)
    }, [projOpen])

    function startEdit() {
      setEditValue(conversationTitle ?? '')
      setEditing(true)
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      }, 30)
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

    return (
      <>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '0 16px',
            height: 36,
            background: 'rgba(255,255,255,0.03)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            flexShrink: 0,
            minWidth: 0,
          }}
        >
          {/* ── LEFT: title + project ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>

            {/* Chat title */}
            {editing ? (
              <input
                ref={inputRef}
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                onBlur={commitRename}
                onKeyDown={e => {
                  if (e.key === 'Enter') commitRename()
                  if (e.key === 'Escape') cancelEdit()
                }}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 5,
                  color: 'var(--sidebar-text)',
                  fontSize: 12,
                  fontWeight: 500,
                  padding: '2px 6px',
                  outline: 'none',
                  width: 220,
                  maxWidth: '40vw',
                }}
              />
            ) : (
              <button
                onClick={startEdit}
                title="Umbenennen"
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '2px 4px',
                  borderRadius: 4,
                  cursor: 'text',
                  color: 'rgba(255,255,255,0.70)',
                  fontSize: 12,
                  fontWeight: 500,
                  maxWidth: 260,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  textAlign: 'left',
                  transition: 'background 120ms',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.07)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none' }}
              >
                {conversationTitle ?? 'Neue Unterhaltung'}
              </button>
            )}

            {/* Project chip */}
            {onAssignToProject && (
              <div ref={projRef} style={{ position: 'relative', flexShrink: 0 }}>
                <button
                  onClick={() => setProjOpen(v => !v)}
                  title={activeProject ? `Projekt: ${activeProject.title}` : 'Projekt zuordnen'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    background: activeProject ? 'rgba(45,122,80,0.18)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${activeProject ? 'rgba(45,122,80,0.4)' : 'rgba(255,255,255,0.10)'}`,
                    borderRadius: 12,
                    padding: '1px 8px 1px 6px',
                    cursor: 'pointer',
                    color: activeProject ? 'rgba(120,220,150,0.9)' : 'rgba(255,255,255,0.40)',
                    fontSize: 11,
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    transition: 'background 120ms',
                    maxWidth: 160,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  <FolderSimple size={11} weight="fill" aria-hidden="true" />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {activeProject ? activeProject.title : 'Projekt'}
                  </span>
                </button>

                {projOpen && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    marginTop: 4,
                    background: 'var(--sidebar-bg)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 8,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                    zIndex: 200,
                    minWidth: 180,
                    padding: '4px 0',
                  }}>
                    {projects.map(p => (
                      <button
                        key={p.id}
                        onClick={() => {
                          onAssignToProject(conversationId, p.id)
                          setProjOpen(false)
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          width: '100%',
                          padding: '7px 12px',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: p.id === projectId ? 'var(--accent)' : 'rgba(255,255,255,0.75)',
                          fontSize: 13,
                          textAlign: 'left',
                          fontWeight: p.id === projectId ? 600 : 400,
                          transition: 'background 80ms',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none' }}
                      >
                        <FolderSimple size={13} weight="fill" aria-hidden="true" />
                        {p.title}
                      </button>
                    ))}
                    {projectId && (
                      <>
                        <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '4px 0' }} />
                        <button
                          onClick={() => {
                            onAssignToProject(conversationId, null)
                            setProjOpen(false)
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            width: '100%',
                            padding: '7px 12px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'rgba(255,255,255,0.45)',
                            fontSize: 13,
                            textAlign: 'left',
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none' }}
                        >
                          <X size={13} weight="bold" aria-hidden="true" />
                          Aus Projekt lösen
                        </button>
                      </>
                    )}
                    {projects.length === 0 && (
                      <div style={{ padding: '8px 12px', color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>
                        Keine Projekte vorhanden
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── RIGHT: artifacts / bookmarks / search / department ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            {artifactCount > 0 && (
              <button
                onClick={() => setDrawerOpen(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', fontSize: 12, padding: 0,
                }}
              >
                <Paperclip size={13} weight="bold" />
                <span>{artifactCount} Artefakt{artifactCount === 1 ? '' : 'e'}</span>
              </button>
            )}

            {bookmarkCount > 0 && (
              <button
                onClick={() => onOpenBookmarks?.()}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', fontSize: 12, padding: 0,
                }}
              >
                <BookmarkSimple size={13} weight="bold" />
                <span>{bookmarkCount} Lesezeichen</span>
              </button>
            )}

            <button
              onClick={() => onOpenSearch?.()}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
                padding: 4, borderRadius: 4,
              }}
              title="Nachrichten durchsuchen"
              aria-label="Nachrichten durchsuchen"
            >
              <MagnifyingGlass size={13} weight="bold" />
            </button>

            <Link
              href={workspaceId && conversationId
                ? `/workspace?ws=${workspaceId}&conv=${conversationId}`
                : '/workspace'}
              style={{
                color: 'var(--text-muted)',
                fontSize: 12,
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              Department →
            </Link>
          </div>
        </div>

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
