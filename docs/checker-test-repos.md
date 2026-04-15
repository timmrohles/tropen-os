# Checker Test-Repos

> Diese Repos werden als Benchmark fuer Checker-Qualitaet genutzt.
> Jeder Checker-Fix wird gegen alle Repos getestet.
> Ziel: Kein Fix erzeugt neue False Positives in diesen Repos.

## Auswahlkriterien

- Repraesentativ fuer Vibe-Coder-Projekte
- Oeffentlich verfuegbar (GitHub)
- Aktiv maintained
- Verschiedene Stacks abgedeckt

## Repos

| # | Repo | Stack | Warum | URL |
|---|------|-------|-------|-----|
| 1 | -- | Next.js + Supabase | Unser Haupt-Stack | -- |
| 2 | -- | T3 Stack | Beliebt bei Indie-Hackern | -- |
| 3 | -- | Next.js Commerce | Vercel-Referenz, produktionsreif | -- |
| 4 | -- | Create-Next-App Default | Minimal, Baseline | -- |
| 5 | -- | Lovable-generiert | Repraesentiert Vibe-Coder-Output | -- |

TODO: Konkrete Repos auswaehlen, URLs eintragen,
ersten Scan durchfuehren und Baseline-FP-Rate dokumentieren.

## Test-Prozess

1. Checker-Fix in Branch implementieren
2. Alle 5 Repos scannen (vor und nach dem Fix)
3. Diff der Findings vergleichen:
   - Weniger Findings = gut (FP entfernt)
   - Mehr Findings = pruefen (neues FP oder echtes Problem?)
4. Nur mergen wenn keine neuen FPs entstehen

## Baseline-Ergebnisse

Wird nach erstem Test-Run ausgefuellt.
