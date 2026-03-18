import Link from 'next/link'

const WHY_CARDS = [
  {
    icon: '👤',
    title: 'Für dich',
    text: 'Volle Transparenz bei KI-Nutzung. EU AI Act konform. Keine Blackbox.',
  },
  {
    icon: '👥',
    title: 'Für dein Team',
    text: 'Bewusster Umgang mit KI von Anfang an. KI-Kompetenz als Standard, nicht als Option.',
  },
  {
    icon: '🏢',
    title: 'Für uns',
    text: 'Nachhaltigkeit ist keine Marketingaussage – es ist Infrastruktur. Wir bauen es ein.',
  },
  {
    icon: '🌍',
    title: 'Für den Planeten',
    text: 'Jeder Token zählt. Gemeinsam kompensieren wir.',
  },
]

const SOURCES = [
  {
    label: 'Stanford University: \u201eThe Price of Prompting\u201c',
    href: 'https://arxiv.org/abs/2407.16893',
    linkText: 'arxiv.org/abs/2407.16893',
  },
  {
    label: 'Umweltbundesamt: Strommix Deutschland 2024',
    href: 'https://www.nowtricity.com/country/germany/',
    linkText: 'nowtricity.com/country/germany',
  },
  {
    label: 'GHG Protocol: Scope 3 Standard',
    href: 'https://ghgprotocol.org',
    linkText: 'ghgprotocol.org',
  },
  {
    label: 'Electricity Maps API (für zukünftige Echtzeit-Daten)',
    href: 'https://electricitymaps.com',
    linkText: 'electricitymaps.com',
  },
]

export default function WhyAndCtaSection() {
  return (
    <>
      {/* Why it matters */}
      <div style={s.sectionDarkBg}>
        <div style={s.sectionInner}>
          <h2 style={s.whyTitle}>Warum das wichtig ist</h2>
          <div style={s.grid4}>
            {WHY_CARDS.map((card) => (
              <div key={card.title} style={s.whyCard}>
                <span style={s.whyIcon}>{card.icon}</span>
                <p style={s.whyCardTitle}>{card.title}</p>
                <p style={s.whyCardText}>{card.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sources */}
      <div style={s.sectionMid}>
        <div style={s.sectionInner}>
          <h2 style={s.sourcesTitle}>Quellen &amp; Methodik</h2>
          <div style={s.sourcesList}>
            {SOURCES.map((src) => (
              <p key={src.href} style={s.sourceItem}>
                {src.label} –{' '}
                <Link href={src.href} target="_blank" rel="noopener noreferrer" style={s.sourceLink}>
                  {src.linkText}
                </Link>
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Footer */}
      <div style={s.ctaSection}>
        <span style={s.ctaIcon}>🦜</span>
        <p style={s.ctaQuote}>
          &bdquo;Ich finde, Transparenz ist der erste Schritt zu verantwortungsvoller KI-Nutzung.&ldquo;
        </p>
        <p style={s.ctaAttribution}>– Toro</p>
        <div style={s.ctaButtons}>
          <Link href="/workspaces" style={s.ctaBtnPrimary}>Tropen OS ausprobieren →</Link>
          <Link href="/" style={s.ctaBtnSecondary}>Zur Startseite</Link>
        </div>
      </div>
    </>
  )
}

const s: Record<string, React.CSSProperties> = {
  sectionInner: {
    maxWidth: 1100,
    margin: '0 auto',
  },
  sectionDarkBg: {
    background: '#0a0a0a',
    padding: '64px 40px',
  },
  whyTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: '#fff',
    marginBottom: 32,
    marginTop: 0,
  },
  grid4: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 16,
  },
  whyCard: {
    background: '#111',
    border: '1px solid #1e1e1e',
    borderRadius: 10,
    padding: 20,
  },
  whyIcon: {
    fontSize: 24,
  },
  whyCardTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#e5e5e5',
    marginTop: 8,
    marginBottom: 8,
  },
  whyCardText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 1.6,
    margin: 0,
  },
  sectionMid: {
    background: '#0d0d0d',
    padding: '64px 40px',
  },
  sourcesTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#888',
    marginBottom: 20,
    marginTop: 0,
  },
  sourcesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  sourceItem: {
    fontSize: 13,
    color: '#555',
    margin: 0,
  },
  sourceLink: {
    color: 'var(--accent)',
    textDecoration: 'none',
  },
  ctaSection: {
    background: 'linear-gradient(135deg, #1a2d10, #1e3818)',
    padding: '64px 40px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  ctaIcon: {
    fontSize: 48,
  },
  ctaQuote: {
    fontStyle: 'italic',
    fontSize: 18,
    color: 'rgba(255,255,255,0.85)',
    maxWidth: 500,
    margin: '24px auto 0',
    lineHeight: 1.6,
  },
  ctaAttribution: {
    fontSize: 14,
    color: 'var(--accent)',
    marginTop: 8,
  },
  ctaButtons: {
    display: 'flex',
    gap: 12,
    marginTop: 32,
    justifyContent: 'center',
  },
  ctaBtnPrimary: {
    background: 'var(--accent)',
    color: '#000',
    padding: '12px 24px',
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 14,
    textDecoration: 'none',
  },
  ctaBtnSecondary: {
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.2)',
    color: 'rgba(255,255,255,0.7)',
    padding: '12px 24px',
    borderRadius: 8,
    fontSize: 14,
    textDecoration: 'none',
  },
}
