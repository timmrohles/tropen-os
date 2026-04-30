import type { CommitteeReviewConfig } from '../committee-review'

export const config: CommitteeReviewConfig = {
  name: 'bp-audit-coverage-1',
  contextFiles: [
    'docs/checker-design-patterns.md',
    'src/lib/audit/checkers/repo-map-checker.ts',
    'src/lib/audit/checkers/ast-quality-checker.ts',
    'src/lib/audit/checkers/file-system-checker.ts',
  ],
  contextTransforms: {
    'src/lib/audit/checkers/repo-map-checker.ts': (content) =>
      content.split('\n').slice(0, 120).join('\n') + '\n... (gekürzt)',
    'src/lib/audit/checkers/ast-quality-checker.ts': (content) =>
      content.split('\n').slice(0, 120).join('\n') + '\n... (gekürzt)',
    'src/lib/audit/checkers/file-system-checker.ts': (content) =>
      content.split('\n').slice(0, 80).join('\n') + '\n... (gekürzt)',
  },

  systemPrompt: `Du bist ein Senior Software-Architect der Audit-Checker-Systeme für produktionsreife TypeScript/Next.js-Projekte bewertet.
Du kennst die Fallstricke von statischer Analyse: False Positives, Performance, Wartbarkeit.
Dein Urteil ist konkret und direkt — du nennst Risiken ohne Umschweife und schlägst präzise Alternativen vor.
Kontext: Ein Self-Hosted Audit-Tool (Tropen OS) erweitert seine eigene Regel-Engine um drei neue Checker, die aus echten CI-Fehlern entstanden sind.`,

  userPrompt: `## Hintergrund

Am 2026-04-30 gab es einen Vercel-Deploy mit mehreren CI-Fehlern die durch manuelles Debugging behoben wurden.
Drei dieser Fehler hätte der eigene Audit-Checker finden können — hat er aber nicht.
Jetzt sollen drei neue Checker gebaut werden.

---

## Checker 1 — Import-Casing-Mismatch

**Real-World-Bug:** \`import X from './Shared'\` während Datei \`shared.tsx\` heißt.
Auf macOS (case-insensitive FS) unsichtbar. Auf Linux/Vercel bricht der Build.

**Geplante Detection:**
- Alle TypeScript-Import-Statements per Regex aus Quell-Dateien extrahieren
- Relative Imports (\`./Shared\`, \`../components/Foo\`) gegen tatsächliche Dateinamen aus dem RepoMap-Index prüfen
- Casing-Unterschied zwischen Import-Pfad und tatsächlichem Dateinamen → Finding
- Geplante Heimat: Erweiterung von \`repo-map-checker.ts\`

**Beantworte für diesen Checker:**

1. **Heuristik valide?** Ist Regex-über-Import-Statements + RepoMap-Vergleich der richtige Ansatz? Oder gibt es einen besseren Weg (z.B. TypeScript Compiler API, \`tsc --listFiles\`)?

2. **False-Positive-Risiken?** Welche Import-Patterns könnten fälschlicherweise triggern? (z.B. Node-Builtins, \`node_modules\`, dynamische Imports, Barrel-Exports, \`@/\`-Aliases, Re-Exports)

3. **Heimat + Domain:** Passt \`repo-map-checker.ts\` als Heimat? Oder besser eigene Datei / anderer bestehender Checker? Domain \`code-quality\`, Severity \`critical\` — korrekt?

---

## Checker 2 — Modul-Level \`process.env\` in Hooks/Components

**Real-World-Bug:**
\`\`\`typescript
// In src/hooks/useDeepFix.ts — schlägt zu bei Modul-Import
const FIX_ENGINE_ENABLED = process.env.NEXT_PUBLIC_FIX_ENGINE_ENABLED === 'true'
\`\`\`
Wird einmal beim Import evaluiert. \`vi.stubEnv()\` greift danach nicht mehr.

**Geplante Detection:**
- AST-Check: \`VariableDeclaration\` auf Modul-Ebene (nicht innerhalb von Function/Hook/Class)
- Initializer enthält \`MemberExpression\` auf \`process.env\`
- Nur in Dateien unter \`src/hooks/\` und \`src/components/\`
- Geplante Heimat: Erweiterung von \`ast-quality-checker.ts\`

**Beantworte für diesen Checker:**

1. **Heuristik valide?** Ist AST-Check auf Modul-Level-\`process.env\` der richtige Ansatz? Gibt es Muster die das Problem haben aber nicht getriggert würden (z.B. \`export const X = ...\`, re-exported configs)?

2. **False-Positive-Risiken?** Was sind legitime Fälle für Modul-Level-Env in Hooks/Components? (z.B. Feature-Flags die sich nie ändern, SSR-Env-Checks, \`NODE_ENV\`-Checks) Wie soll die Allowlist aussehen?

3. **Heimat + Domain:** \`ast-quality-checker.ts\` als Heimat — passt das zur aktuellen Struktur? Domain \`code-quality\`, Severity \`high\` (nicht \`critical\`, weil kein Build-Bruch) — korrekt?

---

## Checker 3 — Stale E2E CSS-Klassen

**Real-World-Bug:** \`page.locator('.ptoro-textarea')\` in E2E-Tests, aber \`.ptoro-textarea\`
existiert nirgends mehr in \`src/\`. Komponente wurde beim Redesign entfernt, Test nicht aktualisiert.

**Geplante Detection:**
- CSS-Selektoren in \`e2e/*.spec.ts\` per Regex extrahieren (\`page.locator('.X')\`, \`page.locator('[class~="X"]')\`, etc.)
- Vergleich gegen: (a) \`globals.css\` Klassennamen, (b) alle \`className=\` Vorkommen in \`src/**/*.tsx\`
- Klassen in E2E die nirgends in \`src/\` vorkommen → Finding
- Geplante Heimat: neue Datei \`e2e-checker.ts\`

**Beantworte für diesen Checker:**

1. **Heuristik valide?** Ist className-String-Matching der richtige Ansatz? Risiko: dynamische Klassen (\`\`className={\`btn-\${variant}\`}\`\`), Tailwind, CSS-Modules. Wie damit umgehen?

2. **False-Positive-Risiken?** Welche Selektoren in E2E-Tests würden fälschlich triggern? (Tailwind-Utility-Klassen, \`aria-*\`-Selektoren, \`data-testid\`, Browser-eigene Klassen, \`body\`/\`html\`)

3. **Heimat + Domain:** Neue Datei \`e2e-checker.ts\` oder in einen bestehenden Checker integrieren? Domain \`code-quality\` (Sub: Test-Hygiene), Severity \`medium\` — korrekt?

---

## Übergreifende Frage

Gibt es einen der drei Checker den ihr **nicht empfehlt zu bauen** (zu hohes FP-Risiko, zu wartungsaufwändig, zu geringer Mehrwert)? Wenn ja, welchen — und warum?`,

  judgePrompt: `Destilliere die 4 Expertenmeinungen zu den drei geplanten Audit-Checkern.

Struktur deiner Zusammenfassung:

## Checker 1 — Import-Casing-Mismatch
- Heuristik: [EINIG | MEHRHEIT | GESPALTEN] — Konsens-Empfehlung
- False-Positives: Top-3-Risiken + empfohlene Gegenmaßnahmen
- Heimat/Domain: Empfehlung + Begründung
- Umsetzungs-Warnung: [falls vorhanden]

## Checker 2 — Modul-Level process.env
- Heuristik: [EINIG | MEHRHEIT | GESPALTEN] — Konsens-Empfehlung
- False-Positives: Top-3-Risiken + Allowlist-Empfehlung
- Heimat/Domain: Empfehlung + Begründung
- Umsetzungs-Warnung: [falls vorhanden]

## Checker 3 — Stale E2E CSS-Klassen
- Heuristik: [EINIG | MEHRHEIT | GESPALTEN] — Konsens-Empfehlung
- False-Positives: Top-3-Risiken + Scope-Empfehlung
- Heimat/Domain: Empfehlung + Begründung
- Umsetzungs-Warnung: [falls vorhanden]

## Übergreifend
- Empfehlung: Alle drei bauen / einen weglassen? [mit Begründung]
- Priorität: In welcher Reihenfolge implementieren?
- Kritischste Warnung aus allen 4 Reviews

Halte es knapp und handlungsorientiert. Jeder Abschnitt max. 5 Zeilen.`,
}
