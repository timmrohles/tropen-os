'use client'

import Link from 'next/link'
import { SquaresFour, RssSimple, Robot, Books } from '@phosphor-icons/react'

const FEATURES = [
  {
    href: '/workspaces',
    Icon: SquaresFour,
    title: 'Workspaces',
    description: 'Komplexe Vorhaben strukturieren — von der Idee zum fertigen Ergebnis',
    example: 'z.B. Businessplan, Marktanalyse, Strategie',
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
  {
    href: '/knowledge',
    Icon: Books,
    title: 'Wissen',
    description: 'Dein Wissen hochladen — Toro nutzt es automatisch',
    example: 'z.B. Handbücher, Richtlinien, Produktinfos',
  },
] as const

export default function FeatureGrid() {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
      gap: 16, marginBottom: 32,
    }}>
      {FEATURES.map(({ href, Icon, title, description, example }) => (
        <Link
          key={href}
          href={href}
          style={{ display: 'block', textDecoration: 'none' }}
          aria-label={`Zu ${title} navigieren`}
        >
          <div className="card">
            <div style={{ padding: '16px 18px' }}>
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
              <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: 0 }}>
                {example}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
