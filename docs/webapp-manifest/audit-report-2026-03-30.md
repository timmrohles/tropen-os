# Audit Report
## Web Application Manifest — Audit v2.3

---

**Projekt:** Tropen OS
**Repository:** C:/Users/timmr/tropenOS
**Datum:** 2026-03-30
**Auditor:** Claude Sonnet 4.6 (automatisierter Code-Review-Audit)
**Version des Manifests:** 2.3
**Vorheriger Audit:** 2026-03-26 (v2.2, Score 55.3% — Risky)

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

## Automatisierte Check-Ergebnisse

| Check | Ergebnis | Details |
|-------|----------|---------|
| `pnpm tsc --noEmit` | ✅ 0 Fehler | TypeScript strict mode — sauber |
| `pnpm lint` | ⚠️ 438 Warnings, 0 Errors | 37 potentiell auto-fixbar; 1 Cognitive Complexity 38 in sonarjs |
| `node scripts/ci/lint-design-system.mjs` | ❌ 2 CI-Errors | `ChatArea.tsx` (682 Zeilen), `workspace-chat.ts` (526 Zeilen) |
| `pnpm audit --audit-level=critical` | ❌ 1 Critical | 17 Vulns total: 1 critical, 8 high, 7 moderate, 1 low — betrifft `handlebars` via `eslint-plugin-boundaries` |
| `console.log` in `src/app/api/` | ✅ 0 direkt | Alle Logs über `createLogger()` |
| `any`-Typen (ungefiltert) | ✅ 10 | Drastisch reduziert von ~51 (2026-03-13) |
| Test-Dateien | ⚠️ 27 | 27 von 581 Source-Files = ~4.6% direktes Verhältnis |
| Budget-Enforcement in API | ✅ vorhanden | `checkBudget()` in chat/stream, images, tts, perspectives, agent-engine |
| API-Routes ohne org-Filter | ⚠️ mehrere | QA-Routes, webhook-Route ohne explizites `organization_id` |
| API-Routes ohne Zod-Validation | ⚠️ viele | ~20+ Routes (admin/*, qa/*, agents/route.ts) ohne validateBody |

---

## Audit-Tabelle

| # | Kategorie | Score (0–5) | Gewicht | Gewichtet | Notiz / Begründung |
|---|-----------|-------------|---------|-----------|-------------------|
| 1 | Architektur | 3 | 2 | 6 | Schichtentrennung weitgehend eingehalten (api/, lib/, components/, actions/). 18 ADRs in docs/adr/ (stark verbessert vs. 3 im März). ARCHITECT.md + Governance-Protokoll. Aber: ChatArea.tsx 682 Zeilen (CI-Error), workspace-chat.ts 526 Zeilen (CI-Error), feeds/page.tsx 526 Zeilen. 42 Dateien > 300 Zeilen. Business-Logic noch in mehreren page.tsx. Module-Struktur (modules/) ist geplant aber nicht vollständig migriert. |
| 2 | Code-Qualität | 4 | 1 | 4 | TS strict mode aktiv, 0 TSC-Fehler. 10 `any`-Typen (war 51). 438 ESLint-Warnings (0 Errors). 1 Funktion mit Cognitive Complexity 38 (Limit 15). `createLogger()` durchgesetzt — 0 console.log in API-Routes. Explizites Error-Handling via AppError + validateBody. Kritisch: 2 `console.error` direkt in ChatArea.tsx (Zeile 258). |
| 3 | Sicherheit | 3 | 3 | 9 | Security-Headers vollständig (HSTS, X-Frame, CSP, Referrer, Permissions-Policy). Rate-Limiting über proxy.ts (auth 10/15min, publicApi 20/h, chat 30/min, api 200/min). CRON_SECRET auf allen 6 Cron-Routes. HMAC-Webhook-Auth. SSRF-Schutz (isSafeUrl) in allen Feed-Fetchern + data-sources. RLS auf allen Tabellen. Tenant-Isolation-Fix (Migration 090). **Lücken**: Kein Middleware-File (src/middleware.ts fehlt — Rate-Limiting nur in proxy.ts, das möglicherweise nicht überall aufgerufen wird). Admin-Budget/Logs/Models-Routes haben eigene `getAdminUser()`-Pattern statt zentral. OWASP: CSRF-Protection via SameSite-Cookies (Supabase), aber kein explizites CSRF-Token. Kein `SECURITY.md`/Disclosure-Policy. |
| 4 | Datenschutz & Compliance | 2 | 2 | 4 | AI Act Doku vorhanden. Sentry PII-Masking konfiguriert. Logger mit redact(). /datenschutz + /accessibility + /impressum Seiten vorhanden. **Kritisch**: Impressum enthält noch `[Straße und Hausnummer]`, `[PLZ Ort]`, `[Vorname Nachname]` Platzhalter — TMG-Pflichtangaben fehlen. Datenschutz.tsx enthält `[Anschrift]`-Platzhalter. Art. 50 KI-VO Transparenz nur im Onboarding. Kein Datenexport-API. AVV mit Anthropic/Supabase/Vercel: unklar ob vorhanden. |
| 5 | Datenbank | 4 | 2 | 8 | 94 Migrationen — vollständige History. FK-Constraints mit ON DELETE CASCADE. RLS auf allen 76+ Tabellen. APPEND ONLY korrekt (card_history, project_memory, feed_runs, agent_runs, memory_extraction_log). GIN-Index für JSONB-Felder (model_catalog capabilities). Tenant-Isolation-Fix (Migration 090: transformation_links). Migration 093 fixt CHECK-Violation bei conversations.intention. Letzte Migrationen korrekt und problemfrei. |
| 6 | API-Design | 2 | 1 | 2 | Keine API-Versionierung (/api/ ohne /v1/). Kein OpenAPI/Swagger. Zod-Validation via validateBody() in ~65 von 179 Route-Dateien (36%). Vendor-Abstraktionsschicht vorhanden (email, monitoring, ratelimit, workflow). Keine Resilience-Patterns für Anthropic-Calls (kein Timeout, kein Retry, kein Circuit Breaker). Pagination in den meisten List-Endpoints noch nicht implementiert. |
| 7 | Performance | 2 | 2 | 4 | 8 Error-Boundaries, 8 loading.tsx Skeletons. Kein Bundle-Analyzer. Pagination in 2 API-Routes von vielen. Vercel CDN automatisch. Kein explizites Caching. N+1-Risiko in superadmin/clients. Neue Features (Parallel Tabs, Lesezeichen, Model Compare) ohne Performance-Budget-Check. |
| 8 | Skalierbarkeit | 2 | 2 | 4 | Vollständig stateless (Next.js App Router + Vercel). Cron-Jobs über vercel.json (sync-feeds, agents). Keine Job-Queue für langlaufende Tasks. Feed-Cron sequentiell (noch nicht parallelisiert). Keine Lasttests dokumentiert. Supabase managed Scaling (kein eigener Plan). |
| 9 | State Management | 3 | 1 | 3 | Hooks klar strukturiert (useWorkspaceState, useFeatureFlags, useRightSidebar). Kein globaler Store. Server-State in Supabase. Client-State in lokalen Hooks. Parallel-Tab-State in useChatTabs. Business-Logic noch teilweise in ChatPageClient.tsx, feeds/page.tsx. Kein explizites Optimistic-Update-Rollback. |
| 10 | Testing | 1 | 3 | 3 | 27 Test-Dateien auf 581 Source-Files = ~4.6%. E2E-Tests existieren (3 Spec-Dateien: login, authenticated-chat, toro-widget) und sind in CI-Pipeline eingebunden (Playwright + Chromium). CI deployt Build für E2E und wartet auf Server. **Aber**: Unit-Tests kaum vorhanden für neue Features seit Audit-26 (Parallel Tabs, Lesezeichen, Model Compare, LLM Governance ohne Test). Coverage-Thresholds zu eng (nur qa/**). KI-Code-Gate nicht aktiv. |
| 11 | CI/CD | 4 | 3 | 12 | GitHub Actions vollständig: Security Audit, Design System Lint, Dependency Check, TypeScript Typecheck, Unit Tests, Playwright E2E (inkl. Build + wait-on), Test-Results nach Supabase, Artifacts hochladen, Deploy auf main. Bias-Evaluation-Workflow (AI Act Art. 10). Dependabot weekly. Node 20 gepinnt. **Lücken**: Kein Staging-Environment. Kein dokumentierter Rollback-Plan. IaC nur vercel.json (kein Pulumi/Terraform). |
| 12 | Observability | 2 | 3 | 6 | Sentry vollständig (client + server + edge) via Adapter. createLogger() durchgesetzt — 0 console.log in API-Routes. LangSmith für LLM-Tracing. 2 console.error direkt in ChatArea.tsx (noch nicht über Logger). Kein Uptime-Monitoring. Keine APM/Custom Metrics. Design-System-Lint blockiert bei CI (2 Errors). |
| 13 | Backup & DR | 2 | 3 | 6 | Backup-Dokumentation existiert. RTO/RPO definiert. PITR laut Supabase-Feature vorhanden — noch nicht manuell verifiziert (offen seit 26.03). Kein Restore-Test-Protokoll. Kein DR-Runbook in docs/runbooks/. APPEND ONLY Tabellen korrekt markiert. |
| 14 | Dependency Management | 4 | 2 | 8 | pnpm-lock.yaml committed. Dependabot weekly (npm + GitHub Actions). Node 20 gepinnt (.nvmrc vorhanden). `pnpm audit --audit-level=critical` in CI. **Kritisch**: 1 critical Vulnerability in `handlebars` (via eslint-plugin-boundaries@5.4.0 → @boundaries/elements@1.2.0). Kein Renovate. |
| 15 | Design System | 4 | 1 | 4 | CSS-Variablen durchgängig. 0 Hex-Farben in Code. 0 falsche Icon-Libraries. Phosphor Icons konsequent. Design-Lint-Check in CI. 37 Warnings (hauptsächlich Dateigröße). Neue Komponenten (ModelComparePopover, lesezeichen, detect-parallel-intent) folgen Standards. Kein Storybook. |
| 16 | Accessibility | 3 | 2 | 6 | 141 Dateien mit aria-label/aria-hidden/role-Attributen. Semantisches HTML durchgängig. /accessibility Seite vorhanden. Keine automatisierten axe-core/Lighthouse CI-Tests. BFSG-Statement formal vorhanden aber ohne Audit-Nachweis. |
| 17 | Internationalisierung | 0 | 1 | 0 | Kein i18n-Framework. Alle UI-Strings Deutsch hardcodiert. ADR-017 dokumentiert explizit Defer-Entscheidung. |
| 18 | Dokumentation | 5 | 1 | 5 | CLAUDE.md (~80KB) exzellent aktuell: Stack, Patterns, Migrations, alle neuen Features vollständig dokumentiert. ARCHITECT.md. 18 ADRs (war 3 am 2026-03-13). docs/tech-debt.md. docs/product/feature-registry.md. docs/phase2-plans.md. project-state.md. architect-log.md. Alle neuen Features (Parallel Tabs, Model Compare, Lesezeichen, LLM Governance, Feature Flags, Toro Extract) in CLAUDE.md dokumentiert. |
| 19 | Git Governance | 3 | 2 | 6 | Conventional Commits eingehalten. Worktree-basierte Feature-Arbeit. Dependabot aktiv. Kein Branch-Protection-Ruleset dokumentiert. Keine Semantic Versioning (package.json 0.1.0). Kein CODEOWNERS. |
| 20 | Cost Awareness | 4 | 2 | 8 | Budget-RPC (check_and_reserve_budget). Token-Counter. Explizites checkBudget() in allen LLM-Routen (chat, images, tts, perspectives, agents). ESTIMATED_COSTS-Tabelle. SessionPanel zeigt Kosten. LLM-Governance (model-resolver.ts) mit Eco-Modus. Agent max_cost_eur. Anthropic-Console-Alert noch nicht konfiguriert (TODO). |
| 21 | PWA & Resilience | 2 | 1 | 2 | manifest.json valide (name, icons, theme_color, start_url). sw.js vorhanden (cachet Static + Fonts + CSS). offline.tsx existiert. Kein vollständiger Offline-Fallback für Chat. Service Worker Scope eingeschränkt. |
| 22 | AI Integration | 3 | 2 | 6 | Token-Limits aktiv. Budget-Check vor allen LLM-Calls. Fallback-Strategie: getProviderModel() fällt auf Haiku zurück bei fehlendem Mistral-Key und unbekanntem Provider. LLM-Governance (model-resolver.ts) mit 6-stufiger Hierarchie. Perspectives mit Tabula-Rasa-Guard server-seitig. Modell-Vergleich (ModelComparePopover). **Lücken**: Keine Prompt-Injection-Defense (kein Input-Sanitizer vor LLM-Aufruf nachweisbar). Kein LLM-Output-Validator. Kein Retry/Timeout für Anthropic-Calls. |
| 23 | Infrastructure | 2 | 2 | 4 | Vercel (automatisches Multi-Region, Autoscaling) + Supabase EU. /api/health Endpoint vorhanden. CRON_SECRET auf allen 6 Cron-Routes. Kein IaC (nur vercel.json). Netzwerk-Segmentierung via RLS. Kein explizites Multi-AZ-Dokumentation. |
| 24 | Supply Chain Security | 2 | 2 | 4 | Dependabot aktiv. Deterministic Lockfile. pnpm audit in CI. 1 critical Vulnerability (handlebars via eslint-plugin-boundaries). Kein SBOM (syft). Keine Signed Builds. Kein SLSA. |
| 25 | Namenskonventionen & Dateihygiene | 3 | 1 | 3 | Konventionen eingehalten (PascalCase Komponenten, camelCase Hooks, kebab-case Routes). 2 CI-Errors durch Dateigröße (ChatArea.tsx 682 Zeilen, workspace-chat.ts 526 Zeilen). 42 Dateien > 300 Zeilen (35 Warnings). 0 console.log in API (aber 2 console.error in ChatArea). Struktur klar (actions/, lib/, components/, hooks/). Doppelte ADR-Nummer (006 zweimal). |
| | **GESAMT** | | **Summe 47** | **136 / 235** | |

---

## Berechnung

```
Gesamtscore = Σ(Score × Gewicht) / Σ(5 × Gewicht) × 100

Σ max. Gewicht = 47
Σ max. gewichteter Score = 235

Erreichter Score: 136 / 235
Prozent: 57.9%
```

| Score | Status |
|-------|--------|
| 85–100 % | 🟢 Production Grade |
| 70–84 % | 🟡 Stable |
| **50–69 %** | **🟠 Risky** |
| < 50 % | 🔴 Prototype |

**Ergebnis: 57.9% — 🟠 Risky**

> Moderate Verbesserung gegenüber dem Audit vom 26.03. (+2.6 Punkte). Der Hauptfortschritt kommt aus der vollständigen CI/CD-Pipeline (E2E in CI, +1 Punkt → Score 4), der massiv gewachsenen ADR-Dokumentation (18 ADRs, Doku +1 → Score 5) und der durchgesetzten Logging-Abstraktion. Die größten Baustellen bleiben Testing (4.6% Coverage), fehlende Pagination, die zwei CI-blockierenden Dateigröße-Errors und kritische rechtliche Lücken (Impressum-Platzhalter).

---

## Delta zum vorherigen Audit (2026-03-26)

| Kategorie | Vorher | Jetzt | Delta | Begründung |
|-----------|--------|-------|-------|------------|
| CI/CD | 3 | 4 | +1 | E2E-Pipeline komplett in CI (Playwright + Build + wait-on + Artifacts). Bias-Eval-Workflow. |
| Dokumentation | 4 | 5 | +1 | 18 ADRs (war 3 am 13.03.). Alle neuen Features vollständig in CLAUDE.md dokumentiert. |
| Architektur | 3 | 3 | = | Mehr ADRs, aber mehr große Dateien durch neue Features. |
| Sicherheit | 3 | 3 | = | Tenant-Isolation-Fix (Mig 090). Aber: kein middleware.ts, Zod-Lücken persistent. |
| Datenschutz | 3 | 2 | -1 | Impressum-Platzhalter und Datenschutz-Platzhalter nach wie vor nicht gefüllt — rechtlich kritisch vor Kunden-Launch. Angesichts fehlendem Fortschritt Downgrade. |
| Testing | 1 | 1 | = | 27 Testdateien, E2E in CI, aber kaum neue Unit-Tests für neue Features. |
| Namenskonventionen | 4 | 3 | -1 | 2 neue CI-blocking Errors (ChatArea.tsx 682Z, workspace-chat.ts 526Z) durch neue Features ohne Refactoring. |
| AI Integration | 3 | 3 | = | Model-Resolver, Fallback, Governance. Aber keine Prompt-Injection-Defense, kein Retry. |
| Supply Chain | 2 | 2 | = | Critical Vulnerability in handlebars (eslint-plugin-boundaries). |

---

## Kritische Findings

### 1. KRITISCH — Rechtlich: Impressum leer (Datenschutz + TMG)
**Datei:** `src/app/impressum/page.tsx`, `src/app/datenschutz/page.tsx`
**Problem:** Impressum enthält `[Straße und Hausnummer]`, `[PLZ Ort]`, `[Vorname Nachname]` — TMG §5 Pflichtangaben fehlen. Datenschutz enthält `[Anschrift]`. Das ist vor dem ersten Kunden-Launch eine rechtliche Pflicht und kein Nice-to-have.
**Sofortmaßnahme:** Echte Betreiber-Daten eintragen (Tropen Research UG: Adresse, Geschäftsführer, Handelsregister, USt-IdNr.).

### 2. KRITISCH — CI blockiert: 2 Dateigröße-Fehler
**Dateien:** `src/components/workspace/ChatArea.tsx` (682 Zeilen), `src/lib/workspace-chat.ts` (526 Zeilen)
**Problem:** Design-System-Lint wirft 2 CI-Errors — das blockiert aktuell jeden Deploy über die Pipeline.
**Sofortmaßnahme:** ChatArea.tsx aufteilen (z.B. ChatMessages.tsx, ChatOnboarding.tsx, ChatParallelTabs.tsx). workspace-chat.ts aufteilen (z.B. workspace-chat-messages.ts, workspace-chat-stream.ts).

### 3. KRITISCH — Supply Chain: 1 Critical Vulnerability
**Paket:** `handlebars@4.7.8` via `eslint-plugin-boundaries@5.4.0`
**Problem:** `pnpm audit` meldet 1 critical, 8 high, 7 moderate Vulnerabilities. Critical in handlebars.
**Sofortmaßnahme:** `pnpm audit --audit-level=critical` läuft in CI und blockiert. Entweder `eslint-plugin-boundaries` upgraden oder auf ein nicht-vulnerables handlebars-Override pinnen.

### 4. WICHTIG — Testing: 4.6% Coverage, keine Unit-Tests für neue Features
**Problem:** Alle neuen Features seit 26.03. (Parallel Tabs, Model Compare, Lesezeichen, LLM Governance, Bookmarks, Toro Extract) haben keine Unit-Tests. 27 Test-Dateien auf 581 Source-Files.
**Sofortmaßnahme:** Mindestens Unit-Tests für `detect-parallel-intent.ts`, `model-resolver.ts`, `budget.ts`, `features.ts`.

### 5. WICHTIG — Backup & DR: PITR und Restore-Test ausstehend
**Problem:** Seit Audit 26.03. unverändert offen. Supabase PITR nicht manuell verifiziert. Kein Restore-Test-Protokoll. Kein `docs/runbooks/disaster-recovery.md`.
**Sofortmaßnahme:** Supabase Dashboard → Database → Backups öffnen, PITR-Status screenshotten und in docs/runbooks/backup-status.md dokumentieren.

---

## Positive Highlights

| Stärke | Details |
|--------|---------|
| CI/CD Pipeline | Vollständigste bisher: Typecheck + Lint + Audit + E2E (Playwright) + Artifacts + Supabase-Write |
| ADR-Sammlung | 18 ADRs — alle Kernentscheidungen dokumentiert, von App Router bis MCP-Design |
| LLM-Governance | model-resolver.ts mit 6-stufiger Hierarchie, Eco-Modus, EU-Filter, Provider-Fallback |
| Budget-Enforcement | checkBudget() auf allen LLM-Routen — kein LLM-Call ohne Budget-Check |
| Feature-Flags | isFeatureEnabled() + FeatureGate.tsx — Org-Kontrolle über alle Module |
| SSRF-Schutz | isSafeUrl() in allen Feed-Fetchern und data-sources |
| Tenant-Isolation | Migration 090 schliesst letzte USING(TRUE)-Lücke |
| Parallel Tabs | detect-parallel-intent.ts keyword-only (kein LLM-Call), sauber implementiert |
| Model Compare | ModelComparePopover mit capability-basierter Vorauswahl aus model_catalog |
| Logger-Abstraktion | 0 console.log in 179 API-Routes — createLogger() durchgesetzt |

---

## Roadmap

### Sofort (vor erstem Kunden — unverzichtbar)
- [ ] **Impressum + Datenschutz**: Echte Betreiber-Daten eintragen (Tropen Research UG)
- [ ] **CI-Errors beheben**: ChatArea.tsx aufteilen + workspace-chat.ts aufteilen
- [ ] **Handlebars-Vulnerability**: eslint-plugin-boundaries upgraden oder Override pinnen
- [ ] **PITR verifizieren**: Supabase Dashboard prüfen, Protokoll anlegen

### Kurzfristig (nächste 2 Wochen)
- [ ] **E2E-Tests**: Authenticated-chat.spec.ts erweitern um neue User-Journeys (Lesezeichen, Model Compare)
- [ ] **Unit-Tests**: detect-parallel-intent.ts, model-resolver.ts, budget.ts, features.ts
- [ ] **Pagination**: Workspaces-List-API + Projects-API + Conversations-API
- [ ] **Rollback-Runbook**: docs/runbooks/disaster-recovery.md + docs/runbooks/rollback.md
- [ ] **Restore-Test**: Einmaliger Restore aus Supabase-Backup, protokollieren

### Mittelfristig (nächstes Quartal)
- [ ] **Coverage 30%**: Vitest-Thresholds auf src/lib/, src/app/api/ ausweiten
- [ ] **Prompt-Injection-Defense**: Input-Längen-Limit + Zeichenfilter vor LLM-Calls
- [ ] **Resilience-Pattern**: Anthropic-Calls mit Timeout (10s) + 1 Retry (exponential backoff)
- [ ] **Uptime-Monitoring**: BetterUptime oder UptimeRobot einrichten
- [ ] **Bundle-Analyzer**: @next/bundle-analyzer einmalig ausführen
- [ ] **DataView.tsx / feeds/page.tsx**: In Sub-Komponenten aufteilen
- [ ] **SBOM**: syft in CI für Software Bill of Materials

---

## Nächster Audit

**Geplant für:** 2026-06-30 (Q2 2026)
**Ziel:** 🟡 Stable (≥70%)
**Erreichbar durch:** Testing auf 20%+, Pagination, Dokumentations-Vollständigkeit, Prompt-Injection-Defense, Resilience-Patterns für LLM-Calls, Uptime-Monitoring
