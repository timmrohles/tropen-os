# Checker Coverage — 2026-04-15

> Alle 25 Manifest-Kategorien haben automatisierte Checker.
> 233 Regeln gesamt (169 automatisiert, 64 manuell).

## Coverage-Tabelle

| Kat | Name | Agent(s) | Auto | Manual | Status |
|-----|------|----------|------|--------|--------|
| 1 | Architektur | ARCHITECTURE | 9 | 1 | ✅ |
| 2 | Code-Qualitaet | CODE_STYLE | 12 | 3 | ✅ |
| 3 | Sicherheit | SECURITY + SECURITY_SCAN | 16 | 11 | ✅ |
| 4 | Datenschutz & Compliance | LEGAL + DSGVO | 16 | 5 | ✅ |
| 5 | Datenbank | DATABASE | 8 | 2 | ✅ |
| 6 | API-Design | API | 6 | 2 | ✅ |
| 7 | Performance | PERFORMANCE | 4 | 3 | ✅ |
| 8 | Skalierbarkeit | SCALABILITY | 4 | 3 | ✅ |
| 9 | State Management | — | 4 | 2 | ✅ |
| 10 | Testing | TESTING | 7 | 0 | ✅ |
| 11 | CI/CD | PLATFORM | 6 | 2 | ✅ |
| 12 | Observability | OBSERVABILITY + ANALYTICS | 8 | 2 | ✅ |
| 13 | Backup & DR | BACKUP_DR | 6 | 3 | ✅ |
| 14 | Dependency Management | DEPENDENCIES | 8 | 0 | ✅ |
| 15 | Design System | DESIGN_SYSTEM | 3 | 4 | ✅ |
| 16 | Accessibility | ACCESSIBILITY + BFSG | 9 | 1 | ✅ |
| 17 | Internationalisierung | CONTENT | 2 | 2 | ✅ |
| 18 | Dokumentation | — | 6 | 2 | ✅ |
| 19 | Git Governance | GIT_GOVERNANCE | 4 | 1 | ✅ |
| 20 | Cost Awareness | COST_AWARENESS | 4 | 3 | ✅ |
| 21 | PWA & Resilience | — | 5 | 1 | ✅ |
| 22 | AI Integration | AI_INTEGRATION + AI_ACT | 12 | 3 | ✅ |
| 23 | Infrastructure | — | 3 | 3 | ✅ |
| 24 | Supply Chain Security | — | 4 | 2 | ✅ |
| 25 | Namenskonventionen | — | 3 | 3 | ✅ |

## Agent-Mapping

| Agent | Manifest-Kategorie | Status |
|-------|-------------------|--------|
| ANALYTICS_AGENT | cat-12 (Observability) — cat-12-rule-9 | ✅ Integriert |
| CONTENT_AGENT | cat-17 (Internationalisierung) — cat-17-rule-4 | ✅ Integriert |
| Alle anderen 25 Agents | Direkt zugeordnet | ✅ |

## Checker-Dateien

| Datei | Regeln | Kategorien |
|-------|--------|-----------|
| repo-map-checker.ts | ~10 | cat-1,2,3,5,6,12,15,22,25 |
| file-system-checker.ts | ~15 | cat-2,5,7,10,11,14,17,21,23 |
| documentation-checker.ts | ~5 | cat-1,4,5,18,19 |
| cli-checker.ts | ~3 | cat-3,10 |
| external-tools-checker.ts | ~5 | cat-1,2,7,16,18 |
| agent-architecture-checker.ts | 3 | cat-1 |
| agent-security-checker.ts | 7 | cat-3,22 |
| security-scan-checker.ts | ~10 | cat-3,22,24 |
| agent-observability-checker.ts | 4 | cat-12 |
| agent-committee-checker.ts | ~15 | cat-2,4,5,6,8,11,12,14,15,16,19,20 |
| agent-regulatory-checker.ts | ~15 | cat-4,16,22 |
| compliance-checker.ts | 6 | cat-4,5,22 |
| ast-analyzer.ts | — | AST engine (shared) |
| ast-quality-checker.ts | 8 | cat-1,2,3,5 |
| gap-checkers.ts | 4 | cat-6,9,14,18 |
| category-gap-checkers.ts | 5 | cat-7,11,20 |
| state-deps-obs-checkers.ts | 5 | cat-9,12,14 |
| final-category-checkers.ts | 9 | cat-8,13,18,21,23 |
| thin-category-checkers.ts | 5 | cat-10,15,17,19,23 |

## Offene Punkte fuer Komitee-Review

### 1. Plattform-spezifische Checker (Lovable / Bolt / Cursor)

Benchmark-Daten: Lovable ~80%, Bolt 71%, Cursor 83%, Manual 84%.
Plattform-Erkennung moeglich (.bolt/, .cursorrules, lovable in package.json).
Frage: Plattform-spezifische Fix-Prompts und Findings? Wann — vor oder nach PMF?

### 2. Score-Differenzierung nach Projekt-Typ

Complexity-Factor (log10) ist implementiert — kleine Projekte bekommen Penalty.
Frage: Explizites Profil-Feld (portfolio/saas/api/mobile) mit angepassten Gewichten?

### 3. Checker-Tiefe vs. UX-Schicht

Checker-Stack ist vollstaendig (233 Regeln, 25/25 Kategorien).
Naechster Schritt: Finding-Priorisierung ("Was zuerst fixen?"), Fix-Prompt-Generator,
Gruppierung ("Heute fixbar" vs. "Braucht Zeit").
Frage: UX-Schicht vor oder nach erstem echten Nutzer-Test?

### 4. Manuelle Checks

64 manuelle Regeln die statisch nicht pruefbar sind (siehe docs/manual-checks.md).
Optionen: "Not checked" markieren / AI-Agent-Review / Aus Score entfernen.
Empfehlung: Option 1 (transparent) fuer MVP, Option 2 als Premium.

## Manuelle Checks

Vollstaendige Liste: [docs/manual-checks.md](../manual-checks.md)
