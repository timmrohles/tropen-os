import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Barrierefreiheit — Tropen OS',
}

// Pflichtseite gemäß BFSG § 12 (gilt für private Anbieter ab 28.06.2025)
export default function AccessibilityPage() {
  const lastReview = '2026-03-13'

  return (
    <main className="content-narrow legal-page">
      <h1>Barrierefreiheitserklärung</h1>
      <p>Letzte Überprüfung: {lastReview}</p>

      <section>
        <h2>Stand der Barrierefreiheit</h2>
        <p>
          Tropen OS ist teilweise konform mit den Anforderungen der WCAG 2.1 Level AA sowie dem
          Barrierefreiheitsstärkungsgesetz (BFSG). Die nachfolgend genannten Inhalte sind noch nicht
          vollständig barrierefrei.
        </p>
      </section>

      <section>
        <h2>Nicht barrierefreie Inhalte</h2>
        <ul>
          <li>Einige Icon-Buttons haben noch keine vollständigen <code>aria-label</code>-Attribute</li>
          <li>Loading-Zustände sind noch nicht vollständig mit <code>aria-busy</code> ausgezeichnet</li>
          <li>Einzelne Farbkontraste wurden noch nicht vollständig auf WCAG 1.4.3 geprüft</li>
          <li>KI-generierte Inhalte können für assistive Technologien ggf. schwer erfassbar sein</li>
        </ul>
      </section>

      <section>
        <h2>Implementierte Barrierefreiheitsmerkmale</h2>
        <ul>
          <li>Tastaturnavigation in allen Drawern und Modals (Fokus-Trap, Escape-Taste, Rückkehr-Fokus)</li>
          <li>Neue KI-Antworten werden für Screenreader via <code>aria-live=&quot;polite&quot;</code> angekündigt</li>
          <li>Reduzierte Bewegung wird respektiert (<code>prefers-reduced-motion</code>)</li>
          <li>KI-generierte Inhalte sind deutlich als solche gekennzeichnet (Art. 50 EU AI Act)</li>
          <li>Semantisches HTML mit ARIA-Rollen auf Dialogen und Navigationselementen</li>
        </ul>
      </section>

      <section>
        <h2>Barriere melden</h2>
        <p>
          Wenn Sie Barrieren in Tropen OS feststellen, melden Sie diese bitte an:{' '}
          <a href="mailto:accessibility@tropen.de">accessibility@tropen.de</a>
          . Wir bemühen uns, Ihnen innerhalb von 5 Werktagen zu antworten.
        </p>
      </section>

      <section>
        <h2>Schlichtungsverfahren (§ 16 BFSG)</h2>
        <p>
          Wenn Sie auf eine Meldung keine zufriedenstellende Antwort erhalten haben, können Sie die
          Schlichtungsstelle nach dem Behindertengleichstellungsgesetz einschalten:{' '}
          <a
            href="https://www.schlichtungsstelle-bgg.de"
            target="_blank"
            rel="noopener noreferrer"
          >
            www.schlichtungsstelle-bgg.de
          </a>
          .
        </p>
      </section>
    </main>
  )
}
