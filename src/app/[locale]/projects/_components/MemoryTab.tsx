'use client'

import { useState, useEffect } from 'react'
import { PencilSimple, Trash, Check } from '@phosphor-icons/react'
import { type Mem, formatRelDate } from './types'

export function MemoryTab({ projectId, memCount }: { projectId: string; memCount: number }) {
  const [memories, setMemories]     = useState<Mem[]>([])
  const [loading, setLoading]       = useState(true)
  const [confirmAll, setConfirmAll] = useState(false)
  const [editingId, setEditingId]   = useState<string | null>(null)
  const [editText, setEditText]     = useState('')

  useEffect(() => {
    fetch(`/api/projects/${projectId}/memory`)
      .then(r => r.json())
      .then(d => setMemories(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false))
  }, [projectId])

  async function handleDelete(memId: string) {
    await fetch(`/api/projects/${projectId}/memory/${memId}`, { method: 'DELETE' })
    setMemories(prev => prev.filter(m => m.id !== memId))
    if (editingId === memId) setEditingId(null)
  }

  async function handleDeleteAll() {
    await fetch(`/api/projects/${projectId}/memory`, { method: 'DELETE' })
    setMemories([])
    setConfirmAll(false)
    setEditingId(null)
  }

  function startEdit(m: Mem) {
    setEditingId(m.id)
    setEditText(m.content)
  }

  async function saveEdit(memId: string) {
    if (!editText.trim()) return
    const res = await fetch(`/api/projects/${projectId}/memory/${memId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: editText.trim() }),
    })
    if (res.ok) {
      const updated = await res.json()
      setMemories(prev => prev.map(m => m.id === memId ? { ...m, content: updated.content } : m))
    }
    setEditingId(null)
  }

  return (
    <div className="project-tab-content">
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
        Das hat Toro sich in diesem Projekt gemerkt. Einträge werden automatisch hinzugefügt.
      </p>

      {loading ? (
        <p style={{ color: 'var(--text-tertiary)', fontSize: 13, margin: 0 }}>Lade Gedächtnis…</p>
      ) : memories.length === 0 ? (
        <p style={{ color: 'var(--text-tertiary)', fontSize: 13, margin: 0 }}>
          Toro hat sich noch nichts gemerkt. Führe ein paar Chats in diesem Projekt durch.
        </p>
      ) : (
        <>
          <div>
            {memories.map(m => (
              <div key={m.id} className="project-memory-item">
                <div className="project-memory-content">
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.type}</span>
                  {editingId === m.id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                      <textarea
                        autoFocus
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        rows={3}
                        style={{ fontSize: 13, lineHeight: 1.5, background: 'var(--bg-surface)', border: '1px solid var(--accent)', borderRadius: 6, padding: '6px 8px', color: 'var(--text-primary)', fontFamily: 'inherit', resize: 'vertical', width: '100%', boxSizing: 'border-box' }}
                        onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) saveEdit(m.id); if (e.key === 'Escape') setEditingId(null) }}
                      />
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-primary btn-sm" onClick={() => saveEdit(m.id)}><Check size={12} weight="bold" /> Speichern</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)}>Abbrechen</button>
                      </div>
                    </div>
                  ) : (
                    <p className="project-memory-text">{m.content}</p>
                  )}
                  <span className="project-memory-date">{formatRelDate(m.created_at)}</span>
                </div>
                <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                  {editingId !== m.id && (
                    <button className="btn-icon" onClick={() => startEdit(m)} aria-label="Eintrag bearbeiten" title="Bearbeiten">
                      <PencilSimple size={13} weight="bold" />
                    </button>
                  )}
                  <button className="btn-icon" onClick={() => handleDelete(m.id)} aria-label="Eintrag löschen" title="Löschen">
                    <Trash size={13} weight="bold" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {confirmAll ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Gesamtes Gedächtnis löschen?</span>
              <button className="btn btn-danger btn-sm" onClick={handleDeleteAll}>Ja, alles löschen</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setConfirmAll(false)}>Abbrechen</button>
            </div>
          ) : (
            <button className="btn btn-danger btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => setConfirmAll(true)}>
              <Trash size={14} weight="bold" aria-hidden="true" /> Gesamtes Gedächtnis löschen
            </button>
          )}
        </>
      )}
    </div>
  )
}
