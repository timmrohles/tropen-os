'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SquaresFour, Plus, SquaresFour as WsIcon, DotsThree, CopySimple, Trash } from '@phosphor-icons/react'

type Workspace = {
  id:         string
  title:      string
  goal:       string | null
  status:     string
  created_at: string
  cards:      { count: number }[]
}

const STATUS_LABEL: Record<string, string> = {
  draft:    'Entwurf',
  active:   'Aktiv',
  archived: 'Archiviert',
}

const inp: React.CSSProperties = {
  width: '100%', padding: '8px 10px', marginBottom: 10,
  border: '1px solid var(--border)', borderRadius: 6,
  background: 'var(--bg-surface)', color: 'var(--text-primary)',
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
  fontFamily: 'var(--font-sans, system-ui)',
}

// ── Card-level menu ───────────────────────────────────────────────────────────

function CardMenu({ wsId, onDelete, onCopy }: {
  wsId: string
  onDelete: (id: string) => void
  onCopy: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  function handleOpen() {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setDropdownPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
    }
    setOpen(p => !p)
    setConfirmDelete(false)
  }

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
        setConfirmDelete(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div style={{ flexShrink: 0 }} onClick={e => e.stopPropagation()}>
      <button
        ref={btnRef}
        type="button"
        className="btn-icon"
        aria-label="Aktionen"
        aria-expanded={open}
        onClick={handleOpen}
        style={{ padding: 5 }}
      >
        <DotsThree size={16} weight="bold" />
      </button>

      {open && (
        <div
          ref={dropdownRef}
          className="dropdown"
          style={{
            position: 'fixed',
            top: dropdownPos.top,
            right: dropdownPos.right,
            minWidth: 160,
            zIndex: 9999,
            padding: '4px 0',
          }}
        >
          {confirmDelete ? (
            <div style={{ padding: '8px 12px' }}>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
                Sicher löschen?
              </p>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => { onDelete(wsId); setOpen(false) }}
                >
                  Löschen
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setConfirmDelete(false)}
                >
                  Abbrechen
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                type="button"
                className="dropdown-item"
                onClick={() => { onCopy(wsId); setOpen(false) }}
              >
                <CopySimple size={14} weight="bold" aria-hidden="true" />
                Duplizieren
              </button>
              <div className="dropdown-divider" />
              <button
                type="button"
                className="dropdown-item dropdown-item--danger"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash size={14} weight="bold" aria-hidden="true" />
                Löschen
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function WorkspacesList({ workspaces: initial }: { workspaces: Workspace[] }) {
  const router = useRouter()
  const [workspaces, setWorkspaces] = useState(initial)
  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate() {
    if (!newTitle.trim()) return
    setSaving(true); setError(null)
    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim() }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Fehler')
      const ws = await res.json()
      router.push(`/workspaces/${ws.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler')
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/workspaces/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Fehler')
      setWorkspaces(prev => prev.filter(w => w.id !== id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Löschen fehlgeschlagen')
    }
  }

  async function handleCopy(id: string) {
    try {
      const res = await fetch(`/api/workspaces/${id}/copy`, { method: 'POST' })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Fehler')
      const copy = await res.json()
      router.push(`/workspaces/${copy.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kopieren fehlgeschlagen')
    }
  }

  const isEmpty = workspaces.length === 0 && !creating

  return (
    <div className="content-max">
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-header-title">
            <SquaresFour size={22} color="var(--text-primary)" weight="fill" aria-hidden="true" />
            Workspaces
          </h1>
          <p className="page-header-sub">Deine KI-Arbeitsbereiche mit Karten und Outcomes</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => { setCreating(true); setError(null) }}>
            <Plus size={14} weight="bold" /> Neuer Workspace
          </button>
        </div>
      </div>

      {creating && (
        <div className="card" style={{ padding: 14, marginBottom: 16 }}>
          <input autoFocus placeholder="Workspace-Name" value={newTitle}
            onChange={e => setNewTitle(e.target.value)} style={inp} aria-label="Workspace-Name"
            onKeyDown={e => {
              if (e.key === 'Enter') handleCreate()
              if (e.key === 'Escape') { setCreating(false); setNewTitle('') }
            }}
          />
          {error && <p role="alert" style={{ fontSize: 12, color: 'var(--error)', margin: '0 0 8px' }}>{error}</p>}
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-primary btn-sm" onClick={handleCreate} disabled={saving || !newTitle.trim()}>Erstellen</button>
            <button className="btn btn-ghost btn-sm" onClick={() => { setCreating(false); setNewTitle(''); setError(null) }}>Abbrechen</button>
          </div>
        </div>
      )}

      {error && !creating && (
        <p role="alert" style={{ fontSize: 13, color: 'var(--error)', marginBottom: 12 }}>{error}</p>
      )}

      {isEmpty ? (
        <div style={{ textAlign: 'center', padding: '64px 24px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 56, height: 56, borderRadius: 14, background: 'var(--accent-light)', marginBottom: 20,
          }}>
            <WsIcon size={28} color="var(--accent)" weight="fill" aria-hidden="true" />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>
            Workspace
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 380, margin: '0 auto 24px' }}>
            Workspaces sind deine KI-Arbeitsbereiche für komplexe Aufgaben.
            Du strukturierst dein Thema mit Karten — Toro hilft dir beim Aufbau.
          </p>
          <button className="btn btn-primary" onClick={() => setCreating(true)}>
            <Plus size={14} weight="bold" /> Ersten Workspace erstellen
          </button>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 20 }}>
            Beispiele: Kampagnenstrategie · Marktanalyse · Produktentwicklung · Wettbewerbsvergleich
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {workspaces.map(ws => {
            const cardCount = ws.cards?.[0]?.count ?? 0
            const statusLabel = STATUS_LABEL[ws.status] ?? ws.status
            return (
              <div
                key={ws.id}
                className="card"
                style={{ padding: '16px 18px', cursor: 'pointer', position: 'relative' }}
                onClick={() => router.push(`/workspaces/${ws.id}`)}
                role="button"
                tabIndex={0}
                aria-label={`Workspace öffnen: ${ws.title}`}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') router.push(`/workspaces/${ws.id}`) }}
              >
                {/* Title row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 8 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', flex: 1, minWidth: 0 }}>
                    {ws.title}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <span style={{
                      fontSize: 10, padding: '2px 8px', borderRadius: 999,
                      background: ws.status === 'active' ? 'var(--accent)' : 'var(--bg-surface-2)',
                      color: ws.status === 'active' ? '#fff' : 'var(--text-tertiary)',
                      border: `1px solid ${ws.status === 'active' ? 'var(--accent)' : 'var(--border)'}`,
                      fontWeight: 500,
                    }}>
                      {statusLabel}
                    </span>
                    <CardMenu wsId={ws.id} onDelete={handleDelete} onCopy={handleCopy} />
                  </div>
                </div>

                {ws.goal && (
                  <p style={{ margin: '0 0 10px', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {ws.goal}
                  </p>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
                  <SquaresFour size={12} weight="fill" color="var(--text-tertiary)" aria-hidden="true" />
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                    {cardCount} {cardCount === 1 ? 'Karte' : 'Karten'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
