# Agent-Updates aus Komitee-Reviews

**Datum:** 2026-04-09
**Gesamt-Kosten:** €2.1769

## Übersicht

| Agent | Findings | Geänderte Regeln | Kosten | Status |
|-------|----------|------------------|--------|--------|
| API_AGENT | 3 | R1, R4, R-Webhook | €0.5421 | ✅ |
| SECURITY_AGENT_FINAL | 3 | R5, R6, R4 | €0.7430 | ✅ |
| TESTING_AGENT | 3 | R1, R4, R2 | €0.4266 | ✅ |
| ACCESSIBILITY_AGENT | 1 | META | €0.4652 | ✅ |

## Details

### API_AGENT

**R1** (agent-checker-alignment-review)
- Problem: API Versioning Regel feuert für interne Next.js Routes. Braucht Applicability-Qualifier: nur für Projekte mit öffentlicher API (openapi.yaml, docs/api vorhanden).
- Aktion: Applicability-Block unter dem Regel-Titel hinzufügen. Severity von CRITICAL auf WARNING senken. Enforcement von BLOCKED auf REVIEWED senken.

**R4** (agent-checker-alignment-review)
- Problem: Resilience-Patterns zu eng definiert — nur Timeout erwähnt. Circuit Breaker, exponential Backoff, Graceful Degradation fehlen.
- Aktion: R4 Bad/Good Beispiele erweitern um Circuit Breaker und exponential Backoff Patterns. Bestehende Beispiele behalten.

**R-Webhook** (agent-checker-alignment-review)
- Problem: Webhook-Signatur-Check feuert für Projekte ohne Webhook-Integration.
- Aktion: Applicability-Qualifier unter dem Regel-Titel: "Gilt nur wenn Webhook-Routes oder Webhook-Dependencies (stripe, github-webhooks etc.) im Projekt existieren."

### SECURITY_AGENT_FINAL

**R5** (agent-checker-alignment-review)
- Problem: Security Headers Regel prüft nur CORS. CSP, HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy fehlen.
- Aktion: R5 erweitern: vollständige Header-Liste mit konkreten empfohlenen Werten und Bad/Good Beispiele für jeden Header. Bestehende CORS-Beispiele behalten.

**R6** (agent-checker-alignment-review)
- Problem: Rate Limiting feuert für Projekte ohne öffentliche Endpoints.
- Aktion: Applicability-Qualifier: "Gilt nur für Projekte mit öffentlichen oder Auth-Endpoints. Interne Tool-only-Apps sind ausgenommen."

**R4** (agent-checker-alignment-review)
- Problem: Tenant Isolation / RLS Check feuert für Single-Tenant-Projekte.
- Aktion: Applicability-Qualifier: "Gilt nur für Multi-Tenant-Projekte (org_id, tenant_id oder workspace_id im DB-Schema)."

### TESTING_AGENT

**R1** (agent-checker-alignment-review)
- Problem: Regel "Tests in CI" ist zu vage — prüft nur ob CI existiert, nicht ob Tests den Merge blockieren.
- Aktion: R1 präzisieren: "Tests MÜSSEN den Merge blockieren (required status check)". Bad/Good Beispiel mit GitHub Actions required-status-check-Config ergänzen.

**R4** (agent-checker-alignment-review)
- Problem: Test-Pyramide 70/20/10 Ratio ist nicht automatisch prüfbar wie beschrieben.
- Aktion: R4 Enforcement von BLOCKED auf REVIEWED ändern. Ergänze Heuristik: Dateianzahl in unit/ vs e2e/ vs integration/ als Proxy, nicht exakte Ratio. Titel entsprechend anpassen.

**R2** (agent-checker-alignment-review)
- Problem: Coverage-Threshold prüft nur Config-Existenz, nicht den tatsächlichen Schwellenwert.
- Aktion: R2 GUIDE-Block erweitern: "Checker muss die Coverage-Config parsen und validieren dass der Threshold-Wert ≥80% ist — nicht nur die Existenz der Config-Datei prüfen."

### ACCESSIBILITY_AGENT

**META** (audit-scoring-review)
- Problem: Accessibility Gewicht sollte ×3 sein statt ×2 wegen EU Accessibility Act 2025 (Pflicht für B2B SaaS ab Juni 2025).
- Aktion: Im Purpose-Abschnitt ergänzen: "Gewicht im Audit: ×3 (kritisch — EU Accessibility Act 2025 ist seit Juni 2025 in Kraft und gilt für B2B SaaS)." Wenn ein Meta-Block mit Gewicht existiert, dort updaten.
