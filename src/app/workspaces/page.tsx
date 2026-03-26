'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShareNetwork, Plus, MagnifyingGlass, X, Archive } from '@phosphor-icons/react'
import WorkspaceCard, { type WorkspaceItem } from '@/components/workspaces/WorkspaceCard'

type ViewTab = 'active' | 'archived'

export default function WorkspacesPage() {
  const router = useRouter()
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([])
  const [archived, setArchived] = useState<WorkspaceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<ViewTab>('active')
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const [activeRes, archivedRes] = await Promise.all([
      fetch('/api/workspaces'),
      fetch('/api/workspaces?archived=true'),
    ])
    if (activeRes.ok) {
      const json = await activeRes.json()
      setWorkspaces(Array.isArray(json) ? json : (json.data ?? []))
    }
    if (archivedRes.ok) {
      const json = await archivedRes.json()
      setArchived(Array.isArray(json) ? json : (json.data ?? []))
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const list = tab === 'active' ? workspaces : archived

  const filtered = useMemo(() =>
    search
      ? list.filter(w =>
          w.title.toLowerCase().includes(search.toLowerCase()) ||
          (w.description ?? '').toLowerCase().includes(search.toLowerCase())
        )
      : list,
    [list, search]
  )

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim()) return
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDesc.trim() || undefined,
        }),
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
    if (!confirm('Workspace wirklich löschen?')) return
    try {
      await fetch(`/api/workspaces/${id}`, { method: 'DELETE' })
      setWorkspaces(prev => prev.filter(w => w.id !== id))
      setArchived(prev => prev.filter(w => w.id !== id))
    } catch {
      setError('Löschen fehlgeschlagen')
    }
  }

  async function handleArchive(id: string) {
    try {
      const res = await fetch(`/api/workspaces/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived_at: new Date().toISOString() }),
      })
      if (!res.ok) return
      const ws = workspaces.find(w => w.id === id)
      if (ws) {
        setWorkspaces(prev => prev.filter(w => w.id !== id))
        setArchived(prev => [{ ...ws, archived_at: new Date().toISOString() }, ...prev])
      }
    } catch {
      setError('Archivieren fehlgeschlagen')
    }
  }

  async function handleUnarchive(id: string) {
    try {
      const res = await fetch(`/api/workspaces/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived_at: null }),
      })
      if (!res.ok) return
      const ws = archived.find(w => w.id === id)
      if (ws) {
        setArchived(prev => prev.filter(w => w.id !== id))
        setWorkspaces(prev => [{ ...ws, archived_at: null }, ...prev])
      }
    } catch {
      setError('Wiederherstellen fehlgeschlagen')
    }
  }

  async function handleCopy(id: string) {
    try {
      const res = await fetch(`/api/workspaces/${id}/copy`, { method: 'POST' })
      if (!res.ok) throw new Error()
      const copy = await res.json()
      setWorkspaces(prev => [{ ...copy, archived_at: null }, ...prev])
      router.push(`/workspaces/${copy.id}`)
    } catch {
      setError('Duplizieren fehlgeschlagen')
    }
  }

  function handleStartRename(ws: WorkspaceItem) {
    setRenamingId(ws.id)
    setRenameValue(ws.title)
  }

  async function handleRenameCommit() {
    if (!renamingId) return
    const trimmed = renameValue.trim()
    const current = workspaces.find(w => w.id === renamingId)
    if (!trimmed || trimmed === current?.title) { setRenamingId(null); return }
    try {
      const res = await fetch(`/api/workspaces/${renamingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmed }),
      })
      if (res.ok) {
        setWorkspaces(prev => prev.map(w => w.id === renamingId ? { ...w, title: trimmed } : w))
      }
    } finally {
      setRenamingId(null)
    }
  }

  const fieldLabel: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)',
    textTransform: 'uppercase', letterSpacing: '0.05em',
    display: 'block', marginBottom: 4,
  }

  const fieldInp: React.CSSProperties = {
    width: '100%', padding: '7px 10px',
    border: '1px solid var(--border-medium)',
    borderRadius: 6, background: 'var(--bg-surface-solid)',
    color: 'var(--text-primary)', fontSize: 13, outline: 'none',
    boxSizing: 'border-box',
  }

  return (
    <div className="content-max" aria-busy={loading}>
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-header-title">
            <ShareNetwork size={22} color="var(--text-primary)" weight="fill" aria-hidden="true" />
            Workspaces
          </h1>
          <p className="page-header-sub">Geteilte Räume zum Sammeln, Kommentieren und Teilen von Inhalten</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => { setCreating(true); setError('') }}>
            <Plus size={14} weight="bold" aria-hidden="true" /> Neuer Workspace
          </button>
        </div>
      </div>

      {/* Create form */}
      {creating && (
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={fieldLabel}>Name *</label>
              <input autoFocus style={fieldInp} value={newTitle} onChange={e => setNewTitle(e.target.value)}
                placeholder="Workspace-Name" required />
            </div>
            <div>
              <label style={fieldLabel}>Beschreibung</label>
              <input style={fieldInp} value={newDesc} onChange={e => setNewDesc(e.target.value)}
                placeholder="Worum geht es?" />
            </div>
            {error && <p role="alert" style={{ fontSize: 12, color: 'var(--error)', margin: 0 }}>{error}</p>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="btn btn-primary btn-sm" disabled={saving || !newTitle.trim()}>
                {saving ? 'Erstellen…' : 'Erstellen'}
              </button>
              <button type="button" className="btn btn-ghost btn-sm"
                onClick={() => { setCreating(false); setNewTitle(''); setNewDesc(''); setError('') }}>
                Abbrechen
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        <button
          className={`chip${tab === 'active' ? ' chip--active' : ''}`}
          onClick={() => { setTab('active'); setSearch('') }}
        >
          Aktiv {workspaces.length > 0 && `(${workspaces.length})`}
        </button>
        <button
          className={`chip${tab === 'archived' ? ' chip--active' : ''}`}
          onClick={() => { setTab('archived'); setSearch('') }}
          style={{ display: 'flex', alignItems: 'center', gap: 5 }}
        >
          <Archive size={12} weight="bold" aria-hidden="true" />
          Archiv {archived.length > 0 && `(${archived.length})`}
        </button>
      </div>

      {/* Search */}
      {list.length > 0 && (
        <div className="search-bar-container" style={{ marginBottom: 24 }}>
          <MagnifyingGlass
            size={14} weight="bold" aria-hidden="true"
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }}
          />
          <input
            className="input"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Workspaces durchsuchen…"
            style={{ paddingLeft: 34 }}
          />
        </div>
      )}

      {/* Inline rename */}
      {renamingId && (
        <>
          <div className="modal-backdrop" onClick={() => setRenamingId(null)} style={{ zIndex: 499 }} aria-hidden="true" />
          <div className="modal-overlay" style={{ zIndex: 500 }} role="dialog" aria-label="Umbenennen">
            <div className="card" style={{ padding: 20, width: '100%', maxWidth: 400 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>
                Workspace umbenennen
              </p>
              <input
                autoFocus
                style={fieldInp}
                value={renameValue}
                onChange={e => setRenameValue(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleRenameCommit(); if (e.key === 'Escape') setRenamingId(null) }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="btn btn-primary btn-sm" onClick={handleRenameCommit}>Speichern</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setRenamingId(null)}>Abbrechen</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Content */}
      {loading ? (
        <div style={{ color: 'var(--text-tertiary)', fontSize: 14 }}>Lädt…</div>
      ) : filtered.length === 0 && list.length === 0 ? (
        tab === 'active' ? (
          <div className="empty-state">
            <ShareNetwork size={32} color="var(--text-tertiary)" weight="fill" aria-hidden="true" />
            <div className="empty-state-title">Noch keine Workspaces</div>
            <div className="empty-state-text">
              Workspaces sind geteilte Räume zum Sammeln von Chats, Artefakten und Projekten — mit Kommentaren und öffentlichem Teilen-Link.
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setCreating(true)}>
              <Plus size={14} weight="bold" aria-hidden="true" /> Ersten Workspace erstellen
            </button>
          </div>
        ) : (
          <div className="empty-state">
            <Archive size={32} color="var(--text-tertiary)" weight="fill" aria-hidden="true" />
            <div className="empty-state-title">Kein Archiv</div>
            <div className="empty-state-text">Archivierte Workspaces erscheinen hier.</div>
          </div>
        )
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <X size={28} color="var(--text-tertiary)" weight="bold" aria-hidden="true" />
          <div className="empty-state-title">Keine Treffer</div>
          <div className="empty-state-text">Versuche einen anderen Suchbegriff.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
          {filtered.map(ws => (
            <WorkspaceCard
              key={ws.id}
              ws={ws}
              onDelete={handleDelete}
              onRename={handleStartRename}
              onArchive={handleArchive}
              onUnarchive={handleUnarchive}
              onCopy={handleCopy}
            />
          ))}
        </div>
      )}
    </div>
  )
}
