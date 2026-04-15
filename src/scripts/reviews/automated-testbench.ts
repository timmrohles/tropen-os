import type { CommitteeReviewConfig } from '../committee-review'

export const config: CommitteeReviewConfig = {
  name: 'automated-testbench',

  contextFiles: [
    'docs/committee-reviews/input-automated-testbench.md',
    'docs/product/roadmap-2026-q2.md',
    'docs/checker-feedback.md',
    'docs/checker-test-repos.md',
  ],

  contextTransforms: {
    'docs/product/roadmap-2026-q2.md': (c) =>
      c.split('\n').slice(0, 100).join('\n') + '\n... (gekuerzt)',
  },

  systemPrompt: `Du bist ein erfahrener Developer Tools Product Strategist mit Expertise in Code-Analyse-Tooling, GitHub API und Go-to-Market-Strategien fuer Developer Tools.

Du beraetst einen Solo-Founder der ein Code-Quality-Tool fuer "Vibe Coders" baut — Entwickler die mit KI-Tools wie Cursor, Claude Code, Lovable Code generieren.

Das Produkt scannt Quellcode mit 188 Regeln und erzeugt Findings mit Fix-Prompts. EU-Compliance ist der Differenziator. Noch keine externen User.

DIE KERNIDEE:
Tausende Lovable/GPT-Engineer-Projekte sind oeffentlich auf GitHub. Automatisiertes Scannen wuerde:
1. Checker-Qualitaet messbar machen (FP-Rate pro Regel)
2. Pattern-Erkennung ermoeglichen (haeufigste Vibe-Coder-Fehler)
3. Content fuer GTM liefern ("94% der Lovable-Apps haben DSGVO-Luecken")
4. Domain Knowledge Moat aufbauen

TECHNISCHE REALITAET:
- Scanner laeuft im Browser (File System API) und als CLI
- generateRepoMapFromFiles() kann in-memory scannen
- GitHub API: 5.000 requests/h, oder git clone
- Solo-Founder mit begrenzter Zeit

Bewerte jede Frage pragmatisch. Keine generischen Empfehlungen. Konkrete Aufwandsschaetzungen in Stunden/Tagen.`,

  userPrompt: `BEWERTE DIESE 7 FRAGEN:

1. TECHNISCHE MACHBARKEIT: Wie scannen wir GitHub-Repos automatisiert?

   A) GitHub API: Repo-Tarball runterladen, lokal entpacken, scannen
   B) GitHub Actions: Workflow bei Schedule, Repos klonen + Scanner CLI
   C) Node.js Script: GitHub API, temporary clone, scan, cleanup
   D) In-memory via GitHub API: Datei-Inhalte ueber API, kein Klonen

   Welcher Ansatz ist fuer einen Solo-Founder am realistischsten?

2. GITHUB API RATE LIMITS

   50 Repos x 100 Dateien = 5.000 Calls = 1 Stunde.
   500 Repos = 10 Stunden.

   Ist git clone besser als API-per-file?
   Gibt es clevere Optimierungen (Tarball, sparse checkout)?

3. WELCHE REPOS AUSWAEHLEN?

   Filter-Optionen:
   A) Mindest-Dateigroesse (>10 TS-Dateien)
   B) package.json mit Next.js oder React
   C) Supabase in Dependencies
   D) Letzter Commit < 6 Monate
   E) Nicht archiviert

4. ERGEBNISSE SPEICHERN UND AUSWERTEN

   A) Bestehende Supabase DB (audit_runs)
   B) Separate Tabelle fuer Benchmark-Scans
   C) JSON-Dateien im Repo
   D) Separate Analytics-DB

   Was auswerten: FP-Rate/Regel, haeufigste Findings, Score-Verteilung, Stack-Korrelation?

5. TIMING: Wann bauen?

   A) Jetzt — Fundament fuer Checker-Qualitaet + Content
   B) Nach UI-Fixes
   C) Nach 10 Beta-Usern
   D) Als Teil der Landing Page

6. CONTENT-STRATEGIE: Wie Ergebnisse veroeffentlichen?

   - Nur aggregiert ("94% haben Problem X")?
   - Einzelne Repos namentlich (mit Score)?
   - Anonymisiert?
   - Ethik: Oeffentliche Repos scannen — akzeptabel?

7. AUFWAND REALISTISCH

   - MVP (10 Repos): ? Stunden
   - Produktionsreif (50+ Repos, DB, Reports): ? Tage
   - Vollautomatisiert (Cron, Discovery, Trends): ? Wochen

   Was ist der MVP der den groessten Wert liefert?

---

ZUSAETZLICH — ARCHITEKTUR-SKIZZE:

Skizziere den technischen Aufbau des MVP:
- Welches Script, welche Eingabe, welche Ausgabe?
- Wo laeuft es (lokal, GitHub Actions, Vercel Cron)?
- Wie werden Ergebnisse gespeichert?
- Wie wird die FP-Rate berechnet?`,

  judgePrompt: `4 Modelle haben unabhaengig die Strategie fuer eine automatisierte Checker-Testbench bewertet — 7 Fragen plus Architektur.

Kern: Tausende Vibe-Coder-Projekte auf GitHub automatisiert scannen um (1) Checker-Qualitaet zu messen, (2) Patterns zu erkennen, (3) GTM-Content zu generieren.

Destilliere den Konsens:

Fuer jede der 7 Fragen:
1. Konsens-Level (EINIG | MEHRHEIT | GESPALTEN)
2. Empfohlene Option
3. Konkreter naechster Schritt

KERNENTSCHEIDUNG:
- Welcher technische Ansatz gewinnt?
- Wie viele Repos im MVP?
- Wann starten?
- Welche ethischen Grenzen beachten?

ARCHITEKTUR:
- Bester Architektur-Vorschlag (konkretes Script-Design)
- Input → Processing → Output Diagramm
- Geschaetzter Aufwand fuer MVP

WARNUNGEN:
- Over-Engineering-Risiko?
- Ethische Fallstricke?
- Rate-Limit-Probleme?

PRIORISIERTE TODO-LISTE:
Max. 5 konkrete Schritte, sortiert nach Impact/Aufwand.`,
}
