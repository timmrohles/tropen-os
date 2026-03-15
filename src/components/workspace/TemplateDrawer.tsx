'use client'

import React, { useEffect, useState } from 'react'
import { X, Plus, Trash, BookmarkSimple, ShareNetwork } from '@phosphor-icons/react'
import type { Template } from '@/lib/prompt-templates'
import { TEMPLATES } from '@/lib/prompt-templates'

interface SavedTemplate {
  id: string
  name: string
  content: string
  is_shared: boolean
  created_at: string
}

interface TemplateDrawerProps {
  template: Template | null
  onClose: () => void
  onAccept: (prompt: string) => void
}

export default function TemplateDrawer({ template, onClose, onAccept }: TemplateDrawerProps) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [tab, setTab] = useState<'core' | 'mine' | 'team'>('core')
  const [activeCore, setActiveCore] = useState<Template | null>(template)
  const [saved, setSaved] = useState<SavedTemplate[]>([])
  const [team, setTeam] = useState<SavedTemplate[]>([])
  const [loadingSaved, setLoadingSaved] = useState(false)
  const [loadingTeam, setLoadingTeam] = useState(false)
  const [newName, setNewName] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newShared, setNewShared] = useState(false)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  // Sync active core template from prop
  useEffect(() => {
    if (template) {
      setActiveCore(template)
      setTab('core')
    }
  }, [template?.id])

  // Reset values when active template changes
  useEffect(() => {
    if (!activeCore) return
    const initial: Record<string, string> = {}
    for (const f of activeCore.fields) {
      initial[f.id] = f.type === 'select' && 'options' in f ? f.options[0] : ''
    }
    setValues(initial)
  }, [activeCore?.id])

  // Load saved templates when switching to "mine" tab
  useEffect(() => {
    if (tab !== 'mine') return
    setLoadingSaved(true)
    fetch('/api/prompt-templates')
      .then(r => r.ok ? r.json() : { data: [] })
      .then(json => setSaved(Array.isArray(json) ? json : (json.data ?? [])))
      .finally(() => setLoadingSaved(false))
  }, [tab])

  // Load team templates when switching to "team" tab
  useEffect(() => {
    if (tab !== 'team') return
    setLoadingTeam(true)
    fetch('/api/prompt-templates?scope=team')
      .then(r => r.ok ? r.json() : { data: [] })
      .then(json => setTeam(Array.isArray(json) ? json : (json.data ?? [])))
      .finally(() => setLoadingTeam(false))
  }, [tab])

  function set(id: string, val: string) {
    setValues((prev) => ({ ...prev, [id]: val }))
  }

  async function handleSaveNew() {
    if (!newName.trim() || !newContent.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/prompt-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), content: newContent.trim(), is_shared: newShared }),
      })
      if (res.ok) {
        const created = await res.json()
        setSaved(prev => [created, ...prev])
        setNewName('')
        setNewContent('')
        setNewShared(false)
        setCreating(false)
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (deletingId) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/prompt-templates/${id}`, { method: 'DELETE' })
      if (res.ok) setSaved(prev => prev.filter(t => t.id !== id))
    } finally {
      setDeletingId(null)
    }
  }

  async function handleToggleShare(t: SavedTemplate) {
    if (togglingId) return
    setTogglingId(t.id)
    try {
      const res = await fetch(`/api/prompt-templates/${t.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_shared: !t.is_shared }),
      })
      if (res.ok) {
        setSaved(prev => prev.map(x => x.id === t.id ? { ...x, is_shared: !t.is_shared } : x))
      }
    } finally {
      setTogglingId(null)
    }
  }

  const requiredFilled = activeCore
    ? activeCore.fields.filter(f => !f.optional).every(f => (values[f.id] ?? '').trim().length > 0)
    : false
  const preview = activeCore && requiredFilled ? activeCore.assemble(values) : null

  return (
    <div className="tdrawer" role="dialog" aria-modal="true" aria-label="Prompt-Vorlagen">
      <div className="tdrawer-header">
        <span className="tdrawer-title">Prompt-Vorlagen</span>
        <button className="tdrawer-close" onClick={onClose} title="Schließen">
          <X size={16} />
        </button>
      </div>

      {/* Tabs */}
      <div className="tdrawer-tabs">
        <button
          className={`tdrawer-tab${tab === 'core' ? ' tdrawer-tab--active' : ''}`}
          onClick={() => setTab('core')}
        >
          Toro-Vorlagen
        </button>
        <button
          className={`tdrawer-tab${tab === 'mine' ? ' tdrawer-tab--active' : ''}`}
          onClick={() => setTab('mine')}
        >
          Meine Vorlagen
        </button>
        <button
          className={`tdrawer-tab${tab === 'team' ? ' tdrawer-tab--active' : ''}`}
          onClick={() => setTab('team')}
        >
          Team
        </button>
      </div>

      {/* ── Tab: Core-Vorlagen ── */}
      {tab === 'core' && (
        <>
          <div className="tdrawer-template-list">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                className={`tdrawer-template-pill${activeCore?.id === t.id ? ' tdrawer-template-pill--active' : ''}`}
                onClick={() => setActiveCore(t)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {activeCore && (
            <>
              <div className="tdrawer-fields">
                {activeCore.fields.map((field) => (
                  <div key={field.id} className="tdrawer-field">
                    <label className="tdrawer-label">
                      {field.label}
                      {field.optional && <span className="tdrawer-optional">optional</span>}
                    </label>

                    {field.type === 'select' ? (
                      <select
                        className="tdrawer-select"
                        value={values[field.id] ?? field.options[0]}
                        onChange={(e) => set(field.id, e.target.value)}
                      >
                        {field.options.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : field.type === 'textarea' ? (
                      <textarea
                        className="tdrawer-textarea"
                        placeholder={field.placeholder}
                        value={values[field.id] ?? ''}
                        onChange={(e) => set(field.id, e.target.value)}
                        rows={5}
                      />
                    ) : (
                      <input
                        className="tdrawer-input"
                        type="text"
                        placeholder={field.placeholder}
                        value={values[field.id] ?? ''}
                        onChange={(e) => set(field.id, e.target.value)}
                      />
                    )}
                  </div>
                ))}
              </div>

              {preview && (
                <div className="tdrawer-preview">
                  <span className="tdrawer-preview-label">Vorschau</span>
                  <p className="tdrawer-preview-text">{preview}</p>
                </div>
              )}

              <button
                className="tdrawer-accept"
                disabled={!requiredFilled}
                onClick={() => onAccept(activeCore.assemble(values))}
              >
                Prompt übernehmen →
              </button>
            </>
          )}
        </>
      )}

      {/* ── Tab: Meine Vorlagen ── */}
      {tab === 'mine' && (
        <div className="tdrawer-mine">
          {creating ? (
            <div className="tdrawer-new-form">
              <input
                className="tdrawer-input"
                placeholder="Name der Vorlage…"
                value={newName}
                onChange={e => setNewName(e.target.value)}
              />
              <textarea
                className="tdrawer-textarea"
                placeholder="Prompt-Text…"
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                rows={4}
              />
              <label className="tdrawer-share-toggle">
                <input
                  type="checkbox"
                  checked={newShared}
                  onChange={e => setNewShared(e.target.checked)}
                />
                <span>Mit Team teilen</span>
              </label>
              <div className="tdrawer-new-actions">
                <button
                  className="tdrawer-accept"
                  disabled={!newName.trim() || !newContent.trim() || saving}
                  onClick={handleSaveNew}
                >
                  {saving ? 'Speichern…' : 'Speichern'}
                </button>
                <button className="tdrawer-cancel" onClick={() => setCreating(false)}>
                  Abbrechen
                </button>
              </div>
            </div>
          ) : (
            <button className="tdrawer-new-btn" onClick={() => setCreating(true)}>
              <Plus size={14} /> Neue Vorlage
            </button>
          )}

          {loadingSaved ? (
            <p className="tdrawer-empty">Laden…</p>
          ) : saved.length === 0 ? (
            <p className="tdrawer-empty">Noch keine eigenen Vorlagen gespeichert.</p>
          ) : (
            <div className="tdrawer-saved-list">
              {saved.map((t) => (
                <div key={t.id} className="tdrawer-saved-item">
                  <div className="tdrawer-saved-info">
                    <span className="tdrawer-saved-name">
                      {t.name}
                      {t.is_shared && <span className="tdrawer-shared-badge">geteilt</span>}
                    </span>
                    <span className="tdrawer-saved-preview">{t.content.slice(0, 80)}{t.content.length > 80 ? '…' : ''}</span>
                  </div>
                  <div className="tdrawer-saved-actions">
                    <button
                      className="tdrawer-use-btn"
                      onClick={() => { onAccept(t.content); onClose() }}
                      title="Verwenden"
                    >
                      <BookmarkSimple size={14} /> Verwenden
                    </button>
                    <button
                      className={`tdrawer-share-btn${t.is_shared ? ' tdrawer-share-btn--active' : ''}`}
                      onClick={() => handleToggleShare(t)}
                      disabled={togglingId === t.id}
                      title={t.is_shared ? 'Nicht mehr teilen' : 'Mit Team teilen'}
                    >
                      <ShareNetwork size={13} />
                    </button>
                    <button
                      className="tdrawer-del-btn"
                      onClick={() => handleDelete(t.id)}
                      disabled={deletingId === t.id}
                      title="Löschen"
                    >
                      <Trash size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Team-Vorlagen ── */}
      {tab === 'team' && (
        <div className="tdrawer-mine">
          {loadingTeam ? (
            <p className="tdrawer-empty">Laden…</p>
          ) : team.length === 0 ? (
            <p className="tdrawer-empty">Noch keine Team-Vorlagen. Teile eigene Vorlagen unter &bdquo;Meine Vorlagen&ldquo;.</p>
          ) : (
            <div className="tdrawer-saved-list">
              {team.map((t) => (
                <div key={t.id} className="tdrawer-saved-item">
                  <div className="tdrawer-saved-info">
                    <span className="tdrawer-saved-name">{t.name}</span>
                    <span className="tdrawer-saved-preview">{t.content.slice(0, 80)}{t.content.length > 80 ? '…' : ''}</span>
                  </div>
                  <div className="tdrawer-saved-actions">
                    <button
                      className="tdrawer-use-btn"
                      onClick={() => { onAccept(t.content); onClose() }}
                      title="Verwenden"
                    >
                      <BookmarkSimple size={14} /> Verwenden
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
