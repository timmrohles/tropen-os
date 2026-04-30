# Committee Review: bp-audit-coverage-1

> Generiert am 2026-04-30 · Reviewer: Claude Sonnet, GPT-4o, Gemini 2.5 Pro, Grok 4 · Judge: Claude Opus

---

## Checker 1 — Import-Casing-Mismatch

- **Heuristik:** **GESPALTEN** — TypeScript Compiler API vs. Regex+RepoMap. Konsens: AST-basierter Ansatz (TS API) ist präziser als Regex, aber Regex+Extension-Resolution kann ausreichen.
- **False-Positives:** Top-3: (1) Extension-lose Imports (`./Button` → `Button.tsx`), (2) Barrel-Exports (`./index`), (3) Node-Builtins/`node_modules`. Gegenmaßnahmen: Extension-Resolution-Logik, Ausschluss absoluter Imports.
- **Heimat/Domain:** **GESPALTEN** — `repo-map-checker.ts` vs. `ast-quality-checker.ts`. Mehrheit: AST-Checker, da Import-Analyse AST erfordert. Domain `code-quality`, Severity `high`/`critical`.
- **Umsetzungs-Warnung:** Regex-Ansatz verpasst dynamische Imports und Re-Exports. TypeScript API erhöht Komplexität deutlich.

## Checker 2 — Modul-Level process.env

- **Heuristik:** **EINIG** — AST-Check auf Modul-Level `VariableDeclaration` ist der richtige Weg. Ergänze um Export-Handling (`export const X = process.env.Y`).
- **False-Positives:** Top-3: (1) Build-time Constants (`NODE_ENV`), (2) Feature-Flags (`NEXT_PUBLIC_*_ENABLED`), (3) SSR-Checks. Allowlist: `/NODE_ENV|NEXT_PUBLIC_.*_(ENABLED|URL)/`.
- **Heimat/Domain:** **EINIG** — `ast-quality-checker.ts`. Domain `code-quality`, Severity `high` (Test-Flakiness, kein Build-Bruch).
- **Umsetzungs-Warnung:** Re-exported Configs aus anderen Files werden ohne rekursive Import-Analyse verpasst.

## Checker 3 — Stale E2E CSS-Klassen

- **Heuristik:** **EINIG** — Grundsätzlich machbar, aber fragil. Tailwind/CSS-Modules machen präzise Detection quasi unmöglich.
- **False-Positives:** Top-3: (1) Tailwind-Utility-Klassen, (2) Dynamische Klassen (``btn-${variant}``), (3) Third-Party/Browser-Klassen. Scope: Nur `data-testid` Policy durchsetzen.
- **Heimat/Domain:** **MEHRHEIT** — Neue `e2e-checker.ts` oder in `ast-quality-checker.ts`. Domain `code-quality`, Severity `medium`.
- **Umsetzungs-Warnung:** **EINIG** — Nicht bauen! FP-Risiko zu hoch für modernen CSS-Stack.

## Übergreifend

- **Empfehlung:** Nur Checker 1+2 bauen. Checker 3 verwerfen — stattdessen Linting-Regel "E2E nur mit data-testid".
- **Priorität:** (1) Import-Casing zuerst (löst Build-Probleme), (2) Process.env danach (verbessert Test-Stabilität).
- **Kritischste Warnung:** "Checker 3 ist ein klassisches P10-Problem (Unvollständige Pattern-Listen) — jede CSS-Klassen-Liste wird in Tailwind-Projekten scheitern."

## Nächste Schritte

1. **Sofort:** Import-Casing-Checker mit Extension-Resolution + Allowlist für Node-Builtins implementieren
2. **Bald:** Process.env-Checker mit vordefinierter Safe-Env-Keys-Liste ausrollen
3. **Später:** E2E-Linting-Policy etablieren: "Nur data-testid in Playwright-Tests" als CI-Hook

---

## Kosten

| Modell           | In-Tok  | Out-Tok | Kosten   |
|------------------|---------|---------|----------|
| Claude Sonnet    |   19313 |    1830 | €0.0794 |
| GPT-4o           |   14767 |     690 | €0.0408 |
| Gemini 2.5 Pro   |   16318 |    2044 | €0.0380 |
| Grok 4           |   15949 |    2382 | €0.0777 |
| Judge (Opus)     |    6292 |    1033 | €0.1598 |
| **Gesamt**       |         |         | **€0.3957** |
