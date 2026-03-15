'use client'

import { useState } from 'react'
import type { WorkspaceDomain } from '@/db/schema'
import type { CreateWorkspaceInput } from '@/lib/validators/workspace'

const MONO = "'DM Mono', 'Courier New', monospace"

const DOMAIN_OPTIONS: { value: WorkspaceDomain; label: string }[] = [
  { value: 'marketing', label: 'Marketing' },
  { value: 'research', label: 'Forschung' },
  { value: 'learning', label: 'Lernen' },
  { value: 'legal', label: 'Recht' },
  { value: 'product', label: 'Produkt' },
  { value: 'custom', label: 'Individuell' },
]

const s: Record<string, React.CSSProperties> = {
  form: {
    fontFamily: MONO,
    color: '#e0e0e0',
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    display: 'block',
    fontSize: 11,
    color: '#444444',
    marginBottom: 6,
    fontFamily: MONO,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
  },
  required: {
    color: '#7C6FF7',
    marginLeft: 2,
  },
  input: {
    width: '100%',
    background: '#080808',
    border: '1px solid #1e1e1e',
    borderRadius: 4,
    padding: '8px 12px',
    color: '#e0e0e0',
    fontSize: 13,
    fontFamily: MONO,
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.15s',
  },
  select: {
    width: '100%',
    background: '#080808',
    border: '1px solid #1e1e1e',
    borderRadius: 4,
    padding: '8px 12px',
    color: '#e0e0e0',
    fontSize: 13,
    fontFamily: MONO,
    outline: 'none',
    boxSizing: 'border-box' as const,
    cursor: 'pointer',
    appearance: 'none' as const,
  },
  textarea: {
    width: '100%',
    background: '#080808',
    border: '1px solid #1e1e1e',
    borderRadius: 4,
    padding: '8px 12px',
    color: '#e0e0e0',
    fontSize: 13,
    fontFamily: MONO,
    outline: 'none',
    boxSizing: 'border-box' as const,
    resize: 'vertical' as const,
    minHeight: 72,
    transition: 'border-color 0.15s',
  },
  sectionDivider: {
    height: 1,
    background: '#1e1e1e',
    margin: '20px 0',
  },
  sectionLabel: {
    fontSize: 11,
    color: '#444444',
    fontFamily: MONO,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    marginBottom: 16,
  },
  actions: {
    display: 'flex',
    gap: 12,
    marginTop: 28,
    alignItems: 'center',
  },
  submitBtn: {
    padding: '10px 24px',
    background: '#7C6FF7',
    color: '#e0e0e0',
    border: 'none',
    borderRadius: 4,
    fontSize: 13,
    fontFamily: MONO,
    cursor: 'pointer',
    letterSpacing: '0.02em',
    transition: 'opacity 0.15s',
  },
}

interface InternalForm {
  title: string
  domain: WorkspaceDomain
  goal: string
  context: string
  tone: string
  language: string
  target_audience: string
}

interface Props {
  onSubmit: (data: Omit<CreateWorkspaceInput, 'createdBy'>) => void
  loading: boolean
}

export default function WorkspaceForm({ onSubmit, loading }: Props) {
  const [form, setForm] = useState<InternalForm>({
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
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({
      title: form.title.trim(),
      domain: form.domain,
      goal: form.goal.trim() || undefined,
      meta: {
        context: form.context.trim() || undefined,
        tone: form.tone.trim() || undefined,
        language: form.language.trim() || undefined,
        target_audience: form.target_audience.trim() || undefined,
      },
    })
  }

  return (
    <form onSubmit={handleSubmit} style={s.form} aria-label="Workspace erstellen">
      <div style={s.fieldGroup}>
        <label htmlFor="wf-title" style={s.label}>
          Titel<span style={s.required}>*</span>
        </label>
        <input
          id="wf-title"
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
        <label htmlFor="wf-domain" style={s.label}>
          Domain<span style={s.required}>*</span>
        </label>
        <select
          id="wf-domain"
          name="domain"
          value={form.domain}
          onChange={handleChange}
          style={s.select}
          aria-required="true"
        >
          {DOMAIN_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div style={s.fieldGroup}>
        <label htmlFor="wf-goal" style={s.label}>Ziel</label>
        <textarea
          id="wf-goal"
          name="goal"
          value={form.goal}
          onChange={handleChange}
          placeholder="Was soll dieser Workspace erreichen?"
          style={s.textarea}
        />
      </div>

      <div style={s.sectionDivider} />
      <p style={s.sectionLabel}>KI-Kontext (optional)</p>

      <div style={s.fieldGroup}>
        <label htmlFor="wf-context" style={s.label}>Kontext</label>
        <textarea
          id="wf-context"
          name="context"
          value={form.context}
          onChange={handleChange}
          placeholder="Hintergrundinformationen für den KI-Assistenten"
          style={s.textarea}
        />
      </div>

      <div style={s.fieldGroup}>
        <label htmlFor="wf-tone" style={s.label}>Ton</label>
        <input
          id="wf-tone"
          name="tone"
          type="text"
          value={form.tone}
          onChange={handleChange}
          placeholder="z.B. professionell, sachlich, kreativ"
          style={s.input}
        />
      </div>

      <div style={s.fieldGroup}>
        <label htmlFor="wf-language" style={s.label}>Sprache</label>
        <input
          id="wf-language"
          name="language"
          type="text"
          value={form.language}
          onChange={handleChange}
          placeholder="z.B. Deutsch"
          style={s.input}
        />
      </div>

      <div style={s.fieldGroup}>
        <label htmlFor="wf-target-audience" style={s.label}>Zielgruppe</label>
        <input
          id="wf-target-audience"
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
          disabled={loading}
          style={{ ...s.submitBtn, opacity: loading ? 0.6 : 1 }}
          aria-busy={loading}
        >
          {loading ? 'Erstellt…' : 'Workspace erstellen'}
        </button>
      </div>
    </form>
  )
}
