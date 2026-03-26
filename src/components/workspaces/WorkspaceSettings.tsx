'use client'

import { useState } from 'react'
import { FloppyDisk } from '@phosphor-icons/react'

const inp: React.CSSProperties = {
  width: '100%', padding: '8px 10px',
  border: '1px solid var(--border-medium)',
  borderRadius: 7, background: 'var(--bg-surface-solid)',
  color: 'var(--text-primary)', fontSize: 13, outline: 'none',
  boxSizing: 'border-box',
}

export default function WorkspaceSettings({
  workspaceId,
  initial,
  onSaved,
}: {
  workspaceId: string
  initial: { title: string; description: string | null; emoji: string | null; status: string }
  onSaved: (data: { title: string; description: string | null; emoji: string | null; status: string }) => void
}) {
  const [form, setForm] = useState({
    title:       initial.title,
    description: initial.description ?? '',
    emoji:       initial.emoji ?? '',
    status:      initial.status,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true); setError('')
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:       form.title.trim(),
          description: form.description.trim() || null,
          emoji:       form.emoji.trim() || null,
          status:      form.status,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Fehler')
      const data = await res.json()
      onSaved({ title: data.title, description: data.description, emoji: data.emoji, status: data.status })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler')
    } finally {
      setSaving(false)
    }
  }

  const label: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)',
    textTransform: 'uppercase', letterSpacing: '0.05em',
    display: 'block', marginBottom: 5,
  }

  return (
    <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 480 }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ width: 80 }}>
          <label style={label}>Emoji</label>
          <input
            style={{ ...inp, textAlign: 'center', fontSize: 20 }}
            value={form.emoji}
            onChange={e => setForm(p => ({ ...p, emoji: e.target.value }))}
            placeholder="🗂️"
            maxLength={4}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={label}>Name *</label>
          <input
            style={inp}
            value={form.title}
            onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            required
            placeholder="Workspace-Name"
          />
        </div>
      </div>

      <div>
        <label style={label}>Beschreibung</label>
        <textarea
          style={{ ...inp, resize: 'vertical', minHeight: 72 }}
          value={form.description}
          onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
          placeholder="Worum geht es in diesem Workspace?"
        />
      </div>

      <div>
        <label style={label}>Status</label>
        <select
          style={inp}
          value={form.status}
          onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
        >
          <option value="draft">Entwurf</option>
          <option value="active">Aktiv</option>
          <option value="archived">Archiviert</option>
        </select>
      </div>

      {error && <p role="alert" style={{ fontSize: 12, color: 'var(--error)', margin: 0 }}>{error}</p>}

      <div>
        <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
          <FloppyDisk size={14} weight="bold" aria-hidden="true" />
          {saved ? 'Gespeichert!' : saving ? 'Speichern…' : 'Änderungen speichern'}
        </button>
      </div>
    </form>
  )
}
