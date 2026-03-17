'use client'
// src/app/feeds/SourcesView.tsx — Quellen-Verwaltung Tab
import { useState, useCallback, useEffect } from 'react'
import {
  listFeedSources, updateFeedSource, deleteFeedSource, copyFeedSource,
} from '@/actions/feeds'
import type { FeedSource } from '@/types/feeds'
import {
  PauseCircle, PlayCircle, DotsThree, PencilSimple, Copy, Trash, Warning,
} from '@phosphor-icons/react'

const SOURCE_COLOR: Record<string, string> = {
  rss:   'var(--accent)',
  email: '#7C6FF7',
  api:   '#F7A44A',
  url:   'var(--text-tertiary)',
}

export default function SourcesView() {
  const [sources, setSources]           = useState<FeedSource[]>([])
  const [loading, setLoading]           = useState(true)
  const [menuOpen, setMenuOpen]         = useState<string | null>(null)
  const [editing, setEditing]           = useState<FeedSource | null>(null)
  const [editName, setEditName]         = useState('')
  const [editUrl, setEditUrl]           = useState('')
  const [editMinScore, setEditMinScore] = useState(5)
  const [saving, setSaving]             = useState(false)
  const [editError, setEditError]       = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const data = await listFeedSources()
    setSources(data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleToggleActive = async (src: FeedSource) => {
    const res = await updateFeedSource(src.id, { isActive: !src.isActive })
    if (!res.error) setSources((prev) => prev.map((s) => s.id === src.id ? { ...s, isActive: !s.isActive } : s))
  }

  const handleCopy = async (src: FeedSource) => {
    setMenuOpen(null)
    const res = await copyFeedSource(src.id)
    if (res.source) setSources((prev) => [res.source!, ...prev])
  }

  const handleDelete = async (src: FeedSource) => {
    setMenuOpen(null)
    if (!confirm(`Quelle „${src.name}" wirklich löschen? Alle zugehörigen Artikel werden ebenfalls entfernt.`)) return
    const res = await deleteFeedSource(src.id)
    if (!res.error) {
      setSources((prev) => prev.filter((s) => s.id !== src.id))
      if (editing?.id === src.id) setEditing(null)
    }
  }

  const openEdit = (src: FeedSource) => {
    setEditing(src)
    setEditName(src.name)
    setEditUrl(src.url ?? '')
    setEditMinScore(src.minScore)
    setEditError('')
    setMenuOpen(null)
  }

  const handleSave = async () => {
    if (!editing) return
    setSaving(true)
    setEditError('')
    const res = await updateFeedSource(editing.id, { name: editName, url: editUrl || null, minScore: editMinScore })
    setSaving(false)
    if (res.error) { setEditError(res.error); return }
    if (res.source) setSources((prev) => prev.map((s) => s.id === editing.id ? res.source! : s))
    setEditing(null)
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-tertiary)', fontSize: 14 }}>Wird geladen…</div>
  }

  if (sources.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-tertiary)', fontSize: 14 }}>
        Noch keine Quellen. <a href="/feeds/new" style={{ color: 'var(--accent)' }}>Erste Quelle anlegen →</a>
      </div>
    )
  }

  return (
    <div onClick={() => setMenuOpen(null)}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {sources.map((src) => (
          <div
            key={src.id}
            className="card"
            style={{
              padding: '16px 18px', cursor: 'pointer',
              borderLeft: src.isActive ? '3px solid var(--accent)' : '3px solid var(--border)',
              opacity: src.isActive ? 1 : 0.65,
              outline: editing?.id === src.id ? '2px solid var(--accent)' : undefined,
              position: 'relative',
            }}
            onClick={() => openEdit(src)}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 600, color: '#fff', background: SOURCE_COLOR[src.type] ?? 'var(--text-tertiary)' }}>
                {src.type.toUpperCase()}
              </span>
              <div style={{ display: 'flex', gap: 4 }} onClick={(e) => e.stopPropagation()}>
                <button className="btn-icon" title={src.isActive ? 'Pausieren' : 'Aktivieren'}
                  aria-label={src.isActive ? 'Quelle pausieren' : 'Quelle aktivieren'}
                  onClick={() => handleToggleActive(src)}>
                  {src.isActive
                    ? <PauseCircle size={16} weight="fill" color="var(--accent)" aria-hidden="true" />
                    : <PlayCircle  size={16} weight="fill" color="var(--text-tertiary)" aria-hidden="true" />}
                </button>
                <button className="btn-icon" aria-label="Weitere Aktionen" aria-haspopup="true"
                  aria-expanded={menuOpen === src.id}
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === src.id ? null : src.id) }}>
                  <DotsThree size={16} weight="bold" aria-hidden="true" />
                </button>
                {menuOpen === src.id && (
                  <div className="dropdown" style={{ position: 'absolute', right: 12, top: 44, zIndex: 20, minWidth: 180 }}
                    role="menu" onClick={(e) => e.stopPropagation()}>
                    <button role="menuitem" className="dropdown-item" onClick={() => openEdit(src)}>
                      <PencilSimple size={14} weight="bold" aria-hidden="true" /> Bearbeiten
                    </button>
                    <button role="menuitem" className="dropdown-item" onClick={() => handleCopy(src)}>
                      <Copy size={14} weight="bold" aria-hidden="true" /> Duplizieren
                    </button>
                    <div className="dropdown-divider" />
                    <button role="menuitem" className="dropdown-item dropdown-item--danger" onClick={() => handleDelete(src)}>
                      <Trash size={14} weight="bold" aria-hidden="true" /> Löschen
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{src.name}</div>
            {src.url && (
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {src.url}
              </div>
            )}
            <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>
              <span>Min. Score: {src.minScore}</span>
              {src.lastFetchedAt && <span>Zuletzt: {new Date(src.lastFetchedAt).toLocaleDateString('de-DE')}</span>}
              {src.errorCount > 0 && (
                <span style={{ color: '#E53E3E', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                  <Warning size={12} weight="fill" aria-hidden="true" /> {src.errorCount} Fehler
                </span>
              )}
            </div>
            {src.keywordsInclude.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                {src.keywordsInclude.slice(0, 3).map((k, i) => (
                  <span key={i} className="chip" style={{ fontSize: 11 }}>{k}</span>
                ))}
                {src.keywordsInclude.length > 3 && (
                  <span className="chip" style={{ fontSize: 11 }}>+{src.keywordsInclude.length - 3}</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {editing && (
        <div className="card" style={{ padding: 24, marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <span className="card-header-label">Quelle bearbeiten</span>
            <button className="btn-icon" aria-label="Schließen" onClick={() => setEditing(null)}>✕</button>
          </div>
          {editError && (
            <div style={{ padding: '10px 14px', background: '#FFF5F5', border: '1px solid #FED7D7', borderRadius: 8, fontSize: 13, color: '#C53030', marginBottom: 16 }}>
              {editError}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Name</label>
              <input
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-surface)', fontSize: 14, color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
                value={editName} onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            {editing.type !== 'email' && (
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>URL</label>
                <input
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-surface)', fontSize: 14, color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
                  value={editUrl} onChange={(e) => setEditUrl(e.target.value)} placeholder="https://…"
                />
              </div>
            )}
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Mindest-Score ({editMinScore})
              </label>
              <input type="range" min={1} max={10} value={editMinScore}
                onChange={(e) => setEditMinScore(Number(e.target.value))}
                style={{ width: '100%' }} aria-label="Mindest-Score" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={() => setEditing(null)}>Abbrechen</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Speichern…' : 'Speichern'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
