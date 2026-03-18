'use client'

import { useState, useTransition } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { updateWorkspace } from '@/actions/workspaces'

const s: Record<string, React.CSSProperties> = {
  fieldGroup: { marginBottom: 24 },
  label: {
    display: 'block', fontSize: 11, color: 'var(--text-secondary)',
    marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em',
  },
  input: {
    width: '100%', background: 'var(--bg-surface-solid)',
    border: '1px solid var(--border-medium)', borderRadius: 4,
    padding: '8px 12px', color: 'var(--text-primary)', fontSize: 13,
    outline: 'none', boxSizing: 'border-box' as const, transition: 'border-color 0.15s',
  },
  textarea: {
    width: '100%', background: 'var(--bg-surface-solid)',
    border: '1px solid var(--border-medium)', borderRadius: 4,
    padding: '8px 12px', color: 'var(--text-primary)', fontSize: 13,
    outline: 'none', boxSizing: 'border-box' as const,
    resize: 'vertical' as const, minHeight: 80, transition: 'border-color 0.15s',
  },
  actions: { display: 'flex', gap: 12, marginTop: 32, alignItems: 'center' },
  savedMsg: { fontSize: 12, color: 'var(--accent)' },
  errorMsg: { fontSize: 12, color: 'var(--error)' },
  sectionTitle: {
    fontSize: 11, color: 'var(--text-tertiary)',
    textTransform: 'uppercase' as const, letterSpacing: '0.1em',
    marginBottom: 16, marginTop: 32, paddingBottom: 8,
    borderBottom: '1px solid var(--border-medium)',
  },
}

interface FormState {
  goal: string; context: string; tone: string
  language: string; target_audience: string
}

export default function WorkspaceSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const workspaceId = params.workspaceId as string

  const [form, setForm] = useState<FormState>({
    goal: '', context: '', tone: '', language: '', target_audience: '',
  })
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [copying, setCopying] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setSaved(false); setError(null)
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleSubmit() {
    setError(null)
    startTransition(async () => {
      try {
        await updateWorkspace(workspaceId, {
          goal: form.goal || undefined,
          meta: {
            context: form.context || undefined,
            tone: form.tone || undefined,
            language: form.language || undefined,
            target_audience: form.target_audience || undefined,
          },
        })
        setSaved(true)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Fehler beim Speichern')
      }
    })
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Fehler')
      router.push('/workspaces')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Löschen fehlgeschlagen')
      setDeleting(false)
      setDeleteConfirm(false)
    }
  }

  async function handleCopy() {
    setCopying(true)
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/copy`, { method: 'POST' })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Fehler')
      const copy = await res.json()
      router.push(`/workspaces/${copy.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kopieren fehlgeschlagen')
      setCopying(false)
    }
  }

  return (
    <div className="content-narrow">
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-header-title">Workspace-Einstellungen</h1>
          <p className="page-header-sub">Name und Einstellungen dieses Workspaces</p>
        </div>
      </div>

      <div aria-label="Workspace-Einstellungen">
        <p style={s.sectionTitle}>Ziel & Fokus</p>

        <div style={s.fieldGroup}>
          <label htmlFor="ws-goal" style={s.label}>Ziel</label>
          <textarea id="ws-goal" name="goal" value={form.goal} onChange={handleChange}
            placeholder="Was soll dieser Workspace erreichen?" style={s.textarea} />
        </div>

        <p style={s.sectionTitle}>Meta-Kontext</p>

        <div style={s.fieldGroup}>
          <label htmlFor="ws-context" style={s.label}>Kontext</label>
          <textarea id="ws-context" name="context" value={form.context} onChange={handleChange}
            placeholder="Hintergrundinformationen für den KI-Assistenten" style={s.textarea} />
        </div>

        <div style={s.fieldGroup}>
          <label htmlFor="ws-tone" style={s.label}>Ton</label>
          <input id="ws-tone" name="tone" type="text" value={form.tone} onChange={handleChange}
            placeholder="z.B. professionell, sachlich, kreativ" style={s.input} />
        </div>

        <div style={s.fieldGroup}>
          <label htmlFor="ws-language" style={s.label}>Sprache</label>
          <input id="ws-language" name="language" type="text" value={form.language} onChange={handleChange}
            placeholder="z.B. Deutsch, Englisch" style={s.input} />
        </div>

        <div style={s.fieldGroup}>
          <label htmlFor="ws-target-audience" style={s.label}>Zielgruppe</label>
          <input id="ws-target-audience" name="target_audience" type="text"
            value={form.target_audience} onChange={handleChange}
            placeholder="z.B. B2B Entscheider, Studierende" style={s.input} />
        </div>

        <div style={s.actions}>
          <button type="button" disabled={isPending} className="btn btn-primary"
            style={{ opacity: isPending ? 0.6 : 1 }} aria-busy={isPending} onClick={handleSubmit}>
            {isPending ? 'Speichert…' : 'Speichern'}
          </button>
          {saved && <span style={s.savedMsg}>Gespeichert</span>}
          {error && <span role="alert" style={s.errorMsg}>{error}</span>}
        </div>

        {/* ── Aktionen ────────────────────────────────────────── */}
        <p style={s.sectionTitle}>Aktionen</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Copy */}
          <div className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                Workspace duplizieren
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: '2px 0 0' }}>
                Erstellt eine Kopie mit allen Karten — Status wird auf Entwurf zurückgesetzt
              </p>
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={handleCopy}
              disabled={copying} aria-busy={copying} style={{ flexShrink: 0 }}>
              {copying ? 'Kopiere…' : 'Duplizieren'}
            </button>
          </div>

          {/* Delete */}
          <div className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, border: '1px solid rgba(192,57,43,0.15)' }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--error)', margin: 0 }}>
                Workspace löschen
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: '2px 0 0' }}>
                Löscht diesen Workspace und alle Karten unwiderruflich
              </p>
            </div>
            {deleteConfirm ? (
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button type="button" className="btn btn-danger btn-sm" onClick={handleDelete}
                  disabled={deleting} aria-busy={deleting}>
                  {deleting ? 'Löscht…' : 'Ja, löschen'}
                </button>
                <button type="button" className="btn btn-ghost btn-sm"
                  onClick={() => setDeleteConfirm(false)}>
                  Abbrechen
                </button>
              </div>
            ) : (
              <button type="button" className="btn btn-danger btn-sm"
                onClick={() => setDeleteConfirm(true)} style={{ flexShrink: 0 }}>
                Löschen
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
