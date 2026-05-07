# Feature-Status

> Konsolidierter Zustand aller größeren Features in Tropen OS.
> Jedes Feature hat einen Status-Eintrag mit definierten Feldern.
> Ergänzt und gepflegt von Claude Code nach jedem relevanten Build.

## Pflege-Regel

Neues Feature gebaut oder Status-Änderung: Eintrag hier aktualisieren.
Dokument muss vor jeder V1-Roadmap-Entscheidung konsultiert werden.

## Status-Kategorien

- **A — Produktiv genutzt:** Alle Schichten verdrahtet, Records/Nutzung belegbar
- **B — Fertig, ungenutzt:** Alle Schichten verdrahtet, aber keine aktive Nutzung (eingefroren, Beta-bereit, oder intern)
- **C — Teilweise implementiert:** Mindestens eine Schicht fehlt oder defekt
- **D — Nur Stub:** UI oder DB-Struktur existiert, keine Funktionalität

---

## Features

---

### Audit-System (Kern)
**Status:** A
**Letzte Prüfung:** 2026-04-22
**Schichten:** DB ✅ Backend ✅ UI ✅ Nutzung ✅
**Abhängigkeiten:** Regel-Registry + Checker-Pipeline, Supabase (audit_runs, audit_findings, audit_category_scores), optionale externe Tools (Lighthouse, ESLint, depcruise)
**Offene Punkte:** False-Positive-Rate weiter senken; Benchmark-Abgleich laufend
**Frozen Paths (2026-04-22):** `--frozen-paths agenten,feeds,workspaces,chat,projects,artifacts,perspectives` — auto-dismissed beim nächsten Run. Findings bleiben sichtbar im "Nicht relevant"-Filter mit `not_relevant_reason='frozen-path'`.

---

### Multi-Model Audit Review (Komitee)
**Status:** A
**Letzte Prüfung:** 2026-04-21
**Schichten:** DB ✅ (audit_runs.review_type, models_used, audit_findings.consensus_level) Backend ✅ (scripts/committee-review.ts) UI ✅ (script-basiert) Nutzung ✅ (11 Runs, ~73 Konsens-Findings)
**Abhängigkeiten:** OpenAI + Google + xAI Credentials, Vercel AI Gateway, Quorum ≥ 2 Modelle
**Offene Punkte:** Auswertung der Konsens-Daten für V1-Roadmap-Entscheidung ausstehend

---

### Consensus Fix Engine
**Status:** A
**Letzte Prüfung:** 2026-04-22
**Schichten:** DB ✅ (audit_fixes: fix_mode, risk_level, drafts, judge_explanation — Migration 20260409000101) Backend ✅ (GET Cache-Lookup + POST Generierung in consensus/route.ts) UI ✅ (DeepFixButton in RecommendationCard, Lazy-Cache-Pattern, ConsensusFixResult-Karte) Nutzung ✅ (Button ab 2026-04-22 sichtbar)
**Abhängigkeiten:** Provider-Credentials (4 Modelle + Opus-Judge), src/lib/fix-engine/
**Offene Punkte:** Hypothese testen ob Konsens-Fix empirisch besser ist als Einzel-Modell-Fix

---

### Lighthouse-Integration (System A — URL-Input)
**Status:** C
**Letzte Prüfung:** 2026-04-22
**Schichten:** DB ✅ (audit_runs nimmt externe Tool-Daten) Backend ✅ (run-audit.ts --lighthouse-url, trigger/route.ts lighthouseUrl param, external-tools-checker.ts) UI ✅ (AuditActions.tsx) Nutzung ❌ (0 echte Records)
**Blocker:** Nur lokal funktional — Lighthouse-NPM-Package läuft nicht in Vercel Serverless/Edge. Cloud-Strategie offen.
**Offene Punkte:** Entscheidung zur Cloud-Strategie (externer Lighthouse-Service oder Vercel-kompatible Alternative); bis dahin System A bleibt Stub in Production

---

### Lighthouse-Integration (System B — QA-Panel)
**Status:** C
**Letzte Prüfung:** 2026-04-22
**Schichten:** DB ✅ (qa_runs vermutlich, Tabelle unklar) Backend ⚠️ (src/app/api/admin/qa/performance/route.ts, src/components/admin/qa/PerformancePanel.tsx — enthält LangSmith-Integration + Lighthouse; Bugs unverified) UI ✅ (src/app/[locale]/(app)/admin/qa/page.tsx) Nutzung ❌
**Abhängigkeiten:** LangSmith API Key (LANGSMITH_API_KEY), admin/qa Route (nur Superadmin)
**Offene Punkte:** QA-Panel-Bugs verifizieren; LangSmith-Integration-Status prüfen; nach Fix → Status B oder A

---

### File System Access API (Extern-Scan)
**Status:** A
**Letzte Prüfung:** 2026-04-22
**Schichten:** DB ✅ (scan_projects — Migration 20260409000103) Backend ✅ (src/app/api/projects/scan/route.ts, src/lib/file-access/) UI ✅ (src/app/audit/scan/) Nutzung ✅ (intern im Dogfooding, Benchmark-System)
**Abhängigkeiten:** Browser mit File System Access API Support (Chrome/Edge), src/lib/audit/ Checker-Stack
**Offene Punkte:** Profile-Onboarding in Production testen; Stack-Detection-Genauigkeit bei Nicht-Next.js-Projekten

---

### CLI-Audit (Eigennutzung / Dogfooding)
**Status:** B
**Letzte Prüfung:** 2026-04-22
**Schichten:** DB ✅ Backend ✅ (src/scripts/run-audit.ts) UI ❌ (CLI-only) Nutzung ✅ (intern/Dogfooding)
**Abhängigkeiten:** Node.js, pnpm, Supabase Admin Key, optionale Tools (ESLint, depcruise, gitleaks)
**Offene Punkte:** Kein UI → kein Produkt-Feature, nur internes Werkzeug. Als eigenständiges Produkt-Feature kein Roadmap-Platz vorgesehen.

---

### Findings-Rendering (RecommendationCard + FindingsTable)
**Status:** A
**Letzte Prüfung:** 2026-04-22
**Schichten:** DB ✅ Backend ✅ UI ✅ (RecommendationCard, FindingsTable, Top5FindingsCards, FixPromptDrawer) Nutzung ✅
**Abhängigkeiten:** group-findings.ts, finding-recommendations.ts, prompt-export/
**Offene Punkte:** Keine kritischen. FindingsGroupTabs (Heute/Woche/Irgendwann) aktiv.

---

### Manual Finding Card
**Status:** C
**Letzte Prüfung:** 2026-04-22
**Schichten:** DB ✅ (audit_findings: kein schema-Change nötig) Backend ⚠️ (finding-recommendations.ts hat manualSteps-Typ definiert, aber nur wenige Einträge mit echten manualSteps-Daten befüllt) UI ✅ (RecommendationCard.tsx rendert manualSteps-Branch korrekt — Zeile 205) Nutzung ❌ (kein bekanntes Finding mit manualSteps in Production)
**Abhängigkeiten:** CLAUDE.md Komponenten-Pattern "Manual Finding Card", finding-recommendations.ts
**Offene Punkte:** Bestehende manuelle Findings (Impressum, Datenschutz, PITR etc.) mit manualSteps + verification Feldern befüllen → dann Status B

---

### Regel-Registry + Checker-Pipeline
**Status:** A
**Letzte Prüfung:** 2026-04-21
**Schichten:** DB ✅ Backend ✅ (rule-registry.ts, 13 Checker-Dateien, 242 Regeln — 178 automatisiert, 64 manuell) UI ✅ Nutzung ✅
**Abhängigkeiten:** AuditContext (Disk oder In-Memory), AST-Cache (SHA-256 LRU, 800 Einträge), optionale RepoMap
**Offene Punkte:** FP-Rate <10% Ziel noch nicht für alle Regeln erreicht; 11 Score-3-Regeln sind echte Issues (kein Kalibrierungsbedarf)

---

### Prompt-Export / Quick Fix Engine
**Status:** A
**Letzte Prüfung:** 2026-04-22
**Schichten:** DB ✅ (audit_fixes) Backend ✅ (src/lib/audit/prompt-export/, src/lib/fix-engine/, /api/audit/fix/generate, /apply, /batch-generate) UI ✅ (FixPromptDrawer, PromptCopyButton — 3 Tool-Varianten: Cursor/Claude Code/Generic) Nutzung ✅ (intern)
**Abhängigkeiten:** RepoMap für Kontext-Extraktion (optional), AI SDK für generative Fixes
**Offene Punkte:** Consensus-Trigger fehlt (siehe oben); apply-Workflow nur intern getestet

---

### Benchmark-System (externe Repos)
**Status:** A
**Letzte Prüfung:** 2026-04-22
**Schichten:** DB ✅ (audit_runs: is_benchmark=true, source_repo_url) Backend ✅ (src/lib/benchmark/, src/scripts/benchmark*.ts) UI ❌ (keine eigene Benchmark-UI — Ergebnisse in DB + docs/audit-reports/) Nutzung ✅ (v8: 49 Repos, 41 Lovable + 8 Mixed)
**Abhängigkeiten:** GITHUB_TOKEN, Vercel AI Gateway
**Offene Punkte:** Keine eigene UI für Benchmark-Ergebnisse im Produkt; Score-Percentile nutzt hardcodierte v7-Daten (muss nach v9 aktualisiert werden)

---

### Audit UX Layer (Quick-Wins, Score-Percentile, Compliance Domains)
**Status:** A
**Letzte Prüfung:** 2026-04-22
**Schichten:** DB ✅ Backend ✅ (src/lib/audit/quick-wins.ts, score-percentile.ts, compliance-domains.ts, self-assessment.ts) UI ✅ (QuickWinsCard, FindingsGroupTabs, CompliancePanel, ProfileOnboarding) Nutzung ✅
**Abhängigkeiten:** Audit-System (Kern), scan_projects.profile JSONB
**Offene Punkte:** Score-Percentile nutzt hardcodierte v7-Benchmark-Daten → nach v9 aktualisieren

---

### i18n-System (next-intl)
**Status:** A
**Letzte Prüfung:** 2026-04-22
**Schichten:** DB ❌ (nicht nötig) Backend ✅ (src/i18n/, messages/de.json, messages/en.json) UI ✅ (77 Seiten/Komponenten mit useTranslations/getTranslations) Nutzung ✅
**Abhängigkeiten:** next-intl ^4.9.1, Locales: en (default), de
**Offene Punkte:** Namespace-Konvention inkonsistent — `artifactRenderer` sollte in `workspace.artifact` migriert werden (CLAUDE.md-Notiz). Keine kritischen Funktionslücken.

---

### Rate Limiting (Middleware)
**Status:** A
**Letzte Prüfung:** 2026-04-22
**Schichten:** DB ❌ (Redis-backed) Backend ✅ (src/lib/ratelimit/, proxy.ts, /api/beta/waitlist) UI ❌ (nicht nötig) Nutzung ✅ (fail-open: kein Crash bei fehlendem Redis-Key)
**Abhängigkeiten:** @upstash/ratelimit, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
**Offene Punkte:** Memory-Adapter für lokale Entwicklung aktiv wenn Upstash nicht konfiguriert — korrekt.

---

### User-Auth + Session Management
**Status:** A
**Letzte Prüfung:** 2026-04-22
**Schichten:** DB ✅ (Supabase Auth + users-Tabelle) Backend ✅ (src/utils/supabase/, src/lib/auth/guards.ts) UI ✅ (Login, Onboarding, Auth-Callback) Nutzung ✅
**Abhängigkeiten:** Supabase Auth, @supabase/ssr
**Offene Punkte:** Cookie-Consent fehlt (DSGVO — einziges CRITICAL Finding im letzten Audit)

---

### Beta-Pilot (Landing + Waitlist)
**Status:** B
**Letzte Prüfung:** 2026-04-22
**Schichten:** DB ✅ (beta_waitlist, beta_feedback, user_preferences.beta_onboarding_done — Migration 20260417000113) Backend ✅ (/api/beta/waitlist, /api/beta/feedback, /api/beta/onboarding-complete) UI ✅ (src/app/[locale]/beta/page.tsx, /welcome, BetaFeedbackButton) Nutzung ❌ (Einladungen noch nicht gestartet)
**Abhängigkeiten:** Auth (für /welcome), is_beta_user manuell per SQL setzen
**Offene Punkte:** Einladungen starten wenn eigener Score 85%+ — dieser Stand ist erreicht (95.2%). Nächster Schritt: erste 10 Beta-User manuell einladen.

---

### Cockpit Widget System (Dashboard)
**Status:** A
**Letzte Prüfung:** 2026-04-22
**Schichten:** DB ✅ (cockpit_widgets, user_preferences.cockpit_setup_done) Backend ✅ (/api/cockpit/* — 8 API-Routes) UI ✅ (src/components/cockpit/widgets/ — 8 Widget-Typen) Nutzung ✅ (intern)
**Abhängigkeiten:** Supabase, Feature-Flags (feeds, workspaces, agents), Budget-Tabelle
**Offene Punkte:** Stufe 2 (MCP-Widgets) und Stufe 3 (Agent-Widgets) für Q3/Q4 2026 geplant

---

### Perspectives (Parallele KI-Perspektiven)
**Status:** B
**Letzte Prüfung:** 2026-04-22
**Schichten:** DB ✅ (perspective_avatars, perspective_user_settings — Migration 20260322000065) Backend ✅ (/api/perspectives/* — 7 Routes, SSE-Streaming) UI ✅ (PerspectivesStrip, PerspectivesBottomSheet, /perspectives Seite) Nutzung ❌ (Feature-Flag aktiv, aber Nav-Eintrag nach Produkt-Pivot eingefroren)
**Abhängigkeiten:** 5 System-Avatare geseedet, Budget-Check, org_model_config
**Offene Punkte:** Nav-Eintrag eingefroren seit Produkt-Pivot (2026-04-10). Entscheidung: Feature in V1-Scope oder definitiv einfrieren?

---

### Workspace Chat + Toro (Edge Function)
**Status:** A
**Letzte Prüfung:** 2026-04-22
**Schichten:** DB ✅ (conversations, artifacts, messages) Backend ✅ (supabase/functions/ai-chat) UI ✅ (ChatArea, ChatInput, ChatMessage, ArtifactRenderer) Nutzung ✅ (war aktiv genutzt, Chat-Routen noch erreichbar)
**Abhängigkeiten:** Anthropic API, Supabase Edge Function deployed, Web Search (web_search_20260209)
**Offene Punkte:** Nav-Eintrag eingefroren nach Produkt-Pivot. Chat-Route technisch erreichbar aber nicht primär beworbenes Feature.

---

### Feeds System (3-stufige Pipeline)
**Status:** B
**Letzte Prüfung:** 2026-04-22
**Schichten:** DB ✅ (feed_sources, feed_items, feed_topics, feed_runs, feed_distributions) Backend ✅ (src/lib/feeds/, /api/feeds/, Cron-Job sync-feeds 6h) UI ✅ (src/app/[locale]/(app)/feeds/) Nutzung ❌ (Nav-Eintrag eingefroren nach Produkt-Pivot — Feature-Flag feeds=true aber keine aktive Nutzung bekannt)
**Abhängigkeiten:** Feed-Sources konfiguriert, LLM (Haiku für Stage 2+3)
**Offene Punkte:** Nutzung nach Produkt-Pivot unklar. Entscheidung: in V1-Scope behalten oder als Zombie deklarieren?

---

### Agenten System (Scheduled Runs)
**Status:** B
**Letzte Prüfung:** 2026-04-22
**Schichten:** DB ✅ (agents, agent_runs, agent_skills) Backend ✅ (src/lib/agent-engine.ts, /api/agents/, Cron-Job 7h) UI ✅ (src/app/[locale]/(app)/agenten/) Nutzung ❌ (Nav-Eintrag eingefroren nach Produkt-Pivot)
**Abhängigkeiten:** Feature-Flag agents=true, skill-resolver, LLM-Credentials
**Offene Punkte:** Keine aktiven Agent-Runs bekannt seit Pivot. Entscheidung: in V1-Scope behalten oder als Zombie deklarieren?

---

### Projekte + Memory
**Status:** A
**Letzte Prüfung:** 2026-04-22
**Schichten:** DB ✅ (projects, project_memory APPEND ONLY, project_documents) Backend ✅ (/api/projects/) UI ✅ (src/app/[locale]/(app)/projects/) Nutzung ✅ (war und ist aktiv — im Dogfooding genutzt)
**Abhängigkeiten:** Supabase Storage (project-docs Bucket), Memory-Extraktion via LLM
**Offene Punkte:** Nav-Eintrag eingefroren nach Pivot, aber Route noch zugänglich. Projekte-Konzept lebt in /audit weiter (scan_projects als Audit-Container).

---

### LLM Governance (Model Resolver + Org Config)
**Status:** B
**Letzte Prüfung:** 2026-04-22
**Schichten:** DB ✅ (model_catalog, org_model_config, user_model_preferences) Backend ✅ (src/lib/llm/model-resolver.ts, /api/models/) UI ✅ (ModelGovernanceSection.tsx auf Admin-Models-Seite) Nutzung ⚠️ (Status unklar — keine belegten org_model_config-Records außer Default)
**Abhängigkeiten:** model_catalog Seeds (Anthropic/GPT/Mistral), MISTRAL_API_KEY optional
**Offene Punkte:** Mistral-Modelle deaktiviert (Migration 20260327000091). Ob reale Orgs non-default Config nutzen: unbekannt.

---

### Schema Drift Check
**Status:** A
**Letzte Prüfung:** 2026-04-22
**Schichten:** DB ❌ (nicht nötig) Backend ✅ (src/lib/audit/schema-drift-check.ts, Regel cat-5-schema-drift) UI ✅ (ScoreHero: RuntimeGapBadge, CategoryRowItem: ⚠ Badge) Nutzung ✅ (Teil jedes Audit-Runs)
**Abhängigkeiten:** Regel-Registry, 8 DB-Provider erkannt (Supabase, Neon, Prisma etc.)
**Offene Punkte:** Keine.

---

### Toro Extract (Dokumenten-Extraktion)
**Status:** B
**Letzte Prüfung:** 2026-04-22
**Schichten:** DB ✅ (knowledge_sources: extraction_status, extracted_metadata — Migration 20260327000088) Backend ✅ (src/lib/knowledge/extract/, /api/knowledge/[id]/extract/) UI ✅ (ExtractionPreview.tsx, ExpiringContractsWidget) Nutzung ❌ (Wissensbasis-Feature nach Pivot nicht aktiv navigierbar)
**Abhängigkeiten:** knowledge_sources (Dokument-Upload), LLM (Haiku für classify + extract)
**Offene Punkte:** Keine aktive Nutzung seit Produkt-Pivot. Entscheidung: Zombie oder V2-Feature?
