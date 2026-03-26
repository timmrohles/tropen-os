'use client'

import { useRef, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DotsThree, Trash, PencilSimple, Archive, ArrowCounterClockwise, Copy, ShareNetwork, SquaresFour, ChatCircle, Paperclip } from '@phosphor-icons/react'

export type WorkspaceItem = {
  id: string
  title: string
  description: string | null
  emoji: string | null
  status: string
  item_count: number
  comment_count: number
  archived_at: string | null
  created_at: string
}

function CardMenu({ ws, onRename, onDelete, onArchive, onUnarchive, onCopy }: {
  ws: WorkspaceItem
  onRename: () => void
  onDelete: (id: string) => void
  onArchive: (id: string) => void
  onUnarchive: (id: string) => void
  onCopy: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
      <button
        className="btn-icon ws-card-menu-btn"
        onClick={() => setOpen(p => !p)}
        aria-label="Mehr Optionen"
      >
        <DotsThree size={16} weight="bold" />
      </button>
      {open && (
        <div className="dropdown animate-dropdown" style={{
          position: 'absolute', top: 'calc(100% + 4px)', right: 0, minWidth: 180, zIndex: 50,
        }}>
          {!ws.archived_at && (
            <button className="dropdown-item" onClick={() => { setOpen(false); onRename() }}>
              <PencilSimple size={14} weight="bold" aria-hidden="true" /> Umbenennen
            </button>
          )}
          <button className="dropdown-item" onClick={() => { setOpen(false); onCopy(ws.id) }}>
            <Copy size={14} weight="bold" aria-hidden="true" /> Duplizieren
          </button>
          {ws.archived_at ? (
            <button className="dropdown-item" onClick={() => { setOpen(false); onUnarchive(ws.id) }}>
              <ArrowCounterClockwise size={14} weight="bold" aria-hidden="true" /> Wiederherstellen
            </button>
          ) : (
            <button className="dropdown-item" onClick={() => { setOpen(false); onArchive(ws.id) }}>
              <Archive size={14} weight="bold" aria-hidden="true" /> Archivieren
            </button>
          )}
          <div className="dropdown-divider" />
          <button className="dropdown-item dropdown-item--danger" onClick={() => { setOpen(false); onDelete(ws.id) }}>
            <Trash size={14} weight="bold" aria-hidden="true" /> Löschen
          </button>
        </div>
      )}
    </div>
  )
}

export default function WorkspaceCard({ ws, onDelete, onRename, onArchive, onUnarchive, onCopy }: {
  ws: WorkspaceItem
  onDelete: (id: string) => void
  onRename: (ws: WorkspaceItem) => void
  onArchive: (id: string) => void
  onUnarchive: (id: string) => void
  onCopy: (id: string) => void
}) {
  const router = useRouter()

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  return (
    <div
      className="card ws-card"
      onClick={() => !ws.archived_at && router.push(`/workspaces/${ws.id}`)}
      role={ws.archived_at ? 'article' : 'button'}
      tabIndex={ws.archived_at ? undefined : 0}
      onKeyDown={e => !ws.archived_at && e.key === 'Enter' && router.push(`/workspaces/${ws.id}`)}
      aria-label={`Workspace: ${ws.title}`}
      style={{ opacity: ws.archived_at ? 0.65 : 1, cursor: ws.archived_at ? 'default' : 'pointer' }}
    >
      <div className="ws-card-header">
        <div className="ws-card-emoji">
          <SquaresFour size={20} color="var(--accent)" weight="fill" aria-hidden="true" />
        </div>
        <div className="ws-card-actions">
          {ws.archived_at && (
            <span style={{
              fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)',
              textTransform: 'uppercase', letterSpacing: '0.05em',
              border: '1px solid var(--border)', borderRadius: 4, padding: '1px 5px',
            }}>
              Archiviert
            </span>
          )}
          <CardMenu
            ws={ws}
            onRename={() => onRename(ws)}
            onDelete={onDelete}
            onArchive={onArchive}
            onUnarchive={onUnarchive}
            onCopy={onCopy}
          />
        </div>
      </div>

      <div className="ws-card-title">{ws.title}</div>

      {ws.description && (
        <div className="ws-card-desc">
          {ws.description.length > 100 ? ws.description.slice(0, 100) + '…' : ws.description}
        </div>
      )}

      <div className="ws-card-footer">
        <span className="ws-card-meta">
          <Paperclip size={11} weight="bold" aria-hidden="true" />
          {ws.item_count}
        </span>
        {ws.comment_count > 0 && (
          <span className="ws-card-meta">
            <ChatCircle size={11} weight="bold" aria-hidden="true" />
            {ws.comment_count}
          </span>
        )}
        <span className="ws-card-date">{formatDate(ws.created_at)}</span>
      </div>
    </div>
  )
}
