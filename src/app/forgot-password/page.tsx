'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    })

    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    setSent(true)
  }

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <h1 style={s.logo}>Tropen OS</h1>
        <p style={s.sub}>Passwort zurücksetzen</p>

        {sent ? (
          <div style={s.success}>
            <p style={s.successText}>E-Mail gesendet. Bitte prüfe dein Postfach.</p>
            <Link href="/login" style={s.backLink}>← Zurück zum Login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={s.form}>
            <label style={s.label}>E-Mail</label>
            <input
              style={s.input}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />

            {error && <p style={s.error}>{error}</p>}

            <button style={s.btn} type="submit" disabled={loading}>
              {loading ? 'Wird gesendet…' : 'Reset-Link senden'}
            </button>

            <Link href="/login" style={s.backLink}>← Zurück zum Login</Link>
          </form>
        )}
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
    width: 360,
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
    marginBottom: 8,
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
    marginTop: 8,
  },
  error: { fontSize: 13, color: '#ef4444', margin: '0 0 4px' },
  success: { display: 'flex', flexDirection: 'column', gap: 16 },
  successText: { fontSize: 14, color: '#a3b554', margin: 0 },
  backLink: {
    fontSize: 13,
    color: '#555',
    textDecoration: 'none',
    textAlign: 'center' as const,
    marginTop: 12,
    display: 'block',
  },
}
