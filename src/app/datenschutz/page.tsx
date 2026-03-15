import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Datenschutz — Tropen OS',
}

export default function DatenschutzPage() {
  return (
    <main style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Datenschutzerklärung</h1>
      <p style={{ color: 'var(--text-tertiary)', fontSize: 13, marginBottom: 40 }}>
        Stand: {new Date().toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
      </p>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>1. Verantwortlicher</h2>
        <p style={{ lineHeight: 1.7, color: 'var(--text-secondary)' }}>
          {/* TODO: Betreiber-Daten + Datenschutzbeauftragter eintragen */}
          Tropen OS · [Anschrift] · <a href="mailto:legal@tropen.de" style={{ color: 'var(--accent)' }}>legal@tropen.de</a>
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>2. Verarbeitete Daten</h2>
        <p style={{ lineHeight: 1.7, color: 'var(--text-secondary)' }}>
          Wir verarbeiten folgende personenbezogene Daten:<br />
          — Registrierungsdaten (E-Mail-Adresse, Name)<br />
          — Chat-Inhalte (zur Bereitstellung des KI-Assistenten)<br />
          — Nutzungsdaten (Verbindungsdaten, Logs ohne PII)<br />
          — Zahlungsdaten (verarbeitet durch unseren Zahlungsanbieter)
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>3. Rechtsgrundlagen (DSGVO)</h2>
        <p style={{ lineHeight: 1.7, color: 'var(--text-secondary)' }}>
          Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO), berechtigte Interessen (Art. 6 Abs. 1 lit. f DSGVO),
          Einwilligung (Art. 6 Abs. 1 lit. a DSGVO) wo angegeben.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>4. Subprozessoren</h2>
        <p style={{ lineHeight: 1.7, color: 'var(--text-secondary)' }}>
          — <strong>Supabase</strong> (Datenbank, Authentifizierung) — EU-Hosting<br />
          — <strong>Vercel</strong> (Hosting) — AVV abgeschlossen<br />
          — <strong>Dify / OpenAI</strong> (KI-Verarbeitung) — Datenverarbeitung gemäß Anbieter-AGB
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>5. Ihre Rechte</h2>
        <p style={{ lineHeight: 1.7, color: 'var(--text-secondary)' }}>
          Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung,
          Datenübertragbarkeit und Widerspruch. Wenden Sie sich an:{' '}
          <a href="mailto:legal@tropen.de" style={{ color: 'var(--accent)' }}>legal@tropen.de</a>.
          Beschwerden richten Sie an Ihre zuständige Datenschutzaufsichtsbehörde.
        </p>
      </section>

      <section>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>6. KI-Verarbeitung (Art. 50 EU AI Act)</h2>
        <p style={{ lineHeight: 1.7, color: 'var(--text-secondary)' }}>
          Toro ist ein KI-gestützter Assistent. Eingaben werden zur Verarbeitung an das KI-Modell übertragen.
          Bitte geben Sie keine besonders sensiblen personenbezogenen Daten in den Chat ein.
        </p>
      </section>
    </main>
  )
}
