'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Passwort muss mindestens 8 Zeichen haben.')
      return
    }
    if (password !== confirm) {
      setError('Passwörter stimmen nicht überein.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setSuccess(true)
    setTimeout(() => router.push('/workspaces'), 2000)
  }

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <h1 style={s.logo}>Tropen OS</h1>
        <p style={s.sub}>Neues Passwort setzen</p>

        {success ? (
          <div style={s.successBox}>
            <p style={s.successText}>Passwort erfolgreich geändert. Weiterleitung…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={s.form}>
            <label style={s.label}>Neues Passwort</label>
            <input
              style={s.input}
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
              minLength={8}
            />

            <label style={s.label}>Passwort bestätigen</label>
            <input
              style={s.input}
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={8}
            />

            {error && <p style={s.error}>{error}</p>}

            <button style={s.btn} type="submit" disabled={loading}>
              {loading ? 'Wird gespeichert…' : 'Passwort speichern'}
            </button>
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
  successBox: { textAlign: 'center' as const, padding: '16px 0' },
  successText: { fontSize: 14, color: '#14b8a6', margin: 0 },
}
