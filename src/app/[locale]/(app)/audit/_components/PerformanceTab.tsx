'use client'
import { AppSection } from '@/components/app-ui/AppSection'
import FindingsTableApp from './FindingsTableApp'
import type { AuditFinding } from '@/lib/audit/group-findings'

interface PerformanceTabProps {
  findings: AuditFinding[]
  statusFilter?: string
  lighthouseUrl: string | null
  hasLighthouseData: boolean
}

export function PerformanceTab({ findings, statusFilter = 'open', lighthouseUrl, hasLighthouseData }: PerformanceTabProps) {
  const openCount = findings.filter(f => f.status === 'open').length

  return (
    <>
      {/* Erklärungsbox — immer sichtbar */}
      <AppSection
        header="Lighthouse — Was bringt das?"
        style={{ marginBottom: 16 }}
      >
        <div style={{ padding: '14px 16px' }}>
          <p style={{ margin: '0 0 10px', fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6 }}>
            Lighthouse misst die echte Performance, Barrierefreiheit und SEO deiner Live-URL — aus Sicht des Browsers, nicht des Codes.
            Der Scan läuft gegen eine öffentlich erreichbare URL und liefert konkrete Werte: Ladezeit, Core Web Vitals, Accessibility-Score.
          </p>
          <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Warum das wichtig ist: Google nutzt Core Web Vitals als Ranking-Faktor.
            Eine Ladezeit über 3 Sekunden kostet durchschnittlich 40% der Besucher.
            BFSG und WCAG fordern nachweisbare Barrierefreiheit — Lighthouse liefert den Nachweis.
          </p>
          {lighthouseUrl ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>Gescannte URL:</span>
              <span style={{
                fontSize: 12, fontFamily: 'var(--font-mono)', padding: '2px 8px',
                background: 'var(--bg-base)', border: '1px solid var(--border)',
                borderRadius: 4, color: 'var(--text-secondary)',
              }}>
                {lighthouseUrl}
              </span>
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
              Noch keine URL gesetzt — URL oben rechts eintragen und Scan starten.
            </p>
          )}
        </div>
      </AppSection>

      {/* Findings */}
      {hasLighthouseData ? (
        <AppSection header={`Performance · ${openCount} offen`}>
          <FindingsTableApp findings={findings} statusFilter={statusFilter} />
        </AppSection>
      ) : (
        <AppSection header="Performance-Findings">
          <div style={{ padding: '24px 16px', textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 4px' }}>
              Noch keine Lighthouse-Daten für dieses Projekt.
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: 0 }}>
              Bundle-Analyse und CC-Metriken laufen automatisch — für Lighthouse-Scores URL eintragen.
            </p>
          </div>
        </AppSection>
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
