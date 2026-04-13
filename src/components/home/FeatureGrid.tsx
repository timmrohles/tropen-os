'use client'

import { Link } from '@/i18n/navigation'
import { SquaresFour, RssSimple, Robot, ArrowRight } from '@phosphor-icons/react'

const FEATURES = [
  {
    href: '/workspaces',
    Icon: SquaresFour,
    title: 'Workspaces',
    description: 'Inhalte sammeln und mit Kollegen oder externen Partnern teilen',
    example: 'z.B. Kampagnen, Projekt-Reviews, Kunden-Präsentationen',
  },
  {
    href: '/feeds',
    Icon: RssSimple,
    title: 'Feeds',
    description: 'Externe Daten automatisch reinholen und aufbereiten',
    example: 'z.B. Branchen-News, Wettbewerber, RSS-Quellen',
  },
  {
    href: '/agenten',
    Icon: Robot,
    title: 'Agenten',
    description: 'Wiederkehrende Aufgaben automatisch erledigen lassen',
    example: 'z.B. Wöchentlicher Report, Monitoring, Alerts',
  },
] as const

export default function FeatureGrid() {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gridAutoRows: '1fr',
      gap: 16, marginBottom: 32,
    }}>
      {FEATURES.map(({ href, Icon, title, description, example }) => (
        <Link
          key={href}
          href={href}
          style={{ display: 'flex', textDecoration: 'none' }}
          aria-label={`Zu ${title} navigieren`}
        >
          <div className="card" style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', flex: 1 }}>
              <Icon size={24} weight="fill" color="var(--accent)" aria-hidden="true" />
              <h3 style={{
                fontSize: 15, fontWeight: 700, color: 'var(--text-primary)',
                margin: '8px 0 4px',
              }}>
                {title}
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 8px' }}>
                {description}
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: '0 0 16px' }}>
                {example}
              </p>
              <div style={{ marginTop: 'auto' }}>
                <span className="btn btn-ghost btn-sm" style={{ pointerEvents: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  Öffnen <ArrowRight size={13} weight="bold" aria-hidden="true" />
                </span>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
