# Audit Report
## Web Application Manifest — Audit v2.1

---

**Projekt:** Tropen OS
**Repository:** C:/Users/timmr/tropenOS
**Datum:** 2026-03-19
**Auditor:** Claude Sonnet 4.6 (automatisierter Code-Review-Audit)
**Version des Manifests:** 2.1
**Vorheriger Audit:** 2026-03-15 (Score 45.5%)

---

## Bewertungsskala

| Score | Bedeutung | Gewicht |
|-------|-----------|---------|
| 0 | Nicht vorhanden | 3 = kritisch |
| 1 | Rudimentär | 2 = wichtig |
| 2 | Teilweise | 1 = optional |
| 3 | Solide | |
| 4 | Sehr gut | |
| 5 | Best Practice | |

---

## Audit-Tabelle

| # | Kategorie | Score (0–5) | Gewicht | Gewichtet | Notiz / Begründung |
|---|-----------|-------------|---------|-----------|-------------------|
| 1 | Architektur | 3 | 2 | 6 | Dependency Cruiser konfiguriert (`.dependency-cruiser.cjs`, `pnpm lint:deps` in CI). Schichtenverletzungen werden als Error geblockt (`lib-no-ui`, `services-no-ui`). Klare Schichtentrennung api/, lib/, components/, actions/, hooks/. 25 Dateien > 300 Zeilen (u.a. `DataView.tsx` 793, `feeds/page.tsx` 505, `WorkspaceBriefing.tsx` 470). Keine formalen ADRs vorhanden — werden in diesem Audit angelegt. `library-resolver.ts` 267 Zeilen, gut innerhalb Grenze. Business-Logik korrekt in `src/lib/` und `src/services/` isoliert — keine in Komponenten gefunden. |
| 2 | Code-Qualität | 4 | 1 | 4 | TS strict mode aktiv (`tsconfig.json: "strict": true`). ESLint (`eslint.config.mjs`) + Prettier (`.prettierrc`) konfiguriert. Design System Lint als eigener CI-Step. 12 `: any`-Verwendungen (vorher 1 — angestiegen, aber noch im vertretbaren Rahmen). `createLogger()` mit JSON-Output in Production. Dependency Cruiser blockiert Architekturverstöße in CI. Magic Numbers vereinzelt in API-Routen (max_tokens inline). |
| 3 | Sicherheit | 3 | 3 | 9 | **Signifikante Verbesserungen seit letztem Audit.** Security-Headers vollständig in `next.config.ts` (HSTS, X-Frame-Options DENY, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, CSP). Rate Limiting in `src/proxy.ts` mit 4 Stufen (auth: 10/15min, public: 20/1h, chat: 30/1min, api: 200/1min) via Upstash Redis. Webhook-Signatur-Validierung für Agenten-Webhooks (HMAC-SHA256). Auth-Guards konsistent (`getAuthUser()`, `canWriteWorkspace()`). Sentry aktiv (`sentry.*.config.ts`, `withSentryConfig` in `next.config.ts`). **Offen**: Feed-URL-Fetcher ohne SSRF-Schutz (`src/lib/feeds/fetchers/url.ts`, `rss.ts`, `api.ts` — kein Private-IP-Block). Email-Inbound-Webhook ohne Resend-Signaturvalidierung (`src/app/api/feeds/inbound/email/route.ts`). `api.dify.ai` noch in CSP (Dify abgelöst). `log.error('Invite error for', email, e)` in `onboarding/complete/route.ts` loggt PII. |
| 4 | Datenschutz & Compliance | 2 | 2 | 4 | `/datenschutz` Route vorhanden (`src/app/datenschutz/page.tsx`) aber Betreiber-Daten unvollständig (`[Anschrift]`-Platzhalter). AI Act Dokumente vorhanden (`docs/AI Act Risk Navigator*.pdf`, `docs/tuev-ai-matrix-mapping-tropen.docx`). Soft-Delete für Conversations + Workspaces. Logger mit `redact()`. Kein Data-Export-API. Kein VVT (Verzeichnis der Verarbeitungstätigkeiten). Art. 50 KI-VO-Hinweis nicht persistent im Chat-UI nachweisbar. PII in einem Log (email in `onboarding/complete/route.ts`). |
| 5 | Datenbank | 4 | 2 | 8 | FK-Constraints durchgängig mit ON DELETE CASCADE/SET NULL. 56 Migrationen (001–056). RLS auf allen neuen Tabellen aktiviert: announcements, library_versions, roles, skills, agents_v2, feed_topics, feed_data_sources, feed_runs, capability_outcome_system. APPEND ONLY Tabellen korrekt markiert: `card_history`, `project_memory`, `feed_processing_log`, `feed_data_records`, `feed_runs`, `agent_runs`. Indexes auf allen relevanten Spalten. `conversations` Migration 049 und 050 fügen Spalten ohne neue RLS-Policies hinzu — bestehende RLS aus `002_rls.sql` deckt Basisschutz ab, aber `workspace_id`-Scoping nicht explizit in Policies. `supabaseAdmin` aus Backend korrekt genutzt (bypasses RLS absichtlich). |
| 6 | API-Design | 2 | 1 | 2 | Keine API-Versionierung (alle Routes unter `/api/` ohne `/v1/`). Kein OpenAPI/Swagger. 117 API-Routen insgesamt — gut strukturiert. Zod-Validierung via `validateBody()` durchgängig in neuen Features. Webhook-Signaturvalidierung für Agenten vorhanden. Kein Retry/Timeout/Circuit Breaker für Anthropic-API-Calls. `debug/feeds` Route in Produktion erreichbar (kein Auth-Guard erkennbar). |
| 7 | Performance | 3 | 2 | 6 | Pagination in `GET /api/projects` (limit/offset, max 100). `GET /api/workspaces` ohne explizite Pagination (gibt alle zurück, aber mit Org-Scoping). Vercel Auto-CDN. Service Worker vorhanden (`public/sw.js`): Network-first für APIs, Cache-first für statische Assets, Offline-Fallback auf `/offline`. Cache-Revalidate in QA-Routes (`revalidate = 60/300`). Kein Bundle-Analyzer. Keine Lighthouse-Baseline dokumentiert. |
| 8 | Skalierbarkeit | 2 | 2 | 4 | Stateless (Next.js App Router auf Vercel). Kein Job-Queue: Feed-Cron ist sequentieller `for`-Loop (`src/app/api/cron/sync-feeds/route.ts`), Agenten-Cron ebenfalls. Vercel-Autoscaling automatisch. Keine Lasttests. Feed-Token-Budget pro Quelle als Soft-Limit. |
| 9 | State Management | 3 | 1 | 3 | Client-State in `useWorkspaceState.ts` (388 Zeilen). Server-State via Supabase. Kein globaler Store (positiv). Server Actions in `src/actions/feeds.ts`, `src/actions/workspaces.ts`. Zod-Validierung in Actions. Kein Optimistic-Update-Rollback. State-Kategorien implizit getrennt. |
| 10 | Testing | 2 | 3 | 6 | **Deutliche Verbesserung.** 22 Testdateien in `src/` (unit + integration). 3 E2E-Tests in `e2e/` (`login.spec.ts`, `authenticated-chat.spec.ts`, `toro-widget.spec.ts`). CI-Pipeline führt alle Tests aus (typecheck → unit → build → E2E). Security Audit in CI (`pnpm audit --audit-level=critical`). Neue Tests seit letztem Audit: `capability-resolver.unit.test.ts`, `guided-workflow-engine.unit.test.ts`, `feed-runner.unit.test.ts`, `project-context.unit.test.ts`, `validators/capabilities.unit.test.ts`, `validators/guided.unit.test.ts`, `validators/transformations.unit.test.ts`. Coverage-Thresholds nur auf 7 Files gesetzt (70%), Ziel 80% auf Business-Logik noch nicht erreicht. Keine Tests für API-Routes (117 Routes). KI-Code-Gate (90% Coverage) nicht erfüllt. |
| 11 | CI/CD | 4 | 3 | 12 | **Signifikante Verbesserung.** Vollständige Pipeline: Security Audit → Design System Lint → Dependency Check → Typecheck → Unit Tests → E2E Tests → Deploy. Kein direkter Push auf main (Pipeline als Schutz). Separate `design-lint.yml` für UI-Changes. `pr-check.yml` vorhanden. Dependabot wöchentlich (npm + GitHub Actions). Vercel Deploy auf main. Test-Ergebnisse werden in Supabase geschrieben. Kein explizites Staging-Environment. Kein Rollback-Runbook. Kein Branch-Protection-Ruleset im GitHub-Repo verifizierbar. |
| 12 | Observability | 3 | 3 | 9 | **Verbesserung.** Sentry aktiv: `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, `withSentryConfig` in `next.config.ts`, Sentry-Import in `src/app/error.tsx` und `src/app/global-error.tsx`. JSON-Logging (`createLogger()`) mit Service-Tags, Timestamps. `redact()` für PII-Schutz. Feed-Processing-Log als Audit-Trail (APPEND ONLY). LangSmith Tracing-Integration vorhanden. Kein `instrumentation.ts` für OpenTelemetry. Kein Uptime-Monitoring. Keine Custom Metrics/APM. Keine Status-Page. |
| 13 | Backup & DR | 1 | 3 | 3 | Supabase-managed Backups (undokumentiert). Kein Restore-Test-Protokoll. Kein DR-Runbook. RTO/RPO nicht definiert. PITR nicht verifiziert. `docs/runbooks/` Verzeichnis nicht vorhanden. Unverändert seit letztem Audit. |
| 14 | Dependency Management | 4 | 2 | 8 | pnpm-lock.yaml committed. Dependabot wöchentlich (npm + GitHub Actions, Major-Updates manuell). Node 20 in CI gepinnt. `.nvmrc` vorhanden mit `20`. `pnpm audit --audit-level=critical` in CI. Kein Renovate (Dependabot ausreichend). |
| 15 | Design System | 4 | 1 | 4 | CSS-Variablen durchgängig. Design System Lint als CI-Step mit automatischem PR-Comment. Komponenten-Konventionen in CLAUDE.md umfassend. Phosphor Icons als Standard. Kein Storybook. Theme-Color in `manifest.json` nutzt alten Hex-Wert `#a3b554` (abgelöstes dunkles Theme — sollte `#2D7A50` sein). |
| 16 | Accessibility | 2 | 2 | 4 | ARIA-Attribute vorhanden. `prefers-reduced-motion` in globals.css. WCAG-Anforderungen in CLAUDE.md dokumentiert. `/datenschutz` Route vorhanden. Keine `/accessibility` Seite. BFSG-Pflicht seit 28.06.2025 nicht vollständig erfüllt (Datenschutzerklärung mit Platzhaltern). Kein axe-core/Lighthouse CI Audit. |
| 17 | Internationalisierung | 0 | 1 | 0 | Kein i18n-Framework. Alle UI-Strings auf Deutsch hardcodiert. Keine Locale-sensitive Formatierung. Unverändert. |
| 18 | Dokumentation | 4 | 1 | 4 | CLAUDE.md umfassend und aktuell (alle Migrations bis 056, Library-System, Agenten-System, Chat, Guided Workflows, Design System). Architect Log vorhanden (`docs/architect-log.md`) mit Einträgen bis 2026-03-19. Umfangreiche Plan-Dokumente. Kein formales ADR-Verzeichnis (wird in diesem Audit angelegt). Keine OpenAPI-Dokumentation. README nicht geprüft. |
| 19 | Git Governance | 2 | 2 | 4 | Conventional Commits konsequent eingehalten (feat:, fix:, docs:, chore: — verifiziert in letzten 20 Commits). CI-Pipeline als impliziter Branch-Schutz. Dependabot aktiv. Mehrere aktive Feature-Branches (`feature/plan-f-canvas-chat-fixes`, `feat/plan-j1`, `feat/plan-j2bc`). Kein expliziter Branch-Protection-Ruleset (keine GitHub-Settings einsehbar). Kein Semantic Versioning (`package.json: 0.1.0`). `package.json` hat kein `engines`-Feld (nur `.nvmrc`). |
| 20 | Cost Awareness | 3 | 2 | 6 | Budget-System in DB (`check_and_reserve_budget()` RPC). Token-Counter (`src/lib/token-counter.ts`). Feed-Token-Budget (`src/lib/feeds/token-budget.ts`, 500k Tokens/Monat pro Quelle). Haiku für token-sparende Operations. Vendor-Abstraktionslayer via `src/lib/library-resolver.ts` (Model-Agnostik). Keine Cloud-Budget-Alerts. Kein Token-Budget per User im Chat (nur Feed-Budget). |
| 21 | PWA & Resilience | 3 | 1 | 3 | `manifest.json` vorhanden mit Name, Icons (192+512 SVG), Start-URL, Display-Mode, Shortcuts. Service Worker (`public/sw.js`) mit Network-first/Cache-first-Strategie, Offline-Fallback auf `/offline`. HTTPS via Vercel. `theme_color: "#a3b554"` ist das abgelöste dunkle Theme-Token. SVG-Icons statt PNG (kein `maskable` PNG für maximale Kompatibilität). |
| 22 | AI Integration | 3 | 2 | 6 | Library-Resolver-System: Rollen, Skills, Capabilities, Outcomes strukturiert. Token-Limits überall definiert (max_tokens: 300–2048 je nach Endpoint). Feed-Token-Budget. Haiku-Fallback in `library-resolver.ts` (Zeile 119). Zod-Validierung für LLM-Output in Briefing-Flow. Kein globaler Fallback bei Anthropic-Ausfall für Chat-Endpoints. Kein Output-Validator für Feed-Stage-2/3. Prompt-Injection-Defense: User-Input wird nie unkontrolliert in System-Prompts eingefügt (System-Prompts kommen aus DB, User-Content als separate `messages`). Kein deterministic mode (temperature) dokumentiert. |
| 23 | Infrastructure | 3 | 2 | 6 | `/api/health` Endpoint vorhanden: DB-Ping, Latenz-Messung, Version, HTTP 200/503. Vercel (Multi-Region, Autoscaling automatisch) + Supabase EU. Cron-Jobs in `vercel.json` (sync-feeds 6 Uhr, agents 7 Uhr). CRON_SECRET-Auth auf Cron-Endpoints. Kein Multi-AZ-Plan dokumentiert (Vercel macht das transparent). Kein explizites Netzwerk-Segmentierungskonzept. |
| 24 | Supply Chain Security | 1 | 2 | 2 | Dependabot tracked Vulnerabilities. Deterministic Lockfile (pnpm-lock.yaml). `pnpm audit --audit-level=critical` in CI. Kein SBOM. Keine Signed Builds. Kein Sigstore/SLSA. |
| 25 | Namenskonventionen & Dateihygiene | 3 | 1 | 3 | kebab-case für Ordner durchgängig. PascalCase für Komponenten. Projektstruktur folgt Next.js App Router Standard. `src/app/api/debug/feeds/route.ts` Debug-Route in Produktion erreichbar. 25 Dateien > 300 Zeilen (CI warnt ab 300, Error ab 500 — `DataView.tsx` 793 Zeilen ist Error-Kandidat). Dependency Cruiser in CI. Keine unused imports (ESLint aktiv). Mapper-Funktionen in `actions/feeds.ts` und `actions/workspaces.ts` könnten konsolidiert werden. |
| | **GESAMT** | | | **126 / 235** | |

---

## Berechnung

```
Gesamtscore = Σ(Score × Gewicht) / Σ(5 × Gewicht) × 100

Σ(Gewicht) = 47
Σ(5 × Gewicht) = 235

Erreichter Score: 126 / 235
Prozent: 53.6%
```

| Score | Status |
|-------|--------|
| 85–100 % | 🟢 Production Grade |
| 70–84 % | 🟡 Stable |
| 50–69 % | 🟠 Risky |
| **53.6 %** | **🟠 Risky** |

**Ergebnis: 53.6% — Risky (vorher: 45.5% Prototype)**

Delta: **+8.1 Prozentpunkte** — erstmalig über der Prototype-Schwelle.

---

## Delta zum vorherigen Audit (2026-03-15)

| Kategorie | Vorher | Jetzt | Delta | Begründung |
|-----------|--------|-------|-------|------------|
| Sicherheit | 2 | 3 | +1 | Security-Headers gesetzt, Rate Limiting in proxy.ts, Webhook-HMAC, Sentry aktiv |
| Testing | 1 | 2 | +1 | 22 Testdateien (vorher 10), E2E-Tests vorhanden, CI integriert |
| CI/CD | 3 | 4 | +1 | Design-Lint, Dependency-Check, E2E in CI, Security Audit, PR-Check |
| Observability | 2 | 3 | +1 | Sentry verifiziert aktiv (next.config.ts + error.tsx), LangSmith |
| Performance | 2 | 3 | +1 | Service Worker, Offline-Fallback, Pagination in projects, Caching in QA |
| AI Integration | 2 | 3 | +1 | Library-System, strukturierte Rollen/Skills/Capabilities, Haiku-Fallback |
| Infrastructure | 2 | 3 | +1 | /health Endpoint vorhanden und vollständig |
| PWA & Resilience | 0 | 3 | +3 | manifest.json + Service Worker + Offline-Fallback |
| Dependency Management | 4 | 4 | = | .nvmrc nun vorhanden (war vorher Kritikpunkt) |
| Architektur | 3 | 3 | = | Dependency Cruiser neu, aber mehr große Dateien |
| Backup & DR | 1 | 1 | = | Keine Maßnahmen ergriffen — kritisch |
| Supply Chain | 1 | 1 | = | Kein SBOM implementiert |
| Datenschutz | 2 | 2 | = | /datenschutz vorhanden aber unvollständig |

---

## Kritische Findings (Score ≤ 2 in hoch-gewichteten Kategorien)

| Kategorie | Score | Gewicht | Sofortmaßnahme |
|-----------|-------|---------|----------------|
| Backup & DR | 1 | 3 | Supabase PITR-Status prüfen + dokumentieren. `docs/runbooks/disaster-recovery.md` erstellen. Restore-Test durchführen und protokollieren. |
| Sicherheit | 3 | 3 | SSRF-Schutz in Feed-Fetchern: Private-IP-Ranges blockieren (`127.`, `192.168.`, `10.`, `::1`). Resend-Webhook-Signatur in `/api/feeds/inbound/email`. `api.dify.ai` aus CSP entfernen (Dify abgelöst). PII-Log in `onboarding/complete/route.ts` Zeile 140 beheben. |
| Supply Chain | 1 | 2 | SBOM mit `syft` generieren und in CI integrieren. |
| API-Design | 2 | 1 | `debug/feeds` Route in Produktion absichern oder entfernen. |

---

## Maßnahmenplan

### Sofort (vor nächstem Feature-Release)

- [ ] **Sicherheit**: SSRF-Schutz in `src/lib/feeds/fetchers/url.ts`, `rss.ts`, `api.ts`: Private-IP-Ranges blockieren (127.x, 192.168.x, 10.x, ::1). URL-Schema-Allowlist (nur http/https).
- [ ] **Sicherheit**: Resend-Webhook-Signaturvalidierung in `src/app/api/feeds/inbound/email/route.ts` (HMAC-basiert, analog zu Agenten-Webhook).
- [ ] **Sicherheit**: `api.dify.ai` aus CSP `connect-src` entfernen (Dify ist abgelöst seit 2026-03-17).
- [ ] **Sicherheit / Datenschutz**: `log.error('Invite error for', email, e)` in `src/app/api/onboarding/complete/route.ts` Zeile 140 — E-Mail-Adresse aus Log entfernen, stattdessen User-ID loggen.
- [ ] **Architektur**: Debug-Route `src/app/api/debug/feeds/route.ts` absichern (Superadmin-Guard) oder aus Produktion entfernen.
- [ ] **Backup & DR**: Supabase Dashboard öffnen → PITR-Status prüfen → `docs/runbooks/disaster-recovery.md` erstellen (Template: RTO < 4h, RPO < 1h, Restore-Schritte, Verantwortliche).

### Kurzfristig (nächste 4 Wochen)

- [ ] **Testing**: Coverage-Thresholds in `vitest.config.ts` auf alle `src/lib/` Files ausweiten (Ziel: 70% → 80%). Aktuell nur 7 Files abgedeckt.
- [ ] **Testing**: API-Routes testen — mindestens `GET /api/projects`, `POST /api/workspaces`, `GET /api/health`.
- [ ] **Architektur**: `src/app/feeds/DataView.tsx` (793 Zeilen) aufteilen — CI-Error-Kandidat (> 500 Zeilen).
- [ ] **Datenschutz**: Datenschutzerklärung vervollständigen — `[Anschrift]`-Platzhalter ersetzen, Rechtsgrundlagen pro Datenkategorie dokumentieren.
- [ ] **Design System**: `manifest.json` `theme_color` von `#a3b554` auf `#2D7A50` korrigieren (abgelöstes dunkles Theme-Token).
- [ ] **Performance**: `/api/workspaces` mit limit/offset Pagination ausstatten (aktuell unbegrenzt).
- [ ] **Git Governance**: `engines`-Feld in `package.json` setzen (`"node": ">=20"`).
- [ ] **API-Design**: Resilience-Pattern für Anthropic-Calls: Timeout (30s), 1 Retry mit exponential Backoff, Fehler-Fallback-Message.

### Mittelfristig (nächstes Quartal)

- [ ] **Backup & DR**: Monatlicher Restore-Test + Protokoll in `docs/runbooks/`.
- [ ] **Supply Chain**: SBOM mit `syft` in CI-Pipeline (`syft . -o cyclonedx-json > sbom.json`).
- [ ] **AI Integration**: Output-Validierung für Feed-Stage-2/3 (Zod-Parse auf JSON-Response von Haiku/Sonnet).
- [ ] **AI Integration**: Globaler Anthropic-Fallback für Chat-Endpunkte (Error-Message + Retry-Hinweis).
- [ ] **Observability**: Uptime-Monitoring einrichten (BetterUptime, UptimeRobot) + Alerting an Team.
- [ ] **Observability**: `instrumentation.ts` für OpenTelemetry (Vercel-Integration vorhanden via Sentry).
- [ ] **Testing**: KI-Code-Gate: Coverage auf 90% für neue AI-Features (Library-Resolver, Agent-Engine).
- [ ] **Cost Awareness**: Cloud-Budget-Alerts in Vercel + Supabase Dashboard konfigurieren.
- [ ] **Accessibility**: `/accessibility` Seite erstellen (BFSG-Anforderung).
- [ ] **ADRs**: Weitere ADRs für pgvector/RAG, Soft-Delete-Pattern, Anthropic-SDK-Direktintegration.

---

## Positive Highlights

| Stärke | Details |
|--------|---------|
| Sicherheits-Sprung | Security-Headers, globales Rate Limiting (4 Stufen), Webhook-HMAC — von Score 2 auf 3 |
| CI/CD-Pipeline | Security Audit, Design Lint, Dependency Check, Unit-Tests, E2E-Tests, Playwright — von Score 3 auf 4 |
| Testing-Fortschritt | 22 Testdateien (vorher 10). E2E-Tests vorhanden. CI-integriert. |
| Library-System | Capabilities + Outcomes + Roles + Skills — strukturiertes AI-Routing-Framework. `library-resolver.ts` sauber architekturiert. |
| PWA | manifest.json + Service Worker + Offline-Fallback — von Score 0 auf 3 |
| /health Endpoint | DB-Ping, Latenz, Version, HTTP 200/503 — vollständig |
| Dependency Cruiser | Architekturverletzungen werden in CI geblockt |
| 56 Migrationen | Alle mit RLS, FK-Constraints, APPEND ONLY Muster konsequent eingehalten |
| Conventional Commits | Letzten 20 Commits alle korrekt (`feat:`, `fix:`, `docs:`) |
| CLAUDE.md | Vollständig aktuell bis Migration 056 + Library-System-Dokumentation |

---

## Nächster Audit

**Geplant für:** 2026-06-19 (Q2 2026)
**Verantwortlich:** Timm Rotter
**Ziel:** Stable (≥ 70%) — erreichbar mit SSRF-Fix, DR-Runbook, SBOM, Coverage-Ausbau, Datenschutz-Vervollständigung.

**Wichtigste Einzelmaßnahme für Score-Sprung:** Backup & DR (Gewicht 3, aktuell Score 1) — DR-Runbook + verifiziertes PITR würde +6 Gewichtspunkte bringen (+2.6%).
