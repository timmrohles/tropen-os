'use client'

import { useEffect, useRef, useState } from 'react'
import { SquaresFour, X, CheckCircle } from '@phosphor-icons/react'

interface Workspace {
  id: string
  name: string
}

interface PostToWorkspaceModalProps {
  conversationId: string
  conversationTitle?: string
  onClose: () => void
}

export default function PostToWorkspaceModal({
  conversationId,
  onClose,
}: PostToWorkspaceModalProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [posting, setPosting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const backdropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/workspaces')
      .then(r => r.json())
      .then(data => {
        setWorkspaces(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handlePost() {
    if (!selectedId) return
    setPosting(true)
    setError('')
    try {
      const res = await fetch(`/api/workspaces/${selectedId}/post-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: conversationId }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Fehler')
      setDone(true)
      setTimeout(onClose, 1400)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler')
    } finally {
      setPosting(false)
    }
  }

  return (
    <div
      className="modal-overlay"
      style={{ zIndex: 200 }}
      ref={backdropRef}
      onClick={e => { if (e.target === backdropRef.current) onClose() }}
    >
      <div
        className="card"
        style={{
          background: 'var(--bg-surface-solid)',
          width: 380,
          maxWidth: '90vw',
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
        }}
        role="dialog"
        aria-modal="true"
        aria-label="In Department posten"
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px 12px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SquaresFour size={16} weight="bold" color="var(--accent)" aria-hidden="true" />
            <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>In Department posten</span>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Schließen">
            <X size={14} weight="bold" />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '14px 18px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
            Toro erstellt eine kurze Zusammenfassung dieses Chats und fügt sie als Eintrag im gewählten Department ein.
          </p>

          {loading ? (
            <div style={{ fontSize: 13, color: 'var(--text-tertiary)', padding: '8px 0' }}>Lädt…</div>
          ) : workspaces.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--text-tertiary)', padding: '8px 0' }}>Keine Departments vorhanden.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 220, overflowY: 'auto' }}>
              {workspaces.map(ws => (
                <button
                  key={ws.id}
                  type="button"
                  className={selectedId === ws.id ? 'list-row list-row--active' : 'list-row'}
                  onClick={() => setSelectedId(ws.id)}
                  style={{ textAlign: 'left' }}
                >
                  <SquaresFour size={14} weight="bold" color={selectedId === ws.id ? 'var(--accent)' : 'var(--text-tertiary)'} aria-hidden="true" />
                  <span style={{ fontSize: 13 }}>{ws.name}</span>
                </button>
              ))}
            </div>
          )}

          {error && (
            <p role="alert" style={{ fontSize: 12, color: 'var(--error)', margin: 0 }}>{error}</p>
          )}

          {done ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--accent)' }}>
              <CheckCircle size={16} weight="fill" aria-hidden="true" />
              Erfolgreich gepostet
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost btn-sm" onClick={onClose} disabled={posting}>
                Abbrechen
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handlePost}
                disabled={!selectedId || posting}
              >
                {posting ? 'Wird gepostet…' : 'Posten'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
