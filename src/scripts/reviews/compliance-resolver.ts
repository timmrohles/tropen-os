import type { CommitteeReviewConfig } from '../committee-review'

export const config: CommitteeReviewConfig = {
  name: 'compliance-resolver',

  contextFiles: [
    'docs/checker-feedback.md',
    'docs/product/marken-brief.md',
    'CLAUDE.md',
  ],

  contextTransforms: {
    'docs/checker-feedback.md': (c) => {
      // Nur die Compliance-Diagnose-Sektion (erster relevanter Block)
      const lines = c.split('\n')
      const start = lines.findIndex(l => l.includes('Diagnose: Compliance-Antworten-Konsumption'))
      const end = lines.findIndex((l, i) => i > start + 5 && l.startsWith('## '))
      return lines.slice(start, end > 0 ? end : start + 120).join('\n') + '\n... (Sektion Compliance-Diagnose, Stand 2026-05-06)'
    },
    'docs/product/marken-brief.md': (c) => {
      // Nur Section 28.1 — Begrenzungs-Aussagen
      const lines = c.split('\n')
      const start = lines.findIndex(l => l.includes('28.1 Begrenzungs-Aussagen'))
      const end = lines.findIndex((l, i) => i > start + 5 && l.startsWith('### 28.'))
      return lines.slice(start, end > 0 ? end : start + 50).join('\n') + '\n... (Section 28.1 only)'
    },
    'CLAUDE.md': (c) => {
      // Nur die Compliance-Inputs-Sektion
      const lines = c.split('\n')
      const start = lines.findIndex(l => l.includes('Compliance-Inputs'))
      const end = lines.findIndex((l, i) => i > start + 3 && l.startsWith('---'))
      const relevant = lines.slice(start, end > 0 ? end : start + 40).join('\n')
      return `=== Compliance-Resolver Design (aus CLAUDE.md) ===\n${relevant}\n... (Compliance-Sektion, gekürzt)`
    },
  },

  systemPrompt: `Du bist ein Spezialist für DSGVO-Compliance-Architektur und Software-Engineering. Du hilfst dabei, eine rechtlich saubere aber technisch umsetzbare Compliance-Resolver-Logik zu spezifizieren.

PRODUKT-KONTEXT:
Tropen OS ist ein Production-Readiness-Tool für Vibe-Coders (Coach-Position nach Marken-Brief). Das Tool positioniert sich explizit NICHT als Rechtsberatung — Coach sagt was er weiß und was NICHT. Die Coach-Stimme ist "Senior-Engineer im PR-Review": direkt, kompetent, Begrenzungen transparent.

AUFGABE:
Spezifiziere Architektur und Verhalten eines compliance-resolver.ts Moduls. Nicht implementieren — spezifizieren.

WICHTIG:
- Keine generischen Compliance-Aussagen — konkrete Entscheidungen für die 9 Fragen
- Juristische Absicherung bedeutet: welche WORDINGS schützen das Tool, nicht welche Anwälte beauftragen
- TypeScript-Skizzen ja — vollständige Implementierung nein
- Coach-Wording muss Marken-Brief Section 28.1 entsprechen: Begrenzungs-Aussage explizit`,

  userPrompt: `## Aufgabe: Compliance-Resolver-Logik spezifizieren

### Kontext

Tropen OS sammelt 9 Compliance-Antworten (DSGVO + KI-Act) via ComplianceBlock.tsx:
- Antworten werden in DB gespeichert (project_compliance_data Tabelle)
- Antworten werden angezeigt und gezählt — ABER von keinem Detektor konsumiert
- Das ist ein Marken-Bruch: Coach der Antworten entgegennimmt aber ignoriert ist kein Coach

Geplant ist compliance-resolver.ts mit 4 Status-Typen:
- \`fulfilled\` — Anforderung ist erfüllt (Code-Check oder User-Antwort)
- \`open\` — Anforderung ist offen, User hat bestätigt dass Problem besteht
- \`input-needed\` — wir haben keine Antwort, können nicht prüfen
- \`not-applicable\` — für dieses Projekt nicht relevant

### Die 9 Fragen (questionKeys aus ComplianceBlock.tsx)

DSGVO:
- \`has_avv_supabase\`: Hat der User einen Auftragsverarbeitungs-Vertrag (AVV) mit Supabase?
- \`has_avv_vercel\`: Hat der User einen AVV mit Vercel?
- \`has_privacy_policy\`: Existiert eine aktuelle Datenschutzerklärung?
- \`data_location\`: Wo werden Daten gespeichert? (EU/EWR | USA mit SCC | USA ohne SCC | Andere | Weiß ich nicht)
- \`has_deletion_process\`: Können Nutzer ihren Account vollständig löschen?

KI-Act:
- \`ki_risk_class\`: Risikoklasse der KI (Minimal | Begrenzt | Hoch | Unakzeptabel | Noch nicht bestimmt)
- \`ki_transparency_label\`: Werden KI-generierte Inhalte für Nutzer erkennbar gemacht?
- \`ki_logging_enabled\`: Werden KI-Entscheidungen geloggt?
- \`ki_purpose_documented\`: Ist der KI-Zweck schriftlich dokumentiert?

### Strawman (als Anker, bitte kritisch prüfen und verbessern)

| questionKey | Code-Prüfbarkeit | Ansatz |
|---|---|---|
| has_avv_supabase | Nein — Vertrag ist externes Dokument | User-Only |
| has_avv_vercel | Nein — Vertrag ist externes Dokument | User-Only |
| has_privacy_policy | Hybrid — Code prüft ob /datenschutz Route existiert; User bestätigt Aktualität | Hybrid |
| data_location | Begrenzt — vercel.json Region-Config prüfbar; Supabase-Region nicht aus Code | Semi-Hybrid |
| has_deletion_process | Hybrid — Code prüft Account-Delete-UI und /api/auth/delete Route | Hybrid |
| ki_risk_class | Nein — juristische Einschätzung, kein Code-Signal | User-Only |
| ki_transparency_label | Hybrid — Code prüft ob KI-Label-Patterns in Komponenten vorhanden | Hybrid |
| ki_logging_enabled | Begrenzt — Code prüft ob Logging-Patterns in Edge Functions vorhanden | Semi-Hybrid |
| ki_purpose_documented | Nein — Dokument außerhalb Code | User-Only |

### AUFGABE — Beantworte für JEDE der 9 Fragen:

**1. Code-Prüfbarkeit**
- Was kann Tropen OS aus dem Code-Bestand tatsächlich prüfen?
- Welche Dateipfade / Patterns wären aussagekräftig?
- Wie hoch ist das False-Positive-Risiko dieser Code-Checks?

**2. Konflikt-Auflösung**
- Wenn Code-Check und User-Antwort widersprechen — wer gewinnt?
- Beispiel: Code findet /datenschutz Route NICHT, aber User hat \`has_privacy_policy: true\` angegeben
- Beispiel: Code findet delete-Endpoint, aber User sagt \`has_deletion_process: false\`
- Gibt es Fälle wo User-Antwort immer gewinnen muss (weil Coach kein Anwalt ist)?

**3. Status-Mapping**
- Wann ist welcher Status aktiv? (fulfilled | open | input-needed | not-applicable)
- Beispiel-Tabelle: Antwort X + Code-Check Y = Status Z

**4. Juristische Implikation**
- Welche GENAUEN Formulierungen schützen Tropen OS?
- Was darf das Tool NICHT sagen? (z.B. "Du bist DSGVO-konform")
- Was sind akzeptable Formulierungen? (z.B. "Kein Code-Signal für fehlende Datenschutzseite")

**5. Coach-Wording**
- Was sagt das Tool dem User je Status?
- Muss Marken-Brief 28.1 entsprechen: Begrenzungs-Aussage explizit, keine Rechtsberatung
- Max 2 Sätze je Status

---

### Juristische Kernfrage (explizit stellen und beantworten)

Wenn Tropen OS \`fulfilled\` markiert basierend auf User-Antwort \`has_avv_supabase: true\`:
- Tropen OS hat den AVV NICHT geprüft — es vertraut der User-Aussage
- Wenn die User-Antwort falsch war (kein AVV vorhanden), welche Haftung entsteht für Tropen OS?
- Welche Disclaimer-Formulierungen verhindern dass das Tool als "Compliance-Zertifikat" gewertet wird?
- Ist ein \`fulfilled\`-Status ohne Code-Verifikation überhaupt rechtlich vertretbar?

---

### Übergreifende Architektur-Frage

**Dreischichten-Konsistenz:**
Der CLAUDE.md-Entwurf sieht vor:
1. Code-Existenz-Check (automatisch)
2. Stamm-Daten aus Settings
3. Detail-Antworten aus Tab-Inputs

Ist diese Reihenfolge korrekt? Oder sollte User-Antwort IMMER die höchste Priorität haben (weil nur der User die rechtliche Situation kennt)?

**Finding-Schwelle:**
Ab welchem Status wird ein Finding generiert? (fulfilled = kein Finding, alle anderen = Finding?)
Oder: sollte \`input-needed\` immer ein Medium-Finding erzeugen, \`open\` immer ein High-Finding?

---

### Format-Anforderung

Pro Frage EINE Markdown-Sektion mit:
\`\`\`
#### [questionKey]

**Code-Prüfbarkeit:** [Konkrete Antwort]
**FP-Risiko:** [Niedrig / Mittel / Hoch + Begründung]
**Konflikt-Auflösung:** [User gewinnt | Code gewinnt | Context-abhängig — warum]
**Status-Mapping:**
- fulfilled: [wann]
- open: [wann]
- input-needed: [wann]
- not-applicable: [wann — oder: nicht anwendbar für diese Frage]
**Coach-Wording (fulfilled):** "..."
**Coach-Wording (open):** "..."
**Coach-Wording (input-needed):** "..."
\`\`\`

Plus am Ende:
1. **Juristische Risiko-Bewertung der Architektur** (Gesamtbewertung)
2. **TypeScript Interface-Skizze** für ComplianceResolverResult und ComplianceResolverInput
3. **Empfehlung zu Finding-Schwellen** (welcher Status erzeugt welches Finding mit welcher Severity)`,

  judgePrompt: `4 Modelle haben unabhängig die Dreischichten-Compliance-Resolver-Logik für Tropen OS spezifiziert.

Tropen OS ist ein Production-Readiness-Tool für Vibe-Coders. Es positioniert sich als Coach, NICHT als Rechtsberatung. Das Tool hat 9 Compliance-Fragen (5 DSGVO, 4 KI-Act) die bisher gespeichert aber nicht konsumiert werden — ein Marken-Bruch der behoben werden soll.

**Deine Aufgabe als Judge:**

## 1. Konsens-Synthese pro questionKey

Für jede der 9 Fragen: Was ist der Konsens zu:
- Code-Prüfbarkeit (ja/nein/hybrid — Mehrheitsentscheidung)
- Konflikt-Auflösung (User-Vorrang vs. Code-Vorrang — Mehrheitsentscheidung)
- Status-Mapping (wann welcher Status — Konsens oder Spaltung)

**Entscheide bei Uneinigkeit explizit** — kein "die Meinungen gehen auseinander". Wähle die bessere Option und begründe kurz.

## 2. Juristische Risiko-Bewertung

Beantworte diese Frage eindeutig:
- Darf Tropen OS \`fulfilled\` anzeigen wenn nur eine User-Antwort vorliegt (kein Code-Verifikation)?
- Welche Disclaimer-Formulierungen sind zwingend notwendig?
- Was sind die 2-3 kritischsten juristischen Risiken der Architektur?

## 3. TypeScript API-Skizze

Erstelle eine konkrete, ausdiskutierte TypeScript Interface-Skizze:
\`\`\`typescript
// compliance-resolver.ts — Interface-Skizze (Komitee-Konsens)
interface ComplianceResolverInput { ... }
type ComplianceStatus = 'fulfilled' | 'open' | 'input-needed' | 'not-applicable'
interface ComplianceResolverResult { ... }
interface ComplianceResolution { ... }
\`\`\`

## 4. Finding-Schwellen-Entscheidung

Welcher Status erzeugt welches Finding?
- Klare Empfehlung (keine Optionsliste)
- Severity pro Status

## 5. Implementations-Reihenfolge

Welche der 9 Fragen sollten ZUERST implementiert werden (maximaler Impact, minimales juristisches Risiko)?
Top 3 priorisiert mit kurzem Grund.

## 6. Konsens-Punkte vs. Spaltungen

Liste explizit:
- X Konsens-Punkte (alle 4 Modelle einig)
- Y Spaltungen (wie aufgelöst, warum)

**Format:** Strukturiertes Markdown mit ## Überschriften. Entscheide klar — kein diplomatisches Schwammen.`,
}
