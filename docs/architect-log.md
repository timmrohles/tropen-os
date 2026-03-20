# Architect Log — Tropen OS

> Protokoll aller Architektur-Entscheidungen.
> Wird nach jedem Build ergänzt.
> Einzige Quelle der Wahrheit für getroffene Entscheidungen.

---

## Format

Jeder Eintrag folgt diesem Schema:

```markdown
### [Datum] — [Feature-Name]
**Ampel:** 🟢 / 🟡 / 🔴
**Prompt:** [Build-Prompt Bezeichnung]
**Entscheidung:** [Was und warum]
**Anpassungen:** [keine | Liste]
**Offene Punkte:** [keine | Liste]
**Neue Lernmuster:** [keine | Was gelernt]
```

---

## 2026-03-20 — Plan L: Chat-Interaktions-System

**Was gebaut wurde:**
- `src/lib/model-selector.ts`: 3 neue Task-Types (`project_intro`, `chips`, `prompt_builder`) → alle auf Haiku
- `src/app/api/chat/project-intro/route.ts`: POST-Endpoint — lädt Projekt-Kontext + letzte 6 Messages, generiert kontextuellen Einstieg (max. 512 Tokens), gibt `{ message }` zurück (kein DB-Write)
- `src/app/api/chat/generate-chips/route.ts`: Fire-and-forget POST nach Stream-Ende — generiert 3-4 Aktions-Chips aus letzter Antwort, gibt `{ chips: ChipItem[] }` zurück
- `src/app/api/chat/prompt-builder/route.ts`: Multi-Turn Prompt-Verfeinerung (max. 2 Klärungsfragen), gibt `{ type: 'question'|'final', ... }` zurück
- Migration `20260320000061`: `prompt_builder` zu `conversation_type` CHECK Constraint hinzugefügt
- `src/lib/workspace-types.ts`: `ChipItem` Interface + State-Erweiterung
- `src/components/workspace/QuickChips.tsx`: Text-only Chips nach jeder Toro-Antwort
- `src/components/workspace/PromptBuilderModal.tsx`: Modal-Dialog mit 3-Phasen UI (not started → Q&A → final prompt)

**Architektur-Abweichungen vom ursprünglichen Build-Prompt:**
- Build-Prompts beschrieben Chips als `<chips>` XML-Block im Streaming-Response → **implementiert als separater fire-and-forget POST** nach Stream-Ende (robuster, kein XML-Parsing im Stream)
- Build-Prompts beschrieben Prompt-Builder inline im Chat → **implementiert als Modal-Dialog** (pragmatischer, weniger State-Komplexität)
- Build-Prompts beschrieben Projekt-Einstieg mit DB-Write → **implementiert ohne DB-Write** (nur return + lokaler State, schlanker)

Diese Abweichungen sind bewusste Architektur-Entscheidungen, keine Fehler. Build-Prompts in `docs/superpowers/plans/` sind Planungsdokumente — die finale Implementierung steht im Code und in CLAUDE.md.

**Sicherheits-Fix im Nachgang:**
`project-intro/route.ts` initial ohne org-ownership Check deployed → Fix-Commit `926ae10` ergänzte `.eq('organization_id', me.organization_id)` + try/catch um alle Supabase-Calls.

**Tests:** 11 Unit-Tests grün (3 Testdateien). TypeScript: 0 Fehler. Design-Lint: 0 Errors.

**Nächste Schritte:**
Manueller Smoke-Test der drei Features (Dev-Server erforderlich). Danach Branch mergen.

---

## 2026-03-20 — Plan J1: Feeds autonom (Distributions + Run-History)

**Was gebaut wurde:**
- Distributions CRUD API (`/api/feeds/[id]/distributions`)
- Project-Distribution in `distributor.ts` (Items → project_memory)
- RunHistoryPanel: Kosten, Fehler-Details, Items-Breakdown
- DistributionsPanel: Outputs konfigurieren direkt in SourcesView
- NotificationBadge: unread count + Mini-Dropdown im Feeds-Header
- Migration 20260320000060: project_memory um organization_id, memory_type, source_url, metadata erweitert

**Was es bedeutet:**
Feeds sind jetzt echte Produktions-Tools. Items können automatisch in Projekte,
Workspaces und als Notifications weitergeleitet werden. Die Run-History zeigt
ob Feeds korrekt laufen und was sie kosten.

**Nächste Schritte:**
Plan D: Chat & Context Integration vollständig abschließen.

---

## 2026-03-19 — Code & Architektur Review (Audit v2.1)

**Score:** 53.6% — 🟠 Risky (vorher 45.5% Prototype, +8.1 Punkte)

**Wichtigste Verbesserungen seit 2026-03-15:**
- Sicherheit +1: Security-Headers (HSTS, CSP, X-Frame-Options) + globales Rate Limiting (4 Stufen) + Webhook-HMAC + Sentry verifiziert aktiv
- CI/CD +1: Design-Lint, Dependency-Check, E2E-Tests, Security Audit in Pipeline
- Testing +1: 22 Testdateien (vorher 10), 3 E2E-Tests, CI-integriert
- PWA +3: manifest.json + Service Worker + Offline-Fallback
- /health Endpoint: vollständig (DB-Ping, Latenz, Version, HTTP 200/503)
- Library-System: Roles/Skills/Capabilities/Outcomes strukturiert implementiert

**Kritische Findings (sofort beheben):**
- SSRF: Feed-Fetcher (`url.ts`, `rss.ts`, `api.ts`) ohne Private-IP-Blockierung
- PII in Log: `onboarding/complete/route.ts` Zeile 140 loggt E-Mail-Adresse
- Email-Webhook ohne Signaturvalidierung: `/api/feeds/inbound/email/route.ts`
- Debug-Route in Produktion ohne Auth-Guard: `/api/debug/feeds/route.ts`
- CSP veraltet: `api.dify.ai` noch drin (Dify abgelöst)

**Strukturelle Defizite (unverändert seit letztem Audit):**
- Backup & DR: Score 1 — kein DR-Runbook, kein Restore-Test, PITR unverifiziert
- Supply Chain: Score 1 — kein SBOM

**Neue Dokumente angelegt:**
- `docs/audit-report-2026-03-19.md` — vollständiger Audit-Report
- `docs/tech-debt.md` — priorisierte Tech-Debt-Liste
- `docs/adr/001-supabase-als-auth-und-db.md`
- `docs/adr/002-conversations-fuer-workspace-chats.md`
- `docs/adr/003-library-system-rolle-capability-skill.md`

---

## 2026-03-19 — Library-System Fundament (Prompt 01)

**Was gebaut wurde:**
- 4 Migrations (052–056): extend capabilities/outcomes/skills, new roles/library_versions tables, cards extension, seed data
- 7 Rollen geseedet: 5 system (Generalist default, Stratege, Analyst, Kommunikator, Projektmanager) + 2 package marketing
- 5 package_agents → roles migriert (Campaign Planner, Brand Voice Writer, Social Adapter, Newsletter Spezialist, Copy Texter)
- 3 neue system-Skills + 3 package-Skills Marketing
- library-resolver.ts: resolveWorkflow(), detectRole(), detectSkill(), buildSystemPrompt()
- 20+ API routes unter /api/library/*
- Chat Input: "Agent" → "Rolle", lädt aus /api/library/roles

**Warum:**
Library-System ist das Fundament für Chat, Workspace, Agenten und Feeds.
Rollen geben Toro Fachexpertise. Skills geben Toro Schritt-für-Schritt-Anweisungen.
Capabilities + Outcomes regeln Modell-Routing und Output-Format.

**Architektur-Entscheide:**
- library-resolver.ts ist SEPARATE von capability-resolver.ts (backward compat)
- model_catalog hat UUID PK (nicht TEXT wie in Spec — bestehende FK beibehalten)
- capabilities.requires_package: neues TEXT-Feld package_slug (UUID FK bleibt erhalten)
- package_agents Tabelle bleibt erhalten (nur Kopie als roles, keine Löschung)
- Fix-Migration 054 nötig: roles_insert RLS policy verhinderte scope='public' für Org-Admins

---

### 2026-03-17 — Architect Review D2 + J2 (noch kein Build)

**Ampel:** 🟡 (D2) · 🔴 (J2)
**Prompt:** Agenten-Spec + Plan D (neue Version) — kritisch prüfen, nicht bauen
**Entscheidung:** Review durchgeführt, Build noch nicht gestartet. Wartet auf Timms Entscheidungen.

**Befunde D2 (Workspace Chat Context):**
- workspace_messages existiert bereits (Migration 035) — braucht ALTER nicht CREATE
- loadProjectContext() existiert bereits in project-context.ts
- Plan heißt ab jetzt "Plan D2" (Plan D ✅ bereits fertig)
- 5 Anpassungen im Build-Prompt nötig vor dem Build

**Befunde J2 (Agenten-System + Skills):**
- agents-Tabelle existiert (Migration 025) — minimales Schema, braucht ALTER
- skills-Tabelle existiert nicht
- Überschneidung Skills vs. Capabilities noch ungeklärt
- Plan-Nummern-Konflikt ARCHITECT.md vs. phase2-plans.md
- Scope zu groß → Pflicht-Aufteilung in J2a / J2b / J2c

**Offene Punkte:**
- Vollständige Entscheidungs-Tabelle: docs/superpowers/plans/2026-03-17-architect-review-d2-j2.md
- D1: Zeitdimension in D2 oder Plan K?
- J1: Skills vs. Capabilities (Option A/B/C)
- J2: Plan-Nummern synchronisieren
- J3: Cron-Runner (Supabase pg_cron empfohlen)
- J4: Marketing-Agents scope='package' nach ALTER
- J5: Toro-Vorschlag opt-in DEFAULT false bestätigt?

**Neue Lernmuster:**
- "Prüfe ob workspace_messages existiert" — ja, seit Migration 035
- Plan D hatte einen unfertigen Teil (Workspace-Context) — beim nächsten Spec-Review sofort checken

---

### 2026-03-17 — Capability + Outcome System (Plan 1)

**Ampel:** 🟢
**Prompt:** Plan 1 — Capability + Outcome System

**Entscheidung:**
Capabilities + Outcomes als zentraler Routing-Layer für alle LLM-Calls.
Capability Resolver in Node.js (`capability-resolver.ts`) — nicht in Deno Edge Functions.
Guided Workflows als strukturierte Entscheidungsbäume ohne LLM-Call bei der Erkennung.

**Anpassungen:**
- Guided Workflows auf max. 3 Verschachtelungsebenen begrenzt
- Immer eine `is_custom: true` Option als Escape
- `guided_enabled = false` überschreibt alles ohne Ausnahme

**Offene Punkte:** keine

**Neue Lernmuster:**
- Deno/Node.js Runtime-Grenze: Node.js-only Code kann nicht in Supabase Edge Functions importiert werden

---

### 2026-03-17 — Chat & Context Integration (Plan D)

**Ampel:** 🟢
**Prompt:** Plan D — Chat & Context Integration

**Entscheidung:**
Zwei Chat-Systeme bleiben parallel: ai-chat Edge Function (Projekte) und Next.js /api/chat/stream (Workspaces).
`workflow_plan` wird client-seitig pre-resolved (Deno kennt keinen Node.js Resolver).
Memory-Warnung bei >85% context_window.
`chat/stream` Auth-Fix: userId immer via `getAuthUser()` — nie aus Request-Body.

**Anpassungen:**
- Spaltenname in project_memory ist `type` (nicht `memory_type`) — Migration 030 geprüft

**Offene Punkte:** keine

**Neue Lernmuster:**
- Security: User-ID niemals aus dem Request-Body nehmen
- Zod v4: `z.record(z.unknown())` → muss `z.record(z.string(), z.unknown())` sein

---

### 2026-03-17 — Transformations-Engine (Plan E)

**Ampel:** 🟢
**Prompt:** Plan E — Transformations-Engine

**Entscheidung:**
DB-Tabellen (`transformations`, `transformation_links`) existieren bereits aus Migration 032.
Dreistufiger Flow: analyze (kein DB-Write) → create pending → execute.
`target_type`: nur `workspace` und `feed` implementiert (kein `agent` vorerst — Agenten-System noch nicht spezifiziert).
Analyse mit claude-haiku (Token-sparend), gibt max. 2 Suggestions zurück.

**Anpassungen:**
- `agent` als target_type aus Validator ausgeschlossen (Zod: `z.enum(['workspace', 'feed'])`)

**Offene Punkte:**
- Agent-Transformation wenn Agenten-System Phase 2 spezifiziert ist

**Neue Lernmuster:** keine

---

### 2026-03-17 — UI Projekte + Workspaces (Plan F)

**Ampel:** 🟢
**Prompt:** Plan F — UI (Projekte + Workspaces + Feeds-Settings)

**Entscheidung:**
Projects page: Memory-Count aus List-Endpoint (project_memory(count) in SELECT) — kein Extra-Request pro Karte.
Memory-Tab: lazy geladen beim ersten Klick.
Workspaces page: Server Component + separater WorkspacesList Client Component.
`workspace_participants` für User-Scoping (kein direkter department_id-Filter).

**Anpassungen:**
- Feeds-Settings Pipeline-Config verschoben (SourcesView hat bereits min_score pro Source)

**Offene Punkte:**
- Feeds Pipeline globale Settings (org-weite min_score Defaults) — für Plan I

**Neue Lernmuster:** keine

---

### 2026-03-17 — Dify-Ablösung (jungle-order)

**Ampel:** 🟢
**Prompt:** Dify komplett ablösen

**Entscheidung:**
Dify wird vollständig entfernt. `jungle-order` Edge Function ruft jetzt Anthropic direkt via fetch auf (`claude-haiku-4-5-20251001`).
Kein SDK-Import nötig — gleicher Ansatz wie `ai-chat` (direktes fetch zur Anthropic API).

**Anpassungen:** keine — Drop-in-Ersatz, gleiche Prompts, gleiche JSON-Extraktion

**Offene Punkte:**
- `DIFY_API_KEY` + `DIFY_API_URL` aus Supabase Edge Function Secrets entfernen (manuell im Dashboard)

**Neue Lernmuster:** keine
