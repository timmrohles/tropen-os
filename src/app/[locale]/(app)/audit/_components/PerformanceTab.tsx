'use client'
import { useEffect, useState } from 'react'
import { AppSection } from '@/components/app-ui/AppSection'
import FindingsTableApp from './FindingsTableApp'
import type { AuditFinding } from '@/lib/audit/group-findings'

interface PerformanceTabProps {
  findings: AuditFinding[]
  statusFilter?: string
  initialLighthouseUrl: string | null
  scanProjectId: string | null
  hasLighthouseData: boolean
}

export function PerformanceTab({ findings, statusFilter = 'open', initialLighthouseUrl, scanProjectId, hasLighthouseData }: PerformanceTabProps) {
  const lsKey = `lh_url_${scanProjectId ?? 'default'}`
  const [url, setUrl] = useState(initialLighthouseUrl ?? '')
  const [saved, setSaved] = useState(false)

  // Sync from localStorage on mount (set by AuditActions if already saved there)
  useEffect(() => {
    if (!initialLighthouseUrl) {
      const stored = localStorage.getItem(lsKey)
      if (stored) setUrl(stored)
    }
  }, [initialLighthouseUrl, lsKey])

  function handleChange(val: string) {
    setUrl(val)
    if (val.trim()) localStorage.setItem(lsKey, val.trim())
    else localStorage.removeItem(lsKey)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const openCount = findings.filter(f => f.status === 'open').length

  return (
    <>
      {/* Lighthouse-Box — Limette-Header, direkt an Findings anschließend */}
      <div style={{ borderBottom: '1px solid var(--border)' }}>
        {/* Header in Limette */}
        <div style={{
          padding: '8px 16px', background: 'var(--secondary)',
          borderBottom: '1px solid rgba(30,37,48,0.12)',
          fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '0.05em',
          color: 'var(--active-bg)',
        }}>
          Lighthouse — Was bringt das?
        </div>
        {/* Body */}
        <div style={{ padding: '14px 16px' }}>
          <p style={{ margin: '0 0 10px', fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6 }}>
            Lighthouse misst die echte Performance, Barrierefreiheit und SEO deiner Live-URL — aus Sicht des Browsers, nicht des Codes.
            Der Scan liefert konkrete Werte: Ladezeit, Core Web Vitals, Accessibility-Score.
          </p>
          <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Warum das wichtig ist: Google nutzt Core Web Vitals als Ranking-Faktor. Eine Ladezeit über 3 Sekunden
            kostet durchschnittlich 40% der Besucher. BFSG und WCAG fordern nachweisbare Barrierefreiheit —
            Lighthouse liefert den Nachweis.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="url"
              value={url}
              onChange={e => handleChange(e.target.value)}
              placeholder="https://deine-app.de"
              aria-label="Lighthouse URL"
              style={{
                flex: 1, maxWidth: 400, height: 34, padding: '0 10px',
                fontSize: 13, fontFamily: 'var(--font-mono)',
                border: '1px solid var(--border)', borderRadius: 4,
                background: 'var(--bg-base)', color: 'var(--text-primary)', outline: 'none',
              }}
            />
            {saved && (
              <span style={{ fontSize: 11, color: 'var(--status-success)', fontFamily: 'var(--font-mono)' }}>
                ✓ gespeichert
              </span>
            )}
            {!url && (
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                URL eintragen → beim nächsten Scan wird Lighthouse ausgeführt
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Findings — direkt darunter, kein Zwischenraum */}
      {hasLighthouseData || openCount > 0 ? (
        <FindingsTableApp findings={findings} statusFilter={statusFilter} />
      ) : (
        <div style={{ padding: '24px 16px', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 4px' }}>
            Noch keine Lighthouse-Daten für dieses Projekt.
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: 0 }}>
            Bundle-Analyse und CC-Metriken laufen automatisch — für Lighthouse-Scores URL oben eintragen.
          </p>
        </div>
      )}

      {/* Fixed findings */}
      {findings.filter(f => f.status === 'fixed').length > 0 && (
        <AppSection header={`Behoben · ${findings.filter(f => f.status === 'fixed').length}`} style={{ marginTop: 16 }}>
          <FindingsTableApp findings={findings} statusFilter="fixed" />
        </AppSection>
      )}
    </>
  )
}
