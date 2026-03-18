'use client'

import { useState, useEffect, useTransition } from 'react'
import { useParams } from 'next/navigation'
import { updateWorkspace } from '@/actions/workspaces'

const s: Record<string, React.CSSProperties> = {
  fieldGroup: {
    marginBottom: 24,
  },
  label: {
    display: 'block',
    fontSize: 11,
    color: 'var(--text-secondary)',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  input: {
    width: '100%',
    background: 'var(--bg-surface-solid)',
    border: '1px solid var(--border-medium)',
    borderRadius: 4,
    padding: '8px 12px',
    color: 'var(--text-primary)',
    fontSize: 13,
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.15s',
  },
  textarea: {
    width: '100%',
    background: 'var(--bg-surface-solid)',
    border: '1px solid var(--border-medium)',
    borderRadius: 4,
    padding: '8px 12px',
    color: 'var(--text-primary)',
    fontSize: 13,
    outline: 'none',
    boxSizing: 'border-box' as const,
    resize: 'vertical' as const,
    minHeight: 80,
    transition: 'border-color 0.15s',
  },
  actions: {
    display: 'flex',
    gap: 12,
    marginTop: 32,
    alignItems: 'center',
  },
  savedMsg: {
    fontSize: 12,
    color: 'var(--accent)',
  },
  errorMsg: {
    fontSize: 12,
    color: 'var(--error)',
  },
  sectionTitle: {
    fontSize: 11,
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    marginBottom: 16,
    marginTop: 32,
    paddingBottom: 8,
    borderBottom: '1px solid var(--border-medium)',
  },
}

interface FormState {
  goal: string
  context: string
  tone: string
  language: string
  target_audience: string
}

export default function WorkspaceSettingsPage() {
  const params = useParams()
  const workspaceId = params.workspaceId as string

  const [form, setForm] = useState<FormState>({
    goal: '',
    context: '',
    tone: '',
    language: '',
    target_audience: '',
  })
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setSaved(false)
    setError(null)
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
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

  return (
    <div className="content-narrow">
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div className="page-header-text">
          <h1 className="page-header-title">Workspace-Einstellungen</h1>
          <p className="page-header-sub">Name und Einstellungen dieses Departments</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} aria-label="Workspace-Einstellungen">
        <p style={s.sectionTitle}>Ziel & Fokus</p>

        <div style={s.fieldGroup}>
          <label htmlFor="ws-goal" style={s.label}>Ziel</label>
          <textarea
            id="ws-goal"
            name="goal"
            value={form.goal}
            onChange={handleChange}
            placeholder="Was soll dieser Workspace erreichen?"
            style={s.textarea}
          />
        </div>

        <p style={s.sectionTitle}>Meta-Kontext</p>

        <div style={s.fieldGroup}>
          <label htmlFor="ws-context" style={s.label}>Kontext</label>
          <textarea
            id="ws-context"
            name="context"
            value={form.context}
            onChange={handleChange}
            placeholder="Hintergrundinformationen für den KI-Assistenten"
            style={s.textarea}
          />
        </div>

        <div style={s.fieldGroup}>
          <label htmlFor="ws-tone" style={s.label}>Ton</label>
          <input
            id="ws-tone"
            name="tone"
            type="text"
            value={form.tone}
            onChange={handleChange}
            placeholder="z.B. professionell, sachlich, kreativ"
            style={s.input}
          />
        </div>

        <div style={s.fieldGroup}>
          <label htmlFor="ws-language" style={s.label}>Sprache</label>
          <input
            id="ws-language"
            name="language"
            type="text"
            value={form.language}
            onChange={handleChange}
            placeholder="z.B. Deutsch, Englisch"
            style={s.input}
          />
        </div>

        <div style={s.fieldGroup}>
          <label htmlFor="ws-target-audience" style={s.label}>Zielgruppe</label>
          <input
            id="ws-target-audience"
            name="target_audience"
            type="text"
            value={form.target_audience}
            onChange={handleChange}
            placeholder="z.B. B2B Entscheider, Studierende"
            style={s.input}
          />
        </div>

        <div style={s.actions}>
          <button
            type="submit"
            disabled={isPending}
            className="btn btn-primary"
            style={{ opacity: isPending ? 0.6 : 1 }}
            aria-busy={isPending}
          >
            {isPending ? 'Speichert…' : 'Speichern'}
          </button>
          {saved && <span style={s.savedMsg}>Gespeichert</span>}
          {error && <span style={s.errorMsg}>{error}</span>}
        </div>
      </form>
    </div>
  )
}
