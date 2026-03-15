import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Impressum — Tropen OS',
}

export default function ImpressumPage() {
  return (
    <main style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 32 }}>Impressum</h1>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Angaben gemäß § 5 TMG</h2>
        <p style={{ lineHeight: 1.7, color: 'var(--text-secondary)' }}>
          {/* TODO: Betreiber-Daten eintragen */}
          Tropen OS<br />
          [Straße und Hausnummer]<br />
          [PLZ Ort]<br />
          Deutschland
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Kontakt</h2>
        <p style={{ lineHeight: 1.7, color: 'var(--text-secondary)' }}>
          E-Mail: <a href="mailto:legal@tropen.de" style={{ color: 'var(--accent)' }}>legal@tropen.de</a>
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Verantwortlich für den Inhalt (§ 18 Abs. 2 MStV)</h2>
        <p style={{ lineHeight: 1.7, color: 'var(--text-secondary)' }}>
          {/* TODO: Name + Anschrift der verantwortlichen Person */}
          [Vorname Nachname]<br />
          [Straße und Hausnummer]<br />
          [PLZ Ort]
        </p>
      </section>

      <section>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>KI-Hinweis (Art. 50 EU AI Act)</h2>
        <p style={{ lineHeight: 1.7, color: 'var(--text-secondary)' }}>
          Toro, der KI-Assistent von Tropen OS, wird durch ein Large Language Model betrieben.
          Antworten sind KI-generiert und können Fehler enthalten. Bitte überprüfen Sie
          sicherheitskritische oder rechtlich relevante Informationen eigenständig.
        </p>
      </section>
    </main>
  )
}
