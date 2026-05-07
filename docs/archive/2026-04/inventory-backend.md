# Backend-Inventar — Edge Functions · lib · Actions · Hooks · Migrations
> Generiert: 2026-04-27
> Schicht-Kürzel (ADR-020): CH=Chat · IN=Inbox · PW=Projektwissen · MK=Merker · AR=Artefakte · PB=Projektboard · ?=Plattform-Infra

---

## 1. Edge Functions (4)

Laufen auf Supabase Edge Runtime (Deno). Direkt vom Client erreichbar, bypassen Next.js.

| Funktion | Zeilen | Schicht | Beschreibung |
|---------|--------|---------|-------------|
| `supabase/functions/ai-chat/index.ts` | 924 | CH | Haupt-Chat-Handler: Streaming, Memory-Fenster, Budget-Check, Tool-Use, TTS-Flag, Konversationstypen (chat/canvas/prompt_builder/guided) |
| `supabase/functions/jungle-order/index.ts` | 240 | PB | Soft-Delete-Orchestrierung für Workspace-Items (Cards, Connections, Agents) mit Multi-Select |
| `supabase/functions/knowledge-ingest/index.ts` | 213 | PW | Dokument-Ingestion: PDF/Text → Chunks → pgvector Embeddings → knowledge_entries |
| `supabase/functions/knowledge-search/index.ts` | 128 | PW | Semantische Suche via pgvector Cosine-Similarity auf knowledge_entries |

**Auffällig:** `ai-chat` ist mit 924 Zeilen die größte einzelne Datei im Projekt. Enthält Routing-Logik, Streaming-Handling, Budget-Enforcement und Prompt-Assembly — Kandidat für Aufspaltung.

---

## 2. Server Actions (src/actions/ — 6 Dateien, 1.889 Zeilen)

Next.js Server Actions: direkter DB-Zugriff aus Client-Komponenten ohne API-Route.

| Datei | Zeilen | Schicht | Beschreibung |
|-------|--------|---------|-------------|
| `src/actions/feeds.ts` | 447 | IN | Feed-CRUD, Quellen anlegen/pausieren, Items laden, Distributions-Management |
| `src/actions/workspaces.ts` | 441 | PB | Workspace-CRUD, Archivierung, Member-Management, Share-Links |
| `src/actions/cards.ts` | 285 | PW | Card-CRUD mit History-Trail, Capability/Skill-Verknüpfung |
| `src/actions/connections.ts` | 264 | ? | Externe Datenquellen-Verbindungen (MCP, Webhooks) |
| `src/actions/chat.ts` | 240 | CH | Konversation anlegen, Intention setzen, Memory-Extraktion triggern |
| `src/actions/chat-stream.ts` | 120 | CH | Stream-Setup und Chunk-Handling für Chat-Responses |
| `src/actions/feed-topics.ts` | 92 | IN | Feed-Topic-CRUD und Quellen-Zuordnung |

---

## 3. Custom Hooks (src/hooks/ — 10 Dateien, 953 Zeilen)

| Datei | Zeilen | Schicht | Beschreibung |
|-------|--------|---------|-------------|
| `src/hooks/useWorkspaceState.ts` | 450 | CH/PB | Zentraler Workspace-State: aktive Konversation, Artefakte, Scroll, Split-View — größter Hook |
| `src/hooks/useParallelTabs.ts` | 168 | CH | Parallel-Tab-Logik: neue Konversation in separatem Tab öffnen |
| `src/hooks/useDeepFix.ts` | 91 | AR | Deep-Fix-Button-State: Consensus-Fix anfordern, Status tracken |
| `src/hooks/useTTS.ts` | 69 | CH | Text-to-Speech: OpenAI TTS-1, Play/Stop, Zustand pro Nachricht |
| `src/hooks/use-focus-trap.ts` | 61 | ? | Tastatur-Fokus-Trap für Modals/Drawers |
| `src/hooks/useAssistantName.ts` | 33 | CH | Toro-Anrede aus user_preferences lesen |
| `src/hooks/usePerspectives.ts` | 24 | CH | Perspectives-Bottom-Sheet-State |
| `src/hooks/useRightSidebar.ts` | 22 | PB | Rechte Panel-Sichtbarkeit steuern |
| `src/hooks/useArtifactsView.ts` | 20 | AR | Artefakte-Übersicht-Modus im Chat |
| `src/hooks/useMediaQuery.ts` | 15 | ? | Responsive-Breakpoint-Detection |

---

## 4. Library-Module (src/lib/ — 135 Dateien, 23.301 Zeilen)

Gruppiert nach Subsystem. Innerhalb jeder Gruppe absteigend nach Zeilenzahl.

### 4.1 Audit-System (src/lib/audit/ — ~30 Dateien)

| Datei | Zeilen | Schicht | Beschreibung |
|-------|--------|---------|-------------|
| `checkers/agent-committee-checker.ts` | 1092 | AR | ~30 automatisierte Checks aus 18 Agenten-Rule-Packs (Legal, DB, API, Testing etc.) |
| `checkers/agent-regulatory-checker.ts` | 686 | AR | DSGVO/BFSG/AI-Act-Checks (~15 Regeln) |
| `checkers/security-scan-checker.ts` | 654 | AR | Sicherheits-Checks: Secrets, SQL-Injection, Auth-Guards |
| `finding-recommendations.ts` | 534 | AR | Fix-Prompt-Empfehlungen pro Rule-ID (Matching, Priorität, manualSteps) |
| `rule-registry.ts` | 526 | AR | ~70 AuditRule-Einträge mit agentSource, Gewichtung, fixType |
| `checkers/file-system-checker.ts` | 480 | AR | Datei-Existenz-Checks (CLAUDE.md, .env.example, Runbooks etc.) |
| `checkers/external-tools-checker.ts` | 457 | AR | Lighthouse, ESLint, depcruise, gitleaks, Bundle-Analyse |
| `checkers/repo-map-checker.ts` | 430 | AR | Symbol- und Struktur-Checks via RepoMap |
| `build-time-rules.ts` | 420 | AR | Statische Audit-Regeln die ohne Laufzeit-Analyse auswertbar sind |
| `agent-applicability.ts` | 410 | AR | Bestimmt welche Agenten-Regeln für ein Projekt gelten |
| `checkers/slop-detection-checker.ts` | 342 | AR | KI-Code-Hygiene: Placeholder, Fingerprints, Overcommenting |
| `checkers/agent-security-checker.ts` | 322 | AR | Security-Agent-spezifische Checks |
| `checkers/ast-quality-checker.ts` | 317 | AR | Cyclomatic Complexity, God Components, N+1, Error-Boundaries |
| `checkers/category-gap-checkers.ts` | 260 | AR | Performance, CI/CD, Cost-Awareness Checks |
| `checkers/state-deps-obs-checkers.ts` | 247 | AR | fetch-in-useEffect, Prop-Drilling, Store, Error-Monitoring |
| `checkers/compliance-checker.ts` | 240 | AR | AGB, Widerruf, Affiliate, AI-Transparenz |
| `export-rules.ts` | 235 | AR | Regelwerk als JSON/Markdown exportieren |
| `prompt-export/template-engine.ts` | 234 | AR | Fix-Prompt-Generierung (5 Sektionen: Problem/Wo/Warum/Fix/Validierung) |
| `deduplicator.ts` | 229 | AR | Finding-Deduplizierung (Same Rule + File = Merge) |
| `checkers/final-category-checkers.ts` | 224 | AR | Backup, Timeout, README, PWA, Deployment Checks |
| `types.ts` | 221 | AR | AuditRule, AuditContext, AuditFinding, AuditOptions Typen |
| `checkers/spec-checker.ts` | 203 | AR | SPEC_AGENT: AI-Kontext-Datei, PRD, README-Drift |
| `checkers/cli-checker.ts` | 202 | AR | Shell-basierte Checks (Supabase, pnpm audit) |
| `checkers/thin-category-checkers.ts` | 193 | AR | Icons, Strings, .gitignore, Deploy-Config |
| `index.ts` | 191 | AR | buildAuditContext (Disk) + buildAuditContextFromFiles (In-Memory) |
| `schema-drift-check.ts` | 189 | AR | DB-Provider-Detection + Schema-Drift |
| `checkers/gap-checkers.ts` | 174 | AR | .env.example, TODO-Checks, Promises, Loading States |
| `checkers/documentation-checker.ts` | 152 | AR | ADR, Runbooks, Changelog Checks |
| `checkers/agent-observability-checker.ts` | 157 | AR | Logging, Monitoring, Alerting Checks |
| `checkers/agent-architecture-checker.ts` | 113 | AR | Architektur-Pattern-Checks |
| `group-findings.ts` | 149 | AR | Findings nach Rule-ID gruppieren für UI |
| `scoring/score-calculator.ts` | 144 | AR | Gewichtetes Score-Berechnung (0–5 × Gewicht) |
| `compliance-domains.ts` | 144 | AR | 6 Compliance-Domänen mit Relevanz-Funktionen |
| `quick-wins.ts` | 141 | AR | Top-5 Findings nach Impact/Aufwand-Score |
| `prompt-export/repo-context.ts` | 89 | AR | Symbols+Deps aus RepoMap für Fix-Prompts (max 2000 Token) |
| `scoring/score-formatter.ts` | 94 | AR | Score-Formatierung (Prozent, Status, Farbe) |
| `self-assessment.ts` | 60 | AR | 5 Self-Assessment-Fragen |
| `page-data.ts` | 96 | AR | DB-Abfragen für Audit-Dashboard-Seiten |
| `score-percentile.ts` | 33 | AR | Percentile-Rang gegen v7-Benchmark-Daten |
| `tasks-data.ts` | 55 | PB | DB-Abfragen für Audit-Tasks im Projektboard |
| `utils/route-utils.ts` | 54 | AR | isListRoute() — List-Route-Detection |
| `utils/platform-utils.ts` | 45 | AR | platformCommand() — Windows PATHEXT-Fix |
| `utils/file-utils.ts` | 38 | AR | Datei-Helfer für Checker |
| `prompt-export/types.ts` | 45 | AR | PromptFinding, ToolTarget, GeneratedPrompt Typen |
| `prompt-export/index.ts` | 4 | AR | Re-Exports |
| `checkers/ast-analyzer.ts` | 273 | AR | Zentraler AST-Parser mit SHA-256 LRU-Cache (800 Einträge) |

### 4.2 Fix-Engine (src/lib/fix-engine/ — 7 Dateien)

| Datei | Zeilen | Schicht | Beschreibung |
|-------|--------|---------|-------------|
| `applier.ts` | 474 | AR | Fix auf Codebase anwenden: Datei lesen, Patch einspielen, validieren |
| `consensus-generator.ts` | 370 | AR | Multi-Modell-Consensus: 4 Reviewer + Judge via AI SDK |
| `context-builder.ts` | 175 | AR | Relevanten Code-Kontext für Fix-Prompt zusammenstellen |
| `generator.ts` | 171 | AR | Fix-Prompt für einzelnes Finding generieren |
| `risk-assessor.ts` | 131 | AR | Risikoniveau eines Fix-Vorschlags bewerten (safe/moderate/critical) |
| `types.ts` | 155 | AR | FixRequest, FixResult, ConsensusFixResult Typen |
| `schemas.ts` | 29 | AR | Zod-Schemas für Fix-Engine-Inputs |
| `index.ts` | 10 | AR | Re-Exports |

### 4.3 Workspace-Layer (src/lib/workspace*.ts — 7 Dateien)

| Datei | Zeilen | Schicht | Beschreibung |
|-------|--------|---------|-------------|
| `workspace-chat.ts` | 446 | CH | Chat-Nachrichten-Flow für Workspaces: Streaming, Kontext, Gedächtnis |
| `workspace-context.ts` | 329 | PW | Projektwissen-Kontext für aktive Session zusammenstellen |
| `workspace-types.ts` | 324 | PB | TypeScript-Typen für alle Workspace-Entitäten |
| `workspace-actions.ts` | 200 | PB | Business-Logik für Workspace-Operationen (Server-seitig) |
| `workspace-jungle.ts` | 183 | PB | Jungle-Order-Logik (Soft-Delete-Orchestrierung) |
| `workspace-chat-guided.ts` | 88 | CH | Guided-Workflow-Erweiterung für Workspace-Chat |
| `workspace-time.ts` | 51 | PB | Zeitstempel-Helfer für Workspace-Items |
| `workspace/briefing.ts` | 70 | AR | Briefing-Generierung (Toro → Workspace-Zusammenfassung) |
| `workspace/briefing-prompts.ts` | 104 | AR | Prompt-Templates für Briefing-Generierung |

### 4.4 Repo-Map (src/lib/repo-map/ — 12 Dateien)

| Datei | Zeilen | Schicht | Beschreibung |
|-------|--------|---------|-------------|
| `reference-analyzer.ts` | 281 | AR | Import/Export-Graph-Analyse für Repo-Map |
| `symbol-extractor.ts` | 188 | AR | AST-basierte Symbol-Extraktion (Funktionen, Klassen, Typen) |
| `index.ts` | 163 | AR | Orchestrierung: discover → parse → extract → rank → compress |
| `graph-ranker.ts` | 130 | AR | Additives Ranking (Zentralität, Re-Export-Score) |
| `map-compressor.ts` | 93 | AR | Budget-bewusste Map-Kompression (Token-Limit) |
| `file-discovery.ts` | 89 | AR | Datei-Discovery mit .gitignore-Respektierung |
| `ast-cache.ts` | 102 | AR | SHA-256 LRU-Cache für AST-Analysen |
| `types.ts` | 63 | AR | RepoMapEntry, SymbolInfo, RankedFile Typen |
| `parser.ts` | 49 | AR | TypeScript-Datei-Parser (ts-morph) |
| `formatters/text-formatter.ts` | 28 | AR | Repo-Map als Text formatieren |
| `formatters/json-formatter.ts` | 27 | AR | Repo-Map als JSON formatieren |
| `fixtures/*` | — | AR | Test-Fixtures für Repo-Map-Tests |

### 4.5 Feeds-Pipeline (src/lib/feeds/ — 10 Dateien)

| Datei | Zeilen | Schicht | Beschreibung |
|-------|--------|---------|-------------|
| `pipeline.ts` | 281 | IN | 3-Stufen-Pipeline: Stage 1 (regelbasiert) → Stage 2 (Haiku-Scoring) → Stage 3 (Sonnet-Analyse) |
| `feed-runner.ts` | 149 | IN | Feed-Quelle abrufen → Pipeline → DB persistieren |
| `distributor.ts` | 102 | IN→PW/PB | Items nach Scoring an Ziel-Schichten routen |
| `fetchers/url.ts` | 96 | IN | HTTP-Fetcher mit SSRF-Guard |
| `fetchers/api.ts` | 84 | IN | API-Fetcher für strukturierte Datenquellen |
| `feed-pause.ts` | 51 | IN | Feed-Pausierungs-Logik |
| `ssrf-guard.ts` | 60 | IN | SSRF-Schutz für externe URL-Aufrufe |
| `token-budget.ts` | 30 | IN | Token-Budget pro Feed-Run |
| `ttl-cleanup.ts` | 36 | IN | TTL-basierte Bereinigung alter Feed-Items |
| `feedback.ts` | 32 | IN | Feed-Feedback (Score anpassen) |
| `fetchers/rss.ts` | 32 | IN | RSS/Atom-Fetcher |
| `fetchers/webhook.ts` | 62 | IN | Webhook-Empfang |
| `feed-cost-estimator.ts` | 69 | IN | LLM-Kosten pro Feed-Run schätzen |

### 4.6 Review-System / Multi-Modell (src/lib/review/ — 7 Dateien)

| Datei | Zeilen | Schicht | Beschreibung |
|-------|--------|---------|-------------|
| `orchestrator.ts` | 102 | AR | 4-Reviewer-Parallel-Ausführung (Promise.all) |
| `judge.ts` | 111 | AR | Opus-Judge: Konsens aus 4 Reviewer-Meinungen |
| `consensus-calculator.ts` | 81 | AR | Konsens-Level-Berechnung (EINIG/MEHRHEIT/GESPALTEN) |
| `prompt-builder.ts` | 42 | AR | Review-Prompt-Konstruktion |
| `response-parser.ts` | 34 | AR | Reviewer-Antworten normalisieren |
| `types.ts` | 37 | AR | ReviewResult, JudgeOutput, ConsensusLevel Typen |

### 4.7 LLM-Layer (src/lib/llm/ — 7 Dateien)

| Datei | Zeilen | Schicht | Beschreibung |
|-------|--------|---------|-------------|
| `providers/google.ts` | 109 | ? | Gemini 2.5 Pro Provider (AI SDK, via Vercel AI Gateway) |
| `providers/openai.ts` | 58 | ? | GPT-5.4 Provider (AI SDK, via Vercel AI Gateway) |
| `providers/xai.ts` | 62 | ? | xAI/Grok-4 Provider (ersetzt DeepSeek nach Migration 100) |
| `providers/anthropic.ts` | 53 | ? | Anthropic/Sonnet Provider (AI SDK) |
| `providers/types.ts` | 29 | ? | Provider-Interface-Typen |
| `router.ts` | 35 | ? | Model-Router: Org-Config → Modell auflösen |
| `openai.ts` | 35 | ? | Lazy-Init OpenAI-Client (kein Crash bei fehlendem Key) |
| `anthropic.ts` | 5 | ? | Re-Export Anthropic-Provider |
| `models.ts` | 5 | ? | Modell-ID-Konstanten |

### 4.8 Benchmark (src/lib/benchmark/ — 5 Dateien)

| Datei | Zeilen | Schicht | Beschreibung |
|-------|--------|---------|-------------|
| `runner.ts` | 184 | AR | Orchestrator: discover → download → scan → persistieren |
| `stats.ts` | 135 | AR | Aggregierte Statistiken über Benchmark-Runs |
| `tarball-extractor.ts` | 102 | AR | GitHub-Tarball → In-Memory FileMap |
| `repo-discovery.ts` | 104 | AR | GitHub Search API mit Filtern |
| `index.ts` | 7 | AR | Re-Exports |

### 4.9 Memory-Extraktion (src/lib/memory/ — 2 Dateien)

| Datei | Zeilen | Schicht | Beschreibung |
|-------|--------|---------|-------------|
| `memory-extractor.ts` | 136 | PW | Toros automatische Wissens-Extraktion aus Konversationen (Haiku) |
| `summary-prompts.ts` | 66 | PW | Prompt-Templates für Wissens-Extraktion und -Zusammenfassung |

### 4.10 File-Access (src/lib/file-access/ — 6 Dateien)

| Datei | Zeilen | Schicht | Beschreibung |
|-------|--------|---------|-------------|
| `stack-detector.ts` | 154 | IN | Framework/DB/Auth-Stack-Erkennung aus Dateiliste |
| `directory-reader.ts` | 90 | IN | File-System-Access-API: Verzeichnis in-memory lesen |
| `file-filter.ts` | 76 | IN | Ignore-Filter für Datei-Discovery |
| `browser-check.ts` | 31 | IN | Feature-Detection für File-System-Access-API |
| `types.ts` | 33 | IN | ProjectFile, DirectoryReadResult, ScanRequest Typen |

### 4.11 Chat-Helfer (src/lib/chat/ — 3 Dateien)

| Datei | Zeilen | Schicht | Beschreibung |
|-------|--------|---------|-------------|
| `complexity-detector.ts` | 254 | CH | Erkennt komplexe Anfragen → steuert Reasoning-Modus |
| `parse-artifacts.ts` | 101 | AR | Artefakt-Blöcke aus Chat-Stream parsen |
| `detect-parallel-intent.ts` | 9 | CH | Keyword-Erkennung für Parallel-Tab-Auslösung |

### 4.12 Resolver / Library (src/lib/ — 4 Dateien)

| Datei | Zeilen | Schicht | Beschreibung |
|-------|--------|---------|-------------|
| `library-resolver.ts` | 267 | ? | Library-Entitäten (Capability, Outcome, Role, Skill) für LLM-Calls auflösen |
| `capability-resolver.ts` | 196 | ? | Capability-spezifische Auflösungs-Logik |
| `skill-resolver.ts` | 165 | ? | Skill-spezifische Auflösungs-Logik |
| `model-selector.ts` | 60 | ? | Modell-Auswahl nach Org-Governance |

### 4.13 Agenten-Engine (src/lib/agents/ — 2 Dateien)

| Datei | Zeilen | Schicht | Beschreibung |
|-------|--------|---------|-------------|
| `agent-engine.ts` (lib root) | 394 | ? | Agent-Ausführungs-Engine: Trigger, Run-Protokoll, Fehlerbehandlung |
| `agents/agent-catalog.ts` | 341 | ? | AgentDefinition-Interface + AGENT_CATALOG (21 Agenten) |

### 4.14 Guided-Workflow-Engine (src/lib/ — 1 Datei)

| Datei | Zeilen | Schicht | Beschreibung |
|-------|--------|---------|-------------|
| `guided-workflow-engine.ts` | 250 | CH | Keyword-Erkennung + Schritte-Auflösung für Guided Chat |

### 4.15 Infrastruktur / Utilities (src/lib/ — ~20 Dateien)

| Datei | Zeilen | Schicht | Beschreibung |
|-------|--------|---------|-------------|
| `graph.ts` | 163 | ? | Graph-Datenstruktur (für Repo-Map-Analyse) |
| `types.ts` | 155 | ? | Globale Typen (WorkspaceCard, Project, Feed etc.) |
| `prompt-templates.ts` | 172 | ? | Prompt-Template-CRUD-Logik |
| `context-builder.ts` | 50 | CH | Chat-Kontext zusammenstellen (History + Gedächtnis) |
| `project-context.ts` | 47 | PW | Projekt-Kontext für LLM-Calls laden |
| `budget.ts` | 77 | ? | Budget-Enforcement: check_and_reserve_budget RPC |
| `auth/guards.ts` | 48 | ? | Auth-Guards: getAuthUser(), requireOrgAdmin() |
| `api-error.ts` | 33 | ? | Standardisierte API-Fehler-Typen |
| `errors.ts` | 16 | ? | Error-Klassen |
| `logger.ts` | 41 | ? | Structured-Logging via createLogger() |
| `i18n.ts` | 52 | ? | next-intl Routing-Config |
| `supabase-admin.ts` | 23 | ? | Supabase Admin-Client (Service Role) |
| `supabase/server.ts` | 18 | ? | Supabase Server-Client (SSR) |
| `supabase.ts` | 7 | ? | Supabase Browser-Client |
| `stale-propagation.ts` | 53 | ? | Stale-State-Propagation zwischen Schichten |
| `card-history.ts` | 70 | PW | Card-Versionshistorie schreiben/lesen |
| `token-counter.ts` | 11 | ? | Token-Zählung |
| `chart-theme.ts` | 47 | ? | Tremor-Chart-Theme-Config |
| `cockpit/widgetCatalog.ts` | 42 | PB | Widget-Katalog-Definition (8 Typen) |
| `home/fetchOrgStats.ts` | 125 | PB | Dashboard-Statistiken laden |
| `langsmith/tracer.ts` | 40 | ? | LangSmith-Tracing (Observability) |
| `db/fields.ts` | 11 | ? | DB-Feld-Helfer |
| `qa/routing-logger.ts` | 46 | ? | QA-Routing-Log |
| `qa/task-classifier.ts` | 39 | ? | QA-Task-Klassifizierung |

### 4.16 Validators (src/lib/validators/ — 12 Dateien)

| Datei | Zeilen | Schicht | Beschreibung |
|-------|--------|---------|-------------|
| `workspace-plan-c.ts` | 88 | ? | Zod-Schemas für Workspace-API |
| `feeds.ts` | 81 | ? | Zod-Schemas für Feed-API |
| `library.ts` | 74 | ? | Zod-Schemas für Library-API |
| `workspace.ts` | 68 | ? | Zod-Schemas für Workspace-CRUD |
| `guided.ts` | 48 | ? | Zod-Schemas für Guided-Workflow-API |
| `cards.ts` | 35 | ? | Zod-Schemas für Card-API |
| `capabilities.ts` | 28 | ? | Zod-Schemas für Capabilities-API |
| `transformations.ts` | 20 | ? | Zod-Schemas für Transformations-API |
| `agents.ts` | 19 | ? | Zod-Schemas für Agenten-API |
| `projects.ts` | 18 | ? | Zod-Schemas für Projekte-API |
| `prompt-templates.ts` | 16 | ? | Zod-Schemas für Templates |
| `artifacts.ts` | 13 | ? | Zod-Schemas für Artefakte |
| `index.ts` | 32 | ? | Re-Exports + validateBody() Helper |

### 4.17 API-Helfer (src/lib/api/ — 3 Dateien)

| Datei | Zeilen | Schicht | Beschreibung |
|-------|--------|---------|-------------|
| `workspaces.ts` | 98 | PB | Server-seitige Workspace-Datenzugriff-Helfer |
| `projects.ts` | 28 | PB | Server-seitige Projekt-Datenzugriff-Helfer |
| `pagination.ts` | 13 | ? | Pagination-Helfer |

---

## lib-Zusammenfassung nach Subsystem

| Subsystem | Dateien | Zeilen | Schicht-Schwerpunkt |
|-----------|---------|--------|---------------------|
| Audit-System | ~45 | ~9.200 | AR |
| Fix-Engine | 8 | 1.345 | AR |
| Workspace-Layer | 9 | 1.671 | CH/PB/PW |
| Repo-Map | 12 | 1.213 | AR |
| Feeds-Pipeline | 13 | 1.084 | IN |
| Review/Multi-Modell | 7 | 407 | AR |
| LLM-Layer | 9 | 386 | ? |
| Benchmark | 5 | 532 | AR |
| Memory-Extraktion | 2 | 202 | PW |
| File-Access | 5 | 384 | IN |
| Chat-Helfer | 3 | 364 | CH/AR |
| Resolver/Library | 4 | 688 | ? |
| Agenten-Engine | 2 | 735 | ? |
| Guided-Workflow | 1 | 250 | CH |
| Infrastruktur/Utils | ~20 | 1.200 | ? |
| Validators | 13 | 548 | ? |
| API-Helfer | 3 | 139 | PB |
| **Gesamt** | **~160** | **~23.300** | |

---

## 5. Migrations (121 Dateien)

Gruppiert nach Themen-Epoch.

### Epoch 1 — Kern-Schema (001–019, März 2026 Woche 1)

| Migration | Thema |
|-----------|-------|
| `001_initial.sql` | organizations, users, workspaces, conversations, messages, model_catalog, usage_logs |
| `002_rls.sql` | Row Level Security für alle Kern-Tabellen |
| `003_seed.sql` | System-Org + Demo-Daten |
| `004_invite_policies.sql` | Einladungs-Policies |
| `005_budget_rpc.sql` | check_and_reserve_budget RPC |
| `006_conversations_task_type.sql` | conversations.task_type Spalte |
| `007_onboarding.sql` | Onboarding-Status in user_preferences |
| `008_projects.sql` | Erste Projekte-Tabelle |
| `009_ai_act.sql` | AI-Act-Compliance-Flags |
| `010_jungle_order.sql` | Soft-Delete-System für Workspace-Items |
| `011_superadmin.sql` | Superadmin-Rollen und Policies |
| `012_fix_budget_rpc.sql` | Budget-RPC-Bugfix |
| `013_memory_window.sql` | Memory-Window für Chat-Kontext |
| `014_rls_audit.sql` | RLS-Policy-Audit |
| `015_thinking_mode.sql` | Thinking-Mode-Flag in Konversationen |
| `016_smart_projects.sql` | Smart-Projekte-Erweiterungen |
| `017_rag_foundation.sql` | pgvector, knowledge_sources, RAG-Grundlage |
| `018_rls_users_fix.sql` | RLS-Bugfix für users-Tabelle |
| `019_fix_demo_org_owner.sql` | Demo-Org-Owner-Fix |

### Epoch 2 — Workspaces + Projects + Feeds Basis (020–036, März 2026 Woche 1–2)

| Migration | Thema |
|-----------|-------|
| `020_superadmin_workspace_member.sql` | Superadmin-Workspace-Membership |
| `021_impersonation.sql` | impersonation_sessions Tabelle |
| `022_artifacts.sql` | artifacts Tabelle |
| `023_proactive_hints.sql` | Proaktive Hinweise im Chat |
| `024_prompt_templates.sql` | prompt_templates Tabelle |
| `025_agents.sql` | Erste agents Tabelle |
| `026_packages.sql` | packages + org_packages |
| `027_qa_tables.sql` | QA-Metriken-Tabellen |
| `028_workspaces_organization_id.sql` | organization_id FK auf workspaces |
| `029_rename_workspaces_to_departments.sql` | workspaces → departments Umbenennung |
| `030_projects_schema.sql` | projects, project_participants, project_memory |
| `031_workspaces_schema.sql` | Workspaces v2: cards, card_history, connections, knowledge_entries |
| `032_support_tables.sql` | dept_settings, transformations, templates |
| `033_feed_tables.sql` | feed_sources, feed_items, feed_distributions |
| `034_messages_human_override.sql` | Human-Override für Nachrichten |
| `035_org_settings_members_see_models.sql` | Org-Setting: Member-Sichtbarkeit |
| `036_knowledge_storage_policies.sql` | Storage-Policies für Dokumente |

### Epoch 3 — Feature-Explosion (20260312–20260325, März 2026 Wochen 2–4)

| Migration | Thema |
|-----------|-------|
| `20260312000031_projects_fixes.sql` | Projekt-RLS-Fixes |
| `20260312000032_workspaces_rls_fixes.sql` | Workspace-RLS-Fixes |
| `20260312000033_support_tables_fixes.sql` | Support-Tabellen-Fixes |
| `20260312000034_feed_rls_fixes.sql` | Feed-RLS-Fixes |
| `20260314000035_workspace_plan_c.sql` | Workspace Plan C: workspace_assets, workspace_exports |
| `20260314000036_feeds_v2.sql` | Feeds v2: keywords, min_score, content_hash UNIQUE |
| `20260316000037_conversations_agent_id.sql` | Konversation ↔ Agent-Verknüpfung |
| `20260316000038_model_catalog_api_model_id.sql` | Model-Catalog: api_model_id Spalte |
| `20260317000039_capability_outcome_system.sql` | capabilities, outcomes, capability_outcomes, guided_workflows |
| `20260317000040_cards_capability.sql` | cards: capability_id, outcome_id |
| `20260317000041_guided_workflows_seed.sql` | 7 System-Workflows + Marketing-Paket |
| `20260317000042_feed_dismissed.sql` | feed_items: dismissed_at |
| `20260317000043_feed_topics.sql` | feed_topics + feed_topic_sources |
| `20260317000044_feed_data_sources.sql` | feed_data_sources + feed_data_records |
| `20260318000045_rls_operators_workspace_templates.sql` | RLS für Workspace-Templates |
| `20260318000046_feed_runs.sql` | feed_runs, feed_notifications |
| `20260318000047_skills.sql` | skills + agent_skills |
| `20260318000048_agents_v2.sql` | agents v2: scope, trigger_type, agent_runs |
| `20260318000049_conversations_workspace.sql` | conversations: workspace_id, card_id |
| `20260319000050_shared_chats.sql` | conversations: share_token |
| `20260319000051_announcements.sql` | announcements Tabelle |
| `20260319000052_library_extend_existing.sql` | Library: capabilities/outcomes/skills erweitern |
| `20260319000053_library_new_tables.sql` | roles, library_versions, org/user_library_settings |
| `20260319000054_library_new_tables_fix.sql` | Library-Fix |
| `20260319000055_library_cards.sql` | cards: role_id, skill_id |
| `20260319000056_library_seed.sql` | 7 System-Rollen geseedet |
| `20260319000058_cards_meta_backfill.sql` | Card-Metadaten-Backfill |
| `20260319000059_memory_extraction_log.sql` | memory_extraction_log (APPEND ONLY) |
| `20260320000060_project_memory_feeds.sql` | project_memory: organization_id, memory_type |
| `20260320000061_chat_prompt_builder.sql` | conversations: 'prompt_builder' Typ |
| `20260320000062_intention_system.sql` | conversations: intention, focus_log |
| `20260320000063_artifacts_react_type.sql` | artifacts: react/data/image Typen |
| `20260320000064_workspace_cards_extend.sql` | workspaces: project_id; cards: source |
| `20260322000065_perspectives.sql` | perspective_avatars, perspective_user_settings, 5 System-Avatare |
| `20260324000066_user_prefs_link_previews.sql` | user_preferences: link_previews |
| `20260324000067_user_prefs_web_search.sql` | user_preferences: web_search_enabled |
| `20260325000068_settings_mcp.sql` | org_mcp_policies, user_mcp_connections |
| `20260325000069_conversations_settings.sql` | Konversations-Einstellungen |
| `20260325000070_user_prefs_emoji_style.sql` | user_preferences: emoji_style, suggestions_enabled |
| `20260325000071_user_prefs_toro_address.sql` | user_preferences: toro_address, language_style |
| `20260325000072_intention_guided.sql` | conversations.intention: NULL → focused/guided |
| `20260325000073_projects_extend.sql` | projects: emoji, context; project_documents; Storage-Bucket |
| `20260325000074_projects_archive_merge.sql` | projects: archived_at |
| `20260325000075_workspaces_items.sql` | workspace_items |
| `20260325000076_workspace_members_share.sql` | workspace_members, share_token |
| `20260325000077_workspace_comments.sql` | workspace_comments |
| `20260325000078_workspace_comments_item.sql` | workspace_comments: item_id |
| `20260325000079_workspaces_archive.sql` | workspaces: archived_at |
| `20260325000080_workspace_items_agent.sql` | workspace_items: agent Typ |
| `20260325000081_org_assistant_image.sql` | organization_settings: ai_assistant_image_url |
| `20260325000082_dashboard_widgets.sql` | dashboard_widgets |
| `20260325000083_rename_to_cockpit.sql` | dashboard_widgets → cockpit_widgets |

### Epoch 4 — Governance + AI (20260327, März 2026 Woche 4)

| Migration | Thema |
|-----------|-------|
| `20260327000084_feature_flags.sql` | organization_settings: features JSONB |
| `20260327000085_llm_governance.sql` | model_catalog: Governance-Felder; org_model_config; user_model_preferences |
| `20260327000086_extract.sql` | knowledge_sources: Extraktions-Spalten (rolled back) |
| `20260327000087_extract_index.sql` | Placeholder (superseded) |
| `20260327000088_extract_full.sql` | knowledge_sources: Vollständige Extraktion |
| `20260327000089_workflow_adapter.sql` | organization_settings: workflow_provider, base_url, api_key |
| `20260327000090_tenant_isolation_fixes.sql` | RLS-Fixes für Tenant-Isolation |
| `20260327000091_deactivate_mistral.sql` | Mistral-Modelle deaktiviert |

### Epoch 5 — Stabilisierung (20260330, März 2026 Ende)

| Migration | Thema |
|-----------|-------|
| `20260330000092_bookmarks_full_content.sql` | bookmarks: full_content |
| `20260330000093_conversations_intention_default.sql` | conversations.intention: DEFAULT NULL |
| `20260330000094_model_catalog_capabilities.sql` | model_catalog: capabilities JSONB |

### Epoch 6 — Audit-System (20260408–20260420, April 2026)

| Migration | Thema |
|-----------|-------|
| `20260408000095_audit_tables.sql` | audit_runs, audit_category_scores, audit_findings |
| `20260408000096_audit_agent_source.sql` | audit_findings: agent_source, agent_rule_id |
| `20260408000097_audit_review_fields.sql` | audit_runs: review_type, models_used, judge_model |
| `20260408000098_audit_run_reviewed_at.sql` | audit_runs: reviewed_at |
| `20260408000099_audit_review_history.sql` | Audit-Review-Historie |
| `20260409000098_audit_fixes.sql` | audit_fixes Tabelle |
| `20260409000099_audit_agent_source_fix.sql` | agent_source Fix |
| `20260409000100_rename_deepseek_to_xai.sql` | DeepSeek → xAI Umbenennung |
| `20260409000101_audit_fixes_consensus.sql` | audit_fixes: fix_mode, risk_level, drafts, judge_explanation |
| `20260409000102_audit_findings_affected_files.sql` | audit_findings: affected_files[], fix_hint |
| `20260409000103_scan_projects.sql` | scan_projects Tabelle |
| `20260409000104_scan_projects_unique.sql` | scan_projects UNIQUE-Constraint |
| `20260409000105_audit_agent_source_security_scan.sql` | agent_source: security-scan |
| `20260409000106_project_profile.sql` | scan_projects: profile JSONB, is_live, compliance_requirements |
| `20260410000107_audit_agent_source_regulatory.sql` | agent_source: dsgvo/bfsg/ai-act |
| `20260410000108_audit_tasks.sql` | audit_tasks Tabelle |
| `20260411000109_audit_tasks_dismissed.sql` | audit_tasks: dismissed |
| `20260413000110_audit_agent_source_lighthouse.sql` | agent_source: lighthouse |
| `20260413000111_audit_agent_source_npm_audit.sql` | agent_source: npm-audit |
| `20260415000112_audit_findings_not_relevant_reason.sql` | audit_findings: not_relevant_reason |
| `20260417000113_beta_tables.sql` | beta_waitlist, beta_feedback, user_preferences: beta_* |
| `20260420000114_audit_findings_agent_source_fix.sql` | agent_source Constraint-Fix |

---

## Migrations-Statistik

| Epoch | Zeitraum | Migrationen | Schwerpunkt |
|-------|----------|-------------|-------------|
| 1 — Kern | bis 2026-03-11 | 19 | Basis-Schema, Auth, Budget, RAG |
| 2 — Features-Basis | 2026-03-12 | 17 | Workspaces, Projects, Feeds, QA |
| 3 — Feature-Explosion | 2026-03-12–25 | 52 | Library, Agents, Perspectives, Cockpit |
| 4 — Governance | 2026-03-27 | 8 | Feature-Flags, LLM-Governance, Workflows |
| 5 — Stabilisierung | 2026-03-30 | 3 | Bookmarks, Model-Catalog |
| 6 — Audit | 2026-04-08–20 | 22 | Komplettes Audit-System |
| **Gesamt** | | **121** | |

**Lücke in Nummerierung:** Migrations 057 und 037–046 fehlen (wahrscheinlich manuell applied oder rolled back).
**Konflikte:** Migrations `20260409000098` und `20260409000099` überlappen mit `097–099` aus Epoch 6 — Nummerierungs-Kollision.
