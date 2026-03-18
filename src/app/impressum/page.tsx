import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Impressum — Tropen OS',
}

export default function ImpressumPage() {
  return (
    <main className="content-narrow legal-page">
      <h1>Impressum</h1>

      <section>
        <h2>Angaben gemäß § 5 TMG</h2>
        <p>
          {/* TODO: Betreiber-Daten eintragen */}
          Tropen OS<br />
          [Straße und Hausnummer]<br />
          [PLZ Ort]<br />
          Deutschland
        </p>
      </section>

      <section>
        <h2>Kontakt</h2>
        <p>
          E-Mail: <a href="mailto:legal@tropen.de">legal@tropen.de</a>
        </p>
      </section>

      <section>
        <h2>Verantwortlich für den Inhalt (§ 18 Abs. 2 MStV)</h2>
        <p>
          {/* TODO: Name + Anschrift der verantwortlichen Person */}
          [Vorname Nachname]<br />
          [Straße und Hausnummer]<br />
          [PLZ Ort]
        </p>
      </section>

      <section>
        <h2>KI-Hinweis (Art. 50 EU AI Act)</h2>
        <p>
          Toro, der KI-Assistent von Tropen OS, wird durch ein Large Language Model betrieben.
          Antworten sind KI-generiert und können Fehler enthalten. Bitte überprüfen Sie
          sicherheitskritische oder rechtlich relevante Informationen eigenständig.
        </p>
      </section>
    </main>
  )
}
