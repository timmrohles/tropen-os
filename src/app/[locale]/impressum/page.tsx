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
          {/* TODO(timm): Straße, PLZ, Ort ergänzen */}
          Tropen Research UG (haftungsbeschränkt)<br />
          [Straße und Hausnummer]<br />
          [PLZ] [Ort]<br />
          Deutschland
        </p>
      </section>

      <section>
        <h2>Vertretungsberechtigte Person</h2>
        <p>
          {/* TODO(timm): Vollständigen Namen eintragen */}
          Timm [Nachname]<br />
          (Geschäftsführer)
        </p>
      </section>

      <section>
        <h2>Kontakt</h2>
        <p>
          {/* TODO(timm): Kontakt-E-Mail bestätigen */}
          E-Mail: <a href="mailto:legal@tropen.de">legal@tropen.de</a>
        </p>
      </section>

      <section>
        <h2>Handelsregister</h2>
        <p>
          {/* TODO(timm): Handelsregisternummer + Amtsgericht eintragen, falls eingetragen */}
          Registergericht: Amtsgericht [Ort]<br />
          Registernummer: HRB [Nummer]
        </p>
      </section>

      <section>
        <h2>Umsatzsteuer-ID</h2>
        <p>
          {/* TODO(timm): USt-IdNr. eintragen, falls vorhanden */}
          Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG:<br />
          [USt-IdNr.]
        </p>
      </section>

      <section>
        <h2>Verantwortlich für den Inhalt (§ 18 Abs. 2 MStV)</h2>
        <p>
          {/* TODO(timm): Name + Anschrift eintragen */}
          Timm [Nachname]<br />
          [Straße und Hausnummer]<br />
          [PLZ] [Ort]
        </p>
      </section>

      <section>
        <h2>KI-Hinweis (Art. 50 EU AI Act)</h2>
        <p>
          Toro, der KI-Assistent von Tropen OS, wird durch Large Language Models betrieben.
          Antworten sind KI-generiert und können Fehler enthalten. Bitte überprüfen Sie
          sicherheitskritische oder rechtlich relevante Informationen eigenständig.
        </p>
      </section>

      <section>
        <h2>Streitschlichtung</h2>
        <p>
          Die EU-Kommission stellt eine Plattform zur Online-Streitbeilegung bereit:{' '}
          <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">
            https://ec.europa.eu/consumers/odr
          </a>
          . Wir nehmen an keinem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teil.
        </p>
      </section>
    </main>
  )
}
