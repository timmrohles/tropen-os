'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  TextAlignLeft, MagnifyingGlass, FloppyDisk, ArrowCounterClockwise,
  Lock, PencilSimple, CaretDown, CaretRight, Code as CodeIcon,
} from '@phosphor-icons/react'
import type { SystemPrompt } from '@/app/api/superadmin/prompts/route'

export default function SuperadminPromptsPage() {
  const [prompts, setPrompts] = useState<SystemPrompt[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeGroup, setActiveGroup] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchPrompts = useCallback(async () => {
    try {
      const res = await fetch('/api/superadmin/prompts')
      if (!res.ok) throw new Error('Fetch failed')
      const data = await res.json()
      setPrompts(data.prompts)
    } catch {
      setError('Prompts konnten nicht geladen werden')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPrompts() }, [fetchPrompts])

  const groups = Array.from(new Set(prompts.map(p => p.group)))

  const filtered = prompts.filter(p => {
    const q = search.toLowerCase()
    if (!q) return true
    return (
      p.name.toLowerCase().includes(q) ||
      p.prompt.toLowerCase().includes(q) ||
      p.group.toLowerCase().includes(q)
    )
  })

  const startEdit = (p: SystemPrompt) => {
    setEditingId(p.id)
    setEditValue(p.prompt)
    setError(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditValue('')
  }

  const savePrompt = async (p: SystemPrompt) => {
    if (editValue === p.prompt) { cancelEdit(); return }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/superadmin/prompts/${p.table}/${p.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: editValue }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Save failed')
      }
      setPrompts(prev => prev.map(x => x.id === p.id ? { ...x, prompt: editValue } : x))
      setEditingId(null)
      setSavedId(p.id)
      setTimeout(() => setSavedId(null), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <div className="page-header-text">
            <h1 className="page-header-title">
              <TextAlignLeft size={22} color="var(--text-primary)" weight="fill" aria-hidden="true" />
              Prompt-Verwaltung
            </h1>
            <p className="page-header-sub">Alle System-Prompts auf einen Blick</p>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton" style={{ height: 80, borderRadius: 'var(--radius-sm)' }} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-header-title">
            <TextAlignLeft size={22} color="var(--text-primary)" weight="fill" aria-hidden="true" />
            Prompt-Verwaltung
          </h1>
          <p className="page-header-sub">
            {prompts.length} Prompts in {groups.length} Gruppen — {prompts.filter(p => p.editable).length} editierbar
          </p>
        </div>
      </div>

      {/* Search + Filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <MagnifyingGlass
            size={14} weight="bold"
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }}
            aria-hidden="true"
          />
          <input
            className="input"
            placeholder="Prompts durchsuchen..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 34 }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            className={`chip ${!activeGroup ? 'chip--active' : ''}`}
            onClick={() => setActiveGroup(null)}
          >
            Alle
          </button>
          {groups.map(g => (
            <button
              key={g}
              className={`chip ${activeGroup === g ? 'chip--active' : ''}`}
              onClick={() => setActiveGroup(activeGroup === g ? null : g)}
            >
              {g.replace(' (Edge Functions)', '').replace(' (Output-Formate)', '')}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div style={{
          padding: '10px 14px', marginBottom: 16, borderRadius: 'var(--radius-sm)',
          background: 'var(--error-bg, rgba(192,57,43,0.08))', color: 'var(--error)',
          fontSize: 13, border: '1px solid var(--error)',
        }}>
          {error}
        </div>
      )}

      {/* Prompt Groups */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {groups
          .filter(g => !activeGroup || g === activeGroup)
          .map(group => {
            const groupPrompts = filtered.filter(p => p.group === group)
            if (groupPrompts.length === 0) return null

            const isHardcoded = group.includes('Hardcoded')

            return (
              <div key={group} className="card">
                <div className="card-header">
                  <span className="card-header-label">
                    {isHardcoded && <Lock size={12} weight="bold" style={{ marginRight: 4 }} />}
                    {group}
                  </span>
                  <span className="badge">{groupPrompts.length}</span>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                  {groupPrompts.map((p, idx) => {
                    const isEditing = editingId === p.id
                    const justSaved = savedId === p.id

                    return (
                      <div key={p.id}>
                        {idx > 0 && <div className="card-divider" />}
                        <div style={{ padding: '12px 16px' }}>
                          {/* Header Row */}
                          <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            marginBottom: isEditing ? 10 : 0, gap: 8,
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                                {p.name}
                              </span>
                              {typeof p.meta?.capability_type === 'string' && (
                                <span className="badge badge--neutral" style={{ fontSize: 10 }}>
                                  {p.meta.capability_type}
                                </span>
                              )}
                              {typeof p.meta?.output_type === 'string' && (
                                <span className="badge badge--neutral" style={{ fontSize: 10 }}>
                                  {p.meta.output_type}
                                </span>
                              )}
                              {typeof p.meta?.scope === 'string' && (
                                <span className="badge badge--info" style={{ fontSize: 10 }}>
                                  {p.meta.scope}
                                </span>
                              )}
                              {justSaved && (
                                <span className="badge badge--success" style={{ fontSize: 10 }}>
                                  Gespeichert
                                </span>
                              )}
                            </div>
                            <div style={{ display: 'flex', gap: 4 }}>
                              {p.editable && !isEditing && (
                                <button
                                  className="btn btn-sm btn-ghost"
                                  onClick={() => startEdit(p)}
                                  aria-label={`${p.name} bearbeiten`}
                                >
                                  <PencilSimple size={12} weight="bold" /> Bearbeiten
                                </button>
                              )}
                              {!p.editable && typeof p.meta?.file === 'string' && (
                                <span style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <CodeIcon size={12} weight="bold" />
                                  {p.meta.file}:{typeof p.meta.lines === 'string' ? p.meta.lines : ''}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Prompt Content */}
                          {isEditing ? (
                            <div>
                              <textarea
                                className="input"
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                rows={Math.max(4, editValue.split('\n').length + 1)}
                                style={{ resize: 'vertical', fontFamily: 'var(--font-mono)', fontSize: 12 }}
                                autoFocus
                              />
                              <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
                                <button
                                  className="btn btn-sm btn-ghost"
                                  onClick={cancelEdit}
                                  disabled={saving}
                                >
                                  <ArrowCounterClockwise size={12} weight="bold" /> Abbrechen
                                </button>
                                <button
                                  className="btn btn-sm btn-primary"
                                  onClick={() => savePrompt(p)}
                                  disabled={saving || editValue === p.prompt}
                                >
                                  <FloppyDisk size={12} weight="bold" />
                                  {saving ? 'Speichert...' : 'Speichern'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <pre style={{
                              margin: '6px 0 0', padding: '8px 10px',
                              background: 'var(--bg-surface-2, rgba(0,0,0,0.02))',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: 12, lineHeight: 1.6,
                              color: 'var(--text-secondary)',
                              fontFamily: 'var(--font-mono)',
                              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                              maxHeight: 120, overflow: 'auto',
                              border: '1px solid var(--border)',
                            }}>
                              {p.prompt || '(leer)'}
                            </pre>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
      </div>

      {filtered.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '48px 0',
          color: 'var(--text-tertiary)', fontSize: 13,
        }}>
          Keine Prompts gefunden.
        </div>
      )}
    </div>
  )
}
