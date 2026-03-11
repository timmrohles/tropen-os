'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

export default function LoginPage() {
  const router = useRouter()
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
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/workspaces')
    router.refresh()
  }

  return (
    <div className="content-narrow" style={s.wrap}>
      <div style={s.card}>
        <h1 style={s.logo}>Tropen OS</h1>
        <p style={s.sub}>Responsible AI Workspace für den Mittelstand</p>

        <form onSubmit={handleLogin} style={s.form}>
          <label style={s.label}>E-Mail</label>
          <input
            style={s.input}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label style={s.label}>Passwort</label>
          <input
            style={s.input}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p style={s.error}>{error}</p>}

          <button style={s.btn} type="submit" disabled={loading}>
            {loading ? 'Anmelden…' : 'Anmelden'}
          </button>

          <Link href="/forgot-password" style={s.forgotLink}>
            Passwort vergessen?
          </Link>
        </form>

        <p style={s.inviteNote}>
          Kein Konto? Tropen OS ist einladungsbasiert –{' '}
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
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: 12,
    padding: '40px 48px',
    width: 360
  },
  logo: { fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 0 6px' },
  sub: { fontSize: 13, color: '#555', margin: '0 0 32px' },
  form: { display: 'flex', flexDirection: 'column', gap: 8 },
  label: { fontSize: 12, color: '#666', marginBottom: 2 },
  input: {
    background: '#111',
    border: '1px solid #2a2a2a',
    color: '#fff',
    padding: '10px 12px',
    borderRadius: 6,
    fontSize: 14,
    outline: 'none',
    marginBottom: 8
  },
  btn: {
    background: '#fff',
    color: '#000',
    border: 'none',
    padding: '11px',
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 8
  },
  error: { fontSize: 13, color: '#ef4444', margin: '0 0 4px' },
  forgotLink: {
    fontSize: 12,
    color: '#444',
    textDecoration: 'none',
    textAlign: 'center' as const,
    marginTop: 12,
    display: 'block',
  },
  inviteNote: {
    fontSize: 12,
    color: '#444',
    textAlign: 'center' as const,
    marginTop: 24,
    marginBottom: 0,
  },
  inviteLink: {
    color: '#555',
    textDecoration: 'none',
  }
}
