'use client'

// LighthouseUrlBlock — Sprint 6b₁
// Portiert die URL-Eingabe aus PerformanceTab in eine standalone-Komponente.
// Coach-Begrenzungs-Aussage: "Wir prüfen nicht selbst die Live-Performance."

import { useState, useEffect } from 'react'
import { ClipboardText } from '@phosphor-icons/react'

interface LighthouseUrlBlockProps {
  scanProjectId?: string | null
  initialUrl?: string | null
  id?: string  // Scroll-Anchor-ID
}

export function LighthouseUrlBlock({ scanProjectId, initialUrl, id }: LighthouseUrlBlockProps) {
  const lsKey = `lh_url_${scanProjectId ?? 'default'}`
  const [url, setUrl] = useState(initialUrl ?? '')
  const [saved, setSaved] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!initialUrl) {
      const stored = localStorage.getItem(lsKey)
      if (stored) setUrl(stored)
    }
  }, [initialUrl, lsKey])

  function handleChange(val: string) {
    setUrl(val)
    if (val.trim()) localStorage.setItem(lsKey, val.trim())
    else localStorage.removeItem(lsKey)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <div id={id} style={{
      border: '1px solid var(--accent)',
      borderRadius: 8, overflow: 'hidden',
      background: '#ffffff',
    }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10, width: '100%',
          padding: '9px 14px', background: 'var(--accent)', border: 'none', cursor: 'pointer',
          textAlign: 'left', borderBottom: open ? '1px solid rgba(255,255,255,0.10)' : 'none',
        }}
      >
        <ClipboardText size={14} weight="fill" color="rgba(255,255,255,0.80)" aria-hidden="true" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 500, color: '#ffffff' }}>
          Lighthouse-URL
        </span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: 400 }}>
          {url ? `· ${url.replace(/^https?:\/\//, '')}` : '· noch keine URL gesetzt'}
        </span>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: 'rgba(255,255,255,0.65)' }}>
          {open ? '▲' : '▼'}
        </span>
      </button>

      {open && (
        <div style={{ padding: '12px 14px' }}>
          {/* Begrenzungs-Aussage (Marken-Brief 28.1) */}
          <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, fontStyle: 'italic' }}>
            Wir prüfen die Live-Performance nicht selbst aus dem Code.
            Tragt eure URL ein — beim nächsten Audit mit externen Tools wird Lighthouse gegen sie ausgeführt.
          </p>
          <p style={{ margin: '0 0 10px', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Lighthouse misst Ladezeit, Core Web Vitals und Barrierefreiheit aus Sicht des Browsers.
            Google nutzt Core Web Vitals als Ranking-Faktor; BFSG fordert nachweisbare Barrierefreiheit.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="url"
              value={url}
              onChange={e => handleChange(e.target.value)}
              placeholder="https://eure-app.de"
              aria-label="Lighthouse URL"
              style={{
                flex: 1, maxWidth: 400, height: 34, padding: '0 10px',
                fontSize: 13, fontFamily: 'var(--font-mono)',
                border: '1px solid var(--border)', borderRadius: 4,
                background: 'var(--bg-base)', color: 'var(--text-primary)', outline: 'none',
              }}
            />
            {saved && (
              <span style={{ fontSize: 11, color: 'var(--teal)', fontFamily: 'var(--font-mono)' }}>✓ gespeichert</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
