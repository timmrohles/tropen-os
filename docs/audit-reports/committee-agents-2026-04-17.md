# Komitee-Dokument — Agent-Stack Review 2026-04-17

> **Kontext für alle Modelle**
> Tropen OS ist ein **Production Readiness Scanner für Vibe-Coder** (Lovable, Bolt, Cursor).
> Statisches Scanning — kein LLM-Call pro Regel, vollständig deterministisch.
> Priorisierte Findings mit Copy-Paste Cursor-Prompts.
> Motto: "Advisor not mechanic" — wir zeigen was fehlt, bauen nicht selbst.
>
> **Stand heute:** 26 Agent Rule Packs (+ 5 neue vorgeschlagen), 233 Regeln (169 auto, 64 manuell), 25 Kategorien.
> **Benchmark v7:** 49 Repos — Manual 87.8%, Cursor 83.2%, Lovable 79.7%, Bolt 70.9%.
> **Vibe-Coder-Feedback (Komitee 2026-04-15):** "68 Findings als flache Liste — gib mir 3 Copy-Paste-Commands."
> **UX-Entscheidung:** Quick-Wins-Button (Top 3–5 Fixes mit Score-Prognose) wird gebaut.

---

## Agent-Stack — alle 31 Agenten

### Bestehende Agenten (26)

| # | Agent | Kategorie | Rules in DB | Benchmark-Rate | Stärke | Bekannte Lücke |
|---|-------|-----------|-------------|----------------|--------|----------------|
| 1 | ACCESSIBILITY_AGENT | cat-16 (WCAG/BFSG) | 18 | cat-16-rule-5/6 profil-gated; Checks: ~61-100% | WCAG 2.1 AA + BFSG-Pflicht, Gewicht ×3, seit EU Accessibility Act | Screen Reader Testing nur Advisory, axe-core Benchmark fehlt noch |
| 2 | AGENT_QUALITY_AGENT | meta/intern | 8 | — (kein Checker in agent-committee-checker.ts) | Prüft Agent-Dokumente selbst auf Struktur + Vollständigkeit | Kein Audit-Kategorie-Eintrag, keine Benchmark-Daten |
| 3 | AI_ACT_AGENT | regulatory (EU AI Act) | 12 | nur EU-Projekte; selektiv | Vollständige Art. 3–50 Abdeckung, High-Risk-Classification | Nur EU-relevant, viele manuelle Checks, kein Auto-Checker |
| 4 | AI_INTEGRATION_AGENT | cat-25 (AI/LLM) | 7 | bei AI-Repos; selektiv | Prompt Injection, Output Validation, Provider Abstraction | Nur 7 Regeln, kein direkter Checker in agent-committee-checker.ts |
| 5 | ANALYTICS_AGENT | cat-? (Analytics) | 7 | niedrig (~0–20%) | GDPR-konformes Tracking, Consent-Prüfung | Lovable-Projekte selten mit Tracking → hohe Nicht-Anwendbarkeitsrate |
| 6 | API_AGENT | cat-? (API Design) | 8 | variabel | Resilience-Patterns (Timeout, Retry, Circuit Breaker) | R1 (Versioning) FP-Risiko bei internen Next.js-Routes |
| 7 | ARCHITECTURE_AGENT_v3 | cat-1 (Architektur) | 8 | hoch (Basis-Checks universell) | File Size Limit (300/500Z), Dependency Model, ADRs | Generisch, viele Platzhalter, v3 aber letztes Update unklar |
| 8 | BACKUP_DR_AGENT | cat-13 (Backup/DR) | 7 | ~60% Supabase-Projekte | 3-2-1 Regel, PITR, RTO/RPO | Supabase-spezifische Checks noch manuell, Restore-Test nicht automatisierbar |
| 9 | BFSG_AGENT | regulatory/cat-16 | 14 | nur DE/EU B2C Apps | Gesetzliche Pflicht (Bußgeld bis €100K), gilt seit 28.06.2025 | Überlappung mit ACCESSIBILITY_AGENT (50%), profil-gated |
| 10 | CODE_STYLE_AGENT | cat-2 (Code-Qualität) | 23 | hoch (universell) | Höchste Regelanzahl, TypeScript Strict, Complexity, Naming | Veraltet (last_updated: 2024-01-10), kein AI-spezifisches Code-Handling |
| 11 | CONTENT_AGENT | cat-17 (i18n) | 8 | ~10% | Hardcoded Strings, i18n Framework, Locale-Aware Formatting | Hohe FP-Rate bei DE-only DEV-Tools, Lovable-Projekte selten i18n-ready |
| 12 | COST_AWARENESS_AGENT | cat-20 (Cost) | 7 | bei AI-Repos (selektiv) | Token Budget, Budget Alerts, Rate Limits, License Compliance | Nur für LLM-Apps relevant; cat-20-rule-6/7 feuern selektiv |
| 13 | DATABASE_AGENT | cat-? (DB) | 9 | hoch (Supabase universell) | Supabase RLS, Service Role Key Isolation, FK Indexing | R5 (3NF) schwer automatisierbar, kein Checker für Migration Drift |
| 14 | DEPENDENCIES_AGENT | cat-14 (Dependencies) | 8 | ~30% | Lockfile-Check gut automatisierbar, CVE-Scanning (npm audit) | SBOM (R5) overkill für MVPs, cat-14-rule-7 (.env.example) nur ~30% |
| 15 | DESIGN_SYSTEM_AGENT | cat-15 (Design) | 8 | ~5% | Verhindert Hex-Hardcoding, Design Tokens (CSS Variables) | Storybook (R7) unrealistisch für Vibe-Coder, cat-15-rule-7 (Icons) ~5% |
| 16 | DSGVO_AGENT | regulatory (GDPR) | 18 | ~95% flaggen min. 1 Rule | Vollständige GDPR-Pflichtenseiten, Cookie Consent, PII-Schutz | R4 (Cookie Consent Library) selten vorhanden → hohe Trefferrate = ggf. overwhelm |
| 17 | ERROR_HANDLING_AGENT | cat-6 (Error Handling) | 8 | Top-Finding bei Benchmark | No Empty Catch, Structured Errors, API-Routes-Coverage | R8 (Circuit Breaker) overkill für MVPs |
| 18 | GIT_GOVERNANCE_AGENT | cat-19 (Git) | 8 | ~20% Gesamt-Benchmark | CODEOWNERS = Top-Quick-Win (Sprint 5b), Branch Protection | Sprint-5b-Audit: Git Governance 20% → größte einzelne Lücke |
| 19 | LEGAL_AGENT | cat-4 (Legal/Compliance) | 8 | EU-only / Profil-gated | PII<T> Type Wrapper, AI Transparency Disclosure, Consent Opt-In | Überlappung mit DSGVO_AGENT, profil-gated Checks |
| 20 | OBSERVABILITY_AGENT_v3 | cat-12 (Observability) | 8 | ~95% | cat-12-rule-10 (Error Monitoring) feuert ~95%; Structured Logging | R5–R7 runtime-only, nicht statisch prüfbar |
| 21 | PERFORMANCE_AGENT | cat-7 (Performance) | 8 | variabel | Core Web Vitals (LCP/INP/CLS), Lighthouse CI-Integration | R1 (LCP <2.5s) overkill für Admin-Pages |
| 22 | PLATFORM_AGENT | cat-11 (CI/CD) | 8 | ~85% Lovable (kein CI) | cat-11-rule-7 (kein CI) feuert ~85% bei Lovable; IaC-Prüfung | R4/R5/R6 overkill für early-stage MVPs |
| 23 | SCALABILITY_AGENT | cat-8 (Skalierbarkeit) | 7 | ~10% | Job Queue für Long Ops, No Session State, Optimistic Updates | Lovable-Projekte skalieren nicht → niedrige Relevanz für MVP |
| 24 | SECURITY_AGENT_FINAL | cat-3 (Security) | 16 | hoch (universell) | Umfassendster Agent, Multi-Tenant Isolation, HTTP Headers | 16 Regeln → viele Findings auf einmal, kein Priorisierungs-Layer |
| 25 | SECURITY_SCAN_AGENT | cat-24 (Security Scan) | 9 | variabel | Direkte Exploitability: SQL Injection, eval(), Path Traversal, SSRF | Regex-basiert → partial coverage, keine Semantic Analysis |
| 26 | TESTING_AGENT | cat-10 (Testing) | 8 | ~80% | cat-10-rule-7 (Test Framework) feuert ~80%; CI Test Gate | Coverage <5% bei Lovable → R2 (80% Coverage) fast immer flagged |

---

### Neue Agenten — vorgeschlagen (5)

Diese Agenten existieren noch nicht. Das Komitee entscheidet über Priorität und Reihenfolge.

| # | Agent | Konzept | Ziel-Kategorie | Hypothetische Rate | Vibe-Coder-Relevanz | Aufwand |
|---|-------|---------|----------------|-------------------|---------------------|---------|
| 27 | **SLOP_DETECTION_AGENT** | Erkennt AI-generierten "Slop"-Code: übermäßig generische Variablennamen (data, result, temp), leere Error-Handler, redundante Kommentare, fehlende Business-Logik-Validierung | cat-2 (Code-Qualität) | ~60–80% bei Vibe-Coder | **Hoch** — Kernproblem von Lovable/Bolt-Output | Mittel (Regex + AST) |
| 28 | **CRA_AGENT** | EU Cyber Resilience Act — Pflichten für Produkte mit digitalen Elementen (SBOM, Vulnerability Disclosure, Update-Policy, Security Contact) | regulatory (CRA) | nur EU-Produkte | Niedrig (MVP-Phase) | Hoch (neue Regulierung) |
| 29 | **SPEC_AGENT** | Prüft ob Implementierung zu einem Spec-Dokument passt (README, spec.md, PRD) — erkennt TODO-Divergenzen, Placeholder-Text, unimplementierte Stubs | cat-1 (Architektur) | ~40–60% | Mittel | Mittel (Datei-Diff) |
| 30 | **EVAL_AGENT** | Bewertet AI-Output-Qualität: Halluzinations-Risiken in Prompts, fehlende Output-Validation, kein Confidence-Scoring, keine Human-in-the-Loop-Checks | cat-25 (AI/LLM) | bei AI-Repos selektiv | Mittel (nur AI-Apps) | Hoch (LLM-Eval-Framework nötig) |
| 31 | **MCP_SECURITY_AGENT** | Model Context Protocol Sicherheit: Tool-Permission-Scope, MCP-Server-Auth, keine Secrets in MCP-Tool-Outputs, Prompt-Injection via MCP-Responses | cat-3/cat-25 | bei MCP-Apps selektiv | Niedrig (MCP noch selten) | Mittel |

---

## Benchmark-Kontext (v7, 2026-04-15)

| Plattform | Repos | Avg Score | Status-Verteilung |
|-----------|-------|-----------|-------------------|
| Manual (CI+Tests+Docs) | 2 | 87.8% | Stable |
| Cursor (.cursorrules) | 3 | 83.2% | Stable (StdDev 0.5!) |
| Lovable | 41 | 79.7% | 26 Stable, 14 Risky, 1 Prototype |
| Bolt.new | 3 | 70.9% | Risky |

**Top-Findings bei Lovable:** Kein CI (~85%), Kein Error Monitoring (~95%), Kein Test Framework (~80%), Kein CHANGELOG (~95%).

**Letztes Komitee (2026-04-15) — relevante Entscheidungen:**
- Frage 3 (UX-Schicht): **A** — Sofort starten. "68 Findings als flache Liste ist der Tod eines Products."
- Frage 1 (Plattform-Agenten): **B** — Generisch bleiben, Plattform nur im Report anzeigen.
- Frage 4 (Manuelle Checks): **C** — 5 Ja/Nein-Fragen im Onboarding.

---

## 8 Bewertungsfragen

Das Komitee bewertet alle 31 Agenten anhand dieser Fragen:

**F1 — Vibe-Coder-Relevanz:** Ist dieser Agent für Vibe-Coder relevant? (Ja / Nur EU / Nur AI-Repos / Nein — zu nischig)

**F2 — Abdeckung:** Ist die Kategorie gut abgedeckt oder gibt es kritische Lücken?

**F3 — Missing Check:** Fehlt ein wichtiger Check den KEIN anderer Agent macht?

**F4 — Priorität:** Sollte dieser Agent höhere oder niedrigere Priorität im Scoring haben? (Gewicht ×1/×2/×3)

**F5 — Top 3 für ersten Eindruck:** Welche 3 Agenten erzeugen den besten "Aha-Moment" bei einem neuen Nutzer?

**F6 — Top 3 FP-Risiken:** Welche 3 Agenten erzeugen wahrscheinlich die meisten False Positives?

**F7 — Bester neuer Agent (ROI):** Welcher der 5 neuen Agenten hat den höchsten ROI für Vibe-Coder — und warum?

**F8 — Größter blinder Fleck:** Was ist der größte blinde Fleck im gesamten Agenten-Stack (etwas das KEIN der 31 Agenten abdeckt)?
