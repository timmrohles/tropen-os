'use client'
// src/app/feeds/DataView.tsx — Daten-Tab (API-Quellen) — state + orchestration
import React, { useState, useEffect, useCallback, useRef } from 'react'
import type { FeedDataSource, FeedDataRecord } from '@/types/feeds'
import { FormState, blankForm, buildAuthConfig } from './_components/DataSourceHelpers'
import { DataSourceCard } from './_components/DataSourceCard'
import { DataSourceForm } from './_components/DataSourceForm'
import { DataSourceHistory } from './_components/DataSourceHistory'

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
      if (res.ok) {
        const json = await res.json() as { data: FeedDataSource[] }
        setSources(json.data ?? [])
      }
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
      auth_config: buildAuthConfig(form),
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
          <DataSourceCard
            key={src.id}
            source={src}
            fetchingId={fetchingId}
            fetchMsg={fetchMsg}
            menuOpen={menuOpen}
            onMenuOpen={setMenuOpen}
            onFetch={handleFetch}
            onToggleActive={handleToggleActive}
            onDelete={handleDelete}
            onOpenHistory={openHistory}
            onEdit={openEdit}
            onShowToast={showToast}
          />
        ))}
      </div>

      <DataSourceForm
        open={modalOpen}
        editingId={editingId}
        form={form}
        saving={formSaving}
        error={formError}
        onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
        onSave={handleSave}
        onClose={() => setModalOpen(false)}
      />

      {historySource && (
        <DataSourceHistory
          source={historySource}
          records={historyRecords}
          loading={historyLoading}
          onClose={() => setHistorySource(null)}
        />
      )}

      {/* ── TOAST ──────────────────────────────────────────────────────────── */}
      {toast && <div className="wl-toast">{toast}</div>}
    </div>
  )
}
