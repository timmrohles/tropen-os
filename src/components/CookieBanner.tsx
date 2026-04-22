'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShieldCheck, X } from '@phosphor-icons/react'

const STORAGE_KEY = 'cookie_consent'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true)
  }, [])

  function accept() {
    localStorage.setItem(STORAGE_KEY, 'all')
    setVisible(false)
  }

  function acceptNecessary() {
    localStorage.setItem(STORAGE_KEY, 'necessary')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="Cookie-Einstellungen"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'min(640px, calc(100vw - 32px))',
        background: 'var(--bg-surface-solid)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 14,
        boxShadow: '0 4px 24px rgba(26,23,20,0.12)',
        zIndex: 9000,
      }}
    >
      <ShieldCheck size={22} color="var(--accent)" weight="fill" style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
          Cookies &amp; Datenschutz
        </p>
        <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Wir setzen technisch notwendige Cookies für die Authentifizierung sowie Sentry für Fehlerberichte.
          Weitere Tracking-Cookies werden nur mit deiner Zustimmung gesetzt.{' '}
          <Link href="/datenschutz" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
            Datenschutzerklärung
          </Link>
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" style={{ fontSize: 13, padding: '6px 14px' }} onClick={accept}>
            Alle akzeptieren
          </button>
          <button className="btn btn-ghost" style={{ fontSize: 13, padding: '6px 14px' }} onClick={acceptNecessary}>
            Nur notwendige
          </button>
        </div>
      </div>

      <button
        className="btn-icon"
        aria-label="Schließen"
        onClick={acceptNecessary}
        style={{ flexShrink: 0, marginTop: -2 }}
      >
        <X size={16} weight="bold" aria-hidden="true" />
      </button>
    </div>
  )
}
