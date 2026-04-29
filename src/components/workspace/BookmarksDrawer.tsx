'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { X, BookmarkSimple, Trash, ArrowRight } from '@phosphor-icons/react'
import { useFocusTrap } from '@/hooks/use-focus-trap'

interface Bookmark {
  id: string
  message_id: string
  conversation_id: string
  content_preview: string | null
  created_at: string
}

interface BookmarksDrawerProps {
  open: boolean
  onClose: () => void
  onUseAsPrompt?: (text: string) => void
  conversationId?: string | null
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
}

export default function BookmarksDrawer({ open, onClose, onUseAsPrompt, conversationId }: BookmarksDrawerProps) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const trapRef = useFocusTrap<HTMLDivElement>(open)

  const fetchBookmarks = useCallback(async () => {
    setLoading(true)
    try {
      const url = conversationId
        ? `/api/bookmarks?conversationId=${conversationId}`
        : `/api/bookmarks`
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setBookmarks(Array.isArray(data) ? data : [])
      }
    } finally {
      setLoading(false)
    }
  }, [conversationId])

  useEffect(() => {
    if (open) fetchBookmarks()
  }, [open, fetchBookmarks])

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  async function handleDelete(bm: Bookmark) {
    if (deletingId) return
    setDeletingId(bm.id)
    try {
      const res = await fetch('/api/bookmarks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: bm.message_id }),
      })
      if (res.ok) setBookmarks(prev => prev.filter(b => b.id !== bm.id))
    } finally {
      setDeletingId(null)
    }
  }

  if (!open) return null

  return (
    <>
      <div
        onClick={onClose}
        className="modal-backdrop"
        style={{ zIndex: 200 }}
      />
      <div ref={trapRef} role="dialog" aria-modal="true" aria-label="Lesezeichen" style={{
        position: 'fixed', top: 52, left: 0, right: 0, zIndex: 201,
        background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        animation: 'slideDown 200ms ease-out',
        maxHeight: 'calc(100vh - 52px)', overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--border-muted)' }}>
          <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
            <BookmarkSimple size={16} weight="fill" color="var(--accent)" />
            Lesezeichen
          </span>
          <button className="btn-icon" onClick={onClose} aria-label="Schließen">
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '12px 24px 16px' }}>
          {loading ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '16px 0' }}>Laden…</div>
          ) : bookmarks.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '16px 0' }}>
              Noch keine Lesezeichen. Klicke das Bookmark-Icon an einer Toro-Antwort.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {bookmarks.map((bm) => (
                <div
                  key={bm.id}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    padding: '12px 14px', background: 'var(--bg-elevated)',
                    borderRadius: 8, border: '1px solid var(--border-muted)',
                  }}
                >
                  <BookmarkSimple size={14} weight="fill" color="var(--accent)" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: 13, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {bm.content_preview ?? '—'}
                    </p>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                      {formatDate(bm.created_at)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    {onUseAsPrompt && bm.content_preview && (
                      <button
                        onClick={() => { onUseAsPrompt(bm.content_preview!); onClose() }}
                        title="Als Prompt verwenden"
                        style={{ background: 'var(--accent-subtle)', border: '1px solid rgba(63,74,85,0.2)', borderRadius: 5, padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--accent)' }}
                      >
                        <ArrowRight size={12} weight="bold" /> Verwenden
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(bm)}
                      title="Entfernen"
                      disabled={deletingId === bm.id}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, borderRadius: 4, display: 'flex', alignItems: 'center', opacity: deletingId === bm.id ? 0.4 : 1 }}
                    >
                      <Trash size={14} weight="bold" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideDown { from { transform: translateY(-12px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
      `}</style>
    </>
  )
}
