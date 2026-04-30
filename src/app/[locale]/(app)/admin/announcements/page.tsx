'use client'

import { useEffect, useState } from 'react'
import { Megaphone } from '@phosphor-icons/react'
import { s, typeBadgeStyle } from './announcements.styles'

interface AnnouncementRow {
  id: string
  title: string
  body: string | null
  url: string | null
  type: string
  expires_at: string | null
  published_at: string
}

interface CreateForm {
  title: string
  body: string
  url: string
  expires_at: string
}

const EMPTY_FORM: CreateForm = {
  title: '',
  body: '',
  url: '',
  expires_at: '',
}

export default function OrgAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actioningId, setActioningId] = useState<string | null>(null)

  function loadAnnouncements() {
    setLoading(true)
    fetch('/api/announcements')
      .then((r) => {
        if (!r.ok) throw new Error(`Fehler beim Laden (${r.status})`)
        return r.json()
      })
      .then((data: unknown) => {
        setAnnouncements(Array.isArray(data) ? (data as AnnouncementRow[]) : [])
        setLoadError(null)
      })
      .catch(() => {
        setAnnouncements([])
        setLoadError('Neuigkeiten konnten nicht geladen werden. Bitte Seite neu laden.')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadAnnouncements()
   
  }, [])

  function openForm() {
    setForm(EMPTY_FORM)
    setFormError(null)
    setShowForm(true)
  }

  function cancelForm() {
    setShowForm(false)
    setFormError(null)
  }

  async function handleCreate() {
    if (!form.title.trim()) {
      setFormError('Titel ist erforderlich.')
      return
    }
    setSaving(true)
    setFormError(null)

    const payload = {
      title: form.title.trim(),
      body: form.body.trim() || null,
      url: form.url.trim() || null,
      type: 'info',
      expires_at: form.expires_at || null,
    }

    const res = await fetch('/api/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setSaving(false)

    if (res.ok) {
      setShowForm(false)
      loadAnnouncements()
    } else {
      const data = await res.json().catch(() => ({})) as { error?: string }
      setFormError(data.error ?? 'Unbekannter Fehler.')
    }
  }

  async function handleDeactivate(id: string) {
    setActioningId(id)
    setActionError(null)
    const res = await fetch(`/api/announcements/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: false }),
    })
    setActioningId(null)
    if (res.ok) {
      loadAnnouncements()
    } else {
      const data = await res.json().catch(() => ({})) as { error?: string }
      setActionError(data.error ?? 'Deaktivieren fehlgeschlagen.')
    }
  }

  async function handleDelete(id: string) {
    setActioningId(id)
    setActionError(null)
    const res = await fetch(`/api/announcements/${id}`, { method: 'DELETE' })
    setActioningId(null)
    if (res.ok) {
      loadAnnouncements()
    } else {
      const data = await res.json().catch(() => ({})) as { error?: string }
      setActionError(data.error ?? 'Löschen fehlgeschlagen.')
    }
  }

  return (
    <div className="content-max">
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-header-title">
            <Megaphone size={22} color="var(--text-primary)" weight="fill" aria-hidden="true" />
            Neuigkeiten für dein Team
          </h1>
          <p className="page-header-sub">Informiere dein Team über wichtige Updates</p>
        </div>
        <div className="page-header-actions">
          {!showForm && (
            <button className="btn btn-primary" onClick={openForm}>
              + Neue Neuigkeit
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <div className="card" style={{ padding: '24px 28px', marginBottom: 24 }}>
          <div style={s.formTitle}>Neue Neuigkeit erstellen</div>

          {formError && <div style={s.errorBanner}>{formError}</div>}

          <div style={s.grid}>
            <div style={s.fullWidth}>
              <label style={s.label}>Titel *</label>
              <input
                style={s.input}
                placeholder="Titel der Neuigkeit"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>

            <div style={s.fullWidth}>
              <label style={s.label}>Body</label>
              <textarea
                style={s.textarea}
                placeholder="Optionaler Beschreibungstext…"
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              />
            </div>

            <div>
              <label style={s.label}>URL</label>
              <input
                style={s.input}
                placeholder="https://…"
                value={form.url}
                onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              />
            </div>

            <div>
              <label style={s.label}>Gilt bis</label>
              <input
                style={s.input}
                type="date"
                value={form.expires_at}
                onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value }))}
              />
            </div>
          </div>

          <div style={s.formFooter}>
            <button className="btn btn-ghost" onClick={cancelForm} disabled={saving}>
              Abbrechen
            </button>
            <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>
              {saving ? 'Speichern…' : 'Neuigkeit erstellen'}
            </button>
          </div>
        </div>
      )}

      {loadError && (
        <div style={{ padding: '10px 14px', marginBottom: 16, borderRadius: 6, fontSize: 13, background: 'var(--error-bg)', border: '1px solid var(--error-border)', color: 'var(--text-primary)' }}>
          {loadError}
        </div>
      )}

      {actionError && <div style={s.errorBanner}>{actionError}</div>}

      <div className="card">
        <div className="card-header">
          <span className="card-header-label">Aktive Neuigkeiten</span>
        </div>
        <div className="card-body">
          {loading ? (
            <p style={s.muted}>Lade…</p>
          ) : announcements.length === 0 ? (
            <p style={s.muted}>Noch keine Neuigkeiten veröffentlicht.</p>
          ) : (
            announcements.map((a) => (
              <div className="list-row" key={a.id}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 500, fontSize: 14, color: 'var(--text-primary)' }}>
                      {a.title}
                    </span>
                    <span style={typeBadgeStyle(a.type)}>{a.type}</span>
                  </div>
                  {a.body && (
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
                      {a.body}
                    </div>
                  )}
                  <div style={s.rowMeta}>
                    {a.expires_at &&
                      `Läuft ab: ${new Date(a.expires_at).toLocaleDateString('de-DE')}`}
                    {a.url && (a.expires_at ? ' · ' : '') + a.url}
                  </div>
                </div>
                <div style={s.rowActions}>
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => handleDeactivate(a.id)}
                    disabled={actioningId === a.id}
                  >
                    Deaktivieren
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDelete(a.id)}
                    disabled={actioningId === a.id}
                  >
                    Löschen
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
