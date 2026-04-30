'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { Link } from '@/i18n/navigation'
import { createClient } from '@/utils/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const t = useTranslations('auth')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(t('loginError'))
      setLoading(false)
      return
    }

    router.push('/audit')
  }

  return (
    <div className="content-narrow" style={s.wrap}>
      <div style={s.card}>
        <h1 style={s.logo}>Tropen OS</h1>
        <p style={s.sub}>Responsible AI Department für den Mittelstand</p>

        <form onSubmit={handleLogin} style={s.form}>
          <label htmlFor="email" style={s.label}>{t('email')}</label>
          <input
            id="email"
            data-testid="login-email"
            style={s.input}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label htmlFor="password" style={s.label}>{t('password')}</label>
          <input
            id="password"
            data-testid="login-password"
            style={s.input}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p style={s.error}>{error}</p>}

          <button className="btn btn-primary" type="submit" disabled={loading} data-testid="login-submit">
            {loading ? t('loading') : t('login')}
          </button>

          <Link href="/forgot-password" style={s.forgotLink}>
            {t('forgotPassword')}
          </Link>
        </form>

        <p style={s.inviteNote}>
          {t('noAccount')}{' '}
          <a href="https://tropen.de" style={s.inviteLink} target="_blank" rel="noreferrer">
            tropen.de
          </a>
        </p>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  card: {
    background: 'var(--bg-surface-solid)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '40px 48px',
    width: 360,
    boxShadow: 'var(--shadow-md)'
  },
  logo: { fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' },
  sub: { fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 32px' },
  form: { display: 'flex', flexDirection: 'column', gap: 8 },
  label: { fontSize: 12, color: 'var(--text-secondary)', marginBottom: 2 },
  input: {
    background: 'var(--bg-surface-solid)',
    border: '1px solid var(--border-medium)',
    color: 'var(--text-primary)',
    padding: '10px 12px',
    borderRadius: 6,
    fontSize: 14,
    outline: 'none',
    marginBottom: 8
  },
  error: { fontSize: 13, color: 'var(--error)', margin: '0 0 4px' },
  forgotLink: {
    fontSize: 12,
    color: 'var(--text-tertiary)',
    textDecoration: 'none',
    textAlign: 'center' as const,
    marginTop: 12,
    display: 'block',
  },
  inviteNote: {
    fontSize: 12,
    color: 'var(--text-tertiary)',
    textAlign: 'center' as const,
    marginTop: 24,
    marginBottom: 0,
  },
  inviteLink: {
    color: 'var(--text-secondary)',
    textDecoration: 'none',
  }
}
