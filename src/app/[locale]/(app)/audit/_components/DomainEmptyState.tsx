'use client'
import { AppSection } from '@/components/app-ui/AppSection'
import type { AuditDomain } from '@/lib/audit/types'

const DOMAIN_COPY: Record<AuditDomain, { headline: string; description: string; tools: string[] }> = {
  'code-quality': {
    headline: 'Code-Qualität',
    description: 'Keine offenen Findings — alles sauber.',
    tools: [],
  },
  'performance': {
    headline: 'Performance — Lighthouse läuft',
    description: 'URL in den Performance-Einstellungen hinterlegen um Lighthouse-Scores zu sehen. Bundle-Analyse läuft automatisch.',
    tools: ['Google PageSpeed Insights (aktiv nach URL)', 'WebPageTest (Roadmap)'],
  },
  'security': {
    headline: 'Sicherheit',
    description: 'Alle Sicherheits-Checks bestanden. Externe Scanner folgen.',
    tools: ['Snyk (Roadmap)', 'OWASP ZAP (Roadmap)', 'gitleaks (aktiv)'],
  },
  'accessibility': {
    headline: 'Barrierefreiheit kommt',
    description: 'WCAG- und BFSG-Prüfungen kommen als integrierte axe-core-Scans. Bis dahin findest du technische A11y-Findings im Code-Qualität-Tab.',
    tools: ['axe-core (Roadmap)', 'WAVE (Roadmap)', 'Lighthouse A11y (aktiv)'],
  },
  'dsgvo': {
    headline: 'DSGVO — alles erfüllt',
    description: 'Keine offenen DSGVO-Pflichten. Regelmäßig re-scannen nach Änderungen an Drittanbietern.',
    tools: [],
  },
  'ki-act': {
    headline: 'EU AI Act — alles erfüllt',
    description: 'Keine offenen KI-Act-Pflichten. Pflichten werden aktiv wenn KI-Features erkannt werden.',
    tools: [],
  },
}

interface Props {
  domain: AuditDomain
  hasRun: boolean
}

export function DomainEmptyState({ domain, hasRun }: Props) {
  const copy = DOMAIN_COPY[domain]
  return (
    <AppSection header={copy.headline}>
      <div style={{ padding: '32px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: copy.tools.length > 0 ? 16 : 0, lineHeight: 1.6 }}>
          {hasRun ? copy.description : 'Audit noch nicht gestartet — klick "Neuer Scan" oben rechts.'}
        </p>
        {copy.tools.length > 0 && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {copy.tools.map(tool => (
              <span key={tool} style={{
                padding: '3px 10px', borderRadius: 12, fontSize: 11,
                fontFamily: 'var(--font-mono)', background: 'var(--surface-warm)',
                color: 'var(--text-tertiary)', border: '1px solid var(--border)',
              }}>
                {tool}
              </span>
            ))}
          </div>
        )}
      </div>
    </AppSection>
  )
}
