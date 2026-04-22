'use client'

import { useState } from 'react'
import { ShieldCheck, ArrowRight } from '@phosphor-icons/react'
import { useTranslations } from 'next-intl'

type Platform = 'lovable' | 'bolt' | 'cursor' | 'other'

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: 'lovable', label: 'Lovable' },
  { value: 'bolt',    label: 'Bolt' },
  { value: 'cursor',  label: 'Cursor' },
  { value: 'other',   label: 'Anderes' },
]

export default function BetaPage() {
  const t = useTranslations('beta')
  const [email,    setEmail]    = useState('')
  const [platform, setPlatform] = useState<Platform | ''>('')
  const [message,  setMessage]  = useState('')
  const [loading,  setLoading]  = useState(false)
  const [done,     setDone]     = useState(false)
  const [error,    setError]    = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/beta/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, platform: platform || undefined, message: message || undefined }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Unbekannter Fehler'); setLoading(false); return }
      setDone(true)
    } catch {
      setError('Netzwerkfehler — bitte nochmal versuchen')
      setLoading(false)
    }
  }

  return (
    <div className="content-narrow" style={s.wrap}>
      {/* Header */}
      <div style={s.logoRow}>
        <ShieldCheck size={20} color="var(--accent)" weight="fill" aria-hidden="true" />
        <span style={s.logoText}>{t('logoText')}</span>
        <span style={s.betaBadge}>{t('badge')}</span>
      </div>

      {done ? (
        <div style={s.doneCard}>
          <p style={s.doneTitle}>{t('doneTitle')}</p>
          <p style={s.doneSub}>{t('doneSub')}</p>
        </div>
      ) : (
        <>
          {/* Headline */}
          <h1 style={s.h1}>{t('headline')}</h1>
          <p style={s.lead}>{t('lead')}</p>

          {/* What it does */}
          <div style={s.card}>
            <p style={s.cardTitle}>{t('whatTitle')}</p>
            <ul style={s.list}>
              <li>Was sofort gefixt werden muss <span style={s.hint}>(mit Copy-Paste Cursor-Prompt)</span></li>
              <li>Was du diese Woche angehen solltest</li>
              <li>Was du bewusst ignorieren kannst</li>
            </ul>
          </div>

          {/* What it's NOT */}
          <div style={s.notCard}>
            <p style={s.notTitle}>{t('notTitle')}</p>
            <ul style={s.notList}>
              <li>{t('notItem1')}</li>
              <li>{t('notItem2')}</li>
              <li>{t('notItem3')}</li>
            </ul>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={s.form} noValidate>
            <p style={s.formTitle}>{t('formTitle')}</p>

            <label htmlFor="beta-email" style={s.label}>{t('emailLabel')}</label>
            <input
              id="beta-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="du@example.com"
              style={s.input}
            />

            <label style={s.label}>{t('platformLabel')}</label>
            <div style={s.platformRow}>
              {PLATFORMS.map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPlatform(prev => prev === p.value ? '' : p.value)}
                  style={{
                    ...s.platformBtn,
                    ...(platform === p.value ? s.platformBtnActive : {}),
                  }}
                  aria-pressed={platform === p.value}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <label htmlFor="beta-message" style={s.label}>
              {t('messageLabel')} <span style={s.optional}>{t('optional')}</span>
            </label>
            <textarea
              id="beta-message"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Kurze Beschreibung deines Projekts..."
              rows={3}
              style={s.textarea}
            />

            {error && <p style={s.error} role="alert">{error}</p>}

            <button
              type="submit"
              disabled={loading || !email}
              className="btn btn-primary"
              style={s.submitBtn}
            >
              {loading ? t('submitLoading') : (
                <>
                  {t('submitBtn')}
                  <ArrowRight size={15} weight="bold" aria-hidden="true" />
                </>
              )}
            </button>
          </form>
        </>
      )}

      <p style={s.footer}>
        {t('footer')}
      </p>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 40,
  },
  logoText: {
    fontSize: 15,
    fontWeight: 700,
    color: 'var(--text-primary)',
    letterSpacing: '-0.01em',
  },
  betaBadge: {
    fontSize: 10,
    fontWeight: 600,
    color: 'var(--accent)',
    background: 'var(--accent-light)',
    borderRadius: 4,
    padding: '2px 6px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  h1: {
    fontSize: 'clamp(22px, 5vw, 30px)',
    fontWeight: 800,
    color: 'var(--text-primary)',
    margin: '0 0 12px',
    lineHeight: 1.25,
  },
  lead: {
    fontSize: 15,
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
    margin: '0 0 24px',
  },
  card: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    padding: '16px 20px',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-primary)',
    margin: '0 0 10px',
  },
  list: {
    margin: 0,
    padding: '0 0 0 18px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 6,
    fontSize: 14,
    color: 'var(--text-secondary)',
  },
  hint: {
    color: 'var(--text-tertiary)',
    fontSize: 12,
  },
  notCard: {
    background: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: 10,
    padding: '14px 20px',
    marginBottom: 28,
  },
  notTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--text-tertiary)',
    margin: '0 0 8px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
  },
  notList: {
    margin: 0,
    padding: '0 0 0 18px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
    fontSize: 13,
    color: 'var(--text-tertiary)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 10,
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '20px 24px',
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: '0 0 4px',
  },
  label: {
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--text-secondary)',
    marginTop: 4,
  },
  optional: {
    fontWeight: 400,
    color: 'var(--text-tertiary)',
  },
  input: {
    width: '100%',
    padding: '9px 12px',
    borderRadius: 8,
    border: '1px solid var(--border)',
    fontSize: 14,
    color: 'var(--text-primary)',
    background: 'var(--bg-surface-solid)',
    boxSizing: 'border-box' as const,
    outline: 'none',
  },
  platformRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  platformBtn: {
    padding: '6px 14px',
    borderRadius: 20,
    border: '1px solid var(--border)',
    background: 'transparent',
    fontSize: 13,
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  platformBtnActive: {
    background: 'var(--accent-light)',
    borderColor: 'var(--accent)',
    color: 'var(--accent)',
    fontWeight: 600,
  },
  textarea: {
    width: '100%',
    padding: '9px 12px',
    borderRadius: 8,
    border: '1px solid var(--border)',
    fontSize: 14,
    color: 'var(--text-primary)',
    background: 'var(--bg-surface-solid)',
    resize: 'vertical' as const,
    boxSizing: 'border-box' as const,
    outline: 'none',
    fontFamily: 'inherit',
    lineHeight: 1.5,
  },
  error: {
    fontSize: 13,
    color: 'var(--error)',
    margin: 0,
  },
  submitBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
    width: '100%',
  },
  doneCard: {
    background: 'var(--accent-light)',
    border: '1px solid var(--accent)',
    borderRadius: 12,
    padding: '24px 28px',
    marginBottom: 24,
  },
  doneTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: 'var(--accent)',
    margin: '0 0 8px',
  },
  doneSub: {
    fontSize: 14,
    color: 'var(--text-secondary)',
    margin: 0,
    lineHeight: 1.6,
  },
  footer: {
    fontSize: 12,
    color: 'var(--text-tertiary)',
    textAlign: 'center' as const,
    marginTop: 'auto',
    paddingTop: 24,
  },
}
