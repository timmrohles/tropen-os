# Benchmark v7 Analysis — Vollstaendiger Checker-Stack

> 49 Repos, 233 Regeln, 25 Kategorien, 27 Agenten
> Datum: 2026-04-15

## Block 1 — Score-Uebersicht

| Gruppe | Repos | Avg | Median | Min | Max | StdDev |
|--------|-------|-----|--------|-----|-----|--------|
| **Gesamt** | 49 | 79.7% | 82.2% | 47.9% | 87.8% | ~6.5 |
| Lovable | 41 | 79.7% | 82.2% | 47.9% | 85.0% | ~6.3 |
| Bolt | 3 | 70.9% | 68.8% | 63.9% | 80.1% | ~8.4 |
| Cursor | 3 | 83.2% | 83.4% | 82.7% | 83.6% | ~0.5 |
| Manual | 2 | 85.8% | 85.8% | 83.7% | 87.8% | ~2.9 |

**Verteilung:** 0 Production, 32 Stable (65%), 16 Risky (33%), 1 Prototype (2%)

**Erkenntnis:** Manual > Cursor > Lovable > Bolt. Projekte mit expliziten Coding-Regeln (.cursorrules) und CI-Pipelines scoren deutlich besser.

## Block 2 — Score-Entwicklung v1→v7

| Version | Avg | StdDev | Spread | Stable | Prototype |
|---------|-----|--------|--------|--------|-----------|
| v1 (Basis) | 72.3% | 0.82 | 5% | 0 | 0 |
| v2 (Noise+Tier) | 77.5% | ~1.5 | 9% | 0 | 0 |
| v3 (AST) | 76.4% | ~1.5 | 9% | 0 | 0 |
| v4 (Kalibriert) | 78.4% | ~2.0 | 10% | 2 | 0 |
| v5 (Density) | 79.3% | ~6.5 | 36% | 26 | 1 |
| v6 (Fixed) | ~80% | ~5.5 | 33% | 31 | 1 |
| **v7 (Final)** | **79.7%** | **~6.5** | **40%** | **32** | **1** |

## Block 3 — Neue Checker: Haben sie gefeuert?

| Checker | Kategorie | Rate | Erwartung | Status |
|---------|-----------|------|-----------|--------|
| cat-11-rule-7 (kein CI) | CI/CD | ~85% Lovable | >80% | ✅ |
| cat-11-rule-8 (CI ohne tsc) | CI/CD | bei Manual | >20% | ✅ |
| cat-12-rule-10 (Error Monitoring) | Observability | ~95% | >80% | ✅ |
| cat-13-rule-8 (Backup Docs) | Backup & DR | ~60% Supabase | >40% | ✅ |
| cat-13-rule-9 (Supabase PITR) | Backup & DR | ~40% | informativ | ✅ |
| cat-14-rule-7 (.env.example) | Dependencies | ~30% | >20% | ✅ |
| cat-14-rule-8 (Major Versions) | Dependencies | ~5% | niedrig | ✅ |
| cat-18-rule-7 (README) | Dokumentation | ~10% | niedrig | ✅ |
| cat-18-rule-8 (CHANGELOG) | Dokumentation | ~95% | >80% | ✅ |
| cat-20-rule-6 (LLM Token Limit) | Cost | bei AI-Repos | selektiv | ✅ |
| cat-20-rule-7 (AI Rate Limit) | Cost | bei AI-Repos | selektiv | ✅ |
| cat-21-rule-5 (Manifest) | PWA | ~90% | >80% | ✅ |
| cat-21-rule-6 (Service Worker) | PWA | ~95% | >80% | ✅ |
| cat-23-rule-4 (Deploy Docs) | Infrastructure | ~20% | variabel | ✅ |
| cat-23-rule-5 (Deploy Config) | Infrastructure | ~10% | variabel | ✅ |
| cat-9-rule-5 (fetch in useEffect) | State | ~15% | >10% | ✅ |
| cat-9-rule-6 (Prop Drilling) | State | ~5% | niedrig | ✅ |
| cat-10-rule-7 (Test Framework) | Testing | ~80% | >70% | ✅ |
| cat-8-rule-6 (API Timeout) | Skalierbarkeit | ~10% | variabel | ✅ |
| cat-15-rule-7 (Icon Library) | Design System | ~5% | niedrig | ✅ |
| cat-17-rule-4 (Hardcoded Strings) | i18n | ~10% | variabel | ✅ |
| cat-19-rule-5 (.gitignore) | Git Governance | ~5% | niedrig | ✅ |

Alle neuen Checker haben in mindestens 1 Repo gefeuert.

## Block 4 — False-Positive-Verdaechtige

Keine neuen 100%-FP-Checks. Die bestehenden 100%-Checks sind profil-gated:
- cat-4-rule-7/11/17/18/20/21 (Compliance) → nur mit Profil
- cat-16-rule-5/6 (BFSG) → nur mit Profil

## Block 5 — Ueberraschungen

1. **Bolt.new 80.1% (Devonz)** — ein Bolt-Repo schafft Stable trotz 568 Findings. Grund: groesseres Projekt, Complexity-Faktor begünstigt es.
2. **Prototype 47.9% (dexoryn/lovable-AI-Agent-gpt)** — einziges Prototype-Repo. Nur 28 Dateien, Complexity-Penalty greift stark.
3. **Cursor-Repos extrem konsistent** — 82.7–83.6% (StdDev 0.5). .cursorrules erzwingen aehnliche Patterns.
4. **Manual-Repos scoren am hoechsten** — 85.8% avg. CI + Tests + Dokumentation machen den Unterschied.
5. **CHANGELOG fehlt bei ~95%** — fast universell. Aber als info-Severity hat es keinen Score-Impact.
