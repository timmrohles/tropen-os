# Audit Report
## Web Application Manifest — Audit v2.1

---

**Projekt:** Tropen OS
**Repository:** C:/Users/timmr/tropen OS
**Datum:** 2026-03-15
**Auditor:** Claude Opus 4.6 (automatisierter Code-Review-Audit)
**Version des Manifests:** 2.1
**Vorheriger Audit:** 2026-03-13 (v2.0, Score 45.7%)

---

## Bewertungsskala

| Score | Bedeutung | Gewicht |
|-------|-----------|---------|
| 0 | Nicht vorhanden | 3 = kritisch |
| 1 | Rudimentar | 2 = wichtig |
| 2 | Teilweise | 1 = optional |
| 3 | Solide | |
| 4 | Sehr gut | |
| 5 | Best Practice | |

---

## Audit-Tabelle

| # | Kategorie | Score (0-5) | Gewicht | Gewichtet | Notiz / Begründung |
|---|-----------|-------------|---------|-----------|-------------------|
| 1 | Architektur | 3 | 2 | 6 | Klare Schichtentrennung (api/, lib/, components/, actions/, hooks/). Business-Logik teilweise in `useWorkspaceState.ts` (1126 Zeilen). 10+ Dateien >300 Zeilen (u.a. `admin/qa/page.tsx` 847, `admin/todos/page.tsx` 809). Keine formalen ADRs, aber CLAUDE.md als funktionaler Ersatz. Neue Workspace/Feeds-Module sauber in `src/lib/feeds/` und `src/lib/api/workspaces.ts` isoliert. |
| 2 | Code-Qualität | 4 | 1 | 4 | TS strict mode aktiv. ESLint + Prettier konfiguriert. `@typescript-eslint/no-explicit-any` als warn. Nur 1 verbleibende `any`-Verwendung (deutliche Verbesserung). Strukturiertes Error-Handling (`validateBody()`, Zod-Validierung). `createLogger()` mit JSON-Output in Production und `redact()` für PII. |
| 3 | Sicherheit | 2 | 3 | 6 | Auth-Guards vorhanden (`getAuthUser()`, `canWriteWorkspace()`, `requireSuperadmin()`). RLS auf allen neuen Tabellen (feeds_v2, workspace_plan_c). Prompt Injection Defense auf `/api/public/chat`. CRON_SECRET-Validierung. **Kritisch**: Kein globales Rate Limiting (nur `/api/public/chat`). Keine Security-Header in `next.config.ts` (leer). Kein Middleware-File. Keine Webhook-Signatur-Validierung (email inbound). Keine SSRF-Schutz bei Feed-URL-Fetching. |
| 4 | Datenschutz & Compliance | 2 | 2 | 4 | AI Act Acknowledgement (Onboarding Step 4, Migration 009). Soft-Delete für Conversations + Workspaces. Logger mit `redact()` Funktion. Kein Data-Export-API. Keine `/datenschutz` oder `/accessibility` Seite. Art. 50 KI-VO nicht persistent im Chat-UI. |
| 5 | Datenbank | 4 | 2 | 8 | FK-Constraints durchgängig mit ON DELETE CASCADE/SET NULL. 37 Migrationen (001-033 + 4 Fixes + 2 neue: workspace_plan_c, feeds_v2). Indexes auf allen relevanten Spalten. `content_hash UNIQUE` auf feed_items. APPEND ONLY auf card_history, project_memory, feed_processing_log. JSONB-Felder ohne Shape-Constraints (meta, metadata). |
| 6 | API-Design | 2 | 1 | 2 | Keine API-Versionierung. Kein OpenAPI/Swagger. Workspace-API gut strukturiert (13 neue Routen). Zod-Validierung durchgängig (feeds, workspace-plan-c Validators). Keine Webhook-Signatur-Validierung. Keine Resilience-Patterns (kein Retry/Timeout/Circuit Breaker bei Anthropic-Calls). |
| 7 | Performance | 2 | 2 | 4 | Pagination in workspace chat (limit/offset), admin logs, QA routing. Keine Pagination in `GET /api/projects`, `GET /api/workspaces`. Vercel Auto-CDN. Caching-Strategie nicht explizit definiert. Kein Bundle-Analyzer. |
| 8 | Skalierbarkeit | 2 | 2 | 4 | Stateless (Next.js App Router auf Vercel). Kein Job-Queue (Cron-Job ist synchron: `for`-Loop über alle Quellen). Keine Lasttests. Supabase-managed Scaling. Feed-Token-Budget pro Quelle (500k/Monat) als Soft-Limit. |
| 9 | State Management | 3 | 1 | 3 | Client-State in `useWorkspaceState.ts`, Server-State in Supabase. Kein globaler Store (positiv). Server Actions in `src/actions/feeds.ts` mit Zod-Validierung. Kein Optimistic-Update-Rollback. State-Kategorien implizit getrennt. |
| 10 | Testing | 1 | 3 | 3 | Vitest konfiguriert mit Happy DOM. 10 Test-Dateien (944 Zeilen) für ~22K LOC. Coverage-Thresholds bei 60% (nur `src/lib/qa/**`). Neue Tests: `pipeline.unit.test.ts` (feeds), `card-history.unit.test.ts`, `stale-propagation.unit.test.ts`, `workspace-context.unit.test.ts`, `workspace-time.unit.test.ts`. CI führt Tests aus. Keine E2E-Tests (kein Playwright/Cypress). Keine Tests für API-Routes. |
| 11 | CI/CD | 3 | 3 | 9 | GitHub Actions: `pnpm typecheck`, `pnpm test`, Vercel Deploy auf `main`. PR-Check mit Summary-Comment. Dependabot aktiv. Kein explizites Staging (nur Vercel Preview). Kein Rollback-Plan dokumentiert. Kein `pnpm audit` mehr in CI (war im vorherigen Audit erwähnt). |
| 12 | Observability | 2 | 3 | 6 | JSON-Logging in Production (`createLogger()` mit service-Tag, Timestamp, Level). Kein Sentry mehr erkennbar im aktuellen Branch (keine Imports, keine Config-Dateien). LangSmith Tracing-Integration (`src/lib/langsmith/`). Feed-Processing-Log als Audit-Trail (APPEND ONLY). Kein Uptime-Monitoring. Keine Custom Metrics/APM. |
| 13 | Backup & DR | 1 | 3 | 3 | Supabase-managed Backups (vorhanden, aber undokumentiert). Kein Restore-Test-Protokoll. Kein DR-Runbook. RTO/RPO nicht definiert. PITR nicht verifiziert. |
| 14 | Dependency Management | 4 | 2 | 8 | pnpm-lock.yaml committed. Dependabot weekly (npm + GitHub Actions). Node 20 in CI gepinnt. Kein `.nvmrc` für Entwickler. `@anthropic-ai/sdk` als neue Dependency (direkte Claude-Integration). `msw` für Test-Mocking. |
| 15 | Design System | 4 | 1 | 4 | CSS-Variablen durchgängig (`--accent`, `--bg-base`, `--active-bg`, etc.). Komponenten-Konventionen in CLAUDE.md umfassend dokumentiert (`.card`, `.btn`, `.list-row`, `.chip`, `.page-header`). Phosphor Icons als Standard. Dunkles Theme-Tokens für tropen_-Features definiert. Kein Storybook. |
| 16 | Accessibility | 2 | 2 | 4 | 107 ARIA-Attribute über 16 Dateien. `prefers-reduced-motion` in globals.css. WCAG-Anforderungen in CLAUDE.md dokumentiert. Keine `/accessibility`-Seite. BFSG-Pflicht seit 28.06.2025 nicht erfüllt. Kein axe-core/Lighthouse CI Audit. |
| 17 | Internationalisierung | 0 | 1 | 0 | Kein i18n-Framework. Alle UI-Strings auf Deutsch hardcodiert. Keine Locale-sensitive Formatierung. |
| 18 | Dokumentation | 4 | 1 | 4 | CLAUDE.md ist umfassend (Stack, Konventionen, DB-Schema, Roadmap, alle Migrationen, Phase-2-Architektur, Feeds-v2-Spec). Plan-Dokumente in `docs/plans/` und `docs/superpowers/plans/`. Kein formales ADR-Verzeichnis. Keine OpenAPI-Dokumentation. |
| 19 | Git Governance | 2 | 2 | 4 | CI-Pipeline als impliziter Branch-Schutz. Dependabot aktiv. Kein Commitlint (aber Conventional-Commit-Style in Recent-Commits erkennbar: `feat(feeds):`, `docs:`). Kein CODEOWNERS. Kein expliziter Branch-Protection-Ruleset. Keine Semantic Versioning (package.json: 0.1.0). |
| 20 | Cost Awareness | 3 | 2 | 6 | Budget-System in DB (`check_and_reserve_budget()` RPC). Token-Counter (`src/lib/token-counter.ts`). SessionPanel zeigt Kosten. Feed-Token-Budget pro Quelle (`src/lib/feeds/token-budget.ts`, 500k Tokens/Monat). Haiku für Stage 2 (token-sparend). Keine Cloud-Budget-Alerts. |
| 21 | PWA & Resilience | 0 | 1 | 0 | Kein `manifest.json`. Kein Service Worker. Kein Offline-Fallback. |
| 22 | AI Integration | 2 | 2 | 4 | Prompt Injection Defense auf Public Chat (10 Regex-Patterns). Token-Limits (max_tokens 600 auf Public, Stage 2 max 300). 3-Stage Feed Pipeline (Stage 1 = 0 Tokens). LLM-Output-Validierung: Zod-Parse auf Briefing-Proposal (`briefingProposalSchema`). Kein globaler Fallback bei Modellausfall. Kein Output-Validator für Feed-Stage-2/3. Anthropic-SDK direkt (kein Dify für neue Features). |
| 23 | Infrastructure | 2 | 2 | 4 | Vercel (Multi-Region, Autoscaling automatisch) + Supabase EU. Kein `/health`-Endpoint. Kein Multi-AZ-Plan dokumentiert. RLS als Zugriffskontrolle auf DB-Ebene. Cron-Job via Vercel Cron (`GET /api/cron/sync-feeds`). |
| 24 | Supply Chain Security | 1 | 2 | 2 | Dependabot tracked Vulnerabilities. Deterministic Lockfile. Kein SBOM. Keine Signed Builds. Kein Sigstore/SLSA. |
| 25 | Namenskonventionen & Dateihygiene | 3 | 1 | 3 | kebab-case für Dateien durchgängig. Projektstruktur folgt Next.js App Router Standard. 10+ Dateien >300 Zeilen (dokumentierte Ausnahmen in CLAUDE.md). Keine unused imports (ESLint `no-unused-vars` aktiv). Utility-Funktionen sauber in `src/lib/` organisiert (feeds/, api/, qa/, validators/). Mapper-Funktionen in actions/feeds.ts dupliziert (camelCase-Mapping). |
| | **GESAMT** | | **Summe 47** | **107 / 235** | |

---

## Berechnung

```
Gesamtscore = Summe(Score * Gewicht) / Summe(5 * Gewicht) * 100

Summe max. Gewicht = 47
Summe max. gewichteter Score = 235

Erreichter Score: 107 / 235
Prozent: 45.5%
```

| Score | Status |
|-------|--------|
| 85-100 % | Production Grade |
| 70-84 % | Stable |
| 50-69 % | Risky |
| **< 50 %** | **Prototype** |

**Ergebnis: 45.5% -- Prototype**

> Das Ergebnis ist nahezu identisch zum vorherigen Audit (45.7%). Die neuen Features (Feeds v2, Workspace Plan C) wurden mit guter Codequalität implementiert (Zod-Validierung, Structured Logging, RLS, Tests), heben aber den Gesamtscore nicht, da strukturelle Defizite (fehlende Security-Headers, kein E2E-Testing, kein DR-Runbook, keine SBOM) unverändert bestehen. Sentry scheint im aktuellen Branch entfernt oder noch nicht migriert worden zu sein, was den Observability-Score von 3 auf 2 senkt.

---

## Delta zum vorherigen Audit (2026-03-13)

| Kategorie | Vorher | Jetzt | Delta | Begründung |
|-----------|--------|-------|-------|------------|
| Architektur | 3 | 3 | = | Neue Module sauber strukturiert, aber mehr grosse Dateien (admin/qa 847, admin/todos 809) |
| Code-Qualität | 4 | 4 | = | `any`-Nutzung stark reduziert (51 -> 1). Zod-Validierung in neuen Modulen konsequent. |
| Sicherheit | 2 | 2 | = | Keine Security-Headers (next.config.ts leer). Kein Middleware. Kein Rate Limiting global. Feed-Email-Webhook ohne Signatur-Validierung (neu). |
| Observability | 3 | 2 | -1 | Sentry-Integration nicht im aktuellen Branch nachweisbar (keine Imports, keine Config). Logger vorhanden, aber herabgestuft. |
| Testing | 1 | 1 | = | 6 neue Test-Dateien (10 total, 944 Zeilen). Positiver Trend, aber Coverage noch zu niedrig für Aufstufung. |
| Cost Awareness | 3 | 3 | = | Feed-Token-Budget neu hinzugekommen (`token-budget.ts`). |
| AI Integration | 2 | 2 | = | Briefing-Proposal mit Zod-Validierung (LLM-Output). Aber kein Fallback bei Modellausfall. |
| Namenskonventionen | n/a | 3 | neu | Neue Kategorie in diesem Audit. |

---

## Kritische Findings (Score 0-1 in gewichteten Kategorien)

| Kategorie | Score | Sofortmassnahme |
|-----------|-------|----------------|
| Sicherheit (Gewicht 3) | 2 | Security-Headers in `next.config.ts` setzen (CSP, HSTS, X-Frame-Options). Next.js Middleware fuer globales Rate Limiting. Webhook-Signatur-Validierung fuer Email-Inbound. |
| Testing (Gewicht 3) | 1 | E2E-Tests fuer kritische User Journeys (Login, Chat, Feed-Setup). Coverage-Thresholds auf Workspace/Feed-Libs ausweiten. |
| Backup & DR (Gewicht 3) | 1 | Supabase PITR verifizieren + dokumentieren. DR-Runbook erstellen. Restore-Test durchfuehren. |
| Observability (Gewicht 3) | 2 | Sentry-Integration wiederherstellen/verifizieren. Uptime-Monitoring einrichten. |
| Supply Chain Security (Gewicht 2) | 1 | SBOM mit `syft` generieren. In CI integrieren. |

---

## Massnahmenplan

### Sofort (vor naechstem Release)
- [ ] **Sicherheit**: Security-Headers in `next.config.ts` setzen: CSP, X-Frame-Options DENY, X-Content-Type-Options nosniff, Strict-Transport-Security, Referrer-Policy.
- [ ] **Sicherheit**: Email-Inbound-Webhook (`/api/feeds/inbound/email`) muss Resend-Webhook-Signatur validieren (HMAC-basiert).
- [ ] **Sicherheit**: SSRF-Schutz bei Feed-URL-Fetching: Private-IP-Ranges blockieren, Allowlist fuer Schemata (http/https only).
- [ ] **Observability**: Sentry-Integration pruefen -- falls entfernt, wiederherstellen (war im vorherigen Audit als vollständig integriert bewertet).
- [ ] **Backup & DR**: Supabase Dashboard: PITR-Status pruefen und als `docs/runbooks/disaster-recovery.md` dokumentieren.

### Kurzfristig (naechste 4 Wochen)
- [ ] **Sicherheit**: Next.js Middleware (`src/middleware.ts`) mit globalem Rate Limiting (z.B. `@upstash/ratelimit`).
- [ ] **Testing**: Mindestens 1 E2E-Test fuer kritische Journey (Login -> Chat -> erste Nachricht) mit Playwright.
- [ ] **Testing**: Coverage-Thresholds in vitest.config.ts auf `src/lib/feeds/**` und `src/lib/api/**` ausweiten.
- [ ] **API-Design**: Pagination fuer `GET /api/projects` und `GET /api/workspaces` (limit + offset, max 50).
- [ ] **Observability**: Uptime-Monitoring einrichten (BetterUptime, UptimeRobot) + Alerting.
- [ ] **Compliance**: `/datenschutz` und `/accessibility` Seiten veroeffentlichen (BFSG-Pflicht).
- [ ] **CI/CD**: `pnpm audit --audit-level=critical` zurueck in CI-Pipeline.
- [ ] **Dependency Management**: `.nvmrc` mit `20` anlegen.

### Mittelfristig (naechstes Quartal)
- [ ] **Testing**: Coverage auf gesamte Codebase ausweiten (Ziel: 70% fuer `src/lib/`). Vitest-Thresholds entsprechend setzen.
- [ ] **AI Integration**: Fallback-Strategie bei Anthropic-Ausfall (Error-Message + automatisches Retry mit exponential backoff + Budget-Check).
- [ ] **AI Integration**: Output-Validierung fuer Feed-Stage-2/3 (Zod-Parse auf JSON-Responses von Haiku/Sonnet).
- [ ] **Architektur**: Formale ADRs fuer Top 5 Entscheidungen (`docs/adr/`): Supabase als Auth+DB, Next.js App Router, pgvector fuer RAG, Soft-Delete-Pattern, Anthropic SDK direkt statt Dify.
- [ ] **Supply Chain**: SBOM mit `syft` in CI-Pipeline.
- [ ] **Performance**: `@next/bundle-analyzer` einmalig ausfuehren, Bundle-Report dokumentieren.
- [ ] **API-Design**: Resilience-Pattern fuer Anthropic-Calls: Timeout (30s), 1 Retry, Fehler-Fallback-Message.
- [ ] **Skalierbarkeit**: Feed-Sync-Cron parallelisieren (aktuell sequentielle `for`-Loop).

---

## Positive Highlights

| Staerke | Details |
|---------|---------|
| Dokumentation | CLAUDE.md ist umfassend und aktuell -- deckt Phase 2, Feeds v2, Workspace Plan C, alle Migrationen ab |
| Datenbank | 37 Migrationen, FK-Constraints, RLS auf allen neuen Tabellen, APPEND ONLY fuer Audit-Trails |
| Code-Qualitaet | `any`-Nutzung auf 1 reduziert (vorher 51). Zod-Validierung durchgaengig in neuen Features. |
| Auth & RBAC | `getAuthUser()`, `canReadWorkspace()`, `canWriteWorkspace()` -- konsistentes Pattern in allen neuen API-Routes |
| Feed-Pipeline | 3-Stage-Design (0 Tokens -> Haiku -> Sonnet) mit Token-Budget-Check. Feedback-Loop fuer Stage-2-Prompt-Enrichment. |
| Structured Logging | `createLogger()` mit Service-Tags, JSON in Production, `redact()` fuer PII |
| Neue Tests | 6 neue Unit-Test-Dateien fuer Plan C Module (card-history, stale-propagation, workspace-context, workspace-time, feeds pipeline) |
| Design System | CSS-Variablen, Komponenten-Konventionen, Phosphor Icons -- durchgaengig eingehalten |
| Cost Awareness | Budget-RPC, Token-Counter, SessionPanel, Feed-Token-Budget (500k/Monat/Quelle) |

---

## Neue Features seit letztem Audit

### Feeds v2 (Migration 20260314000036)
- Vollstaendiges Redesign: `feed_sources`, `feed_items`, `feed_schemas`, `feed_distributions`, `feed_processing_log`
- 3-Stage Pipeline: Stage 1 (regelbasiert, 0 Tokens), Stage 2 (Haiku Scoring), Stage 3 (Sonnet Deep)
- Email-Inbound-Webhook (`/api/feeds/inbound/email`)
- Cron-Job (`/api/cron/sync-feeds`) mit CRON_SECRET-Auth
- Server Actions in `src/actions/feeds.ts`
- Zod-Validierung (`src/lib/validators/feeds.ts`)
- Unit-Tests fuer Pipeline (`pipeline.unit.test.ts`)

### Workspace Plan C (Migration 20260314000035)
- Cards CRUD mit APPEND ONLY `card_history`
- Stale-Propagation (`src/lib/stale-propagation.ts`)
- Briefing-Flow mit Anthropic SDK (`/api/workspaces/[id]/briefing`)
- Export-System (chat, markdown)
- Workspace-Chat (Silo + Karten-Chat)
- Assets-Management
- Context-Builder (`src/lib/workspace-context.ts`)
- Time-Travel (`src/lib/workspace-time.ts`)
- 5 neue Unit-Test-Dateien

---

## Naechster Audit

**Geplant fuer:** 2026-06-15 (Q2 2026)
**Verantwortlich:** Timm Rotter
**Ziel:** Risky (>=50%) -- erreichbar mit Sofort- + Kurzfristmassnahmen (Security-Headers, E2E-Tests, DR-Runbook, Sentry-Fix)
