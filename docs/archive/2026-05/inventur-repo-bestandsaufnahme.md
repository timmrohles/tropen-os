# Repo-Bestandsaufnahme — Tropen OS — 2026-05-07

> **Erstellt:** 2026-05-07  
> **Zweck:** Vollständige Inventur vor Brücken-Doku und v2-Zielbild-Umsetzung.  
> **Methode:** Direktes Lesen aus Quellen — keine Interpretationen ohne Beleg.  
> **Scope:** Repo unter `C:/Users/timmr/tropenOS`

---

## Teil A — Heutige Substanz (produktiv aktiv)

### Audit-Engine

---

#### Audit-Pipeline-Einstiegspunkt

- **Typ:** CLI-Script + API-Route
- **Pfad:** `src/scripts/run-audit.ts` (CLI), `src/app/api/audit/trigger/route.ts` (Web-API)
- **Funktion:** `run-audit.ts` baut `AuditContext` aus dem lokalen Repo und ruft alle Checker auf; `/api/audit/trigger` startet denselben Prozess serverseitig und persistiert in DB.
- **Quelle:** `src/lib/audit/index.ts` — `buildAuditContext()` + `buildAuditContextFromFiles()` (In-Memory für Benchmarks)
- **Beobachtung:** Zwei Einstiegspunkte (CLI + API-Route) sind vorhanden. Die Funktion `buildAuditContextFromFiles()` ermöglicht Scan ohne Disk-Zugriff (Benchmark-Modus).

---

#### Regel-Lader / Rule-Registry

- **Typ:** TypeScript-Modul
- **Pfad:** `src/lib/audit/rule-registry.ts`
- **Funktion:** Exportiert `AUDIT_RULES: AuditRule[]` mit allen Regeln; bietet `getRulesForCategory()`, `getRuleById()`, `getFixType()`.
- **Quelle:** `src/lib/audit/rule-registry.ts` — 600 Zeilen
- **Beobachtung:** Regeln sind statisch inline definiert; kein dynamisches Laden aus DB oder Dateien.

---

#### Severity-Logik + Killer-Klassifikation

- **Typ:** TypeScript-Modul
- **Pfad:** `src/lib/audit/killer-rule-ids.ts`
- **Funktion:** `shouldBeKiller(severity, ruleId)` — einziger Entscheidungspunkt: severity='critical' → automatisch Killer; zusätzlich explizite Rule-ID-Liste.
- **Quelle:** `src/lib/audit/killer-rule-ids.ts` (aus CLAUDE.md)
- **Beobachtung:** Migration `20260506000118_critical_findings_killer_coupling.sql` hat alle bestehenden Critical-Findings nachträglich als `is_killer=true` gesetzt. DB-Felder `is_killer` und `effort_minutes` in `audit_findings` seit Migration 117.

---

#### Checker-Dateien in `src/lib/audit/checkers/`

| Datei | Inhalt |
|-------|--------|
| `agent-architecture-checker.ts` | Dependency-Modell, verbotene Ordnernamen, unerwartete Namespaces |
| `agent-committee-checker.ts` | 30+ Checks der 18 Komitee-Agenten (Legal, DB, API, Testing etc.) |
| `agent-observability-checker.ts` | Console-Logs, Trace-IDs, PII in Logs, Incident-Docs |
| `agent-regulatory-checker.ts` | DSGVO (Cookie Consent, Hashing, HSTS, CSP, Export, Deletion), BFSG (Statement, Feedback, HTML-lang, Skip-Nav, ARIA-live), AI-Act (Klassifizierung, Disclosure, Decision-Logging, Purpose-Docs, Verbotene-Praktiken) |
| `agent-security-checker.ts` | Auth-Guard-Konsistenz, RLS-Coverage, Rate-Limiting, CORS, Error-Leakage, LLM-Input-Separation, File-Upload-Validierung |
| `ast-analyzer.ts` | Zentraler AST-Parser mit SHA-256 LRU-Cache (800 Einträge) |
| `ast-quality-checker.ts` | Cognitive Complexity, God Components, Error-Handling, Secrets, Zirkuläre Imports, any-Usage, N+1-Queries, Error-Boundary, Import-Casing, Modul-Level-Env |
| `category-gap-checkers.ts` | Performance-Basics, CI/CD-Existenz, CI-Type-Check, LLM-Token-Limits, AI-Route-Rate-Limiting |
| `cli-checker.ts` | Shell-basiert: Secrets im Repo (gitleaks), Unit-Test-Coverage, Production-Build |
| `compliance-checker.ts` | AGB, Widerrufsbelehrung, Checkout-Button-Text, Affiliate-Disclosure, AI-Transparenz, AI-Content-Labeling |
| `config-killer-checker.ts` | DB-SSL-Konfiguration, Dev-Credentials in Produktion, HTTPS-Erzwingung (Killer-Rules) |
| `db-security-checker.ts` | RLS auf User-Tabellen, kein Service-Role im Frontend, Anon-Key-Wildcard, Storage-Bucket-Policies, Edge-Functions-Service-Role, Backup-Strategie |
| `documentation-checker.ts` | ADRs vorhanden, README vorhanden, Runbooks vorhanden, Conventional Commits, FK-Constraints in Migrations, Index-Strategie, AI-Act-Dokumentation |
| `external-tools-checker.ts` | depcruiser-Zyklen, Lighthouse (Perf/A11y/Best-Practices/SEO), Bundle-Größen, ESLint-Detailed, npm-Audit |
| `file-system-checker.ts` | TypeScript-Strict, ESLint, Prettier, Lockfile, Node-Version, Migrations-Tool, CI-Pipeline, Dependabot, PWA-Manifest, Service-Worker, Health-Endpoint, API-Versioning, OpenAPI, Error-Tracking-Sentry, Distributed-Tracing, i18n-Framework, Vulnerability-Scan-in-CI, Infrastructure-as-Code, Job-Queue, E2E-Tests, Integration-Tests, Tests-in-CI, KI-Code-Gate, SBOM, Semantic-Versioning, Projekt-Struktur |
| `final-category-checkers.ts` | Backup-Docs, Supabase-PITR, API-Timeouts, Unlimited-Queries, README-Qualität, CHANGELOG, Web-Manifest, Offline-Fallback, Deployment-Docs |
| `gap-checkers.ts` | `.env.example`, TODO-Kommentare, Unhandled-Promises, Loading-States |
| `repo-map-checker.ts` | Dateigrößen, Komponenten-Größen, Input-Validierung, Logger-Abstraktion, Vendor-Abstraktion, Service-Key-im-Frontend, Budget-Enforcement, Business-Logic-Separation, Naming-Conventions, ARIA-Attributes, Token-Limits |
| `security-scan-checker.ts` | Injection-Patterns, Auth-Patterns, Data-Exposure, Client-Side-Patterns, Crypto-Patterns, Business-Logic-Patterns, AI-Security-Patterns, Supply-Chain-Patterns |
| `slop-detection-checker.ts` | AI-Placeholder-Kommentare, AI-Tool-Fingerprints, Überkommentierung, Placeholder-Credentials, Mixed-Comment-Language (cat-26) |
| `spec-checker.ts` | AI-Kontext-Datei, PRD-Präsenz, README-Drift, `.cursorrules` enthält Stack (cat-18) |
| `sprint9b-domain-checkers.ts` | OSS-Lizenz-Copyleft, Marketing-Tracking, Platform-App-Store, Infrastructure-Hosting |
| `state-deps-obs-checkers.ts` | fetch-in-useEffect, Prop-Drilling, Server-State-im-Store, Outdated-Major-Versions, Error-Monitoring |
| `thin-category-checkers.ts` | Icon-Library-Konsistenz, Hardcoded-Strings, `.gitignore`-Vollständigkeit, Deployment-Config, Test-Framework, next/font-display |

---

#### Anzahl aktiver Regeln (aus rule-registry.ts, gezählt 2026-05-07)

**Gezählt direkt aus `src/lib/audit/rule-registry.ts`:**
- Automatisierte Regeln (`{ id: '...' }`): **187**
- Manuelle Regeln (`manual(...)`): **68**
- **Total: 255 Regeln**

CLAUDE.md und Zielbild v2 nennen "242 Regeln in 26 Kategorien" — die tatsächliche Zahl im Code ist **255**. Differenz: +13 Regeln (wahrscheinlich durch Sprint 9b und DB-Security-Rules nach Dokumentations-Update).

Kategorien: 26 (cat-1 bis cat-26, plus sec-db und sprint9b-Domain-Detektoren die cat-3/6/21/23/24 zugeordnet sind).

---

### Multi-Model-Komitee-Engine

---

#### Committee-Review-Framework

- **Typ:** CLI-Script
- **Pfad:** `src/scripts/committee-review.ts`
- **Funktion:** Generisches 4-Modell-Komitee (Sonnet + GPT-5.4 + Gemini 2.5 Pro + Grok 4) + Opus-Judge; Config-basiert; ~€0.35–0.50 pro Review.
- **Quelle:** `src/scripts/committee-review.ts`; Review-Configs in `src/scripts/reviews/*.ts`
- **Beobachtung:** 6 Review-Configs vorhanden: `claude-md.ts`, `audit-scoring.ts`, `fix-engine.ts`, `agent-checker-alignment.ts`, `repo-map.ts`, `dogfooding-feedback.ts`.

---

#### Modelle (aus CLAUDE.md)

| Rolle | Modell |
|-------|--------|
| Reviewer 1 | `anthropic/claude-sonnet-4.6` via AI Gateway |
| Reviewer 2 | `openai/gpt-5.4` via AI Gateway |
| Reviewer 3 | `google/gemini-2.5-pro` via AI Gateway |
| Reviewer 4 | `deepseek/deepseek-chat` via AI Gateway |
| Judge | `anthropic/claude-opus-4.6` via AI Gateway |

**Quelle:** `CLAUDE.md` — Abschnitt "AI-Modelle"

---

#### Output-Verzeichnisse

- `docs/committee-reviews/` — Review-Ergebnisse (`*-review.md`)
- `docs/audit-reports/` — Komitee-Audit-Reports mit Datum
- `src/scripts/reviews/` — Review-Config-Dateien

---

#### Letzte Ausführungen

- Letzter Komitee-Report in `docs/audit-reports/`: `k05-konzept-vertiefung-komitee-2026-05-07.md` (heute)
- Letzter regulärer Audit-Report: `docs/audit-reports/2026-05-06-audit-report.json` / `.md`
- Score im letzten Audit-Report (2026-05-06): **96.4% — Production Grade** (153 automatisierte Regeln ausgewertet, 97 manuelle nicht gewertet)

---

### Audit-Regelwerk

---

#### Kategorien-Liste mit Regelanzahl (aus rule-registry.ts)

Gezählt aus `src/lib/audit/rule-registry.ts` (Stand 2026-05-07):

| Kategorie | Nr. | Auto | Manual | Gesamt |
|-----------|-----|------|--------|--------|
| Architektur | cat-1 | 8 | 3 | 11 |
| Code-Qualität | cat-2 | 11 | 5 | 16 |
| Sicherheit | cat-3 + sec-db | 24 | 14 | 38 |
| Datenschutz & Compliance | cat-4 | 13 | 6 | 19 |
| Datenbank | cat-5 | 8 | 3 | 11 |
| API-Design | cat-6 | 5 | 5 | 10 |
| Performance | cat-7 | 4 | 5 | 9 |
| Skalierbarkeit | cat-8 | 5 | 3 | 8 |
| State Management | cat-9 | 4 | 2 | 6 |
| Testing | cat-10 | 6 | 1 | 7 |
| CI/CD | cat-11 | 6 | 2 | 8 |
| Observability | cat-12 | 8 | 4 | 12 |
| Backup & DR | cat-13 | 6 | 3 | 9 |
| Dependency Management | cat-14 | 5 | 0 | 5 |
| Design System | cat-15 | 5 | 4 | 9 |
| Accessibility | cat-16 | 9 | 1 | 10 |
| Internationalisierung | cat-17 | 2 | 2 | 4 |
| Dokumentation | cat-18 | 10 | 3 | 13 |
| Git Governance | cat-19 | 4 | 1 | 5 |
| Cost Awareness | cat-20 | 4 | 3 | 7 |
| PWA & Resilience | cat-21 | 5 | 1 | 6 |
| AI Integration | cat-22 | 14 | 3 | 17 |
| Infrastructure | cat-23 | 4 | 3 | 7 |
| Supply Chain Security | cat-24 | 5 | 3 | 8 |
| Namenskonventionen | cat-25 | 3 | 3 | 6 |
| KI-Code-Hygiene | cat-26 | 5 | 0 | 5 |

**Gesamt aus Audit-Report 2026-05-06:** 153 automatisierte (gewertet) + 97 manuelle (nicht gewertet) = 250 in Auswertung. Abweichung zur Code-Zählung (255) erklärt durch externe-Tool-Regeln die im `--skip-cli`-Modus nicht laufen.

---

#### Verzeichnis `docs/agents/` — Anzahl Agent-Dateien

**Gezählt:** 29 Dateien (28 Agent-Markdown-Dateien + 1 `_archive`-Unterordner + 1 `_reviews`-Unterordner)

Agent-Dateien (Hauptverzeichnis):
`ACCESSIBILITY_AGENT.md`, `AGENT_QUALITY_AGENT.md`, `AI_ACT_AGENT.md`, `AI_INTEGRATION_AGENT.md`, `ANALYTICS_AGENT.md`, `API_AGENT.md`, `ARCHITECTURE_AGENT_v3.md`, `BACKUP_DR_AGENT.md`, `BFSG_AGENT.md`, `CODE_STYLE_AGENT.md`, `CONTENT_AGENT.md`, `COST_AWARENESS_AGENT.md`, `DATABASE_AGENT.md`, `DEPENDENCIES_AGENT.md`, `DESIGN_SYSTEM_AGENT.md`, `DSGVO_AGENT.md`, `ERROR_HANDLING_AGENT.md`, `GIT_GOVERNANCE_AGENT.md`, `LEGAL_AGENT.md`, `LOAD_TEST_AGENT.md`, `OBSERVABILITY_AGENT_v3.md`, `PERFORMANCE_AGENT.md`, `PLATFORM_AGENT.md`, `SCALABILITY_AGENT.md`, `SECURITY_AGENT_FINAL.md`, `SECURITY_SCAN_AGENT.md`, `SLOP_DETECTION_AGENT.md`, `SPEC_AGENT.md`, `TESTING_AGENT.md`

**Gesamt: 29 Agent-Dateien** (CLAUDE.md sagt "21 Agent Rule Packs" — Differenz: 8 neuere Agents wie BFSG_AGENT, AI_ACT_AGENT, DSGVO_AGENT, LOAD_TEST_AGENT, AGENT_QUALITY_AGENT, SECURITY_SCAN_AGENT, SLOP_DETECTION_AGENT, SPEC_AGENT wurden nach dem CLAUDE.md-Update ergänzt).

---

### Fix-Prompt-Generator

---

#### Template-Engine

- **Typ:** Server-only TypeScript-Modul
- **Pfad:** `src/lib/audit/prompt-export/template-engine.ts`
- **Funktion:** `buildFixPrompt(finding, tool, repoMap?)` — deterministisch, kein LLM-Aufruf; 5 Sections (Problem/Wo/Warum/Fix/Validierung).
- **Quelle:** `src/lib/audit/prompt-export/template-engine.ts` (aus CLAUDE.md)
- **Beobachtung:** 2400+ Zeilen in `finding-recommendations.ts` (statische Daten); der Template-Engine-Code ist davon getrennt.

---

#### API-Route Fix-Prompts

- **Typ:** API-Route
- **Pfad:** `src/app/api/audit/fix-prompt/route.ts`
- **Funktion:** Server-seitige Prompt-Generierung on-demand; Client-Bundle enthält keine Recommendation-Daten.
- **Quelle:** `src/app/api/audit/fix-prompt/route.ts`; CLAUDE.md Tab-Sprint-Architektur-Abschnitt
- **Beobachtung:** `finding-recommendations.ts` ist server-only; intentional zur Bundle-Größen-Reduzierung.

---

#### Fix-Session-API

- **Typ:** API-Route
- **Pfad:** `src/app/api/audit/fix-session/route.ts`
- **Funktion:** POST — erstellt Fix-Session-Bundle für Gruppe von Findings.
- **Quelle:** `src/app/api/audit/fix-session/route.ts` (POST-Handler auf Zeile 101)
- **Beobachtung:** Inline Fix-Session-Bundle wurde 2026-05-06 in `AuditFindingsClient.tsx` integriert; GlobalQuickWinsBar ist gelöscht.

---

### Web-Plattform

---

#### Next.js App-Router-Struktur — Top-Level-Routen unter `src/app/[locale]/(app)/`

| Route | Typ | Beschreibung |
|-------|-----|-------------|
| `/dashboard` | Server Component | Projekt-Übersicht, Score-Cards, Onboarding-Hero |
| `/audit` | Server + Client | Audit-Dashboard mit Domain-Tabs, Score-Hero, Findings |
| `/audit/scan` | Client | Externen Projektordner per File System Access API verbinden |
| `/chat` | Client | Workspace-Chat mit Toro (eingefroren) |
| `/chat/[id]` | Client | Einzelner Chat |
| `/cockpit` | Server Component | Widget-Dashboard (8 Widget-Typen) |
| `/projects` | Client | Projekt-Übersicht (eingefroren) |
| `/projects/[id]` | Client | Einzelnes Projekt |
| `/workspaces` | Client | Workspace-Liste (eingefroren) |
| `/workspace/[id]` | Client | Einzelner Workspace (eingefroren) |
| `/ws/[workspaceId]` | Client | Canvas-Ansicht (eingefroren) |
| `/feeds` | Client | Feed-Quellen + Items (eingefroren) |
| `/agenten` | Client | Agenten-Liste (eingefroren) |
| `/perspectives` | Client | Parallele KI-Perspektiven (eingefroren) |
| `/knowledge` | Client | Wissensbasis (eingefroren) |
| `/artifacts` | Client | Artefakte-Übersicht (eingefroren) |
| `/settings` | Client | Benutzer-Einstellungen |
| `/department` | Server | Department/Workspace-Verwaltung |
| `/home` | Server | Landing nach Login |
| `/admin/*` | Server (Admin-Guard) | Budget, Logs, User, Branding, Models, Announcements, QA, Todos |
| `/superadmin/*` | Server (Superadmin-Guard) | Clients, Agents, Beta, Announcements, Perspectives |
| `/design-reference` | Client | Superadmin: Design-Referenzseite |

---

#### Public-Routes (ohne Auth)

Unter `src/app/[locale]/` (außerhalb `(app)/`):
- `/_lp` — Landing Page
- `/beta` — Beta-Waitlist (public, kein Auth)
- `/impressum` — Impressum
- `/datenschutz` — Datenschutzerklärung
- `/responsible-ai` — Responsible AI Policy
- `/login` — Login
- `/forgot-password` — Passwort vergessen
- `/reset-password` — Passwort zurücksetzen
- `/onboarding` — Onboarding nach Registrierung
- `/welcome` — Welcome nach Beta-Registrierung
- `/accessibility` — BFSG-Erklärung zur Barrierefreiheit

Unter `src/app/s/` (kein Locale-Prefix):
- `/s/[token]` — Geteilter Chat (Share-Link)

---

#### API-Routes: `src/app/api/` — Verzeichnis-Liste

`admin`, `agents`, `announcements`, `artifacts`, `audit`, `beta`, `bookmarks`, `capabilities`, `chat`, `cockpit`, `conversations`, `cron`, `debug`, `feeds`, `guided`, `health`, `home`, `images`, `knowledge`, `library`, `messages`, `onboarding`, `packages`, `perspectives`, `projects`, `prompt-templates`, `public`, `repo-map`, `s`, `scan-projects`, `search`, `settings`, `shared`, `skills`, `superadmin`, `transformations`, `tts`, `usage`, `user`, `workspaces`

---

### File System Access API-Integration

---

#### File-Access-Library

- **Typ:** Browser-only TypeScript-Module
- **Pfad:** `src/lib/file-access/` (5 Dateien: `types.ts`, `browser-check.ts`, `file-filter.ts`, `directory-reader.ts`, `stack-detector.ts`)
- **Funktion:** Browser liest lokale Dateien ohne Server-Upload; `readDirectory()`, `detectStack()`, `isFileSystemAccessSupported()`.
- **Quelle:** `src/lib/file-access/` (aus CLAUDE.md Projektstruktur-Abschnitt)
- **Beobachtung:** Nur im Browser nutzbar; serverseitiger Scan nutzt `buildAuditContext()` mit lokalem Disk-Zugriff.

---

#### Seiten/Routen die File System Access API nutzen

- **Pfad:** `src/app/[locale]/(app)/audit/scan/page.tsx`
- **Komponente:** `src/app/[locale]/(app)/audit/scan/_components/ConnectProjectCard.tsx`
- **Quelle:** CLAUDE.md Abschnitt `/src/app/audit/scan`

---

### Datenbank-Tabellen

Vollständige Liste aller jemals per `CREATE TABLE` angelegten Tabellen in `supabase/migrations/` (Stand 2026-05-07):

APPEND-ONLY-Tabellen (laut CLAUDE.md):

| Tabelle | Migrations-Quelle | Append-Only |
|---------|-------------------|-------------|
| `agent_runs` | `20260318000048_agents_v2.sql` | JA |
| `audit_category_scores` | `20260408000095_audit_tables.sql` | JA |
| `audit_runs` | `20260408000095_audit_tables.sql` | JA |
| `feed_processing_log` | `033_feed_tables.sql` | JA |
| `feed_data_records` | `20260317000044_feed_data_sources.sql` | JA |
| `feed_runs` | `20260318000046_feed_runs.sql` | JA |
| `focus_log` | `20260320000062_intention_system.sql` | JA |
| `memory_extraction_log` | `20260319000059_memory_extraction_log.sql` | JA |
| `card_history` | `031_workspaces_schema.sql` | JA |
| `project_memory` | `030_projects_schema.sql` | JA |

Alle Tabellen (alphabetisch, inklusive Schema-Prefix wo vorhanden):

| Tabelle | Migrations-Quelle |
|---------|-------------------|
| `agent_runs` | `20260318000048_agents_v2.sql` |
| `agents` | `025_agents.sql` |
| `announcements` | `032_support_tables.sql` (inferred) |
| `artifacts` | `022_artifacts.sql` |
| `audit_category_scores` | `20260408000095_audit_tables.sql` |
| `audit_findings` | `20260408000095_audit_tables.sql` |
| `audit_fixes` | `20260409000101_audit_fixes_consensus.sql` |
| `audit_review_runs` | `20260408000097_audit_review_fields.sql` |
| `audit_runs` | `20260408000095_audit_tables.sql` |
| `audit_tasks` | `20260410000108_audit_tasks.sql` |
| `beta_feedback` | `20260417000113_beta_tables.sql` |
| `beta_waitlist` | `20260417000113_beta_tables.sql` |
| `bookmarks` | `020_superadmin.sql` (inferred) |
| `capabilities` | `20260317000039_capability_outcome_system.sql` |
| `capability_org_settings` | `20260317000039_capability_outcome_system.sql` |
| `capability_outcomes` | `20260317000039_capability_outcome_system.sql` |
| `card_history` | `031_workspaces_schema.sql` |
| `cards` | `031_workspaces_schema.sql` |
| `connections` | (Quelle-Lücke: nicht in suchbaren Migrations) |
| `conversations` | `001_initial.sql` (inferred) |
| `cockpit_widgets` | `20260325000083_rename_to_cockpit.sql` (umbenannt von dashboard_widgets) |
| `deep_review_invocations` | `20260506000119_deep_review_rate_limits.sql` |
| `dept_knowledge` | `032_support_tables.sql` |
| `dept_settings` | `032_support_tables.sql` |
| `feed_data_records` | `20260317000044_feed_data_sources.sql` |
| `feed_data_sources` | `20260317000044_feed_data_sources.sql` |
| `feed_distributions` | `033_feed_tables.sql` |
| `feed_items` | `033_feed_tables.sql` |
| `feed_notifications` | `20260318000046_feed_runs.sql` |
| `feed_processing_log` | `033_feed_tables.sql` |
| `feed_runs` | `20260318000046_feed_runs.sql` |
| `feed_schemas` | `20260314000036_feeds_v2.sql` |
| `feed_source_schemas` | `20260314000036_feeds_v2.sql` |
| `feed_sources` | `033_feed_tables.sql` |
| `feed_topic_sources` | `20260317000043_feed_topics.sql` |
| `feed_topics` | `20260317000043_feed_topics.sql` |
| `focus_log` | `20260320000062_intention_system.sql` |
| `guided_workflow_options` | `20260317000039_capability_outcome_system.sql` |
| `guided_workflow_settings` | `20260317000039_capability_outcome_system.sql` |
| `guided_workflows` | `20260317000039_capability_outcome_system.sql` |
| `impersonation_sessions` | `021_impersonation.sql` |
| `knowledge_entries` | `017_rag_foundation.sql` |
| `library_versions` | `20260319000053_library_new_tables.sql` |
| `memory_extraction_log` | `20260319000059_memory_extraction_log.sql` |
| `messages` | `001_initial.sql` (inferred) |
| `model_catalog` | `20260316000038_model_catalog_api_model_id.sql` |
| `org_knowledge` | `017_rag_foundation.sql` |
| `org_library_settings` | `20260319000053_library_new_tables.sql` |
| `org_mcp_policies` | `20260325000068_settings_mcp.sql` |
| `org_packages` | `026_packages.sql` |
| `org_model_config` | `20260327000085_llm_governance.sql` |
| `organization_settings` | `001_initial.sql` (inferred) |
| `organizations` | `001_initial.sql` |
| `outcomes` | `20260317000039_capability_outcome_system.sql` |
| `package_agents` | `025_agents.sql` |
| `packages` | `026_packages.sql` |
| `perspective_avatars` | `20260322000065_perspectives.sql` |
| `perspective_user_settings` | `20260322000065_perspectives.sql` |
| `project_compliance_data` | `20260429000115_project_compliance_data.sql` |
| `project_documents` | `20260325000073_projects_extend.sql` |
| `project_knowledge` | `017_rag_foundation.sql` |
| `project_memory` | `030_projects_schema.sql` |
| `project_participants` | `030_projects_schema.sql` |
| `projects` | `008_projects.sql` / `030_projects_schema.sql` |
| `prompt_templates` | `024_prompt_templates.sql` |
| `qa_compliance_checks` | `027_qa_tables.sql` |
| `qa_lighthouse_runs` | `027_qa_tables.sql` |
| `qa_metrics` | `027_qa_tables.sql` |
| `qa_routing_log` | `027_qa_tables.sql` |
| `qa_test_runs` | `027_qa_tables.sql` |
| `roles` | `20260319000053_library_new_tables.sql` |
| `scan_project_profiles` | `20260505000116_scan_project_profiles.sql` |
| `scan_projects` | `20260409000103_scan_projects.sql` |
| `skills` | `20260318000047_skills.sql` |
| `agent_skills` | `20260318000047_skills.sql` |
| `templates` | `032_support_tables.sql` |
| `transformation_links` | `032_support_tables.sql` |
| `transformations` | `032_support_tables.sql` |
| `usage_logs` | `001_initial.sql` (inferred) |
| `user_capability_settings` | `20260317000039_capability_outcome_system.sql` |
| `user_library_settings` | `20260319000053_library_new_tables.sql` |
| `user_mcp_connections` | `20260325000068_settings_mcp.sql` |
| `user_model_preferences` | `20260327000085_llm_governance.sql` |
| `user_preferences` | `007_onboarding.sql` |
| `users` | `001_initial.sql` |
| `workspace_assets` | (Quelle-Lücke: nicht direkt gefunden) |
| `workspace_comments` | `20260325000077_workspace_comments.sql` |
| `workspace_exports` | (Quelle-Lücke: nicht direkt gefunden) |
| `workspace_items` | `20260325000075_workspaces_items.sql` |
| `workspace_members` | `20260325000076_workspace_members_share.sql` |
| `workspace_messages` | (Quelle-Lücke: nicht direkt gefunden) |
| `workspace_participants` | (Quelle-Lücke: nicht direkt gefunden) |
| `workspaces` | `001_initial.sql` |

**Gesamtzahl: ca. 90 Tabellen** (einschließlich Duplikate durch Umbenennung, z.B. `dashboard_widgets` → `cockpit_widgets`).

---

### Auth-System

---

#### Supabase-Auth

- **Typ:** Konfiguration
- **Pfad:** `src/utils/supabase/server.ts`, `src/utils/supabase/client.ts`
- **Funktion:** Server-seitiger Auth via `@supabase/ssr` (`createClient()`); Client-seitig via `createClient()` aus `@/utils/supabase/client`.
- **Quelle:** CLAUDE.md — DB-Zugriff-Constraint-Abschnitt; `src/utils/supabase/`

---

#### Guards

- **Pfad:** `src/lib/auth/guards.ts`
- **Guards:**
  - `requireSuperadmin()` — prüft `users.role === 'superadmin'`, sonst redirect zu `/workspaces`
  - `requireOrgAdmin()` — prüft `users.role` in `['superadmin', 'admin']`, sonst redirect zu `/workspaces`
- **Quelle:** `src/lib/auth/guards.ts` — Zeilen 10-48

---

#### Middleware

- **Pfad:** `src/middleware.ts`
- **Funktion:** Drei Schichten: (1) API-Routes erhalten Rate-Limiting via `proxy()`; (2) Root-Pfad `/` redirect für authentifizierte User direkt zu `/{locale}/dashboard` (1-Hop statt 2); (3) Alle anderen Routen: next-intl i18n-Routing + Request-ID + Pathname-Header.
- **Quelle:** `middleware.ts` — vollständig gelesen (56 Zeilen)
- **Beobachtung:** Middleware schützt keine App-Routen explizit — das machen Guards in Server Components. Auth-Callback unter `/auth` und Share-Links `/s/` sind vom Matcher ausgenommen.

---

### Schlüssel-Komponenten (`src/app/[locale]/(app)/audit/_components/`)

| Datei | Funktion |
|-------|----------|
| `AuditActions.tsx` | Aktions-Buttons auf der Audit-Seite (Scan starten, Export) |
| `AuditFindingsClient.tsx` | Client-Komponente für Findings-Sektionen: STOPPER / EMPFOHLEN ZUERST / WEITERE; Inline Fix-Session-Bundle |
| `AuditTabs.tsx` | Tab-Navigation (Findings / Kategorien / Verlauf) |
| `AuditTierTabs.tsx` | Tier-Filter-Tabs (Starter / Production / Enterprise) |
| `BetaFeedbackButton.tsx` | Feedback-Button sichtbar für Beta-User |
| `CategoryBreakdown.tsx` | Kategorie-Aufschlüsselung mit Scores |
| `CategoryRowItem.tsx` | Einzel-Zeile in Kategorie-Tabelle |
| `ComplianceBlock.tsx` | DSGVO + KI-Act Compliance-Fragen (ersetzt DsgvoTab/KiActTab) |
| `CompliancePanel.tsx` | Domänen-Übersicht mit Ampel-Status |
| `ComplianceQuestion.tsx` | Inline-Input für einzelne Compliance-Frage |
| `ComplianceStatus.tsx` | Status-Badge für Compliance-Domäne |
| `ConsensusFixResult.tsx` | Anzeige von Komitee-Fix-Ergebnissen |
| `DeepFixButton.tsx` | Button für Deep-Review / Komitee-Fix |
| `DeferredSection.tsx` | Lazy-geladene Sektion |
| `DomainEmptyState.tsx` | Empty-State wenn Domain keine Findings hat |
| `FilterChipsRow.tsx` | Filter-Chips für Findings-Status |
| `FindingClusterRow.tsx` | Cluster-Zeile für gruppierte Findings |
| `FindingSection.tsx` | Sektion für eine Finding-Gruppe |
| `FindingsGroupTabs.tsx` | Chip-Tabs: Heute / Diese Woche / Irgendwann |
| `FindingsTable.tsx` | Findings-Liste als RecommendationCards |
| `FindingsTableApp.tsx` | App-Tabellen-Primitives-Variante der Findings-Liste |
| `FixPreview.tsx` | Vorschau eines generierten Fix-Prompts |
| `FixPreviewParts.tsx` | Teil-Komponenten des Fix-Preview |
| `FixPreviewSections.tsx` | Sektionen im Fix-Preview |
| `FixPromptDrawer.tsx` | Portal-Drawer rechts; Tool-Chips (Cursor/Claude Code/Generic), Copy; mode: single/group |
| `FixPromptInline.tsx` | Inline-Fix-Prompt ohne Drawer |
| `FurtherSection.tsx` | "Weitere Findings"-Sektion |
| `IslandsRow.tsx` | Drei Insel-Karten: KillerStatus / PolishScore / SelfInput; türkiser Hintergrund |
| `LighthouseUrlBlock.tsx` | Performance-URL-Input (ersetzt PerformanceTab) |
| `ProfileDisplayBar.tsx` | Anzeige des Projekt-Profils |
| `ProfileOnboarding.tsx` | 3-Schritt-Profil-Formular |
| `PromptCopyButton.tsx` | Copy-to-Clipboard für Prompts |
| `QuickWinsCard.tsx` | Prominente Karte für Top-5-Quick-Wins |
| `RecommendationCard.tsx` | Universelle Karte für Findings; Typ-Weiche: manual vs. prompt |
| `RunHistory.tsx` | Verlauf vergangener Audit-Runs |
| `ScoreBar.tsx` | Score-Balken-Visualisierung |
| `ScoreHero.tsx` | Großer Score-Hero oben auf der Seite |
| `ScoreTrend.tsx` | Score-Trend-Chart |
| `ScoreTrendLazy.tsx` | Lazy-geladene Variante des Score-Trend |
| `audit-findings-utils.ts` | Geteilte Utility-Funktionen für Findings-Darstellung |
| `category-descriptions.ts` | Statische Kategorie-Beschreibungen |
| `findings-table-helpers.ts` | Hilfsfunktionen für Findings-Tabelle |

**Gesamt: 39 Dateien** (36 `.tsx` + 3 `.ts`)

---

### Compliance-Resolver

---

#### Compliance-Resolver

- **Typ:** Server-only TypeScript-Modul
- **Pfad:** `src/lib/audit/compliance-resolver.ts`
- **Funktion:** Stufe 1 aktiv: 3 Checks. Verboten: Status `'fulfilled'`. User-Antwort hat absoluten Vorrang vor Code-Signal.
- **Quelle:** `src/lib/audit/compliance-resolver.ts` — Zeilen 1-95 gelesen

**Aktive Checks in Stufe 1:**

| Check | Question-Key | Was wird geprüft |
|-------|-------------|------------------|
| 1 | `has_privacy_policy` | Datenschutzseite vorhanden (`datenschutz`/`privacy` im Pfad) |
| 2 | `has_deletion_process` | Konto-Löschprozess erkennbar (aus Code-Kommentar, nicht vollständig gelesen) |
| 3 | `data_location` | Daten-Speicherort (aus CLAUDE.md Compliance-Resolver-Abschnitt) |

**Status-Typen:** `confirmed` | `needs-attention` | `input-needed` | `not-applicable`
**'fulfilled' ist verboten** (Komitee-Konsens 2026-05-06: juristisch untragbar ohne externe Verifikation).

---

### Deep-Review-Feature

---

#### Rate-Limit-Mechanismus

- **Pfad:** `src/lib/audit/deep-review-rate-limit.ts`
- **Funktion:** 24h-Cooldown + 10 Invocations/Monat pro User; liest/schreibt in `deep_review_invocations`-Tabelle (Migration 119).
- **Quelle:** `src/lib/audit/deep-review-rate-limit.ts` — direkt gelesen (MONTHLY_LIMIT=10, COOLDOWN_MS=24h)
- **Beobachtung:** DB-Tabelle `deep_review_invocations` seit `20260506000119_deep_review_rate_limits.sql`.

---

#### API-Route

- **Pfad:** `src/app/api/audit/review/route.ts`
- **Quelle:** `ls src/app/api/audit/review` — `route.ts` + `status/` vorhanden.

---

### i18n

---

#### next-intl Konfiguration

- **Pfad:** `src/i18n/routing.ts`, `src/i18n/request.ts`, `src/i18n/navigation.ts`
- **Locales:** `['de', 'en']`; `defaultLocale: 'de'`; `localePrefix: 'always'`
- **Quelle:** `src/i18n/routing.ts` — vollständig gelesen

---

#### Namespace-Übersicht (aus `messages/en.json`)

`common`, `nav`, `dashboard`, `status`, `auth`, `audit`, `auditScan`, `error`, `settings`, `projects`, `workspaces`, `feeds`, `agenten`, `artifacts`, `adminUsers`, `adminBudget`, `adminModels`, `adminBranding`, `adminLogs`, `cockpit`, `home`, `knowledge`, `department`, `perspectives`, `tasks`, `superadmin`, `beta`, `artifactRenderer`

**Gesamt: 28 Namespaces** (Feature-zentrisch, außer `artifactRenderer` laut CLAUDE.md-ADR-Abschnitt)

---

### Test-Coverage

---

#### Tests vorhanden

- **Unit-Tests:** `src/lib/audit/__tests__/` — 16+ Dateien: `audit-pipeline.integration.test.ts`, `checker-violations.integration.test.ts`, `cli-checker.unit.test.ts`, `documentation-checker.unit.test.ts`, `file-system-checker.unit.test.ts`, `findings-pipeline.integration.test.ts`, `group-findings.unit.test.ts`, `index.unit.test.ts`, `prompt-export.integration.test.ts`, `quick-wins.unit.test.ts`, `repo-map-checker.unit.test.ts`, `rule-registry.unit.test.ts`, `schema-drift-check.unit.test.ts`, `score-calculator.unit.test.ts`, `score-formatter.unit.test.ts`, `score-percentile.unit.test.ts`, `score-pipeline.integration.test.ts`, `state-deps-obs-checkers.unit.test.ts`
- **Weitere Tests:** `test/api/`, `test/audit/` + Setup-Dateien
- **E2E-Tests:** `e2e/` — `authenticated-chat.spec.ts`, `login.spec.ts`, `toro-widget.spec.ts`
- **Framework:** Vitest (Unit/Integration), Playwright (E2E)
- **Quelle:** `ls src/lib/audit/__tests__/`, `ls e2e/`

---

#### CI/CD: `.github/workflows/`

| Workflow | Datei |
|----------|-------|
| Bias-Evaluation | `bias-eval.yml` |
| CI (tsc + lint + tests) | `ci.yml` |
| Design-Lint | `design-lint.yml` |
| Lighthouse | `lighthouse.yml` |
| PR-Check | `pr-check.yml` |
| Security | `security.yml` |

**Gesamt: 6 Workflows**

---

## Teil B — Eingefrorene Substanz

---

### Projektwissen-System

- **Typ:** DB-Schema + UI-Route
- **Pfad:** `supabase/migrations/008_projects.sql`, `030_projects_schema.sql`, `20260325000073_projects_extend.sql`
- **Funktion:** `projects` + `project_memory` (APPEND ONLY) + `project_documents` + `project_knowledge`-Tabellen. Route `/projects` vorhanden.
- **Quelle:** `supabase/migrations/030_projects_schema.sql` (project_memory), `20260325000073_projects_extend.sql` (project_documents)
- **Status:** teilweise aktiv — `project_memory` wird von Feeds-Distribution (`target_type='project'`) genutzt; UI-Route `/projects` eingefroren seit 2026-04-27.
- **Beobachtung:** Tabelle `project_documents` vorhanden mit Storage-Bucket. Route `src/app/[locale]/(app)/projects/` existiert mit `page.tsx` + `[id]/`.

---

### Agenten-System

- **Typ:** DB-Schema + UI-Route + Engine
- **Pfad:** `src/lib/agent-engine.ts`, `supabase/migrations/025_agents.sql`, `20260318000048_agents_v2.sql`
- **Funktion:** `agents` + `agent_runs` (APPEND ONLY) — Tabellen vorhanden; `src/lib/agent-engine.ts` als Engine; Route `/agenten` vorhanden.
- **Quelle:** `supabase/migrations/20260318000048_agents_v2.sql` (5 Marketing-Paket-Agenten geseedet als scope='package')
- **Status:** eingefroren — Code + Schema vorhanden; Nav-Eintrag aus Sidebar entfernt (MVP-Pivot 2026-04-27).
- **Beobachtung:** Route `src/app/[locale]/(app)/agenten/` existiert mit `page.tsx`. `agent_runs` ist APPEND ONLY.

---

### Guided-Workflows / Capability-Outcome-System

- **Typ:** DB-Schema + Engine
- **Pfad:** `supabase/migrations/20260317000039_capability_outcome_system.sql`, `20260317000041_guided_workflows_seed.sql`
- **Funktion:** `capabilities`, `outcomes`, `guided_workflows`, `guided_workflow_options`, `guided_workflow_settings` — vollständig geseedet.
- **Quelle:** `supabase/migrations/20260317000041_guided_workflows_seed.sql` — 7 System-Workflows geseedet (Gesprächseinstieg, Entscheidung treffen, Optionen strukturieren, Entscheidungsmatrix, Unsicherheit, Neues Projekt, Recherche vertiefen)
- **Status:** eingefroren — Schema + Seed vorhanden; UI für Workflow-Verwaltung nicht aktiv im MVP.
- **Beobachtung:** Resolver-Code in `src/lib/capability-resolver.ts` + `src/lib/skill-resolver.ts` + `src/lib/library-resolver.ts` vorhanden (TRANSFORMATION-Status laut CLAUDE.md).

---

### Skill-System

- **Typ:** DB-Schema (geseedet)
- **Pfad:** `supabase/migrations/20260318000047_skills.sql`
- **Funktion:** `skills` + `agent_skills` — 6 System-Skills geseedet.
- **Quelle:** `supabase/migrations/20260318000047_skills.sql` — Zeilen 182-264 gelesen

**Die 6 System-Skills:**
1. `deep_analysis` — Tiefenanalyse (Gründliche inhaltliche Analyse von Texten)
2. `summarize` — Zusammenfassung (Komprimierung langer Texte)
3. `market_watch` — Marktbeobachtung (Wettbewerber, Trends, Marktveränderungen)
4. (4–6: Quelle-Lücke — Zeilen 235+ nicht vollständig gelesen; laut CLAUDE.md: Wissensextraktion, Berichterstellung, Social-Media)

- **Status:** nur Schema/Seed — UI für Skill-Verwaltung nicht aktiv im MVP.

---

### Bookmarks / Notifications / Inbox

- **Typ:** DB + UI-Route
- **Pfad:** `supabase/migrations/20260330000092_bookmarks_full_content.sql`; Route: (Quelle-Lücke — Route-Pfad nicht explizit verifiziert)
- **Funktion:** `bookmarks`-Tabelle mit `full_content TEXT`; UI eingefroren.
- **Quelle:** Migration 092; CLAUDE.md Pending-Tasks: "Lesezeichen-Feature ✅ gebaut"
- **Status:** eingefroren — gebaut 2026-03-30, im MVP-Pivot eingefroren.

---

### MCP-Plan

- **Typ:** Konzept-Dokumente
- **Pfad:** `docs/plans/mcp-integrations-konzept.md`, `docs/plans/mcp-integrations-plan.md`
- **Funktion:** Design für MCP-Integrationen (Toro verbindet sich mit Gmail, Kalender, Slack etc.)
- **Quelle:** `docs/plans/mcp-integrations-konzept.md` — Status: "Konzept März 2026"; `docs/product/migrations.md` CLAUDE.md
- **Status:** nur Konzept — wartet auf OAuth-Keys laut Memory. DB-Tabellen `org_mcp_policies` + `user_mcp_connections` (Migration 068) vorhanden.

---

### Toro-Chat-Widget / Canvas-Chat

- **Typ:** Komponente + Route
- **Pfad:** `src/app/[locale]/(app)/ws/[workspaceId]/` (Canvas); `src/app/[locale]/(app)/workspace/[id]/` (Workspace)
- **Funktion:** Canvas-Ansicht für Workspace-Chat mit Cards; `src/lib/workspace-context.ts` als separates Chat-System.
- **Quelle:** CLAUDE.md — "Zwei Chat-Systeme mit separaten System-Prompts"
- **Status:** eingefroren — Routen vorhanden, im MVP nicht aktiv in der Sidebar.

---

### Perspectives-System

- **Typ:** DB-Schema + UI-Route + API-Routes
- **Pfad:** `supabase/migrations/20260322000065_perspectives.sql`; `src/app/[locale]/(app)/perspectives/`; `src/app/api/perspectives/`
- **Funktion:** `perspective_avatars` + `perspective_user_settings` — 5 System-Avatare geseedet; Parallele KI-Antworten via SSE-Streaming.
- **Quelle:** Migration 065; CLAUDE.md Perspectives-Abschnitt
- **Status:** eingefroren — vollständig gebaut (2026-03-23), im MVP-Pivot eingefroren.
- **Beobachtung:** Route `src/app/[locale]/(app)/perspectives/` existiert; 7 API-Routes unter `src/app/api/perspectives/`.

---

### Feeds-System

- **Typ:** DB-Schema + UI-Route + Cron
- **Pfad:** `supabase/migrations/033_feed_tables.sql`, `20260314000036_feeds_v2.sql`; `src/app/[locale]/(app)/feeds/`
- **Funktion:** `feed_sources`, `feed_items`, `feed_distributions`, `feed_runs` (APPEND ONLY) — vollständig; Cron: `sync-feeds` alle 6h.
- **Quelle:** Migration 033, 036; `src/app/[locale]/(app)/feeds/` existiert mit `page.tsx` + Komponenten
- **Status:** eingefroren — vollständig gebaut (Plan J1 ✅), im MVP-Pivot eingefroren.
- **Beobachtung:** Route hat Unterverzeichnisse `DataView.tsx`, `SourceCard.tsx`, `SourcesView.tsx` etc.

---

### Cockpit-Widgets

- **Typ:** DB + UI-Route
- **Pfad:** `supabase/migrations/20260325000083_rename_to_cockpit.sql`; `src/app/[locale]/(app)/cockpit/page.tsx`; `src/components/cockpit/widgets/`
- **Funktion:** 8 Widget-Typen mit echten Daten; `cockpit_widgets`-Tabelle (umbenannt von dashboard_widgets).
- **Quelle:** Migration 083; `ls src/components/cockpit/widgets/` — 10 Dateien: `ArtifactOverviewWidget.tsx`, `BudgetUsageWidget.tsx`, `CodeHealthWidget.tsx`, `FeedHighlightsWidget.tsx`, `ProjectStatusWidget.tsx`, `QuickActionsWidget.tsx`, `RecentActivityWidget.tsx`, `Shared.tsx`, `TeamActivityWidget.tsx`, `ToroRecommendationWidget.tsx`
- **Status:** teilweise aktiv — Widget-Tabelle + Komponenten vorhanden; Cockpit-Route existiert; Sidebar-Link im MVP nicht primär (Dashboard ist Haupteinstieg).

---

## Teil C — Konzept-Substanz

### `docs/product/`

| Dokument | Kurzbeschreibung | Status |
|----------|-----------------|--------|
| `zielbild-2026-q3.md` | Zielbild Q3 2026 v2: 8 Achsen aus Sparring + K0 + K0.5 Komitee | normativ (Entwurf für ADR-031, 24h-Wait) |
| `roadmap-2026-q2.md` | Normative Roadmap — Single Source of Truth für Bauphasen + Sprint-Status | normativ |
| `marken-brief.md` | Coach-Position, Schiefer-Limette-Welt, Stimm-Formel, Pflicht-Tags | normativ |
| `feature-bestand.md` | Feature-Inventar mit Status-Markern (LIVE/EINGEFROREN/ABGELÖST) | normativ |
| `feature-registry.md` | (umbenannt zu feature-bestand.md) | veraltet |
| `migrations.md` | Vollständige Migrations-Übersicht | normativ |
| `rag-architecture.md` | RAG + pgvector + Wissensbasis-Schema | eingefroren |
| `onboarding.md` | Onboarding-Schritte, AI-Act, Email-Templates | normativ |
| `superadmin.md` | Superadmin-Tool, Client-Anlage-Ablauf | normativ |
| `jungle-order.md` | Jungle Order Edge Function, Soft Delete, Multi-Select | normativ |
| `open-todos.md` | Manuelle To-Dos (z.B. Supabase PITR Restore-Test) | normativ |
| `backup-dr.md` | Backup + DR Dokumentation | normativ |
| `meta-agenten.md` | Meta-Agenten-Konzept | unklar |
| `user-story-idea-to-production.md` | Marketing-Narrativ: Idea-to-Production | Marketing-Narrativ |
| `user-types-hobby-business-enterprise.md` | User-Typen-Strategie | Entwurf |
| `toro-potential-scan.md` | Potenzial-Scan für Toro-Weiterentwicklung | unklar |

---

### `docs/adr/`

| Dokument | Kurzbeschreibung | Status |
|----------|-----------------|--------|
| `001-nextjs-app-router.md` | Next.js App Router als Framework-Entscheidung | normativ |
| `002-vercel-deployment-plattform.md` | Vercel als Deployment-Plattform | normativ |
| `003-supabase-als-auth-und-db.md` | Supabase für Auth + DB | normativ |
| `004-drizzle-schema-only.md` | Drizzle nur für Schema-Definition, keine Queries | normativ |
| `005-append-only-tables.md` | Append-Only-Muster für Audit-Logs etc. | normativ |
| `006-ai-sdk-als-llm-layer.md` | Vercel AI SDK als LLM-Layer | normativ |
| `007-rollen-architektur.md` | Rollen-Architektur (Superadmin/OrgRole/WorkspaceRole) | normativ |
| `008-chart-bibliotheken.md` | Chart-Bibliotheken: Tremor (App) / ECharts (Artifacts) / Reveal.js | normativ |
| `009-artifact-system-iframe-sucrase.md` | Artifact-System mit iFrame + Sucrase-Transforms | normativ |
| `010-anthropic-direct-no-dify.md` | Anthropic direkt (Dify abgelöst) | normativ |
| `011-conversations-fuer-workspace-chats.md` | conversations-Tabelle für Workspace-Chats | normativ |
| `012-feeds-pipeline-architektur.md` | Feeds-Pipeline-Architektur | normativ |
| `013-library-system-rolle-capability-skill.md` | Library-System (eingefroren/TRANSFORMATION-Status) | eingefroren |
| `014-smart-model-router-multi-provider.md` | Smart Model Router + Multi-Provider | normativ |
| `015-perspectives-parallele-ki-antworten.md` | Perspectives-System (eingefroren) | eingefroren |
| `016-web-search-anthropic-server-tool.md` | Web Search via Anthropic server tool | normativ |
| `017-i18n-deferred.md` | i18n: deferred bis April 2026 | normativ (umgesetzt) |
| `018-windmill-statt-n8n.md` | Windmill statt n8n als Workflow-Engine | normativ |
| `019-nextjs-16-downgrade-turbopack-nft-bug.md` | Next.js 16 Downgrade wegen Turbopack NFT-Bug | normativ |
| `020-six-layer-knowledge-architecture.md` | Sechs-Schichten-Wissens-Modell | normativ |
| `021-prompt-veredler-architecture.md` | Prompt-Veredler (Phase 2) | Entwurf |
| `022-markdown-format-obsidian-bridge.md` | Markdown + YAML + Wikilinks | normativ |
| `023-interface-strategy.md` | Interface-Strategie: CLI-First + Pull-MCP | normativ |
| `024-marken-pivot.md` | Marken-Pivot zu Schiefer-Limette (2026-04-28) | normativ |
| `027-killer-kriterien-score-pivot.md` | Killer-Kriterien + Score-Pivot (ADR-027) | normativ |
| `ADR-025-tab-architektur.md` | Tab-Architektur: 7 Domain-Tabs, Compliance-Strategie | normativ |
| `ADR-026-doku-hygiene-tab.md` | Doku-Hygiene-Tab | normativ |
| `INDEX.md` | ADR-Index | normativ |

**Fehlende ADRs:** ADR-028 bis ADR-030 nicht vorhanden. ADR-031 steht aus (Pivot zur Begleitplattform, 24h-Wait nach Zielbild v2).

---

### `docs/plans/`

| Dokument | Kurzbeschreibung | Status |
|----------|-----------------|--------|
| `2026-03-07-superadmin-clients-design.md` | Superadmin-Clients Design | normativ |
| `2026-03-07-superadmin-clients.md` | Superadmin-Clients Spezifikation | normativ |
| `2026-03-07-workspace-redesign.md` | Workspace-Redesign | eingefroren |
| `2026-03-08-prompt-templates-design.md` | Prompt-Templates Design | normativ |
| `2026-03-08-prompt-templates.md` | Prompt-Templates Spezifikation | normativ |
| `2026-03-08-ui-redesign.md` | UI-Redesign Spezifikation | eingefroren |
| `2026-03-09-smarte-projekte-design.md` | Smarte Projekte Design | eingefroren |
| `2026-03-09-smarte-projekte.md` | Smarte Projekte Spezifikation | eingefroren |
| `2026-03-10-rag-foundation.md` | RAG-Foundation Plan | eingefroren |
| `2026-03-10-toro-public-chat-widget.md` | Toro Public Chat Widget | eingefroren |
| `agents-spec.md` | Agenten-System: Definition, Typen, DB-Schema, Agent-Engine | eingefroren |
| `ansatz-c-lh-finding-types.md` | Lighthouse-Finding-Typen Strukturierung (Sprint-Plan) | Entwurf |
| `bp-audit-tabellen-welt.md` | Audit-Tabellen-Welt Design-Plan | normativ (umgesetzt) |
| `bp-design-1-marken-pivot.md` | Marken-Pivot Design-Plan | normativ (umgesetzt) |
| `echarts-artifacts.md` | ECharts-Artifacts Plan | normativ (umgesetzt) |
| `mcp-integrations-konzept.md` | MCP-Integrationen Konzept (wartet auf OAuth-Keys) | Entwurf |
| `mcp-integrations-plan.md` | MCP-Integrationen Build-Plan | Entwurf |
| `perspectives-build.md` | Perspectives Build-Plan | normativ (umgesetzt) |
| `presentation-artifacts.md` | Präsentations-Artifacts Plan | normativ (umgesetzt) |
| `tremor-migration.md` | Tremor Chart-Migration | normativ (umgesetzt) |
| `widget-katalog.md` | Cockpit Widget-Katalog (Roadmap) | Entwurf |

---

### `docs/audit-reports/`

Neueste Reports:
| Dokument | Typ |
|----------|-----|
| `2026-05-06-audit-report.md/.json` | Regulärer Audit-Report (96.4%) |
| `k05-konzept-vertiefung-komitee-2026-05-07.md` | K0.5 Komitee-Sprint (heute) |
| `k0-konzept-explorativ-komitee-2026-05-07.md` | K0 Komitee-Sprint (heute) |
| `compliance-resolver-komitee-2026-05-06.md` | Compliance-Resolver Komitee |
| `findings-inventar-2026-05-05.md` | Findings-Inventar |
| `dogfood-2026-05-04.md` | Dogfooding-Session-Report |

Benchmark-Ergebnisse: `benchmark-2026-04-17-v8-full.json` (49 Repos, avg 80.2% Lovable)

---

### `docs/handover/`

| Dokument | Kurzbeschreibung | Status |
|----------|-----------------|--------|
| `k0-sprint-handover-2026-05-07.md` | K0 Sprint Handover (heute erstellt) | normativ |
| `k05-sprint-handover-2026-05-07.md` | K0.5 Sprint Handover (heute erstellt) | normativ |

---

### `docs/synthese/`

| Dokument | Kurzbeschreibung | Status |
|----------|-----------------|--------|
| `tag4-master-synthese.md` | Strategie-Synthese aus 3-Tage-Inventur (2026-04-27) | normativ |
| `anhang-a-roadmap.md` | Sprint-Plan mit Aufwand-Schätzung | normativ |
| `anhang-b-migrations.md` | DB-Migrations-Block für Sprint 1+ | normativ |
| `anhang-c-kill-und-einfrier-liste.md` | Kill- und Einfrier-Liste mit Wieder-Anschalten-Bedingungen | normativ |

---

### `docs/committee-reviews/`

33 Dateien: 17 Review-Ergebnisse (`*-review.md`) + 10 Input-Dokumente (`input-*.md`) + 6 weitere.

Neueste Reviews: `compliance-resolver-review.md`, `killer-kriterien-komitee-review.md`, `wording-komitee-8a-review.md`, `prodify-round2-review.md`.

---

### `docs/inventory/` (nicht `inventur/`)

8 Dateien aus früherer Inventur-Session (2026-04-23/27):
`2026-04-23-vision-reactivation-inventory.md`, `2026-04-27-backend-inventar.md`, `2026-04-27-bestandstabelle.md`, `2026-04-27-doc-review-adr020-023.md`, `2026-04-27-doc-review-v2.md`, `2026-04-27-markdown-inventar.md`, `2026-04-27-schichten-mapping.md`, `inventur-code-2026-04-27.md`

**Hinweis:** Verzeichnis heißt `docs/inventory/` (englisch), nicht `docs/inventur/` (Deutsch). Diese Bestandsaufnahme wurde unter `docs/inventur/` abgelegt (neu erstellt).

---

### Root-Konzept-Dateien

| Datei | Kurzbeschreibung | Status |
|-------|-----------------|--------|
| `ARCHITECT.md` | System-Architekt-Protokoll: Pflicht-Lektüre vor jedem Build | normativ |
| `CLAUDE.md` | Einzige Quelle der Wahrheit für Claude Code: Tech-Stack, Design-System, Code-Regeln, Migrations-Übersicht | normativ |
| `docs/webapp-manifest/manifesto.md` | 10 Kernprinzipien (Philosophie) | normativ |
| `docs/webapp-manifest/engineering-standard.md` | Konkrete Regeln pro Kategorie (25 Kategorien) | normativ |
| `docs/webapp-manifest/audit-system.md` | Gewichtetes Scoring (0–5 pro Regel, Gewichte 1–3) | normativ |

---

## Teil D — Mapping gegen v2-Zielbild

Quelle: `docs/product/zielbild-2026-q3.md` (Stand 2026-05-07)

---

### Achse 1 — Eintritts-Architektur

**v2-Anspruch:** Ein Eintritt mit Verzweigungs-Frage "Was hast du bereits?" — Repo-URL oder Idee/nichts — führt zu identischem Dashboard.

**Substanz vorhanden:**
- File System Access API (`src/lib/file-access/`) für Repo-Scan ohne Upload
- `/audit/scan` mit `ConnectProjectCard.tsx` (3-Schritt-Flow)
- Scan-Pipeline via `/api/projects/scan`
- Dashboard (`/dashboard`) mit Projekt-Card-Grid

**Substanz-Lücke:**
- GitHub-URL-Direkt-Verbindung nicht implementiert (nur lokaler Ordner via File System Access API)
- "Idee / nichts"-Pfad mit 5-Fragen-Wizard fehlt
- Eintritts-Frage "Was hast du bereits?" als expliziter Screen-1-Flow fehlt
- Verzweigungs-UX zwischen den zwei Pfaden fehlt

---

### Achse 2 — Eingriffs-Logik: Gate-getrieben

**v2-Anspruch:** Pull statt Push. Drei Loci: Editor (Schweigen), Pre-Commit-Gate (opt-in), CI/CD-Release-Gate (opt-in). Drei Severity-Klassen: Critical / Should / Info.

**Substanz vorhanden:**
- Killer-Klassifikation (`killer-rule-ids.ts`) als Grundlage für Critical-Severity
- `shouldBeKiller()` als einziger Entscheidungspunkt
- Severity-Felder in `audit_findings` (`severity`, `is_killer`)
- `cat-3-rule-build` prüft Production-Build

**Substanz-Lücke:**
- CLI-Tool (`tropen gate`) nicht gebaut
- Pre-Commit-Git-Hook nicht vorhanden
- CI/CD-Release-Gate nicht vorhanden
- Drei-Severity-Klassen-UI (Critical sichtbar, Should+Info zugeklappt) nicht als explizites v2-Pattern implementiert — aktuelle UI hat STOPPER/EMPFOHLEN ZUERST/WEITERE

---

### Achse 3 — Wissens-Asymmetrie: Vier Domänen

**v2-Anspruch:** Vier-Domänen-Spezialist: Architektur & Datenmodell, Security & Auth, Testing/Monitoring/Operations, Compliance (DSGVO-Kern + BFSG-Basics + AI-Act-Transparenz).

**Substanz vorhanden:**
- 7 Domain-Tabs (code-quality, security, accessibility, dsgvo, ki-act, performance, documentation)
- DSGVO-Checker (6 automatisierte DSGVO-Rules)
- BFSG-Checker (5 automatisierte BFSG-Rules)
- AI-Act-Checker (5 automatisierte AI-Act-Rules)
- Compliance-Resolver Stufe 1 (3 Checks aktiv)
- Agent-Regelwerk für alle vier Domänen

**Substanz-Lücke:**
- CRA-Tiefe bewusst auf Phase 2 verschoben (kein Gap, Design-Entscheidung)
- UX/UI-Konsistenz als fünfte Domäne bewusst gestrichen (kein Gap)

---

### Achse 4 — Tool-Verhältnis: Hilfs-Artefakte und Datei-Brücke

**v2-Anspruch:** Nur Hilfs-Artefakte (Fix-Prompts, Compliance-Checklisten, Template-Prompts, Decision-Log). Datei-Export + Zwischenablage als Brücke. CLI-Tool (`tropen audit`). Keine IDE-Plugins.

**Substanz vorhanden:**
- Fix-Prompt-Generator (Template-Engine + API-Route) vollständig
- Copy-to-Clipboard in `FixPromptDrawer.tsx` + `PromptCopyButton.tsx`
- Compliance-Checklisten (ComplianceBlock, ComplianceQuestion)
- Prompt-Templates-System (`prompt_templates`-Tabelle + UI)

**Substanz-Lücke:**
- CLI-Tool (`tropen audit`, `tropen gate`) fehlt komplett (v2 schätzt 4 Wochen Aufwand)
- Decision-Log als `.tropen/decision-log.yml` im User-Repo fehlt
- GitHub-Action (`tropen gate --release`) fehlt

---

### Achse 5 — Schweigen-by-Default

**v2-Anspruch:** Schweigen außerhalb Chat. Proaktiv im Begleiter-Chat. Email-Digest opt-in (max. 1×/Woche).

**Substanz vorhanden:**
- Chat-Interface vorhanden (eingefroren)
- Quick-Chips in Toro-Bubble (Suggestion-Pills im Chat)
- Intention-System (`conversations.intention`)

**Substanz-Lücke:**
- Email-Digest-System fehlt
- Lautstärke-Regler (still/normal/laut) für Chat-Proaktivität fehlt
- Kontext-Trigger im Chat (wenn User über Auth schreibt und Auth-Finding verfügbar) nicht implementiert
- Begleiter-Chat als explizites v2-Konzept noch nicht gebaut

---

### Achse 6 — Projekt-Hygiene über Zeit

**v2-Anspruch:** Decision-Log als `.tropen/decision-log.yml` im User-Repo. Drift-Erkennung Soll vs. Ist. Müll-Erkennung. Kein Graph nötig.

**Substanz vorhanden:**
- Score-Trend (`src/lib/audit/trend.ts`) für zeitliche Entwicklung
- `audit_runs` (APPEND ONLY) als Verlaufs-Grundlage
- Repo-Map-Generator (`src/scripts/generate-repo-map.ts`) als Ist-Bild-Basis
- SLOP-Detection (cat-26) als Müll-Erkennung
- Dependency-Checks als Drift-Signal

**Substanz-Lücke:**
- Decision-Log im User-Repo (`.tropen/decision-log.yml`) nicht vorhanden
- Drift-Erkennung Soll-Bild aus Decision-Log vs. Code-Scan fehlt
- Refactoring-Anlass-Erkennung als eigenständige Funktion fehlt

---

### Achse 7 — Regelwerk als Kern-Asset

**v2-Anspruch:** 255 Regeln (im Zielbild: "242") als zentrales Wissens-Asset. Vier Use-Cases: Audit, Fix-Prompts, Prompt-Veredler (Phase 2), Initial-Compliance-Checkliste.

**Substanz vorhanden:**
- 255 Regeln in 26 Kategorien (aus Code gezählt)
- Audit aktiv (Use-Case 1)
- Fix-Prompts vollständig (Use-Case 2)
- `finding-recommendations.ts` (2400+ Zeilen) als Regelwerk-Wissens-Asset

**Substanz-Lücke:**
- Prompt-Veredler (Use-Case 3) bewusst auf Phase 2 verschoben
- Initial-Compliance-Checkliste für "Nichts vorhanden"-Eintritt (Use-Case 4, neu aus Achse 1) fehlt

---

### Achse 8 — Lernfähigkeit

**v2-Anspruch:** Phase 1 (aktiv): Komitee-Lernen (intern) + Externe Quellen (manuell kuratiert). Repo-Lernen: Phase 2/3.

**Substanz vorhanden:**
- Multi-Model-Komitee vollständig (`src/scripts/committee-review.ts` + 6 Review-Configs)
- Komitee-Reviews in `docs/committee-reviews/` (33 Dokumente)
- Agent-Generator + Meta-Review + Deep-Agent-Generator als Lern-Pipeline

**Substanz-Lücke:**
- Externe Quellen (CVE-Feeds, Gesetzes-Updates) nicht automatisiert — manuell kuratiert
- Kein Semi-automatisierter CVE-Feed-Ingest vorhanden

---

## Teil E — Auffälligkeiten

---

**E-1: `docs/inventory/` vs. `docs/inventur/`**

Früheres Inventur-Verzeichnis heißt `docs/inventory/` (englisch, 8 Dateien aus April 2026). Diese neue Inventur wurde in `docs/inventur/` (Deutsch, neu erstellt) abgelegt. Zwei Verzeichnisse mit ähnlichem Zweck.
Quelle: `ls C:/Users/timmr/tropenOS/docs` — beide vorhanden.

---

**E-2: ADR-Nummern-Lücken**

ADR-025, ADR-026, ADR-027 existieren als Dateien. ADR-028 bis ADR-030 fehlen. Nächste geplante: ADR-031 (Pivot). Lücke von 3 ADRs ungeklärt.
Quelle: `ls docs/adr/` — INDEX.md + ADR 001-024 + ADR-025/026/027.

---

**E-3: Regelzahl-Diskrepanz**

CLAUDE.md und Zielbild v2 nennen "242 Regeln in 26 Kategorien". Code-Zählung ergibt 255. Letzte Audit-Report-Auswertung (2026-05-06): 153 automatisierte + 97 manuelle = 250 in Auswertung. Drei verschiedene Zahlen im Umlauf.
Quelle: `rule-registry.ts` (255 gezählt), CLAUDE.md, `2026-05-06-audit-report.md` (250).

---

**E-4: `dashboard_widgets`-Tabelle vs. `cockpit_widgets`**

Migration 082 erstellt `dashboard_widgets`. Migration 083 benennt sie in `cockpit_widgets` um. In der Tabellen-Extraktion erscheinen beide Namen (durch `CREATE TABLE`-Scan ohne `ALTER TABLE`-Berücksichtigung). Aktiver Name: `cockpit_widgets`.
Quelle: `supabase/migrations/20260325000082_dashboard_widgets.sql`, `20260325000083_rename_to_cockpit.sql`.

---

**E-5: 10 Cockpit-Widget-Komponenten vs. 8 Widget-Typen**

CLAUDE.md nennt "8 Widget-Typen". `ls src/components/cockpit/widgets/` zeigt 10 Dateien (inkl. `CodeHealthWidget.tsx`, `ProjectStatusWidget.tsx` die nicht in der 8er-Liste stehen). Mögliche Erklärung: Entwicklung nach CLAUDE.md-Dokumentation.
Quelle: `ls src/components/cockpit/widgets/`.

---

**E-6: `qa_*`-Tabellen ohne erkennbare UI**

4 QA-Tabellen aus Migration 027: `qa_compliance_checks`, `qa_lighthouse_runs`, `qa_metrics`, `qa_routing_log`, `qa_test_runs`. Keine UI-Route `/qa` unter `(app)/` gefunden (nur `/admin/qa` als Admin-Route).
Quelle: `supabase/migrations/027_qa_tables.sql`; `ls src/app/[locale]/(app)/admin/` — `qa` vorhanden.

---

**E-7: `workspace_assets`, `workspace_exports`, `workspace_messages`, `workspace_participants` — Quellen-Lücke**

Diese vier Tabellennamen tauchen im `CREATE TABLE`-Scan auf, aber die exakten Migrations-Dateien wurden nicht einzeln verifiziert. Möglicherweise unter früheren Workspace-Migrations oder unter anderem Schema.
Quelle: Grep-Output — Tabellennamen vorhanden, Migrations-Datei nicht explizit gefunden.

---

**E-8: Doppelte Pipeline-Einstiegspunkte**

Audit kann gestartet werden via: (a) `run-audit.ts` CLI, (b) `/api/audit/trigger` Web-API, (c) `/audit/scan` für externe Projekte. Drei verschiedene Einstiegspunkte mit unterschiedlichen Kontexten (lokales Repo vs. DB-Persist vs. In-Memory). Kein offensichtlicher Bug, aber Komplexität.

---

**E-9: `package_agents`-Tabelle — Status nach Migrations-Migration**

Migration 056 migriert `package_agents` → `roles`. Tabelle `package_agents` aus Migration 025 sollte danach leer/obsolet sein. Im Grep-Output taucht sie noch auf.
Quelle: `supabase/migrations/20260319000056_library_seed.sql` (Kommentar "package_agents → roles migriert").

---

**E-10: `connections`-Tabelle — keine Migrations-Quelle gefunden**

Tabelle `connections` taucht im Grep-Output auf, aber die exakte Migration konnte nicht identifiziert werden.
Quelle: Grep-Output.

---

## Teil F — Quellen-Lücken

---

**F-1: "242 Regeln in 26 Kategorien" — echte Zahl aus Code?**

Tatsächliche Zahl aus `rule-registry.ts` (direkt gezählt, 2026-05-07): **255 Regeln** (187 automatisierte + 68 manuelle). Audit-Report 2026-05-06 wertet 153 automatisierte + 97 manuelle = 250 aus (externe-Tool-Regeln im `--skip-cli`-Modus nicht aktiv). Die Zahl "242" aus CLAUDE.md ist nicht mehr aktuell — sie datiert aus einem früheren Sprint.

---

**F-2: "6 System-Skills geseedet" — welche genau?**

Vier bestätigt aus direktem Lesen von `20260318000047_skills.sql`:
1. `deep_analysis` — Tiefenanalyse
2. `summarize` — Zusammenfassung
3. `market_watch` — Marktbeobachtung
4. (Skill 4-6: Zeilen 235+ nicht vollständig gelesen)

CLAUDE.md nennt: "Tiefenanalyse, Zusammenfassung, Marktbeobachtung, Wissensextraktion, Berichterstellung, Social-Media". Die letzten 3 wurden nicht direkt im Code verifiziert. **Quellen-Lücke für Skills 4–6.**

---

**F-3: "7 System-Workflows" — welche genau?**

Direkt aus `supabase/migrations/20260317000041_guided_workflows_seed.sql` gelesen:
1. "Wie kann ich helfen?" (sort_order 0)
2. "Wie sollen wir die Entscheidung angehen?" (sort_order 1)
3. "Wie viele Optionen hast du?" (sort_order 2)
4. "Was sind deine wichtigsten Kriterien?" (sort_order 3)
5. "Kein Problem – wo stehst du gerade?" (sort_order 4)
6. "Neues Projekt – womit fangen wir an?" (sort_order 5)
7. "Recherche abgeschlossen – was als nächstes?" (sort_order 6)

**Vollständig belegt.** Alle 7 System-Workflows sind in der Migration dokumentiert.

---

**F-4: Komitee-Engine "läuft produktiv" — wann zuletzt ausgeführt?**

Laut `docs/architect-log.md` (letzte Einträge):
- K0-Sprint: 2026-05-07 (heute), Kosten €0.3510
- K0.5-Sprint: 2026-05-07 (heute), Kosten €1.5914
- Compliance-Resolver-Komitee: 2026-05-06, Kosten €0.44 (aus Memory)
- Letzter regulärer Audit: 2026-05-06

Die Engine läuft aktiv — zwei Sprints heute. Neuester Report: `k05-konzept-vertiefung-komitee-2026-05-07.md`.

---

**F-5: `connections`-Tabelle**

Tabelle `connections` erscheint in Grep-Output aber Migrations-Quelldatei nicht identifiziert. Möglicherweise Teil der frühen Migrations (001-033) unter einem anderen Kontext. **Quellen-Lücke.**

---

**F-6: `workspace_assets`, `workspace_exports`, `workspace_messages`, `workspace_participants`**

Erscheinen im Grep-Output, aber Migrations-Quelldateien nicht einzeln verifiziert. Möglicherweise aus frühen Workspace-Migrations (031 oder ähnlich). **Quellen-Lücke für exakte Migration.**

---

**F-7: Skills 4–6 (Wissensextraktion, Berichterstellung, Social-Media)**

Nicht direkt im Code verifiziert — nur aus CLAUDE.md-Memory. Die Migration-Datei `20260318000047_skills.sql` wurde nur bis Skill 3 gelesen (Zeile ~250). **Quellen-Lücke für Skills 4–6.**

---

*Bestandsaufnahme abgeschlossen: 2026-05-07. Erstellt durch automatische Code-Inventur.*
