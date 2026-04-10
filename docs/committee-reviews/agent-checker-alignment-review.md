# Committee Review: agent-checker-alignment

> Generiert am 2026-04-09 · Reviewer: Claude Sonnet, GPT-4o, Gemini 2.5 Pro, Grok 4 · Judge: Claude Opus

---

# Audit-Engine Qualitätsbericht: Konsens der Modelle

## 1. Coverage-Lücken

**Konsens-Level**: EINIG

### Top-3 Findings:
1. **Security R5 (HTTP Security Headers)** — Alle Modelle bestätigen: CSP/HSTS-Checks fehlen, nur CORS wird geprüft
2. **Testing R4 (Test Pyramid Balance)** — Einheitlich identifiziert: 70/20/10-Ratio wird nicht automatisch validiert
3. **Testing R1 (CI Test Gate)** — Konsens: Nur Präsenz wird geprüft, nicht ob Tests tatsächlich blockieren

**Priorität**: SOFORT FIXEN für Security R5, NÄCHSTER SPRINT für Testing-Lücken

## 2. False Positives

**Konsens-Level**: EINIG

### Vollständige Liste der False Positives mit Fixes:

#### 1. API Versioning für interne Routes
**Problem**: Feuert für `/api/*` Routes in Next.js-Projekten ohne öffentliche API
```javascript
// FIX für checkApiVersioning:
function isPublicAPI(ctx) {
  return hasFile(ctx.rootPath, 'openapi.yaml') || 
         hasFile(ctx.rootPath, 'docs/api') ||
         ctx.packageJson.description?.includes('API') ||
         hasExternalAPIKeys(ctx);
}

if (!isPublicAPI(ctx)) {
  return pass('Internal API routes - versioning not required');
}
```

#### 2. RLS Coverage für Single-Tenant
**Problem**: Tenant-Isolation-Check feuert auch für Single-Tenant-Projekte
```javascript
// FIX für checkRlsCoverage:
function isMultiTenantProject(ctx) {
  const hasOrgId = ctx.migrations.some(m => 
    m.includes('org_id') || m.includes('tenant_id')
  );
  const hasMultiTenantDeps = ctx.packageJson.dependencies?.['@clerk/nextjs'] ||
                             ctx.packageJson.dependencies?.['@supabase/auth-helpers'];
  return hasOrgId || hasMultiTenantDeps;
}

if (!isMultiTenantProject(ctx)) {
  return pass('Single-tenant project - RLS not required');
}
```

#### 3. Rate Limiting für interne APIs
**Problem**: Rate-Limiting-Check für Projekte ohne öffentliche Endpoints
```javascript
// FIX für checkRateLimiting:
function hasPublicEndpoints(ctx) {
  return hasFile(ctx.rootPath, 'openapi.yaml') ||
         ctx.routes.some(r => r.includes('/public/')) ||
         hasFile(ctx.rootPath, 'nginx.conf');
}

if (!hasPublicEndpoints(ctx)) {
  return pass('No public endpoints - rate limiting optional');
}
```

#### 4. Webhook Validation ohne Webhooks
**Problem**: Webhook-Signature-Check feuert für Projekte ohne Webhook-Integration
```javascript
// FIX für checkWebhookSignatureValidation:
function hasWebhooks(ctx) {
  return ctx.routes.some(r => r.includes('/webhook')) ||
         hasFile(ctx.rootPath, 'src/webhooks') ||
         ctx.packageJson.dependencies?.['@webhook/verifier'];
}

if (!hasWebhooks(ctx)) {
  return pass('No webhooks detected - signature validation not applicable');
}
```

**Priorität**: SOFORT FIXEN — alle False Positives untergraben Vertrauen in die Engine

## 3. Checker-Qualität

**Konsens-Level**: EINIG

### Top-3 Findings:
1. **Security R2 Input Validation**: Checker prüft nur Schema-Imports, ignoriert Headers/Cookies/Files
   - *"Übersieht Header-Validation, Cookie-Parsing, File-Upload-Checks"* (Claude)
   - *"only verifies schema presence within routes"* (GPT-4o)
   
2. **API R4 Resilience Patterns**: Sucht nur nach "AbortController", ignoriert Circuit Breaker
   - *"Übersieht Circuit Breaker, exponential backoff"* (Claude)
   - *"mainly looks for basic usage like timeouts"* (GPT-4o)

3. **Testing R2 Coverage Thresholds**: Prüft nur Config-Existenz, nicht die 80%-Schwelle
   - *"Prüft nicht ob Threshold tatsächlich 80% ist"* (Claude)
   - Grok bestätigt: "prüft nur Präsenz"

**Priorität**: NÄCHSTER SPRINT — Checker-Qualität systematisch verbessern

## 4. Fehlende Agenten

**Konsens-Level**: MEHRHEIT (2 von 3 nennen State Management)

### Top-3 Findings:
1. **State Management Agent** — Claude und implizit Grok erwähnen fehlende State-Checks
   - *"Prevents state leakage between user sessions"* (Claude)
   - Critical für Multi-Tenant-Sicherheit

2. **Documentation/Localization Agent** — GPT-4o betont Internationalisierung
   - *"Content Localization Agent"* für regionale Anpassungen
   - Aktuell nur oberflächlicher README-Check

3. **PWA & Resilience** — Claude identifiziert Lücke
   - *"Nur Manifest-Check, keine echte Resilience"*
   - Offline-Capability und Service Worker fehlen

**Priorität**: NÄCHSTER SPRINT für State Management, KANN WARTEN für Localization

## Nächste Schritte

### Sofort (diese Woche):
1. **False Positive Fixes deployen** — Alle 4 Checker-Anpassungen implementieren
2. **Security R5 Checker bauen** — CSP/HSTS-Header-Validierung ergänzen
3. **Kommunikation** — Teams über angepasste Checker informieren

### Nächster Sprint:
1. **Checker-Qualität Review** — Systematisch alle 3 identifizierten Schwachstellen fixen
2. **State Management Agent** — Neuen Agent für Session/State-Isolation entwickeln
3. **Coverage-Metriken** — Dashboard für Agent-Checker-Alignment aufbauen

### Später:
1. **Localization Agent** — Wenn internationale Expansion ansteht
2. **PWA-Checker** — Service Worker und Offline-Tests erweitern
3. **LLM-basierte Checker** — Für semantische Regeln evaluieren

---

## Kosten

| Modell           | In-Tok  | Out-Tok | Kosten   |
|------------------|---------|---------|----------|
| Claude Sonnet    |   33341 |    1232 | €0.1102 |
| GPT-4o           |   27331 |     514 | €0.0683 |
| Gemini 2.5 Pro   |   29999 |    2045 | €0.0539 |
| Grok 4           |   27598 |    2861 | €0.1169 |
| Judge (Opus)     |    4824 |    1706 | €0.1863 |
| **Gesamt**       |         |         | **€0.5356** |
