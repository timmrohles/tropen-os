'use client'

import { useState, useTransition } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { createWorkspace } from '@/actions/workspaces'
import type { WorkspaceDomain } from '@/db/schema'

export default function NewWorkspacePage() {
  const router = useRouter()
  const t = useTranslations('workspaces')
  const tc = useTranslations('common')
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

  const DOMAIN_OPTIONS: { value: WorkspaceDomain; label: string }[] = [
    { value: 'marketing', label: t('domainMarketing') },
    { value: 'research',  label: t('domainResearch') },
    { value: 'learning',  label: t('domainLearning') },
    { value: 'legal',     label: t('domainLegal') },
    { value: 'product',   label: t('domainProduct') },
    { value: 'custom',    label: t('domainCustom') },
  ]

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setError(null)
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) { setError(t('titleRequired')); return }

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
        setError(err instanceof Error ? err.message : t('createError'))
      }
    })
  }

  return (
    <div className="content-narrow" style={s.page}>
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-header-title">{t('newPageTitle')}</h1>
        </div>
      </div>
      <p style={s.subheading}>{t('newPageSubtitle')}</p>

      <form onSubmit={handleSubmit} aria-label={t('newFormAriaLabel')}>
        <div style={s.fieldGroup}>
          <label htmlFor="nw-title" style={s.label}>
            {t('fieldTitle')}<span style={s.required}>*</span>
          </label>
          <input
            id="nw-title"
            name="title"
            type="text"
            required
            value={form.title}
            onChange={handleChange}
            placeholder={t('titlePlaceholderNew')}
            style={s.input}
            aria-required="true"
          />
        </div>

        <div style={s.fieldGroup}>
          <label htmlFor="nw-domain" style={s.label}>
            {t('fieldDomain')}<span style={s.required}>*</span>
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
          <label htmlFor="nw-goal" style={s.label}>{t('fieldGoal')}</label>
          <textarea
            id="nw-goal"
            name="goal"
            value={form.goal}
            onChange={handleChange}
            placeholder={t('goalPlaceholder')}
            style={s.textarea}
          />
        </div>

        <div style={s.divider} />
        <p style={s.sectionLabel}>{t('aiContextSection')}</p>

        <div style={s.fieldGroup}>
          <label htmlFor="nw-context" style={s.label}>{t('fieldContext')}</label>
          <textarea
            id="nw-context"
            name="context"
            value={form.context}
            onChange={handleChange}
            placeholder={t('contextPlaceholder')}
            style={s.textarea}
          />
        </div>

        <div style={s.fieldGroup}>
          <label htmlFor="nw-tone" style={s.label}>{t('fieldTone')}</label>
          <input
            id="nw-tone"
            name="tone"
            type="text"
            value={form.tone}
            onChange={handleChange}
            placeholder={t('tonePlaceholder')}
            style={s.input}
          />
        </div>

        <div style={s.fieldGroup}>
          <label htmlFor="nw-language" style={s.label}>{t('fieldLanguage')}</label>
          <input
            id="nw-language"
            name="language"
            type="text"
            value={form.language}
            onChange={handleChange}
            placeholder={t('languagePlaceholder')}
            style={s.input}
          />
        </div>

        <div style={s.fieldGroup}>
          <label htmlFor="nw-target-audience" style={s.label}>{t('fieldTargetAudience')}</label>
          <input
            id="nw-target-audience"
            name="target_audience"
            type="text"
            value={form.target_audience}
            onChange={handleChange}
            placeholder={t('audiencePlaceholder')}
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
            {isPending ? t('creating2') : t('createWorkspace')}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => router.back()}>
            {tc('cancel')}
          </button>
        </div>
      </form>
    </div>
  )
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
