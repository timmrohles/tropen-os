'use client'

import { useState } from 'react'
import { EnvelopeSimple } from '@phosphor-icons/react'

export function SecuritySection() {
  const [resetSent, setResetSent] = useState(false)
  const [sending, setSending] = useState(false)

  async function sendPasswordReset() {
    setSending(true)
    const { createClient } = await import('@/utils/supabase/client')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.email) {
      await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/settings`,
      })
    }
    setSending(false)
    setResetSent(true)
  }

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-header-label">Sicherheit</span>
      </div>
      <div className="card-body" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        <div>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Passwort ändern</div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 12px' }}>
            Wir senden dir eine E-Mail mit einem Link zum Passwort-Reset.
          </p>
          {resetSent ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 14px', borderRadius: 'var(--radius-sm)',
              background: 'var(--accent-light)', color: 'var(--accent)', fontSize: 13,
            }}>
              <EnvelopeSimple size={16} weight="bold" aria-hidden="true" />
              E-Mail gesendet — bitte überprüfe deinen Posteingang
            </div>
          ) : (
            <button
              className="btn btn-ghost"
              onClick={sendPasswordReset}
              disabled={sending}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <EnvelopeSimple size={14} weight="bold" aria-hidden="true" />
              {sending ? 'Sende…' : 'Passwort-Reset-E-Mail senden'}
            </button>
          )}
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Zwei-Faktor-Authentifizierung</div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
            2FA-Verwaltung kommt bald.
          </p>
        </div>
      </div>
    </div>
  )
}
