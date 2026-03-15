import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Barrierefreiheit — Tropen OS',
}

// Pflichtseite gemäß BFSG § 12 (gilt für private Anbieter ab 28.06.2025)
export default function AccessibilityPage() {
  const lastReview = '2026-03-13'

  return (
    <main style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Barrierefreiheitserklärung</h1>
      <p style={{ color: 'var(--text-tertiary)', fontSize: 13, marginBottom: 40 }}>
        Letzte Überprüfung: {lastReview}
      </p>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
          Stand der Barrierefreiheit
        </h2>
        <p style={{ lineHeight: 1.7, color: 'var(--text-secondary)' }}>
          Tropen OS ist teilweise konform mit den Anforderungen der WCAG 2.1 Level AA sowie dem
          Barrierefreiheitsstärkungsgesetz (BFSG). Die nachfolgend genannten Inhalte sind noch nicht
          vollständig barrierefrei.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
          Nicht barrierefreie Inhalte
        </h2>
        <ul style={{ lineHeight: 1.8, color: 'var(--text-secondary)', paddingLeft: 20 }}>
          <li>Einige Icon-Buttons haben noch keine vollständigen <code>aria-label</code>-Attribute</li>
          <li>Loading-Zustände sind noch nicht vollständig mit <code>aria-busy</code> ausgezeichnet</li>
          <li>Einzelne Farbkontraste wurden noch nicht vollständig auf WCAG 1.4.3 geprüft</li>
          <li>KI-generierte Inhalte können für assistive Technologien ggf. schwer erfassbar sein</li>
        </ul>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
          Implementierte Barrierefreiheitsmerkmale
        </h2>
        <ul style={{ lineHeight: 1.8, color: 'var(--text-secondary)', paddingLeft: 20 }}>
          <li>Tastaturnavigation in allen Drawern und Modals (Fokus-Trap, Escape-Taste, Rückkehr-Fokus)</li>
          <li>Neue KI-Antworten werden für Screenreader via <code>aria-live=&quot;polite&quot;</code> angekündigt</li>
          <li>Reduzierte Bewegung wird respektiert (<code>prefers-reduced-motion</code>)</li>
          <li>KI-generierte Inhalte sind deutlich als solche gekennzeichnet (Art. 50 EU AI Act)</li>
          <li>Semantisches HTML mit ARIA-Rollen auf Dialogen und Navigationselementen</li>
        </ul>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
          Barriere melden
        </h2>
        <p style={{ lineHeight: 1.7, color: 'var(--text-secondary)' }}>
          Wenn Sie Barrieren in Tropen OS feststellen, melden Sie diese bitte an:{' '}
          <a href="mailto:accessibility@tropen.de" style={{ color: 'var(--accent)' }}>
            accessibility@tropen.de
          </a>
          . Wir bemühen uns, Ihnen innerhalb von 5 Werktagen zu antworten.
        </p>
      </section>

      <section>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
          Schlichtungsverfahren (§ 16 BFSG)
        </h2>
        <p style={{ lineHeight: 1.7, color: 'var(--text-secondary)' }}>
          Wenn Sie auf eine Meldung keine zufriedenstellende Antwort erhalten haben, können Sie die
          Schlichtungsstelle nach dem Behindertengleichstellungsgesetz einschalten:{' '}
          <a
            href="https://www.schlichtungsstelle-bgg.de"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--accent)' }}
          >
            www.schlichtungsstelle-bgg.de
          </a>
          .
        </p>
      </section>
    </main>
  )
}
