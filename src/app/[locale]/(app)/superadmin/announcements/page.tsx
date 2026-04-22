'use client'

import { useEffect, useState } from 'react'
import { Megaphone } from '@phosphor-icons/react'
import { s, typeBadgeStyle } from './announcements.styles'
import { useTranslations } from 'next-intl'

interface OrgRow {
  id: string
  name: string
}

interface AnnouncementRow {
  id: string
  title: string
  body: string | null
  url: string | null
  url_label: string | null
  type: string
  source: 'tropen' | 'org'
  expires_at: string | null
  published_at: string
}

interface CreateForm {
  title: string
  body: string
  url: string
  url_label: string
  expires_at: string
  type: 'info' | 'update' | 'warning'
  target: 'all' | 'org'
  organization_id: string
}

const EMPTY_FORM: CreateForm = {
  title: '',
  body: '',
  url: '',
  url_label: '',
  expires_at: '',
  type: 'info',
  target: 'all',
  organization_id: '',
}

export default function SuperadminAnnouncementsPage() {
  const t = useTranslations('superadmin')
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([])
  const [orgs, setOrgs] = useState<OrgRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actioningId, setActioningId] = useState<string | null>(null)

  function loadAnnouncements() {
    setLoading(true)
    fetch('/api/announcements')
      .then((r) => r.json())
      .then((data) => setAnnouncements(Array.isArray(data) ? data : []))
      .catch(() => setAnnouncements([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadAnnouncements()
    fetch('/api/superadmin/clients')
      .then((r) => r.ok ? r.json() : { data: [] })
      .then((json: { data: OrgRow[] }) =>
        setOrgs((json.data ?? []).map((o) => ({ id: o.id, name: o.name })))
      )
      .catch(() => setOrgs([]))
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
    if (form.target === 'org' && !form.organization_id) {
      setFormError('Bitte eine Organisation auswählen.')
      return
    }
    setSaving(true)
    setFormError(null)
    const payload: Record<string, string | null> = {
      title: form.title.trim(),
      body: form.body.trim() || null,
      url: form.url.trim() || null,
      url_label: form.url_label.trim() || null,
      expires_at: form.expires_at || null,
      type: form.type,
      organization_id: form.target === 'org' ? form.organization_id : null,
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
      const data = await res.json()
      setFormError(data.error ?? 'Unbekannter Fehler')
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
      const data = await res.json().catch(() => ({}))
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
      const data = await res.json().catch(() => ({}))
      setActionError(data.error ?? 'Löschen fehlgeschlagen.')
    }
  }

  return (
    <div className="content-wide">
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-header-title">
            <Megaphone size={22} color="var(--text-primary)" weight="fill" aria-hidden="true" />
            {t('announcements.title')}
          </h1>
          <p className="page-header-sub">{t('announcements.subtitle')}</p>
        </div>
        <div className="page-header-actions">
          {!showForm && (
            <button className="btn btn-primary" onClick={openForm}>
              {t('announcements.newBtn')}
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <div className="card" style={{ padding: '24px 28px', marginBottom: 24 }}>
          <div style={s.formTitle}>{t('announcements.formTitle')}</div>

          {formError && <div style={s.errorBanner}>{formError}</div>}

          <div style={s.grid}>
            <div style={s.fullWidth}>
              <label style={s.label}>{t('announcements.titleLabel')}</label>
              <input
                style={s.input}
                placeholder="Titel der Announcement"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>

            <div style={s.fullWidth}>
              <label style={s.label}>{t('announcements.bodyLabel')}</label>
              <textarea
                style={s.textarea}
                placeholder="Optionaler Beschreibungstext…"
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              />
            </div>

            <div>
              <label style={s.label}>{t('announcements.urlLabel')}</label>
              <input
                style={s.input}
                placeholder="https://…"
                value={form.url}
                onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              />
            </div>

            <div>
              <label style={s.label}>{t('announcements.urlLabelLabel')}</label>
              <input
                style={s.input}
                placeholder="Mehr erfahren"
                value={form.url_label}
                onChange={(e) => setForm((f) => ({ ...f, url_label: e.target.value }))}
              />
            </div>

            <div>
              <label style={s.label}>{t('announcements.expiresLabel')}</label>
              <input
                style={s.input}
                type="date"
                value={form.expires_at}
                onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value }))}
              />
            </div>

            <div>
              <label style={s.label}>{t('announcements.typeLabel')}</label>
              <select
                style={s.input}
                value={form.type}
                onChange={(e) =>
                  setForm((f) => ({ ...f, type: e.target.value as CreateForm['type'] }))
                }
              >
                <option value="info">info</option>
                <option value="update">update</option>
                <option value="warning">warning</option>
              </select>
            </div>

            <div style={s.fullWidth}>
              <span style={s.label}>{t('announcements.audienceLabel')}</span>
              <div style={s.radioGroup}>
                <label style={s.radioLabel}>
                  <input
                    type="radio"
                    name="target"
                    value="all"
                    checked={form.target === 'all'}
                    onChange={() => setForm((f) => ({ ...f, target: 'all', organization_id: '' }))}
                  />
                  {t('announcements.allOrgs')}
                </label>
                <label style={s.radioLabel}>
                  <input
                    type="radio"
                    name="target"
                    value="org"
                    checked={form.target === 'org'}
                    onChange={() => setForm((f) => ({ ...f, target: 'org' }))}
                  />
                  {t('announcements.specificOrg')}
                </label>
              </div>
            </div>

            {form.target === 'org' && (
              <div style={s.fullWidth}>
                <label style={s.label}>{t('announcements.orgLabel')}</label>
                <select
                  style={s.input}
                  value={form.organization_id}
                  onChange={(e) => setForm((f) => ({ ...f, organization_id: e.target.value }))}
                >
                  <option value="">— Org auswählen —</option>
                  {orgs.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div style={s.formFooter}>
            <button className="btn btn-ghost" onClick={cancelForm} disabled={saving}>
              {t('announcements.cancel')}
            </button>
            <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>
              {saving ? t('announcements.saving') : t('announcements.createBtn')}
            </button>
          </div>
        </div>
      )}

      {actionError && <div style={s.errorBanner}>{actionError}</div>}

      <div className="card">
        <div className="card-header">
          <span className="card-header-label">{t('announcements.activeTitle')}</span>
        </div>
        <div className="card-body">
          {loading ? (
            <p style={s.muted}>Lade…</p>
          ) : announcements.length === 0 ? (
            <p style={s.muted}>Keine aktiven Announcements.</p>
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
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
                    {a.source === 'tropen' ? 'Alle Orgs' : 'Org-spezifisch'}
                    {a.url && ` · ${a.url}`}
                    {a.expires_at &&
                      ` · Läuft ab: ${new Date(a.expires_at).toLocaleDateString('de-DE')}`}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => handleDeactivate(a.id)}
                    disabled={actioningId === a.id}
                  >
                    {t('announcements.deactivate')}
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDelete(a.id)}
                    disabled={actioningId === a.id}
                  >
                    {t('announcements.delete')}
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
