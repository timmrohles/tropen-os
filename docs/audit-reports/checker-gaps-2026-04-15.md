# Checker Gap Analysis — 2026-04-15

> Basiert auf Benchmark v6 (41 Lovable + 8 Bolt/Cursor/Manual Repos)

## Ergebnis

5 von 10 geprüften Gaps haben bereits Checker. 5 fehlen.

| # | Gap | Existiert | Rule-ID | Aufwand |
|---|-----|-----------|---------|---------|
| 1 | Hardcoded Secrets (sk_live, AIza, Bearer) | ✅ Ja | cat-3-rule-30 | — |
| 2 | Missing .env.example | ❌ Nein | — | Klein (1h) |
| 3 | console.log in Produktion | ✅ Ja | cat-12-rule-6 | — |
| 4 | TODO/FIXME ohne Ticket | ❌ Nein | — | Klein (2h) |
| 5 | Missing Loading States (useQuery ohne isLoading) | ❌ Nein | — | Mittel (4h) |
| 6 | Unhandled Promise (.then ohne .catch) | ❌ Nein | — | Mittel (3h) |
| 7 | TypeScript Strict Mode | ✅ Ja | cat-2-rule-1 | — |
| 8 | Missing error.tsx | ✅ Ja | cat-2-rule-11 | — |
| 9 | Unused Dependencies | ❌ Nein | — | Gross (6h) |
| 10 | HTTPS/HSTS Headers | ✅ Ja | cat-4-rule-15 | — |

## Priorisierte Empfehlung (nach Impact/Aufwand)

1. **Missing .env.example** (1h) — Jedes Projekt mit Secrets braucht das
2. **TODO/FIXME Zaehler** (2h) — Indikator fuer technische Schulden
3. **Unhandled Promises** (3h) — Haeufige Fehlerquelle bei Vibe-Codern
4. **Missing Loading States** (4h) — UX-Problem, AST-basiert machbar
5. **Unused Dependencies** (6h) — Bundle-Size-Impact, aber komplex

## Benchmark-Ergebnisse nach Topic

| Topic | Repos | Avg Score | Verteilung |
|-------|-------|-----------|------------|
| Manual (CI) | 2 | 84.3% | 2 Stable |
| Cursor | 3 | 83.3% | 3 Stable |
| Lovable | 41 | ~80% | 31 Stable, 9 Risky, 1 Prototype |
| Bolt.new | 3 | 71.1% | 3 Risky |

**Erkenntnis:** Projekte mit CI-Pipeline (Manual) scoren am besten.
Cursor-Projekte nahe dran. Bolt.new am schlechtesten.

## AST-Checks bei groesseren Repos (Mixed Benchmark)

| Check | Repos (von 8) | Findings | Kommentar |
|-------|---------------|----------|-----------|
| Cognitive Complexity | 100% | 285 | Kern-Differenziator — feuert ueberall |
| Error Handling | 75% | 320 | Haeufigste Code-Qualitaets-Findings |
| God Components | 88% | 73 | Korreliert mit Projektgroesse |
| File Size | 100% | 155 | Basis-Check |
