'use client'

import { useState } from 'react'
import { PaperPlaneTilt, Trash, ChatCircle } from '@phosphor-icons/react'

export type Comment = {
  id: string
  content: string
  item_id: string | null
  parent_id: string | null
  user_id: string | null
  guest_name: string | null
  created_at: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function CommentThread({ workspaceId, comments: initial, currentUserId, canAdmin, isGuest = false, itemId = null }: {
  workspaceId: string
  comments: Comment[]
  currentUserId: string | null
  canAdmin: boolean
  isGuest?: boolean
  itemId?: string | null
}) {
  const [comments, setComments] = useState(initial)
  const [text, setText] = useState('')
  const [guestName, setGuestName] = useState('')
  const [sending, setSending] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Filter by item when in item context; show workspace-level comments otherwise
  const rootComments = comments.filter(c => !c.parent_id && (itemId ? c.item_id === itemId : !c.item_id))

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    setSending(true)
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: text.trim(),
          guest_name: guestName.trim() || undefined,
          item_id: itemId ?? undefined,
        }),
      })
      if (res.ok) {
        const comment = await res.json()
        setComments(prev => [...prev, comment])
        setText('')
      }
    } finally {
      setSending(false)
    }
  }

  async function handleDelete(commentId: string) {
    setDeletingId(commentId)
    try {
      await fetch(`/api/workspaces/${workspaceId}/comments/${commentId}`, { method: 'DELETE' })
      setComments(prev => prev.filter(c => c.id !== commentId))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      {rootComments.length === 0 ? (
        <div className="empty-state" style={{ padding: '32px 24px' }}>
          <ChatCircle size={28} color="var(--text-tertiary)" weight="fill" aria-hidden="true" />
          <div className="empty-state-title">Noch keine Kommentare</div>
          <div className="empty-state-text">Schreib den ersten Kommentar.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {rootComments.map(c => (
            <div key={c.id} className="ws-comment">
              <div className="ws-comment-header">
                <span className="ws-comment-author">
                  {c.guest_name ?? (c.user_id ? 'Mitglied' : 'Anonym')}
                </span>
                <span className="ws-comment-date">{formatDate(c.created_at)}</span>
                {(canAdmin || c.user_id === currentUserId) && (
                  <button
                    className="btn-icon ws-comment-delete"
                    onClick={() => handleDelete(c.id)}
                    disabled={deletingId === c.id}
                    aria-label="Kommentar löschen"
                  >
                    <Trash size={12} weight="bold" />
                  </button>
                )}
              </div>
              <div className="ws-comment-content">{c.content}</div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {isGuest && (
          <input
            style={{
              padding: '7px 10px', border: '1px solid var(--border)',
              borderRadius: 6, background: 'var(--bg-surface-solid)',
              color: 'var(--text-primary)', fontSize: 13, outline: 'none',
            }}
            value={guestName}
            onChange={e => setGuestName(e.target.value)}
            placeholder="Dein Name (optional)"
            maxLength={100}
          />
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            style={{
              flex: 1, padding: '8px 10px', border: '1px solid var(--border)',
              borderRadius: 6, background: 'var(--bg-surface-solid)',
              color: 'var(--text-primary)', fontSize: 13, outline: 'none',
            }}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Kommentar schreiben…"
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e as unknown as React.FormEvent) }
            }}
          />
          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={sending || !text.trim()}
            aria-label="Senden"
          >
            <PaperPlaneTilt size={14} weight="bold" aria-hidden="true" />
          </button>
        </div>
      </form>
    </div>
  )
}
