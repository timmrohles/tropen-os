'use client'
// src/app/feeds/DataView.tsx — Daten-Tab (API-Quellen)
import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  PlayCircle, PauseCircle, DotsThree, ArrowClockwise, Trash, PencilSimple,
  ClockCounterClockwise, ArrowSquareOut, Warning, Lock, X,
} from '@phosphor-icons/react'
import type { FeedDataSource, FeedDataRecord } from '@/types/feeds'

// ─── helpers ──────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1)   return 'gerade eben'
  if (m < 60)  return `vor ${m} Min`
  const h = Math.floor(m / 60)
  if (h < 24)  return `vor ${h}h`
  return `vor ${Math.floor(h / 24)}d`
}

function authLabel(type: string | null): string {
  if (!type || type === 'none') return 'Keine Auth'
  if (type === 'bearer')  return 'Bearer'
  if (type === 'api_key') return 'API-Key'
  if (type === 'basic')   return 'Basic Auth'
  return type
}

function intervalLabel(sec: number): string {
  if (sec === 0)     return 'Manuell'
  if (sec <= 300)    return 'Alle 5 Min'
  if (sec <= 3600)   return 'Stündlich'
  if (sec <= 86400)  return 'Täglich'
  return `${sec}s`
}

const INTERVAL_OPTIONS = [
  { label: 'Manuell',      value: 0 },
  { label: 'Alle 5 Min',   value: 300 },
  { label: 'Stündlich',    value: 3600 },
  { label: 'Täglich',      value: 86400 },
]

const AUTH_OPTIONS = [
  { label: 'Keine',        value: 'none' },
  { label: 'Bearer Token', value: 'bearer' },
  { label: 'API-Key',      value: 'api_key' },
  { label: 'Basic Auth',   value: 'basic' },
]

// ─── form layout helpers ───────────────────────────────────────────────────────

function FormSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '14px 0 8px' }}>
        {label}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {children}
      </div>
    </div>
  )
}

function FormField({
  label, optional, hint, children,
}: {
  label: string
  optional?: boolean
  hint?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="tdrawer-label">
        {label}
        {optional && <span className="tdrawer-optional"> (optional)</span>}
      </label>
      {children}
      {hint && (
        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: '5px 0 0', lineHeight: 1.55 }}>
          {hint}
        </p>
      )}
    </div>
  )
}

// ─── blank form state ──────────────────────────────────────────────────────────

function blankForm() {
  return {
    name: '', description: '', url: 'https://',
    method: 'GET' as 'GET' | 'POST',
    authType: 'none',
    bearerToken: '', apiKeyHeader: 'X-API-Key', apiKeyValue: '',
    basicUser: '', basicPassword: '',
    fetchInterval: 3600,
    schemaPath: '',
  }
}

type FormState = ReturnType<typeof blankForm>

// ─── main component ────────────────────────────────────────────────────────────

export default function DataView() {
  const [sources, setSources]       = useState<FeedDataSource[]>([])
  const [loading, setLoading]       = useState(true)
  const [fetchingId, setFetchingId] = useState<string | null>(null)
  const [fetchMsg, setFetchMsg]     = useState<Record<string, string>>({})
  const [menuOpen, setMenuOpen]     = useState<string | null>(null)
  const [toast, setToast]           = useState<string | null>(null)

  // Create / edit modal
  const [modalOpen, setModalOpen]   = useState(false)
  const [editingId, setEditingId]   = useState<string | null>(null)
  const [form, setForm]             = useState<FormState>(blankForm())
  const [formSaving, setFormSaving] = useState(false)
  const [formError, setFormError]   = useState('')

  // History drawer
  const [historySource, setHistorySource]   = useState<FeedDataSource | null>(null)
  const [historyRecords, setHistoryRecords] = useState<FeedDataRecord[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── load ────────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/feeds/data-sources')
      if (res.ok) setSources(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // ── toast helper ────────────────────────────────────────────────────────────

  const showToast = (msg: string) => {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3500)
  }

  // ── escape closes modal / drawer ────────────────────────────────────────────

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (historySource) { setHistorySource(null); return }
      if (modalOpen) setModalOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [historySource, modalOpen])

  // ── manual fetch ────────────────────────────────────────────────────────────

  const handleFetch = async (src: FeedDataSource) => {
    setMenuOpen(null)
    setFetchingId(src.id)
    setFetchMsg((prev) => ({ ...prev, [src.id]: '' }))
    try {
      const res = await fetch(`/api/feeds/data-sources/${src.id}/fetch`, { method: 'POST' })
      const json = await res.json() as { error?: string; recordCount?: number }
      const msg = json.error
        ? `Fehler: ${json.error}`
        : `${json.recordCount ?? 0} Datensätze abgerufen`
      setFetchMsg((prev) => ({ ...prev, [src.id]: msg }))
      setSources((prev) => prev.map((s) => s.id === src.id
        ? { ...s, lastFetchedAt: new Date().toISOString(), recordCount: json.recordCount ?? s.recordCount, lastError: json.error ?? null }
        : s
      ))
    } finally {
      setFetchingId(null)
    }
  }

  // ── toggle active ───────────────────────────────────────────────────────────

  const handleToggleActive = async (src: FeedDataSource) => {
    setMenuOpen(null)
    await fetch(`/api/feeds/data-sources/${src.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !src.isActive }),
    })
    setSources((prev) => prev.map((s) => s.id === src.id ? { ...s, isActive: !s.isActive } : s))
  }

  // ── delete ──────────────────────────────────────────────────────────────────

  const handleDelete = async (src: FeedDataSource) => {
    setMenuOpen(null)
    if (!confirm(`Datenquelle „${src.name}" wirklich löschen? Alle Abrufe werden entfernt.`)) return
    await fetch(`/api/feeds/data-sources/${src.id}`, { method: 'DELETE' })
    setSources((prev) => prev.filter((s) => s.id !== src.id))
  }

  // ── history drawer ──────────────────────────────────────────────────────────

  const openHistory = async (src: FeedDataSource) => {
    setMenuOpen(null)
    setHistorySource(src)
    setHistoryLoading(true)
    setHistoryRecords([])
    try {
      const res = await fetch(`/api/feeds/data-sources/${src.id}/records?limit=10`)
      if (res.ok) setHistoryRecords(await res.json())
    } finally {
      setHistoryLoading(false)
    }
  }

  // ── create / edit modal ─────────────────────────────────────────────────────

  const openCreate = () => {
    setEditingId(null)
    setForm(blankForm())
    setFormError('')
    setModalOpen(true)
  }

  const openEdit = (src: FeedDataSource) => {
    setMenuOpen(null)
    setEditingId(src.id)
    setForm({
      name: src.name,
      description: src.description ?? '',
      url: src.url,
      method: src.method,
      authType: src.authType ?? 'none',
      bearerToken: src.authType === 'bearer' ? (src.authConfig.token ?? '') : '',
      apiKeyHeader: src.authType === 'api_key' ? (src.authConfig.header ?? 'X-API-Key') : 'X-API-Key',
      apiKeyValue: src.authType === 'api_key' ? (src.authConfig.key ?? '') : '',
      basicUser: src.authType === 'basic' ? (src.authConfig.username ?? '') : '',
      basicPassword: src.authType === 'basic' ? (src.authConfig.password ?? '') : '',
      fetchInterval: src.fetchInterval,
      schemaPath: src.schemaPath ?? '',
    })
    setFormError('')
    setModalOpen(true)
  }

  const f = (patch: Partial<FormState>) => setForm((prev) => ({ ...prev, ...patch }))

  const buildAuthConfig = (): Record<string, string> => {
    if (form.authType === 'bearer')  return { token: form.bearerToken }
    if (form.authType === 'api_key') return { header: form.apiKeyHeader, key: form.apiKeyValue }
    if (form.authType === 'basic')   return { username: form.basicUser, password: form.basicPassword }
    return {}
  }

  const handleSave = async () => {
    setFormError('')
    if (!form.name.trim()) { setFormError('Name ist erforderlich'); return }
    if (!form.url.startsWith('http')) { setFormError('URL muss mit http:// oder https:// beginnen'); return }
    setFormSaving(true)

    const body = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      url: form.url,
      method: form.method,
      auth_type: form.authType === 'none' ? undefined : form.authType,
      auth_config: buildAuthConfig(),
      fetch_interval: form.fetchInterval,
      schema_path: form.schemaPath.trim() || undefined,
    }

    try {
      let sourceId: string
      if (editingId) {
        const res = await fetch(`/api/feeds/data-sources/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) { const j = await res.json() as { error?: string }; setFormError(j.error ?? 'Fehler'); return }
        sourceId = editingId
        await load()
      } else {
        const res = await fetch('/api/feeds/data-sources', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) { const j = await res.json() as { error?: string }; setFormError(j.error ?? 'Fehler'); return }
        const created = await res.json() as FeedDataSource
        sourceId = created.id
        setSources((prev) => [created, ...prev])
        // Trigger initial fetch
        await fetch(`/api/feeds/data-sources/${sourceId}/fetch`, { method: 'POST' })
        await load()
      }
      setModalOpen(false)
    } finally {
      setFormSaving(false)
    }
  }

  // ── render ───────────────────────────────────────────────────────────────────

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-tertiary)', fontSize: 14 }}>Wird geladen…</div>
  }

  return (
    <div onClick={() => setMenuOpen(null)}>

      {/* Action row */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className="btn btn-primary" onClick={openCreate}>+ Datenquelle</button>
      </div>

      {/* Empty state */}
      {sources.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-tertiary)', fontSize: 14 }}>
          Noch keine Datenquellen. Richte deine erste API-Verbindung ein.
        </div>
      )}

      {/* Source cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {sources.map((src) => (
          <div
            key={src.id}
            className="card"
            style={{
              padding: '16px 18px',
              borderLeft: src.isActive ? '3px solid var(--accent)' : '3px solid var(--border)',
              opacity: src.isActive ? 1 : 0.65,
              position: 'relative',
            }}
            onClick={() => setMenuOpen(null)}
          >
            {/* Card header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 600, color: '#fff', background: 'var(--accent)' }}>
                  API
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 500 }}>
                  {src.method}
                </span>
                {src.authType && src.authType !== 'none' && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--text-tertiary)' }}>
                    <Lock size={11} weight="fill" aria-hidden="true" />
                    {authLabel(src.authType)}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 4 }} onClick={(e) => e.stopPropagation()}>
                <button
                  className="btn-icon"
                  title={src.isActive ? 'Pausieren' : 'Aktivieren'}
                  aria-label={src.isActive ? 'Quelle pausieren' : 'Quelle aktivieren'}
                  onClick={() => handleToggleActive(src)}
                >
                  {src.isActive
                    ? <PauseCircle size={16} weight="fill" color="var(--accent)" aria-hidden="true" />
                    : <PlayCircle  size={16} weight="fill" color="var(--text-tertiary)" aria-hidden="true" />}
                </button>
                <button
                  className="btn-icon"
                  aria-label="Daten jetzt abrufen"
                  disabled={fetchingId === src.id}
                  onClick={() => handleFetch(src)}
                >
                  <ArrowClockwise
                    size={16} weight="bold" aria-hidden="true"
                    style={{ animation: fetchingId === src.id ? 'spin 1s linear infinite' : undefined }}
                  />
                </button>
                <button
                  className="btn-icon"
                  aria-label="Weitere Aktionen"
                  aria-haspopup="true"
                  aria-expanded={menuOpen === src.id}
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === src.id ? null : src.id) }}
                >
                  <DotsThree size={16} weight="bold" aria-hidden="true" />
                </button>
                {menuOpen === src.id && (
                  <div
                    className="dropdown"
                    style={{ position: 'absolute', right: 12, top: 44, zIndex: 20, minWidth: 190 }}
                    role="menu"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button role="menuitem" className="dropdown-item" onClick={() => openHistory(src)}>
                      <ClockCounterClockwise size={14} weight="bold" aria-hidden="true" /> Verlauf
                    </button>
                    <button role="menuitem" className="dropdown-item" onClick={() => openEdit(src)}>
                      <PencilSimple size={14} weight="bold" aria-hidden="true" /> Bearbeiten
                    </button>
                    <div className="dropdown-divider" />
                    <button role="menuitem" className="dropdown-item dropdown-item--danger" onClick={() => handleDelete(src)}>
                      <Trash size={14} weight="bold" aria-hidden="true" /> Löschen
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Name + URL */}
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>{src.name}</div>
            {src.description && (
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>{src.description}</div>
            )}
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 8 }}>
              {src.url}
            </div>

            {/* Meta row */}
            <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 8, flexWrap: 'wrap' }}>
              {src.lastFetchedAt && <span>Letzter Abruf: {relativeTime(src.lastFetchedAt)}</span>}
              {src.recordCount > 0 && <span>{src.recordCount.toLocaleString('de-DE')} Datensätze</span>}
              <span>{intervalLabel(src.fetchInterval)}</span>
            </div>

            {/* Error state */}
            {src.lastError && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, padding: '8px 10px', borderRadius: 6, background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', fontSize: 12, color: '#92400E', marginBottom: 8 }}>
                <Warning size={14} weight="fill" style={{ flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
                <span>Letzter Fetch fehlgeschlagen: {src.lastError}</span>
              </div>
            )}

            {/* Fetch in progress */}
            {fetchingId === src.id && (
              <div style={{ fontSize: 12, color: 'var(--accent)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                <ArrowClockwise size={12} weight="bold" aria-hidden="true" /> Wird abgerufen…
              </div>
            )}
            {fetchMsg[src.id] && fetchingId !== src.id && (
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>{fetchMsg[src.id]}</div>
            )}

            {/* JSON preview from schemaPreview */}
            {src.schemaPreview && !src.lastError && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Vorschau</div>
                <pre style={{
                  fontFamily: 'var(--font-mono, "DM Mono", monospace)',
                  fontSize: 11,
                  color: 'var(--text-secondary)',
                  background: 'var(--bg-surface-2)',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  padding: '8px 10px',
                  margin: 0,
                  overflow: 'hidden',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  maxHeight: 72,
                }}>
                  {JSON.stringify(src.schemaPreview, null, 2).split('\n').slice(0, 4).join('\n')}
                </pre>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button
                className="btn btn-ghost btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                onClick={(e) => { e.stopPropagation(); showToast('Kommt bald – wird mit Plan D/E integriert') }}
              >
                <ArrowSquareOut size={13} weight="bold" aria-hidden="true" /> In Projekt
              </button>
              <button
                className="btn btn-ghost btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                onClick={(e) => { e.stopPropagation(); showToast('Kommt bald – wird mit Plan D/E integriert') }}
              >
                <ArrowSquareOut size={13} weight="bold" aria-hidden="true" /> In Workspace
              </button>
              <button
                className="btn btn-ghost btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                onClick={(e) => { e.stopPropagation(); openHistory(src) }}
              >
                <ClockCounterClockwise size={13} weight="bold" aria-hidden="true" /> Verlauf
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── CREATE / EDIT MODAL ─────────────────────────────────────────────── */}
      {modalOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => setModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={editingId ? 'Datenquelle bearbeiten' : 'Neue Datenquelle anlegen'}
        >
          <div
            className="card"
            style={{ width: '100%', maxWidth: 560, padding: 24, maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-surface-solid)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                {editingId ? 'Datenquelle bearbeiten' : 'Neue Datenquelle'}
              </span>
              <button className="btn-icon" aria-label="Schließen" onClick={() => setModalOpen(false)}>
                <X size={16} weight="bold" aria-hidden="true" />
              </button>
            </div>

            {formError && (
              <div style={{ padding: '10px 14px', background: '#FFF5F5', border: '1px solid #FED7D7', borderRadius: 8, fontSize: 13, color: '#C53030', marginBottom: 16 }}>
                {formError}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

              {/* ── Abschnitt: Grunddaten ─────────────────────────────── */}
              <FormSection label="Grunddaten">
                <FormField label="Name" hint="Ein eindeutiger Name, damit du die Quelle später wiedererkennst.">
                  <input className="tdrawer-input" value={form.name} onChange={(e) => f({ name: e.target.value })}
                    placeholder='z.B. "Wettbewerber-Preise" oder "Google Analytics Export"' maxLength={255} autoFocus />
                </FormField>
                <FormField label="Beschreibung" optional hint="Wozu dienen diese Daten? Wer soll sie nutzen? Hilft dir bei der Organisation.">
                  <input className="tdrawer-input" value={form.description} onChange={(e) => f({ description: e.target.value })}
                    placeholder='z.B. "Tägliche Preis-Updates unserer 5 Hauptkonkurrenten"' />
                </FormField>
              </FormSection>

              {/* ── Abschnitt: Verbindung ─────────────────────────────── */}
              <FormSection label="Verbindung">
                <FormField
                  label="API-Adresse (URL)"
                  hint={
                    <>
                      Die vollständige Web-Adresse des Datenzugangs. Diese steht in der Dokumentation des Dienstes.
                      {' '}<strong>Tipp:</strong> Suche nach „API Endpoint", „Data Export URL" oder „Integration URL"
                      in den Einstellungen deines Tools.
                    </>
                  }
                >
                  <input className="tdrawer-input" value={form.url} onChange={(e) => f({ url: e.target.value })}
                    placeholder="https://api.meinservice.com/v1/export" />
                </FormField>

                <FormField
                  label="Abfragemethode"
                  hint={
                    form.method === 'GET'
                      ? 'GET = Daten nur lesen. Richtig für die meisten Datenquellen – wähle GET wenn du unsicher bist.'
                      : 'POST = Anfrage mit zusätzlichen Parametern senden. Nur nötig wenn die API-Dokumentation POST verlangt.'
                  }
                >
                  <div style={{ display: 'flex', gap: 8 }}>
                    {(['GET', 'POST'] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => f({ method: m })}
                        style={{
                          padding: '7px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: '1px solid',
                          borderColor: form.method === m ? 'var(--accent)' : 'var(--border)',
                          background: form.method === m ? 'var(--accent-light)' : 'var(--bg-surface)',
                          color: form.method === m ? 'var(--accent)' : 'var(--text-secondary)',
                        }}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </FormField>
              </FormSection>

              {/* ── Abschnitt: Authentifizierung ──────────────────────── */}
              <FormSection label="Authentifizierung">
                <FormField
                  label="Zugangsmethode"
                  hint={
                    form.authType === 'none'    ? 'Diese API ist öffentlich – keine Anmeldedaten nötig.' :
                    form.authType === 'bearer'  ? 'Ein Zugriffstoken das du in den API-Einstellungen des Dienstes generierst. Meist unter „API-Tokens", „Access Tokens" oder „Developer Settings" zu finden.' :
                    form.authType === 'api_key' ? 'Ein einfacher Schlüssel der mit jeder Anfrage mitgeschickt wird. Steht meist in den API-Einstellungen unter „API Key", „API Credentials" oder „Zugangsdaten".' :
                    /* basic */                   'Benutzername und Passwort für den API-Zugang. Wird von älteren APIs verwendet. Nutze wenn möglich stattdessen einen API-Key.'
                  }
                >
                  <select className="tdrawer-select" value={form.authType} onChange={(e) => f({ authType: e.target.value })}>
                    {AUTH_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </FormField>

                {form.authType === 'bearer' && (
                  <FormField
                    label="Bearer Token"
                    hint='Der lange Zugriffsschlüssel aus den API-Einstellungen. Sieht oft so aus: "eyJhbG…" oder eine zufällige Zeichenkette wie "sk-abc123…"'
                  >
                    <input className="tdrawer-input" type="password" value={form.bearerToken}
                      onChange={(e) => f({ bearerToken: e.target.value })}
                      placeholder="Hier den Token einfügen…" autoComplete="off" />
                  </FormField>
                )}

                {form.authType === 'api_key' && (
                  <>
                    <FormField
                      label="Header-Name"
                      hint='Der technische Name des Feldes. Steht in der API-Dokumentation. Häufige Werte: "X-API-Key", "X-Auth-Token", "API-Key". Im Zweifel: "X-API-Key" lassen.'
                    >
                      <input className="tdrawer-input" value={form.apiKeyHeader}
                        onChange={(e) => f({ apiKeyHeader: e.target.value })} placeholder="X-API-Key" />
                    </FormField>
                    <FormField
                      label="API-Key"
                      hint="Dein persönlicher Zugriffsschlüssel. Diesen findest du in den API-Einstellungen des Dienstes."
                    >
                      <input className="tdrawer-input" type="password" value={form.apiKeyValue}
                        onChange={(e) => f({ apiKeyValue: e.target.value })}
                        placeholder="Hier den Key einfügen…" autoComplete="off" />
                    </FormField>
                  </>
                )}

                {form.authType === 'basic' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <FormField label="Benutzername" hint="Der API-Benutzername (oft die E-Mail-Adresse).">
                      <input className="tdrawer-input" value={form.basicUser}
                        onChange={(e) => f({ basicUser: e.target.value })} autoComplete="off" />
                    </FormField>
                    <FormField label="Passwort" hint="Das API-Passwort (nicht das Login-Passwort deines Accounts).">
                      <input className="tdrawer-input" type="password" value={form.basicPassword}
                        onChange={(e) => f({ basicPassword: e.target.value })} autoComplete="off" />
                    </FormField>
                  </div>
                )}

                {form.authType !== 'none' && (
                  <div style={{ display: 'flex', gap: 8, padding: '10px 12px', background: 'rgba(45, 122, 80, 0.06)', border: '1px solid rgba(45, 122, 80, 0.2)', borderRadius: 8 }}>
                    <Lock size={14} weight="fill" color="var(--accent)" style={{ flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                      <strong style={{ color: 'var(--text-primary)' }}>Sicherheitsempfehlung:</strong>{' '}
                      Erstelle für diese Verbindung einen <strong>dedizierten API-Key mit minimalen Rechten</strong> (nur Lesen).
                      Verwende niemals dein Admin-Passwort. Zugangsdaten werden verschlüsselt gespeichert.
                    </p>
                  </div>
                )}
              </FormSection>

              {/* ── Abschnitt: Einstellungen ──────────────────────────── */}
              <FormSection label="Einstellungen">
                <FormField
                  label="Abruf-Intervall"
                  hint={
                    form.fetchInterval === 0     ? 'Manuell: Daten werden nur abgerufen wenn du auf ▶ klickst.' :
                    form.fetchInterval === 300   ? 'Alle 5 Minuten: Hohes Abfragevolumen – nur für Echtzeit-Daten sinnvoll.' :
                    form.fetchInterval === 3600  ? 'Stündlich: Empfohlen für die meisten Datenquellen. Gute Balance aus Aktualität und Ressourcen.' :
                    /* 86400 */                   'Täglich: Für Daten die sich selten ändern, z.B. wöchentliche Reports oder Stammdaten.'
                  }
                >
                  <select className="tdrawer-select" value={form.fetchInterval} onChange={(e) => f({ fetchInterval: Number(e.target.value) })}>
                    {INTERVAL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </FormField>

                <FormField
                  label="JSON-Pfad"
                  optional
                  hint={
                    <span>
                      Gibt an <em>wo in der API-Antwort</em> die eigentlichen Daten stehen.{' '}
                      <strong>Leer lassen</strong> wenn die API direkt eine Liste zurückgibt.{' '}
                      Nur ausfüllen wenn die Daten tiefer verschachtelt sind:
                      <span style={{ display: 'block', marginTop: 6, fontFamily: 'var(--font-mono, monospace)', fontSize: 11, background: 'var(--bg-surface-2)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 8px', lineHeight: 1.6 }}>
                        {'{'} &quot;status&quot;: &quot;ok&quot;, <strong>&quot;data&quot;</strong>: {'{'} <strong>&quot;items&quot;</strong>: [...]{'}'} {'}'}
                        {'\n'}→ JSON-Pfad: <strong>$.data.items</strong>
                      </span>
                    </span>
                  }
                >
                  <input className="tdrawer-input" value={form.schemaPath}
                    onChange={(e) => f({ schemaPath: e.target.value })}
                    placeholder="Leer lassen oder z.B.: $.data.items" />
                </FormField>
              </FormSection>

            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Abbrechen</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={formSaving} aria-busy={formSaving}>
                {formSaving
                  ? (editingId ? 'Speichern…' : 'Wird angelegt…')
                  : (editingId ? 'Speichern' : 'Speichern & ersten Abruf starten')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── HISTORY DRAWER ──────────────────────────────────────────────────── */}
      {historySource && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'stretch', justifyContent: 'flex-end' }}
          onClick={() => setHistorySource(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`Abruf-Verlauf: ${historySource.name}`}
        >
          <div
            style={{
              width: '100%', maxWidth: 520,
              background: 'var(--bg-surface-solid)',
              borderLeft: '1px solid var(--border)',
              padding: 24,
              overflowY: 'auto',
              animation: 'slideInRight 0.2s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Abruf-Verlauf</div>
                <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{historySource.name}</div>
              </div>
              <button className="btn-icon" aria-label="Schließen" onClick={() => setHistorySource(null)}>
                <X size={16} weight="bold" aria-hidden="true" />
              </button>
            </div>

            {historyLoading && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-tertiary)', fontSize: 14 }}>Wird geladen…</div>
            )}

            {!historyLoading && historyRecords.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-tertiary)', fontSize: 14 }}>Noch keine Abrufe.</div>
            )}

            {!historyLoading && historyRecords.length > 0 && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <th style={{ textAlign: 'left', padding: '6px 10px 8px 0', color: 'var(--text-tertiary)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Zeitpunkt</th>
                      <th style={{ textAlign: 'right', padding: '6px 10px 8px', color: 'var(--text-tertiary)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Datensätze</th>
                      <th style={{ textAlign: 'left', padding: '6px 10px 8px', color: 'var(--text-tertiary)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status</th>
                      <th style={{ textAlign: 'right', padding: '6px 10px 8px 0', color: 'var(--text-tertiary)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Dauer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyRecords.map((rec) => (
                      <tr key={rec.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '8px 10px 8px 0', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                          {new Date(rec.fetchedAt).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td style={{ padding: '8px 10px', color: 'var(--text-primary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                          {rec.error ? '—' : (rec.recordCount ?? 0).toLocaleString('de-DE')}
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          {rec.error
                            ? <span style={{ color: '#C53030', fontWeight: 600 }}>✗ {rec.httpStatus ?? 'Fehler'}</span>
                            : <span style={{ color: 'var(--accent)', fontWeight: 600 }}>✓ OK</span>}
                        </td>
                        <td style={{ padding: '8px 0 8px 10px', color: 'var(--text-tertiary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                          {rec.fetchDurationMs != null ? `${rec.fetchDurationMs}ms` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn btn-ghost" onClick={() => setHistorySource(null)}>Schließen</button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST ──────────────────────────────────────────────────────────── */}
      {toast && <div className="wl-toast">{toast}</div>}
    </div>
  )
}
