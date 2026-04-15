import type { CommitteeReviewConfig } from '../committee-review'

export const config: CommitteeReviewConfig = {
  name: 'db-access-strategy',

  contextFiles: [
    'docs/committee-reviews/input-db-access-strategy.md',
    'docs/webapp-manifest/manifesto.md',
  ],

  contextTransforms: {
    'docs/webapp-manifest/manifesto.md': (c) => c.split('\n').slice(0, 80).join('\n'),
  },

  systemPrompt: `Du bist ein erfahrener Product Architect und Developer Tools Stratege. Du bewertest die Datenbankzugriffs-Strategie einer Code-Quality-Plattform für Vibe-Coders (Entwickler die mit KI-Tools wie Cursor, Claude Code, Lovable Code generieren).

Die Plattform heißt Tropen OS und positioniert sich als "Production Readiness Guide" — sie findet Probleme im Code, erklärt sie, und hilft dem User sie zu beheben. Sie schreibt keinen Code in externe Projekte.

AKTUELLER STAND:
- Scannt nur Code: TypeScript, SQL-Migrations, Schema-Definitionen, Config-Files
- 25 Kategorien mit gewichtetem Scoring (0-100%)
- Positionierung: "Advisor not Mechanic" — generiert Fix-Prompts, kein Auto-Fix
- Solo-Founder-Produkt in früher Beta-Phase
- Zielgruppe: Vibe-Coders, nicht Senior DBAs

KERNPROBLEM:
Vibe-Coders arbeiten oft über Provider-Dashboards statt Migrations-Dateien. RLS-Policies, Indexes, Permissions können manuell gesetzt/gelöscht werden — kein Code-Trace. Security und Compliance (wichtigste Differenzierer) haben damit einen systematischen blinden Fleck.

Bewerte strategisch und konkret. Keine generischen Empfehlungen — konkrete Architektur-Vorschläge, realistische Aufwandseinschätzungen für einen Solo-Founder.`,

  userPrompt: `BEWERTE DIESE 6 FRAGEN:

1. BRAUCHEN WIR DB-ZUGRIFF FÜR EIN GLAUBWÜRDIGES PRODUKT?

   Fragen:
   - Können wir "Production Readiness" versprechen ohne Live-DB gesehen zu haben?
   - Reicht Code-Analyse + ehrliche Kommunikation der Grenzen für die ersten 10 Beta-User?
   - Wie positionieren sich vergleichbare Tools (Snyk, SonarQube, Semgrep)? Haben sie DB-Zugriff?
   - Was ist der konkrete Schaden wenn wir RLS-Fehler NICHT erkennen, aber der Score sagt "Stable"?
   - Wann wird der blinde Fleck vom Feature-Gap zum Vertrauensproblem?

2. WELCHER ZUGRIFFS-LEVEL IST RICHTIG?

   Optionen:
   A) Code-only + "Schema-Drift"-Finding (kein DB-Zugriff)
   B) Schema-Metadaten (information_schema, pg_policies, pg_indexes — read-only)
   C) Management API der Provider (Supabase API, Neon API)
   D) Connection String mit Read-Only-User
   E) Hybrid (Code-Scan Standard, DB-Check optionaler Deep Scan)

   Fragen:
   - Welche Option empfiehlst du für MVP? Für Wachstum?
   - Was ist der minimale Zugriff der maximalen Mehrwert bringt?
   - Wie hoch ist die Vertrauenshürde bei jeder Option auf einer Skala 1-10?
   - Welche Option ist am ehesten DSGVO-konform ohne externe Zertifizierung?

3. PROVIDER-AGNOSTIK: REALISTISCH ODER ILLUSION?

   Vermutete Marktaufteilung Vibe-Coders:
   - Supabase (Postgres): ~40%
   - Neon (Postgres): ~20%
   - Firebase/Firestore: ~15%
   - PlanetScale/MySQL: ~10%
   - MongoDB Atlas: ~10%
   - Turso/SQLite: ~5%

   Fragen:
   - Ist diese Einschätzung realistisch? Welche Provider fehlen?
   - Postgres-first (Supabase + Neon = 60%) — ist das die richtige Priorisierung?
   - Kann man eine Abstraktionsschicht bauen die für Postgres + Firestore + MongoDB funktioniert?
   - Oder ist Postgres-only der pragmatische Start und später erweiterbar?

4. SECURITY UND VERTRAUEN

   Fragen:
   - Was braucht ein Vibe-Coder um uns DB-Zugriff zu geben? (SOC2? Open Source? Lokale Analyse?)
   - Ist ein Read-Only-User in Supabase einfach genug für einen Vibe-Coder zu erstellen?
   - Welche Vertrauenssignale sind am wichtigsten für Early Adopters?
   - Wie kommuniziert man "wir sehen keine Daten, nur Schema" überzeugend?
   - Ist lokale Analyse (CLI-Tool, kein Cloud-Upload) eine realistische Option?

5. TIMING: JETZT ODER NACH PMF?

   Fragen:
   - Ist DB-Zugriff ein MVP-Feature oder ein Post-PMF-Feature?
   - Können wir ohne DB-Zugriff die ersten 10 Beta-User gewinnen?
   - Welcher Score-Gap entsteht durch den blinden Fleck? (Schätze: wie viel % des Scores ist DB-abhängig)
   - Gibt es einen "falschen Sicherheitscheck"-Effekt? (User denkt er ist sicher, ist es aber nicht)
   - Ab wann wird der blinde Fleck zum aktiven Vertrauensproblem (kein nur Limitation)?

6. IMPACT AUF AUDIT-SCORE

   Aktuell: Datenbank-Kategorie (Gewicht 2) bewertet Migrations-Dateien, Schema-Definitionen, RLS-Patterns im Code.

   Fragen:
   - Welche konkreten Prüfungen werden mit DB-Zugriff möglich?
   - Wie verändert sich die Aussagekraft des Gesamt-Scores?
   - Welche Security-Findings sind nur mit Live-DB erkennbar?
   - Schätze: wie viel % der echten DB-Probleme sehen wir mit Code-only?
   - Sollte der Score bei fehlendem DB-Zugriff einen expliziten Hinweis tragen?

---

ZUSÄTZLICH — KONKRETE EMPFEHLUNG:

Formuliere eine klare Empfehlung:
- MVP-Strategie: was genau jetzt bauen (oder explizit nicht bauen)?
- Wie den blinden Fleck kommunizieren ohne den Score zu entwerten?
- Welcher Provider als erster für DB-Check? (Konkret: Supabase Management API vs. direkte Postgres-Verbindung)
- Minimale technische Architektur für den ersten DB-Check (Pseudocode/Interface ok)
- Roadmap: wann macht DB-Zugriff Sinn (Nutzerzahl? Revenue? Spezifisches Feedback)?`,

  judgePrompt: `4 Modelle haben unabhängig die Datenbankzugriffs-Strategie einer Code-Quality-Plattform für Vibe-Coders bewertet — 6 Fragen plus konkrete Empfehlung.

Das Produkt positioniert sich als "Advisor not Mechanic" für Production Readiness. Kernproblem: Vibe-Coders konfigurieren DBs über Dashboards, nicht Code. RLS-Fehler und Sicherheitslücken sind im Code-Scan unsichtbar.

Destilliere den Konsens:

Für jede der 6 Fragen:
1. Konsens-Level (EINIG | MEHRHEIT | GESPALTEN)
2. Top-Empfehlung (ein Satz)
3. Konkreter nächster Schritt

KERNENTSCHEIDUNG:
- Brauchen wir DB-Zugriff für MVP? Ja/Nein/Bedingt — mit Begründung
- Welche Option (A/B/C/D/E) gewinnt für MVP?
- Welche Option für Wachstum?

PROVIDER-STRATEGIE:
- Postgres-first oder provider-agnostisch?
- Welcher erste Provider? Wie implementieren?

VERTRAUEN:
- Was ist der minimale Vertrauens-Aufbau für Early Adopters?
- Wie kommuniziert man die Grenzen des Code-only-Scans?

WARNUNGEN:
- Gibt es einen "falschen Sicherheitscheck"-Effekt der das Produkt aktiv schadet?
- Was ist das größte Risiko wenn wir DB-Zugriff zu früh bauen?
- Was ist das größte Risiko wenn wir ihn zu spät bauen?

SCORE-EMPFEHLUNG:
- Sollte der Audit-Score den DB-Zugriff-Status kommunizieren?
- Formuliere konkret wie das UI das kommunizieren soll.`,
}
