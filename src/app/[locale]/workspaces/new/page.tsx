'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createWorkspace } from '@/actions/workspaces'
import type { WorkspaceDomain } from '@/db/schema'

const DOMAIN_OPTIONS: { value: WorkspaceDomain; label: string }[] = [
  { value: 'marketing', label: 'Marketing' },
  { value: 'research', label: 'Forschung' },
  { value: 'learning', label: 'Lernen' },
  { value: 'legal', label: 'Recht' },
  { value: 'product', label: 'Produkt' },
  { value: 'custom', label: 'Individuell' },
]

const s: Record<string, React.CSSProperties> = {
  page: {
    paddingTop: 32,
    paddingBottom: 48,
  },
  subheading: {
    fontSize: 14,
    color: 'var(--text-tertiary)',
    marginBottom: 32,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    display: 'block',
    fontSize: 12,
    fontWeight: 500,
    color: 'var(--text-secondary)',
    marginBottom: 6,
  },
  required: {
    color: 'var(--accent)',
    marginLeft: 2,
  },
  input: {
    width: '100%',
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '9px 12px',
    color: 'var(--text-primary)',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  select: {
    width: '100%',
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '9px 12px',
    color: 'var(--text-primary)',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box' as const,
    cursor: 'pointer',
    appearance: 'none' as const,
  },
  textarea: {
    width: '100%',
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '9px 12px',
    color: 'var(--text-primary)',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box' as const,
    resize: 'vertical' as const,
    minHeight: 80,
  },
  divider: {
    height: 1,
    background: 'var(--border)',
    margin: '24px 0',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    marginBottom: 16,
  },
  actions: {
    display: 'flex',
    gap: 12,
    marginTop: 28,
    alignItems: 'center',
  },
  errorMsg: {
    fontSize: 13,
    color: 'var(--error)',
    marginTop: 12,
  },
}

interface FormState {
  title: string
  domain: WorkspaceDomain
  goal: string
  context: string
  tone: string
  language: string
  target_audience: string
}

export default function NewWorkspacePage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>({
    title: '',
    domain: 'custom',
    goal: '',
    context: '',
    tone: '',
    language: 'Deutsch',
    target_audience: '',
  })

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setError(null)
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) { setError('Titel ist erforderlich'); return }

    startTransition(async () => {
      try {
        const { createClient } = await import('@/utils/supabase/client')
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }

        const workspace = await createWorkspace({
          title: form.title.trim(),
          domain: form.domain,
          goal: form.goal.trim() || undefined,
          createdBy: user.id,
          meta: {
            context: form.context.trim() || undefined,
            tone: form.tone.trim() || undefined,
            language: form.language.trim() || undefined,
            target_audience: form.target_audience.trim() || undefined,
          },
        })
        router.push(`/ws/${workspace.id}/canvas`)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Fehler beim Erstellen')
      }
    })
  }

  return (
    <div className="content-narrow" style={s.page}>
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-header-title">Neuen Workspace erstellen</h1>
        </div>
      </div>
      <p style={s.subheading}>Erstelle einen strukturierten KI-Arbeitsbereich</p>

      <form onSubmit={handleSubmit} aria-label="Neuer Workspace">
        <div style={s.fieldGroup}>
          <label htmlFor="nw-title" style={s.label}>
            Titel<span style={s.required}>*</span>
          </label>
          <input
            id="nw-title"
            name="title"
            type="text"
            required
            value={form.title}
            onChange={handleChange}
            placeholder="z.B. Q2 Content-Strategie"
            style={s.input}
            aria-required="true"
          />
        </div>

        <div style={s.fieldGroup}>
          <label htmlFor="nw-domain" style={s.label}>
            Domain<span style={s.required}>*</span>
          </label>
          <select
            id="nw-domain"
            name="domain"
            value={form.domain}
            onChange={handleChange}
            style={s.select}
            aria-required="true"
          >
            {DOMAIN_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div style={s.fieldGroup}>
          <label htmlFor="nw-goal" style={s.label}>Ziel</label>
          <textarea
            id="nw-goal"
            name="goal"
            value={form.goal}
            onChange={handleChange}
            placeholder="Was soll dieser Workspace erreichen?"
            style={s.textarea}
          />
        </div>

        <div style={s.divider} />
        <p style={s.sectionLabel}>KI-Kontext (optional)</p>

        <div style={s.fieldGroup}>
          <label htmlFor="nw-context" style={s.label}>Kontext</label>
          <textarea
            id="nw-context"
            name="context"
            value={form.context}
            onChange={handleChange}
            placeholder="Hintergrundinformationen für den KI-Assistenten"
            style={s.textarea}
          />
        </div>

        <div style={s.fieldGroup}>
          <label htmlFor="nw-tone" style={s.label}>Ton</label>
          <input
            id="nw-tone"
            name="tone"
            type="text"
            value={form.tone}
            onChange={handleChange}
            placeholder="z.B. professionell, sachlich, kreativ"
            style={s.input}
          />
        </div>

        <div style={s.fieldGroup}>
          <label htmlFor="nw-language" style={s.label}>Sprache</label>
          <input
            id="nw-language"
            name="language"
            type="text"
            value={form.language}
            onChange={handleChange}
            placeholder="z.B. Deutsch"
            style={s.input}
          />
        </div>

        <div style={s.fieldGroup}>
          <label htmlFor="nw-target-audience" style={s.label}>Zielgruppe</label>
          <input
            id="nw-target-audience"
            name="target_audience"
            type="text"
            value={form.target_audience}
            onChange={handleChange}
            placeholder="z.B. B2B Entscheider, Studierende"
            style={s.input}
          />
        </div>

        {error && <p style={s.errorMsg} role="alert">{error}</p>}

        <div style={s.actions}>
          <button
            type="submit"
            disabled={isPending}
            className="btn btn-primary"
            style={{ marginTop: 8, opacity: isPending ? 0.6 : 1 }}
            aria-busy={isPending}
          >
            {isPending ? 'Erstellt…' : 'Workspace erstellen'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => router.back()}>
            Abbrechen
          </button>
        </div>
      </form>
    </div>
  )
}
