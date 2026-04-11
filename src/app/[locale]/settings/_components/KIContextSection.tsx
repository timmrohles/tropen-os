'use client'

import { useEffect, useState } from 'react'
import { FloppyDisk, ArrowSquareOut, FileText } from '@phosphor-icons/react'
import Link from 'next/link'

interface KIData {
  ki_context?: string
  ki_role?: string
  communication_style?: string
}

interface DocRow {
  id: string
  title: string
  file_type: string | null
  file_size: number | null
  status: string
  created_at: string
}

function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / (1024 * 1024)).toFixed(1)} MB`
}

export function KIContextSection() {
  const [kiRole, setKiRole] = useState('')
  const [kiContext, setKiContext] = useState('')
  const [commStyle, setCommStyle] = useState('structured')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [docs, setDocs] = useState<DocRow[]>([])

  useEffect(() => {
    fetch('/api/settings/ki-context')
      .then(r => r.json())
      .then((d: KIData) => {
        setKiRole(d.ki_role ?? '')
        setKiContext(d.ki_context ?? '')
        setCommStyle(d.communication_style ?? 'structured')
      })

    fetch('/api/knowledge?scope=user')
      .then(r => r.ok ? r.json() : [])
      .then((d: DocRow[]) => setDocs(d.slice(0, 5)))
  }, [])

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    await fetch('/api/settings/ki-context', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ki_role: kiRole, ki_context: kiContext, communication_style: commStyle }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card">
        <div className="card-header">
          <span className="card-header-label">Mein KI-Kontext</span>
        </div>
        <div className="card-body" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
            Was soll Toro über dich wissen? Je mehr Kontext, desto bessere Antworten.
          </p>

          <div className="settings-field">
            <label className="settings-label" htmlFor="ki-role">Meine Rolle</label>
            <input
              id="ki-role"
              type="text"
              className="settings-input"
              placeholder="z.B. Marketing Manager bei Acme GmbH"
              value={kiRole}
              onChange={e => setKiRole(e.target.value)}
            />
          </div>

          <div className="settings-field">
            <label className="settings-label" htmlFor="comm-style">Kommunikationsstil</label>
            <select id="comm-style" className="settings-select" value={commStyle} onChange={e => setCommStyle(e.target.value)}>
              <option value="formal">Formell</option>
              <option value="structured">Strukturiert</option>
              <option value="casual">Locker / Du</option>
              <option value="direct">Direkt und knapp</option>
            </select>
          </div>

          <div className="settings-field">
            <label className="settings-label" htmlFor="ki-context">Über mich (für Toro)</label>
            <textarea
              id="ki-context"
              className="settings-textarea"
              rows={4}
              placeholder="Was soll Toro über deine Arbeit, Ziele und Präferenzen wissen?"
              value={kiContext}
              onChange={e => setKiContext(e.target.value)}
            />
          </div>

          <button
            className="btn btn-primary"
            style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6 }}
            onClick={handleSave}
            disabled={saving}
          >
            <FloppyDisk size={14} weight="bold" aria-hidden="true" />
            {saved ? 'Gespeichert' : saving ? 'Speichern…' : 'Speichern'}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-header-label">Meine Dokumente</span>
          <Link href="/knowledge" className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
            <ArrowSquareOut size={12} weight="bold" aria-hidden="true" />
            Alle verwalten
          </Link>
        </div>
        <div className="card-body" style={{ padding: '12px 18px' }}>
          {docs.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
              Noch keine Dokumente. <Link href="/knowledge" style={{ color: 'var(--accent)' }}>Jetzt hochladen →</Link>
            </p>
          ) : (
            docs.map(doc => (
              <div key={doc.id} className="settings-doc-row">
                <FileText size={16} weight="fill" style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} aria-hidden="true" />
                <span className="settings-doc-name">{doc.title}</span>
                <span className="settings-doc-meta">
                  {doc.file_size ? formatBytes(doc.file_size) : ''}
                </span>
              </div>
            ))
          )}
          {docs.length > 0 && (
            <Link href="/knowledge" style={{ fontSize: 12, color: 'var(--accent)', display: 'block', marginTop: 10 }}>
              Alle Dokumente anzeigen →
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
