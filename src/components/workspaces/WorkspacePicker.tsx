'use client'

import { useEffect, useRef, useState } from 'react'
import { X, MagnifyingGlass, ShareNetwork, Check, SquaresFour } from '@phosphor-icons/react'

type Workspace = { id: string; title: string; emoji: string | null; description: string | null }

export type WorkspaceItemType = 'conversation' | 'artifact' | 'project' | 'feed_source' | 'agent'

export default function WorkspacePicker({
  itemType,
  itemId,
  itemTitle,
  onClose,
  onSaved,
}: {
  itemType: WorkspaceItemType
  itemId: string
  itemTitle: string
  onClose: () => void
  onSaved?: (workspaceTitle: string) => void
}) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [error, setError] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/workspaces')
      .then(r => r.json())
      .then(data => setWorkspaces(Array.isArray(data) ? data : (data?.data ?? [])))
      .finally(() => { setLoading(false); setTimeout(() => searchRef.current?.focus(), 50) })
  }, [])

  const filtered = q
    ? workspaces.filter(w =>
        w.title.toLowerCase().includes(q.toLowerCase()) ||
        (w.description ?? '').toLowerCase().includes(q.toLowerCase())
      )
    : workspaces

  async function handleSave(ws: Workspace) {
    setSaving(ws.id); setError('')
    try {
      const res = await fetch(`/api/workspaces/${ws.id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_type: itemType, item_id: itemId, title: itemTitle }),
      })
      if (!res.ok) {
        const msg = (await res.json()).error ?? 'Fehler'
        throw new Error(msg)
      }
      setSaved(ws.id)
      onSaved?.(ws.title)
      setTimeout(onClose, 900)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler')
      setSaving(null)
    }
  }

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 499 }} aria-hidden="true" />
      <div className="modal-overlay" style={{ zIndex: 500 }} role="dialog" aria-modal="true" aria-label="In Workspace ablegen">
        <div className="card" style={{ width: '100%', maxWidth: 440, padding: 24, background: 'var(--bg-surface-solid)' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              In Workspace ablegen
            </h2>
            <button className="btn-icon" onClick={onClose} aria-label="Schließen">
              <X size={16} weight="bold" />
            </button>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: '0 0 16px', lineHeight: 1.4 }}>
            „{itemTitle.length > 50 ? itemTitle.slice(0, 50) + '…' : itemTitle}&ldquo;
          </p>

          {/* Search */}
          <div className="search-bar-container" style={{ marginBottom: 10 }}>
            <MagnifyingGlass
              size={14} weight="bold"
              style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }}
              aria-hidden="true"
            />
            <input
              ref={searchRef}
              className="input"
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Workspace suchen…"
              style={{ paddingLeft: 32 }}
            />
          </div>

          {/* List */}
          <div style={{ maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {loading ? (
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)', padding: '16px 0', textAlign: 'center' }}>Lädt…</p>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center' }}>
                <ShareNetwork size={24} color="var(--text-tertiary)" weight="fill" aria-hidden="true" />
                <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 8 }}>
                  {q ? 'Kein Workspace gefunden' : 'Noch keine Workspaces vorhanden'}
                </p>
              </div>
            ) : (
              filtered.map(ws => (
                <button
                  key={ws.id}
                  onClick={() => !saved && handleSave(ws)}
                  disabled={!!saving || !!saved}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: 10, padding: '9px 10px', borderRadius: 7,
                    background: saved === ws.id ? 'var(--accent-light)' : 'transparent',
                    border: 'none', cursor: saving || saved ? 'default' : 'pointer',
                    textAlign: 'left', width: '100%', transition: 'background 0.1s',
                    opacity: saving && saving !== ws.id ? 0.5 : 1,
                  }}
                  onMouseEnter={e => { if (!saving && !saved) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(26,23,20,0.05)' }}
                  onMouseLeave={e => { if (saved !== ws.id) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                    <SquaresFour size={18} color="var(--accent)" weight="fill" aria-hidden="true" style={{ flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ws.title}
                      </div>
                      {ws.description && (
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {ws.description}
                        </div>
                      )}
                    </div>
                  </div>
                  {saved === ws.id ? (
                    <Check size={14} weight="bold" color="var(--accent)" aria-label="Hinzugefügt" />
                  ) : saving === ws.id ? (
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>…</span>
                  ) : null}
                </button>
              ))
            )}
          </div>

          {error && (
            <p role="alert" style={{ fontSize: 12, color: 'var(--error)', marginTop: 8 }}>{error}</p>
          )}
        </div>
      </div>
    </>
  )
}
