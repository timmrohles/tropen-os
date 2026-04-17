# Committee Review: agent-stack-review

> Generiert am 2026-04-17 · Reviewer: Claude Sonnet, GPT-4o, Gemini 2.5 Pro, Grok 4 · Judge: Claude Opus

---

# Konsens-Bericht: 31-Agent-Stack Evaluation

## F1 — VIBE-CODER-RELEVANZ
**Konsens-Level:** MEHRHEIT

**Konsens-Antwort:** 19 Agenten sind universell relevant ("Ja"), 5 nur für EU-Projekte ("Nur EU"), 2 nur für AI-Repos ("Nur AI"), 5 werden als nicht relevant eingestuft ("Nein").

**Abweichende Meinungen:**
- **ACCESSIBILITY_AGENT**: Claude/GPT/Gemini: "Ja", Grok: "Nur EU" (BFSG-Pflicht vs. MVP-Fokus)
- **ANALYTICS_AGENT**: Claude/Grok: "Ja", GPT: "Nein" (GDPR-Tracking wichtig vs. selten anwendbar)
- **PLATFORM_AGENT**: Claude/Grok/Gemini: "Ja", GPT: "Nein" (CI/CD wichtig vs. überkomplex für MVPs)
- **SCALABILITY_AGENT**: Grok/Gemini: "Ja", Claude/GPT: "Nein" (Job Queues nützlich vs. overkill für MVPs)

## F2 — ABDECKUNG (Top 3 Lücken)
**Konsens-Level:** EINIG

**Konsens-Antwort:**
1. **cat-25 (AI/LLM)**: Nur 7 Regeln, fehlt Output-Validation, Hallucination-Detection, Provider-spezifische Issues
2. **cat-15 (Design System)**: Nur 8 Regeln, ~5% Rate, fehlt Mobile Responsiveness, Theme Switching
3. **cat-8 (Skalierbarkeit)** oder **cat-19 (Git)**: Niedrige Abdeckung für kritische Produktions-Aspekte

## F3 — MISSING CHECK (Top 3)
**Konsens-Level:** MEHRHEIT

**Konsens-Antwort:**
1. **Runtime Performance unter Last**: Keine Agenten prüfen Verhalten bei 100-1000 concurrent Users
2. **User Feedback Integration**: Keine Mechanismen für Post-MVP-Iteration und echte Usability-Validierung
3. **SEO-Basics** oder **Memory-Leak-Detection**: Grundlegende Web-App-Hygiene fehlt

**Abweichende Meinungen:**
- Claude betont SEO und Memory-Leaks, andere fokussieren auf Dependency Freshness und API-Schema-Validation

## F4 — PRIORITÄT (Änderungsvorschläge)
**Konsens-Level:** EINIG

**Konsens-Antwort:**
**Höher gewichten:**
- **GIT_GOVERNANCE_AGENT**: von ×1 auf ×2-3 (20% Sprint-5b-Lücke, größte Quick-Win-Chance)
- **ERROR_HANDLING_AGENT**: von ×1 auf ×2 (95%+ Treffer-Rate, direkte User-Experience)
- **TESTING_AGENT**: von ×1 auf ×2 (80% ohne Test Framework)
- **OBSERVABILITY_AGENT_v3**: von ×1 auf ×2-3 (95% fehlendes Error Monitoring)

**Niedriger gewichten:**
- **SCALABILITY_AGENT**: von ×1 auf ×0.5 (MVP-irrelevant)
- **DESIGN_SYSTEM_AGENT**: von ×1 auf ×0.5 (Storybook unrealistisch)

## F5 — TOP 3 FÜR ERSTEN EINDRUCK
**Konsens-Level:** EINIG

**Konsens-Antwort:**
1. **ERROR_HANDLING_AGENT**: 95%+ Treffer-Rate, "No Empty Catch" sofort verständlich
2. **GIT_GOVERNANCE_AGENT**: 20% Lücke, "Add CODEOWNERS" konkreter Quick-Win
3. **SECURITY_AGENT_FINAL** oder **TESTING_AGENT**: HTTP Headers/Test Framework fehlen universell

## F6 — TOP 3 FP-RISIKEN
**Konsens-Level:** EINIG

**Konsens-Antwort:**
1. **CONTENT_AGENT**: DE-only Tools als "fehlende i18n" geflaggt
2. **API_AGENT**: Interne Next.js-Routes als "unversioned APIs" markiert
3. **PERFORMANCE_AGENT**: Admin-Pages mit LCP >2.5s für low-traffic unrealistisch

## F7 — BESTER NEUER AGENT (ROI)
**Konsens-Level:** EINIG

**Konsens-Antwort:**
1. **SLOP_DETECTION_AGENT**: 60-80% Rate, trifft AI-Code-Kernproblem direkt
2. **SPEC_AGENT**: 40-60% Rate, README-Implementation-Drift universal
3. **EVAL_AGENT**: Wichtig für AI-Apps, aber höherer Aufwand
4. **MCP_SECURITY_AGENT**: Noch niedrige Adoption
5. **CRA_AGENT**: Nur EU, ROI erst 2027+

## F8 — GRÖSSTER BLINDER FLECK
**Konsens-Level:** EINIG

**Konsens-Antwort:** **Runtime-Verhalten unter realer Last**. Alle 233 Regeln prüfen statischen Code, aber keiner testet ob die App bei 100-1000 concurrent Users skaliert oder crasht.

---

## Entscheidungen

### 1. Reihenfolge der 5 neuen Agenten
1. **SLOP_DETECTION_AGENT** — Sofort implementieren (höchster ROI, 60-80% Rate)
2. **SPEC_AGENT** — Als zweites (40-60% Rate, universell nützlich)  
3. **EVAL_AGENT** — Drittes Quartal (wichtig für AI-Apps-Wachstum)
4. **MCP_SECURITY_AGENT** — Wenn Adoption steigt
5. **CRA_AGENT** — 2027 vor Inkrafttreten

### 2. Gewichts-Änderungen
**Erhöhen:**
- GIT_GOVERNANCE_AGENT: ×1 → ×3
- OBSERVABILITY_AGENT_v3: ×1 → ×3  
- ERROR_HANDLING_AGENT: ×1 → ×2
- TESTING_AGENT: ×1 → ×2

**Reduzieren:**
- DESIGN_SYSTEM_AGENT: ×1 → ×0.5
- SCALABILITY_AGENT: ×1 → ×0.5
- CONTENT_AGENT: ×1 → ×0.5

### 3. Top 3 Agenten für Quick-Win-UX
1. **GIT_GOVERNANCE_AGENT** — "Add CODEOWNERS" mit Copy-Paste-Command
2. **ERROR_HANDLING_AGENT** — "No Empty Catch" sofort fixbar
3. **OBSERVABILITY_AGENT_v3** — "Integrate Sentry" klarer One-Liner

### 4. Top 3 FP-Risiken (sofortige Regel-Verbesserung)
1. **CONTENT_AGENT**: Whitelist für DE-only Apps ohne i18n-Requirement
2. **API_AGENT**: Exclude-Pattern für /api/internal/* Routes
3. **PERFORMANCE_AGENT**: Threshold-Anpassung für Admin/Dashboard-Pages

### 5. Größter blinder Fleck
**Handlungsempfehlung:** Neuen **LOAD_TEST_AGENT** entwickeln, der:
- Locust/k6-Skripte in Repo scannt
- Basic Load-Test-Template generiert
- "Test mit 100 Users vor Production" als Regel einführt

## Nächste Schritte

1. **Sofort (diese Woche):**
   - SLOP_DETECTION_AGENT implementieren und testen
   - Gewichts-Änderungen in Scoring-System einpflegen
   - FP-Exclude-Patterns für CONTENT/API/PERFORMANCE_AGENT

2. **Bald (nächster Sprint):**
   - SPEC_AGENT als zweiten neuen Agent ausrollen
   - Quick-Win-Trio (GIT/ERROR/OBSERVABILITY) in Onboarding prominent platzieren
   - Load-Test-Agent-Konzept ausarbeiten

3. **Später (Q1 2025):**
   - EVAL_AGENT für wachsende AI-App-Basis
   - Monitoring-Dashboard für Agent-Performance (FP-Rates tracken)
   - EU-spezifische Agenten in separates Profil auslagern

---

## Kosten

| Modell           | In-Tok  | Out-Tok | Kosten   |
|------------------|---------|---------|----------|
| Claude Sonnet    |    8553 |    2048 | €0.0524 |
| GPT-4o           |    6377 |    1018 | €0.0243 |
| Gemini 2.5 Pro   |    7006 |    2044 | €0.0272 |
| Grok 4           |    7279 |    2594 | €0.0565 |
| Judge (Opus)     |    6866 |    2268 | €0.2540 |
| **Gesamt**       |         |         | **€0.4143** |
