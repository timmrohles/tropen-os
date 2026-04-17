# Komitee-Ergebnisse — Agent-Stack Review 2026-04-17

> 4 Modelle: Claude Sonnet, GPT-4o, Gemini 2.5 Pro, Grok 4
> Judge: Claude Opus
> Kosten: EUR 0.41

---

## Frage 1 — Vibe-Coder-Relevanz aller 26 bestehenden Agenten

**Konsens-Level: MEHRHEIT** (4 Streitfälle, Rest einig)

| Kategorie | Agenten |
|-----------|---------|
| **Ja — universell relevant** (19) | ACCESSIBILITY_AGENT, ARCHITECTURE_AGENT_v3, BACKUP_DR_AGENT, CODE_STYLE_AGENT, DATABASE_AGENT, DEPENDENCIES_AGENT, DSGVO_AGENT, ERROR_HANDLING_AGENT, GIT_GOVERNANCE_AGENT, OBSERVABILITY_AGENT_v3, PERFORMANCE_AGENT, PLATFORM_AGENT, SECURITY_AGENT_FINAL, SECURITY_SCAN_AGENT, TESTING_AGENT, ANALYTICS_AGENT, API_AGENT, COST_AWARENESS_AGENT, AI_INTEGRATION_AGENT |
| **Nur EU** (4) | BFSG_AGENT, AI_ACT_AGENT, LEGAL_AGENT, DSGVO_AGENT* |
| **Nur AI-Repos** (2) | COST_AWARENESS_AGENT*, EVAL_AGENT (neu) |
| **Nein — zu nischig für MVP** (3) | AGENT_QUALITY_AGENT (intern), CONTENT_AGENT (i18n selten), DESIGN_SYSTEM_AGENT (Storybook unrealistisch) |

*Streitfälle (GESPALTEN zwischen Modellen):*
- ACCESSIBILITY_AGENT: Claude/GPT/Gemini "Ja" — Grok "Nur EU" (BFSG-Pflicht vs. MVP-Fokus)
- ANALYTICS_AGENT: Claude/Grok "Ja" — GPT "Nein" (GDPR-Tracking wichtig vs. selten anwendbar)
- PLATFORM_AGENT: Claude/Grok/Gemini "Ja" — GPT "Nein" (CI/CD wichtig vs. überkomplex)
- SCALABILITY_AGENT: Grok/Gemini "Ja" — Claude/GPT "Nein" (Job Queues vs. overkill)

---

## Frage 2 — Top 3 Abdeckungslücken

**Konsens-Level: EINIG**

| # | Lücke | Begründung |
|---|-------|-----------|
| 1 | **cat-25 (AI/LLM)** | Nur 7 Regeln, fehlt Output-Validation, Hallucination-Detection, Provider-Issues |
| 2 | **cat-15 (Design System)** | 8 Regeln, ~5% Rate, fehlt Mobile Responsiveness, Theme Switching |
| 3 | **cat-19 (Git Governance)** | 20% Benchmark-Rate — größte einzelne Lücke in Sprint 5b, braucht mehr Gewicht |

---

## Frage 3 — Missing Checks (kein Agent macht das)

**Konsens-Level: MEHRHEIT**

| # | Fehlender Check | Details |
|---|----------------|---------|
| 1 | **Runtime Performance unter Last** | Kein Agent prüft Verhalten bei 100–1000 concurrent Users |
| 2 | **User Feedback Integration** | Kein Mechanismus für Post-MVP-Iteration und Usability-Validierung |
| 3 | **SEO-Basics** | Meta-Tags, OpenGraph, Sitemap, robots.txt — grundlegende Web-App-Hygiene |

*Abweichung: Claude betont SEO + Memory-Leaks, andere fokussieren auf Dependency Freshness + API-Schema-Validation.*

---

## Frage 4 — Priorität / Gewichts-Änderungen

**Konsens-Level: EINIG**

| Agent | Änderung | Begründung |
|-------|---------|-----------|
| GIT_GOVERNANCE_AGENT | ×1 → **×3** | 20% Sprint-5b-Lücke, größte Quick-Win-Chance (CODEOWNERS) |
| OBSERVABILITY_AGENT_v3 | ×1 → **×3** | 95% fehlendes Error Monitoring — kritisch für Production |
| ERROR_HANDLING_AGENT | ×1 → **×2** | 95%+ Treffer-Rate, direkter User-Experience-Impact |
| TESTING_AGENT | ×1 → **×2** | 80% ohne Test Framework — fundamentale Lücke |
| DESIGN_SYSTEM_AGENT | ×1 → ×0.5 | Storybook (R7) unrealistisch für Vibe-Coder |
| SCALABILITY_AGENT | ×1 → ×0.5 | MVP-irrelevant, Lovable-Projekte skalieren nicht |
| CONTENT_AGENT | ×1 → ×0.5 | i18n selten, hohe FP-Rate |

---

## Frage 5 — Top 3 für ersten Eindruck (Aha-Moment)

**Konsens-Level: EINIG**

| Rang | Agent | Warum |
|------|-------|-------|
| 1 | **GIT_GOVERNANCE_AGENT** | "Add CODEOWNERS" — konkreter Copy-Paste-Quick-Win, 20% Lücke |
| 2 | **ERROR_HANDLING_AGENT** | "No Empty Catch" — sofort verständlich, 95%+ Treffer-Rate |
| 3 | **OBSERVABILITY_AGENT_v3** | "Integrate Sentry" — klarer One-Liner, 95% fehlendes Error Monitoring |

*GPT-4o wählt statt GIT_GOVERNANCE den SECURITY_AGENT_FINAL (HTTP Headers universell).*

---

## Frage 6 — Top 3 FP-Risiken

**Konsens-Level: EINIG**

| Rang | Agent | Konkretes FP-Szenario |
|------|-------|----------------------|
| 1 | **CONTENT_AGENT** | DE-only Tools werden als "fehlende i18n" geflaggt — obwohl bewusst monolingual |
| 2 | **API_AGENT** | Interne Next.js-Routes (`/api/internal/*`) als "unversioned APIs" markiert |
| 3 | **PERFORMANCE_AGENT** | Admin-Pages / Low-Traffic-Apps mit LCP >2.5s als Fehler — unrealistischer Threshold |

---

## Frage 7 — Bester neuer Agent (ROI)

**Konsens-Level: EINIG**

| Rang | Neuer Agent | ROI | Begründung |
|------|------------|-----|-----------|
| 1 | **SLOP_DETECTION_AGENT** | Hoch | 60–80% Rate, trifft AI-Code-Kernproblem direkt (Lovable/Bolt-Output) |
| 2 | **SPEC_AGENT** | Mittel-Hoch | 40–60% Rate, README-Implementation-Drift universell |
| 3 | **EVAL_AGENT** | Mittel | Wichtig für AI-Apps-Wachstum, aber höherer Implementierungsaufwand |
| 4 | **MCP_SECURITY_AGENT** | Niedrig-Mittel | Noch niedrige MCP-Adoption in Vibe-Coder-Projekten |
| 5 | **CRA_AGENT** | Niedrig | Nur EU, konkreter ROI erst 2027+ |

---

## Frage 8 — Größter blinder Fleck

**Konsens-Level: EINIG**

**Runtime-Verhalten unter realer Last.**

Alle 233 Regeln prüfen statischen Code. Kein einziger der 31 Agenten testet, ob die App bei 100–1000 concurrent Users skaliert oder crasht. Alle Benchmark-Repos sind Demos/MVPs — Runtime-Performance ist vollständig unvalidiert.

**Handlungsempfehlung:** Neuen **LOAD_TEST_AGENT** entwickeln:
- Scannt ob k6/Locust/artillery-Skripte im Repo existieren
- Generiert Basic Load-Test-Template als Fix-Prompt
- Regel: "Test mit 100 Users vor erstem Production-Launch"

---

## Entscheidungen

| Entscheidung | Beschluss | Konsens | Begründung |
|-------------|---------|---------|-----------|
| 1 — Reihenfolge neue Agenten | SLOP → SPEC → EVAL → MCP → CRA | EINIG | ROI-Ranking: Treffer-Rate × Vibe-Coder-Relevanz |
| 2 — Gewichts-Erhöhung | GIT ×3, OBS ×3, ERROR ×2, TESTING ×2 | EINIG | Hohe Treffer-Rate + direkte Production-Relevanz |
| 3 — Gewichts-Reduktion | DESIGN ×0.5, SCALABILITY ×0.5, CONTENT ×0.5 | EINIG | Overkill für MVP, hohe FP-Rate |
| 4 — Quick-Win-UX Trio | GIT + ERROR + OBSERVABILITY | EINIG | Konkrete Copy-Paste-Fixes, 80–95% Treffer-Rate |
| 5 — FP-Fixes sofort | CONTENT Whitelist + API Exclude-Pattern + PERFORMANCE Threshold | EINIG | Top-3 FP-Quellen eliminieren |
| 6 — Blinder Fleck | LOAD_TEST_AGENT konzipieren | EINIG | Einziger ungedeckter Production-Critical-Aspekt |

---

## Nächste Schritte (priorisiert)

| # | Schritt | Aufwand | Impact |
|---|---------|---------|--------|
| 1 | **SLOP_DETECTION_AGENT** implementieren (Regex + AST) | 3 Tage | 60–80% Rate bei Vibe-Coder |
| 2 | **Gewichts-Änderungen** in scoring-system einpflegen (GIT/OBS/ERROR/TESTING hoch; DESIGN/SCALE/CONTENT runter) | 1 Tag | Score-Differenzierung verbessert |
| 3 | **FP-Exclude-Patterns** für CONTENT/API/PERFORMANCE | 1 Tag | FP-Rate <10% Ziel |
| 4 | **Quick-Win-Trio** in Onboarding-UI prominent (GIT + ERROR + OBS) | 2 Tage | Aha-Moment für neue User |
| 5 | **SPEC_AGENT** als zweiten neuen Agent | 3 Tage | README-Drift-Detection |
| 6 | **LOAD_TEST_AGENT** konzipieren + Spec schreiben | 1 Tag | Strategische Lücke addressieren |

---

## Kosten

| Modell | In-Tok | Out-Tok | Kosten |
|--------|--------|---------|--------|
| Claude Sonnet | 8.553 | 2.048 | €0.0524 |
| GPT-4o | 6.377 | 1.018 | €0.0243 |
| Gemini 2.5 Pro | 7.006 | 2.044 | €0.0272 |
| Grok 4 | 7.279 | 2.594 | €0.0565 |
| Judge (Opus) | 6.866 | 2.268 | €0.2540 |
| **Gesamt** | | | **€0.4143** |
