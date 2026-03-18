'use client'

import { useState } from 'react'

export interface SaveArtifactModalProps {
  content: string
  language: string | null
  conversationId: string
  organizationId: string
  onDone: () => void
  onCancel: () => void
}

export function SaveArtifactModal({
  content, language, conversationId, organizationId, onDone, onCancel,
}: SaveArtifactModalProps) {
  const [name, setName] = useState(language ? `${language}-snippet` : 'code-snippet')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    try {
      await fetch('/api/artifacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, organizationId, name: name.trim(), type: 'code', language, content }),
      })
      onDone()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 24, width: 340, display: 'flex', flexDirection: 'column', gap: 16 }}
      >
        <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 15 }}>Artefakt speichern</div>
        <div>
          <label style={{ color: 'var(--text-secondary)', fontSize: 12, display: 'block', marginBottom: 6 }}>Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', color: 'var(--text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '7px 14px', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            style={{ background: 'var(--accent)', border: 'none', borderRadius: 6, padding: '7px 14px', color: '#fff', fontSize: 13, fontWeight: 600, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1 }}
          >
            {saving ? 'Speichern…' : 'Speichern'}
          </button>
        </div>
      </div>
    </div>
  )
}
