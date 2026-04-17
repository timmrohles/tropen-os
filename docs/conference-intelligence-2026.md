# Conference Intelligence 2026

> Strategische Entscheidungen aus Komitee-Reviews, Dogfooding und Benchmarks.
> Dieses Dokument ist die einzige Quelle der Wahrheit für beschlossene Gewichtungen, Agent-Kalibrierungen
> und Stack-Entscheidungen. Neue Entscheidungen werden als Abschnitte ergänzt.

---

## Komitee-Review: Agent-Stack Evaluation — 2026-04-17

**Modelle:** Claude Sonnet 4.6, GPT-4o, Gemini 2.5 Pro, Grok 4
**Judge:** Claude Opus 4.6
**Gesamtkosten:** €0.4143
**Protokoll:** `docs/audit-reports/committee-agents-results-2026-04-17.md`

### Beschlossene Gewichts-Änderungen (Kategorie-Level)

| Kategorie | ID | Alt | Neu | Begründung |
|-----------|----|-----|-----|-----------|
| Git Governance | cat-19 | ×2 | ×3 | 20% Sprint-5b-Lücke, größte Quick-Win-Chance (CODEOWNERS) |
| Code-Qualität | cat-2 | ×1 | ×2 | Error Handling 95%+ Hit-Rate, direkter User-Experience-Impact |
| Skalierbarkeit | cat-8 | ×2 | ×1 | MVP-irrelevant, Lovable-Projekte skalieren nicht |

> **Hinweis:** cat-10 (Testing) und cat-12 (Observability) waren bereits auf ×3 — keine Änderung nötig.
> cat-15 (Design System) und cat-17 (i18n) bereits auf ×1 (Minimum) — Typ erlaubt keine 0.5.

### Beschlossene Severity-Kalibrierungen

| Regel | Änderung | Begründung |
|-------|---------|-----------|
| cat-19-rule-3 (package.json version 0.x) | severity: low → **info**, score: 0 → 3 | Versionsnummer ist ein Hinweis, kein Problem |
| cat-19-rule-4 (kein CODEOWNERS) | severity: medium → **high** | Fehlende PR-Zuweisung ist ein echter Production-Gap |

### Beschlossene False-Positive-Fixes

| Agent | FP-Szenario | Fix |
|-------|------------|-----|
| CONTENT_AGENT (cat-17) | DE-only Apps als "fehlende i18n" geflaggt | severity: low → info, score: 0 → 3; Advisory-Text statt Fehler |
| API_AGENT (cat-6) | /api/internal/, /api/admin/, /api/health, /api/webhooks/ als "unversioned" markiert | Neue `INTERNAL_API_PREFIXES` Exclude-Liste; wenn alle Routes intern → null score |
| PERFORMANCE_AGENT (cat-7) | Admin/Dashboard-Pages mit LCP-Problemen als Fehler | Skip lazy-load check für Pfade mit admin/dashboard/settings/internal |

### Quick-Win-Trio (UX-Priorisierung)

Top-3 Agenten für Onboarding-Aha-Moment (einstimmig):

1. **GIT_GOVERNANCE_AGENT** — "Add CODEOWNERS" — konkrete Copy-Paste-Datei, 20% Lücke
2. **ERROR_HANDLING_AGENT** — "No Empty Catch" — sofort verständlich, 95%+ Hit-Rate
3. **OBSERVABILITY_AGENT_v3** — "Integrate Sentry" — klarer One-Liner, 95% fehlendes Error Monitoring

**Implementierung:** `quick-wins.ts` gibt Findings aus cat-2, cat-12, cat-19 einen +2-Bonus im Scoring-Algorithmus.

### Neue Agenten-Roadmap (nach ROI priorisiert)

| Rang | Agent | Hit-Rate | Status |
|------|-------|---------|--------|
| 1 | SLOP_DETECTION_AGENT | 60–80% | Spec — nächster Sprint |
| 2 | SPEC_AGENT | 40–60% | Geplant |
| 3 | EVAL_AGENT | Mittel | Q3 2026 (AI-App-Wachstum) |
| 4 | MCP_SECURITY_AGENT | Niedrig | Wenn Adoption steigt |
| 5 | CRA_AGENT | Niedrig | 2027 vor Inkrafttreten |

### Grösster blinder Fleck

**Runtime-Verhalten unter realer Last** — einstimmig.

Alle 233 Regeln prüfen statischen Code. Kein Agent testet ob die App bei 100–1000 concurrent Users
skaliert oder crasht. Handlungsempfehlung: **LOAD_TEST_AGENT** (Spec: `docs/agents/LOAD_TEST_AGENT.md`).

### Nächste Schritte (nach Priorität)

| # | Schritt | Aufwand | Status |
|---|---------|---------|--------|
| 1 | Gewichts-Änderungen + Severity-Kalibrierung in Scoring einpflegen | 1 Tag | ✅ 2026-04-17 |
| 2 | FP-Exclude-Patterns für CONTENT/API/PERFORMANCE implementieren | 1 Tag | ✅ 2026-04-17 |
| 3 | Quick-Win-Trio in Scoring bevorzugen | 2h | ✅ 2026-04-17 |
| 4 | LOAD_TEST_AGENT Spec schreiben | 1 Tag | ✅ 2026-04-17 |
| 5 | SLOP_DETECTION_AGENT implementieren | 3 Tage | ⬜ Sprint 11 |
| 6 | Quick-Win-Trio in Onboarding-UI prominent (GIT + ERROR + OBS) | 2 Tage | ⬜ Sprint 11 |
| 7 | SPEC_AGENT | 3 Tage | ⬜ Sprint 12 |

---

## Abdeckungslücken (identifiziert 2026-04-17)

| Kategorie | Lücke | Handlungsbedarf |
|-----------|-------|----------------|
| cat-22 (AI/LLM) | Nur 7 Regeln — fehlt Output-Validation, Hallucination-Detection, Provider-Issues | Hoch |
| cat-15 (Design System) | Nur 8 Regeln, ~5% Hit-Rate — fehlt Mobile Responsiveness, Theme Switching | Mittel |
| cat-19 (Git Governance) | 20% Lücke — größter Quick-Win im gesamten Stack | ✅ Gewicht erhöht |

---

## Top-3 FP-Risiken (einstimmig)

1. **CONTENT_AGENT** — DE-only Tools als "fehlende i18n" → ✅ Fix implementiert 2026-04-17
2. **API_AGENT** — /api/internal/\* als "unversioned APIs" → ✅ Fix implementiert 2026-04-17
3. **PERFORMANCE_AGENT** — Admin-Pages mit LCP >2.5s als Fehler → ✅ Fix implementiert 2026-04-17

---

_Letztes Update: 2026-04-17_
