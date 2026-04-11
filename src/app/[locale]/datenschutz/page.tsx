import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Datenschutz — Tropen OS',
}

export default function DatenschutzPage() {
  return (
    <main className="content-narrow legal-page">
      <h1>Datenschutzerklärung</h1>
      <p>Stand: {new Date().toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}</p>

      <section>
        <h2>1. Verantwortlicher</h2>
        <p>
          {/* TODO: Betreiber-Daten + Datenschutzbeauftragter eintragen */}
          Tropen OS · [Anschrift] · <a href="mailto:legal@tropen.de">legal@tropen.de</a>
        </p>
      </section>

      <section>
        <h2>2. Verarbeitete Daten</h2>
        <p>
          Wir verarbeiten folgende personenbezogene Daten:<br />
          — Registrierungsdaten (E-Mail-Adresse, Name)<br />
          — Chat-Inhalte (zur Bereitstellung des KI-Assistenten)<br />
          — Nutzungsdaten (Verbindungsdaten, Logs ohne PII)<br />
          — Zahlungsdaten (verarbeitet durch unseren Zahlungsanbieter)
        </p>
      </section>

      <section>
        <h2>3. Rechtsgrundlagen (DSGVO)</h2>
        <p>
          Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO), berechtigte Interessen (Art. 6 Abs. 1 lit. f DSGVO),
          Einwilligung (Art. 6 Abs. 1 lit. a DSGVO) wo angegeben.
        </p>
      </section>

      <section>
        <h2>4. Subprozessoren</h2>
        <p>
          — <strong>Supabase</strong> (Datenbank, Authentifizierung) — EU-Hosting<br />
          — <strong>Vercel</strong> (Hosting) — AVV abgeschlossen<br />
          — <strong>Dify / OpenAI</strong> (KI-Verarbeitung) — Datenverarbeitung gemäß Anbieter-AGB
        </p>
      </section>

      <section>
        <h2>5. Ihre Rechte</h2>
        <p>
          Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung,
          Datenübertragbarkeit und Widerspruch. Wenden Sie sich an:{' '}
          <a href="mailto:legal@tropen.de">legal@tropen.de</a>.
          Beschwerden richten Sie an Ihre zuständige Datenschutzaufsichtsbehörde.
        </p>
      </section>

      <section>
        <h2>6. KI-Verarbeitung (Art. 50 EU AI Act)</h2>
        <p>
          Toro ist ein KI-gestützter Assistent. Eingaben werden zur Verarbeitung an das KI-Modell übertragen.
          Bitte geben Sie keine besonders sensiblen personenbezogenen Daten in den Chat ein.
        </p>
      </section>
    </main>
  )
}
