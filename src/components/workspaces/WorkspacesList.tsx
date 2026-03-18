'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SquaresFour, Plus, ChartBar } from '@phosphor-icons/react'

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

const STATUS_COLOR: Record<string, string> = {
  draft:    'var(--text-tertiary)',
  active:   'var(--accent)',
  archived: 'var(--text-tertiary)',
}

const inp: React.CSSProperties = {
  width: '100%', padding: '8px 10px', marginBottom: 10,
  border: '1px solid var(--border)', borderRadius: 6,
  background: 'var(--bg-surface)', color: 'var(--text-primary)',
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
  fontFamily: 'var(--font-sans, system-ui)',
}

export default function WorkspacesList({ workspaces }: { workspaces: Workspace[] }) {
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate() {
    if (!newTitle.trim()) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
          <input
            autoFocus
            placeholder="Workspace-Name"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleCreate()
              if (e.key === 'Escape') { setCreating(false); setNewTitle('') }
            }}
            style={inp}
          />
          {error && <p style={{ fontSize: 12, color: '#ef4444', margin: '0 0 8px' }}>{error}</p>}
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-primary btn-sm" onClick={handleCreate} disabled={saving || !newTitle.trim()}>
              Erstellen
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => { setCreating(false); setNewTitle(''); setError(null) }}>
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {workspaces.length === 0 && !creating ? (
        <p style={{ color: 'var(--text-tertiary)', fontSize: 14, padding: '40px 0', textAlign: 'center' }}>
          Noch keine Workspaces — erstelle deinen ersten.
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {workspaces.map(ws => {
            const cardCount = ws.cards?.[0]?.count ?? 0
            return (
              <button
                key={ws.id}
                className="card"
                style={{ padding: '16px 18px', textAlign: 'left', cursor: 'pointer', width: '100%' }}
                onClick={() => router.push(`/workspaces/${ws.id}`)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {ws.title}
                  </p>
                  <span style={{
                    fontSize: 11,
                    color: STATUS_COLOR[ws.status] ?? 'var(--text-tertiary)',
                    flexShrink: 0, marginLeft: 8,
                  }}>
                    {STATUS_LABEL[ws.status] ?? ws.status}
                  </span>
                </div>
                {ws.goal && (
                  <p style={{ margin: '0 0 10px', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {ws.goal}
                  </p>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
                  <ChartBar size={12} weight="fill" color="var(--text-tertiary)" aria-hidden="true" />
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                    {cardCount} {cardCount === 1 ? 'Karte' : 'Karten'}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
