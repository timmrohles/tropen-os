import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Datenschutz — Tropen OS',
}

// Static date to avoid server/client hydration mismatch
const STAND = 'April 2026'

export default function DatenschutzPage() {
  return (
    <main className="content-narrow legal-page">
      <h1>Datenschutzerklärung</h1>
      <p>Stand: {STAND}</p>

      <section>
        <h2>1. Verantwortlicher</h2>
        <p>
          {/* TODO(timm): Vollständige Anschrift + ggf. DSB eintragen */}
          Tropen Research UG (haftungsbeschränkt)<br />
          [Straße und Hausnummer], [PLZ] [Ort], Deutschland<br />
          E-Mail: <a href="mailto:legal@tropen.de">legal@tropen.de</a>
        </p>
      </section>

      <section>
        <h2>2. Verarbeitete Daten und Zwecke</h2>
        <p>
          Wir verarbeiten folgende personenbezogene Daten:
        </p>
        <ul>
          <li><strong>Accountdaten</strong> (E-Mail-Adresse) — zur Bereitstellung des Diensts und Authentifizierung</li>
          <li><strong>Chat-Inhalte</strong> — zur Bereitstellung des KI-Assistenten; Inhalte werden zur Verarbeitung an den KI-Anbieter übertragen</li>
          <li><strong>Nutzungs- und Verbindungsdaten</strong> (IP-Adresse, Zeitstempel, Browsertyp) — Betrieb und Sicherheit, keine PII in Logs</li>
          <li><strong>Audit-Daten</strong> (hochgeladene Code-Dateien für externe Scans) — ausschließlich zur Durchführung des angeforderten Audits; keine dauerhafte Speicherung roher Dateien</li>
        </ul>
      </section>

      <section>
        <h2>3. Rechtsgrundlagen (DSGVO)</h2>
        <ul>
          <li>Art. 6 Abs. 1 lit. b DSGVO — Vertragserfüllung (Bereitstellung des Diensts)</li>
          <li>Art. 6 Abs. 1 lit. f DSGVO — berechtigte Interessen (Sicherheit, Missbrauchsprävention)</li>
          <li>Art. 6 Abs. 1 lit. a DSGVO — Einwilligung, soweit gesondert eingeholt</li>
        </ul>
      </section>

      <section>
        <h2>4. Auftragsverarbeiter (Subprozessoren)</h2>
        <ul>
          <li><strong>Supabase</strong> — Datenbank und Authentifizierung; Server in der EU (Frankfurt)</li>
          <li><strong>Vercel</strong> — Hosting und CDN; Auftragsverarbeitungsvertrag (AVV) geschlossen</li>
          <li><strong>Anthropic</strong> — KI-Verarbeitung (Large Language Models); Daten werden gemäß Anthropic-Datenschutzrichtlinie verarbeitet</li>
          <li><strong>OpenAI</strong> — Text-to-Speech (TTS); Daten werden gemäß OpenAI-Datenschutzrichtlinie verarbeitet</li>
        </ul>
        <p>
          Mit allen Auftragsverarbeitern bestehen oder werden Auftragsverarbeitungsverträge gemäß Art. 28 DSGVO geschlossen.
          Für Drittlandübertragungen (USA) gelten EU-Standardvertragsklauseln (SCCs).
        </p>
      </section>

      <section>
        <h2>5. Speicherdauer</h2>
        <p>
          Accountdaten werden bis zur Kontolöschung gespeichert. Chat-Inhalte werden auf Anfrage gelöscht.
          Verbindungsdaten werden nach 90 Tagen gelöscht. Nach Kündigung werden alle personenbezogenen
          Daten innerhalb von 30 Tagen gelöscht, soweit keine gesetzlichen Aufbewahrungsfristen entgegenstehen.
        </p>
      </section>

      <section>
        <h2>6. Ihre Rechte (Art. 15–22 DSGVO)</h2>
        <p>
          Sie haben das Recht auf:
        </p>
        <ul>
          <li>Auskunft über gespeicherte Daten (Art. 15)</li>
          <li>Berichtigung unrichtiger Daten (Art. 16)</li>
          <li>Löschung (&bdquo;Recht auf Vergessenwerden&ldquo;, Art. 17)</li>
          <li>Einschränkung der Verarbeitung (Art. 18)</li>
          <li>Datenübertragbarkeit (Art. 20)</li>
          <li>Widerspruch gegen die Verarbeitung (Art. 21)</li>
        </ul>
        <p>
          Zur Ausübung Ihrer Rechte wenden Sie sich an:{' '}
          <a href="mailto:legal@tropen.de">legal@tropen.de</a>.
          Sie haben außerdem das Recht, Beschwerde bei der zuständigen Datenschutzaufsichtsbehörde einzulegen.
        </p>
      </section>

      <section>
        <h2>7. KI-Verarbeitung (Art. 50 EU AI Act)</h2>
        <p>
          Toro ist ein KI-gestützter Assistent auf Basis von Large Language Models.
          Eingaben werden zur Verarbeitung an den jeweiligen KI-Anbieter übertragen.
          Bitte geben Sie keine besonders sensiblen personenbezogenen Daten (Art. 9 DSGVO)
          in den Chat ein. Die Ergebnisse des KI-Assistenten sind nicht als Rechts-,
          Steuer- oder Fachberatung zu verstehen.
        </p>
      </section>

      <section>
        <h2>8. Cookies und lokaler Speicher</h2>
        <p>
          Wir setzen technisch notwendige Cookies und Session-Tokens für Authentifizierung und
          Sitzungsverwaltung ein. Keine Tracking- oder Werbe-Cookies.
          Nutzereinstellungen werden im localStorage des Browsers gespeichert.
        </p>
      </section>

      <section>
        <h2>9. Änderungen dieser Datenschutzerklärung</h2>
        <p>
          Wir behalten uns vor, diese Datenschutzerklärung bei Bedarf zu aktualisieren.
          Die jeweils aktuelle Version ist unter dieser URL abrufbar. Bei wesentlichen Änderungen
          informieren wir registrierte Nutzer per E-Mail.
        </p>
      </section>
    </main>
  )
}
