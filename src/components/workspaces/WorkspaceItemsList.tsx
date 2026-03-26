'use client'

import { useEffect, useState } from 'react'
import { Trash, Code, FileText, ChatCircle, Database, File, Rss, PlusCircle, ArrowSquareOut, ChatTeardrop } from '@phosphor-icons/react'
import CommentThread, { type Comment } from './CommentThread'

export type WorkspaceItemRow = {
  id: string
  item_type: 'conversation' | 'artifact' | 'project' | 'feed_source' | 'note'
  item_id: string | null
  title: string
  description: string | null
  meta: Record<string, unknown>
  added_by: string | null
  created_at: string
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  conversation: <ChatCircle size={14} weight="bold" aria-hidden="true" />,
  artifact:     <Code       size={14} weight="bold" aria-hidden="true" />,
  project:      <FileText   size={14} weight="bold" aria-hidden="true" />,
  feed_source:  <Rss        size={14} weight="bold" aria-hidden="true" />,
  note:         <File       size={14} weight="bold" aria-hidden="true" />,
}

const TYPE_LABEL: Record<string, string> = {
  conversation: 'Chat',
  artifact:     'Artefakt',
  project:      'Projekt',
  feed_source:  'Feed',
  note:         'Notiz',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function WorkspaceItemsList({
  workspaceId,
  items: initial,
  canWrite,
  onAdd,
  allComments = [],
  currentUserId = null,
}: {
  workspaceId: string
  items: WorkspaceItemRow[]
  canWrite: boolean
  onAdd: () => void
  allComments?: Comment[]
  currentUserId?: string | null
}) {
  const [items, setItems] = useState(initial)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Sync when parent adds items via onAdded callback
  useEffect(() => { setItems(initial) }, [initial])
  const [openCommentsId, setOpenCommentsId] = useState<string | null>(null)

  async function handleDelete(itemId: string) {
    setDeletingId(itemId)
    try {
      await fetch(`/api/workspaces/${workspaceId}/items/${itemId}`, { method: 'DELETE' })
      setItems(prev => prev.filter(i => i.id !== itemId))
    } finally {
      setDeletingId(null)
    }
  }

  if (items.length === 0) {
    return (
      <div className="empty-state" style={{ padding: '48px 24px' }}>
        <Database size={32} color="var(--text-tertiary)" weight="fill" aria-hidden="true" />
        <div className="empty-state-title">Keine Inhalte</div>
        <div className="empty-state-text">Verknüpfe Chats, Artefakte, Projekte oder Feeds mit diesem Workspace.</div>
        {canWrite && (
          <button className="btn btn-primary btn-sm" onClick={onAdd}>
            <PlusCircle size={14} weight="bold" aria-hidden="true" /> Element hinzufügen
          </button>
        )}
      </div>
    )
  }

  return (
    <div>
      {canWrite && (
        <div style={{ marginBottom: 16 }}>
          <button className="btn btn-primary btn-sm" onClick={onAdd}>
            <PlusCircle size={14} weight="bold" aria-hidden="true" /> Element hinzufügen
          </button>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {items.map(item => {
          const itemComments = allComments.filter(c => c.item_id === item.id)
          const isCommentsOpen = openCommentsId === item.id
          return (
            <div key={item.id}>
              <div className="ws-item-row">
                <div className="ws-item-icon">
                  {TYPE_ICON[item.item_type] ?? <File size={14} weight="bold" />}
                </div>
                <div className="ws-item-body">
                  <div className="ws-item-title">{item.title}</div>
                  {item.description && item.item_type === 'conversation' && (
                    <div className="ws-item-desc" style={{ fontStyle: 'italic', color: 'var(--text-tertiary)' }}>
                      {item.description}
                    </div>
                  )}
                  {item.description && item.item_type !== 'conversation' && (
                    <div className="ws-item-desc">{item.description}</div>
                  )}
                </div>
                <div className="ws-item-meta">
                  <span className="ws-item-type">{TYPE_LABEL[item.item_type] ?? item.item_type}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{formatDate(item.created_at)}</span>
                </div>
                <div className="ws-item-actions">
                  {item.item_id && item.item_type === 'conversation' && (
                    <a
                      href={`/chat/${item.item_id}`}
                      className="btn-icon"
                      title="Chat öffnen"
                      onClick={e => e.stopPropagation()}
                      aria-label="Chat öffnen"
                    >
                      <ArrowSquareOut size={13} weight="bold" />
                    </a>
                  )}
                  <button
                    className="btn-icon"
                    onClick={() => setOpenCommentsId(isCommentsOpen ? null : item.id)}
                    aria-label="Kommentare"
                    title={`Kommentare${itemComments.length ? ` (${itemComments.length})` : ''}`}
                    style={{ color: isCommentsOpen ? 'var(--accent)' : undefined, position: 'relative' }}
                  >
                    <ChatTeardrop size={13} weight={isCommentsOpen ? 'fill' : 'bold'} />
                    {itemComments.length > 0 && !isCommentsOpen && (
                      <span style={{
                        position: 'absolute', top: 0, right: 0,
                        width: 7, height: 7, borderRadius: '50%',
                        background: 'var(--accent)', border: '1px solid var(--bg-surface)',
                      }} />
                    )}
                  </button>
                  {canWrite && (
                    <button
                      className="btn-icon"
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      aria-label="Entfernen"
                      title="Entfernen"
                    >
                      <Trash size={13} weight="bold" />
                    </button>
                  )}
                </div>
              </div>
              {isCommentsOpen && (
                <div style={{
                  marginLeft: 32, marginBottom: 8, padding: '12px 16px',
                  background: 'var(--bg-inset, rgba(26,23,20,0.03))',
                  borderRadius: 8, borderLeft: '2px solid var(--border)',
                }}>
                  <CommentThread
                    workspaceId={workspaceId}
                    comments={allComments}
                    currentUserId={currentUserId}
                    canAdmin={canWrite}
                    itemId={item.id}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
