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

## 2026-03-23 — Superadmin Perspectives, Charts, Bugfixes

**Ampel:** 🟢
**Was gebaut wurde:**

### sa-persp-01: Superadmin Perspectives-Verwaltung
- `src/app/superadmin/perspectives/page.tsx` (neu): CRUD für `scope='system'` Avatare — Filter-Chips, Card-Grid, Edit-Form
- `src/app/api/superadmin/perspectives/route.ts` + `[id]/route.ts` (neu): GET/POST/PATCH/DELETE mit `requireSuperadmin()`-Guard
- `src/app/superadmin/SuperadminNav.tsx`: Link "Perspectives" eingefügt

### chart-presentations: Präsentations-System
- `src/lib/workspace-context.ts`: `buildPresentationContext()` — lädt Workspace + Cards + project_memory via department_id
- `src/lib/context-builder.ts`: Re-Export von `buildPresentationContext`
- `src/app/api/chat/stream/route.ts`: `mode='presentation'` → nutzt `buildPresentationContext` statt `buildWorkspaceContext`

### chart-tremor: Tremor Theme Migration
- `tailwind.config.js`: Tremor brand-Farben auf Tropen-Grün (#2D7A50) aktualisiert
- `src/app/dashboard/CostChart.tsx`: `colors={['emerald']}` → `colors={['green']}`
- `src/components/admin/qa/RoutingPanel.tsx`: `color="emerald"` → `color="green"` auf BarList
- `src/components/workspace/SessionPanel.tsx`: Tremor AreaChart für per-message Kosten (ab 2 Datenpunkten)

### chart-echarts: ECharts Artifact-Renderer
- `src/lib/chat/parse-artifacts.ts`: ArtifactType `'chart'` hinzugefügt
- `src/components/workspace/ArtifactRenderer.tsx`: `buildChartIframeHtml()` (ECharts 5 CDN), Chart-Render-Branch mit 350px iframe

### Edge Function Deployment
- `supabase/functions/ai-chat/index.ts`: Gesprächsregeln, Präsentations-Artifacts, Chart-Artifacts, Attachment-Support deployed
- War seit Commit `1938211` nicht deployed — alle lokalen Änderungen jetzt live

### Gesprächsverhalten-Update
- Regel 2 in `buildSystemPrompt()`: "Erst fragen, dann bauen" — bei vagen Erstellungs-Anfragen zuerst eine Klärungsfrage, dann bauen

### Bugfixes (Hydration + Artifact)
- `src/components/workspace/ChatInput.tsx`: `hasSpeech` via `useEffect`/`useState` statt direktem `getSpeechRecognition()` im Render — behebt Hydration-Mismatch (SSR kennt kein `window`)
- `src/components/home/RecentlyUsed.tsx`: `suppressHydrationWarning` auf Zeit-Buttons (`Date.now()` in Render-Pfad)
- `src/components/AppFooter.tsx`: `suppressHydrationWarning` auf Jahr-Span (`new Date().getFullYear()`)
- `src/app/api/artifacts/transform/route.ts`: sucrase-Transform um `'typescript'` erweitert — Toro darf TypeScript-Syntax in React-Artifacts verwenden

**Anpassungen:** keine strukturellen Änderungen

**Offene Punkte:**
- `public/academy-presentation.html` (Test-Datei) kann nach Tests gelöscht werden
- Supabase CLI Update auf v2.78.1 empfohlen

**Neue Lernmuster:**
- `'use client'`-Komponenten mit `window`/`Date.now()` im Render-Pfad → immer `useEffect`+`useState(false)` oder `suppressHydrationWarning`
- sucrase für React-Artifacts braucht `['jsx', 'typescript']` wenn Toro TypeScript-Syntax generieren kann

---

## 2026-03-20 — Hotfix: Toro Gesprächsverhalten

**Ampel:** 🟢
**Was gebaut wurde:**
- `supabase/functions/ai-chat/index.ts`: Gesprächsregeln an den Anfang von `buildSystemPrompt()` eingefügt — vor dem AI-Guide-Name. Regeln: Eine Frage auf einmal, direkt starten, kein Formular-Stil, kurze erste Antwort, Markdown nur wenn sinnvoll.
- Edge Function deployed: `supabase functions deploy ai-chat` ✅

**Nicht geändert:**
- Chips-Mechanismus: `/api/chat/generate-chips` + `QuickChips` funktionieren bereits korrekt
- Markdown-Rendering: `ReactMarkdown` + `remarkGfm` bereits in `ChatMessage.tsx` aktiv

**Offene Punkte:** keine

---

## 2026-03-20 — Workspace Umbau (Rahmen-Visualisierung)

**Ampel:** 🟡
**Was gebaut wurde:**
- Migration `20260320000064`: `workspaces.project_id` UUID FK; `cards.source` CHECK ('manual'/'chat_artifact'), `cards.source_conversation_id` UUID FK
- `src/app/api/artifacts/save/route.ts`: Erweiterter Artifact-Save — speichert Artefakt + erstellt automatisch eine Workspace-Card (source='chat_artifact', status='ready') wenn die Konversation `intention='focused'` und `current_project_id` gesetzt ist, und ein Workspace mit dieser `project_id` existiert
- `src/components/workspace/ArtifactRenderer.tsx`: Endpunkt auf `/api/artifacts/save` umgestellt
- `src/lib/workspace-types.ts`: `Conversation.drift_detected` hinzugefügt
- `src/hooks/useWorkspaceState.ts`: `drift_detected` in Supabase-Select ergänzt
- `src/lib/workspace-actions.ts`: Optimistisches Conversation-Objekt um `drift_detected: null` ergänzt
- `src/app/workspaces/page.tsx`: `project_id` in Query; done-count (status='ready') für project-verknüpfte Workspaces
- `src/components/workspaces/WorkspacesList.tsx`: Progress-Bar wenn `project_id` gesetzt und `cardCount > 0`
- `src/app/workspaces/[id]/page.tsx`: `CanvasCard` um `source` + `source_conversation_id` erweitert; Select aktualisiert
- `src/components/workspaces/CardTile.tsx`: "Aus Chat" Badge bei `source === 'chat_artifact'`
- `src/components/workspace/ChatContextStrip.tsx`: Neu — zeigt Projekt-Fokus-Strip über Chat; inkl. Drift-Warning-Icon
- `src/components/workspace/ChatArea.tsx`: ChatContextStrip integriert (wenn `intention=focused` und `current_project_id` gesetzt)
- `src/app/globals.css`: `.chat-context-strip` CSS-Klassen hinzugefügt

**Anpassungen gegenüber Build-Prompt:**
- `cards.status` Konflikt: Build-Prompt schlug neue Status-Werte vor (draft/review/done), aber die Spalte existiert bereits mit (draft/ready/stale/processing/error). `ADD COLUMN IF NOT EXISTS` wäre No-Op. Lösung: `status='ready'` als "done"-Proxy für Progress-Berechnung verwendet — keine neuen Status-Werte nötig.
- `intentions-system-konzept.md` nicht gefunden — wurde ohne externe Referenz implementiert.

**Offene Punkte:**
- Supabase Edge Function `ai-chat` muss noch `intention` + `current_project_id` in den System-Prompt injizieren
- Edge Function muss `<artifact>`-Format-Anweisung im System-Prompt erhalten

**Neue Lernmuster:** Wenn ein Build-Prompt eine neue DB-Spalte vorschlägt die bereits existiert, nie blind überschreiben — immer vorhandene Constraints prüfen und Proxy-Lösung suchen.

---

## 2026-03-20 — Artifact-Renderer (Inline Artifacts im Chat)

**Ampel:** 🟢
**Was gebaut wurde:**
- Migration `20260320000063`: `artifacts.type` CHECK um 'react', 'data', 'image', 'other' erweitert (aligned DB mit Validator)
- `src/lib/chat/parse-artifacts.ts`: Reiner Parser — extrahiert `<artifact>` Blöcke aus Nachrichteninhalt via Regex; gibt `ContentSegment[]` (TextSegment | ArtifactSegment) zurück
- `src/components/workspace/ArtifactRenderer.tsx`: Renderer mit Syntax-Highlighting (Standard) + optionaler iframe-Vorschau für `react`-Type; "Speichern"-Button → POST /api/artifacts; sandbox="allow-scripts" ohne allow-same-origin
- `src/lib/validators/artifacts.ts`: Enum aligned mit DB CHECK
- `ArtifactsDrawer.tsx`: 'react' + weitere Typen zur Union + Atom-Icon ergänzt
- `ChatMessage.tsx`: `renderAssistantContent` in `renderLines()` + artifact-aware Wrapper umstrukturiert; `parseArtifacts()` wird nur aufgerufen wenn `<artifact>` im Content enthalten

**Architektur-Entscheidungen:**
- iframe `srcdoc` + sandbox="allow-scripts": KI-Code läuft isoliert, kein Zugriff auf App-State/Cookies; React + Babel werden lazy via CDN geladen (nur bei "Vorschau öffnen")
- Lazy Preview-Trigger (User klickt "Vorschau"): Vermeidet ~5MB Babel-Download bei jedem Chat-Reload
- Bestehende `/api/artifacts` POST-Route wiederverwendet — kein neuer Endpoint nötig
- `renderLines()` als extrahierter Helper: ermöglicht Wiederverwendung für Text-Segmente innerhalb artifact-aware Rendering
- Pre-existing Discrepancy (validator vs. DB CHECK) — in dieser Migration behoben

**Edge Function (TODO):** `ai-chat` muss System-Prompt-Snippet für `<artifact>` Format erhalten (außerhalb Next.js codebase)

**TypeScript:** 0 Errors.

---

## 2026-03-20 — Intentions-System Chat-Start (Weichenstellung)

**Was gebaut wurde:**
- Migration `20260320000062`: `conversations` um `intention`, `current_project_id`, `drift_detected`, `focus_since_message` erweitert; `focus_log` Tabelle (APPEND ONLY) mit RLS angelegt
- `IntentionGate.tsx`: Zwei klickbare Karten ("Gezielt" / "Offen") — ersetzt EmptyState wenn `activeConvId === null`
- `FocusedFlow.tsx`: 3-Phasen UI — Projekt-Picker → Start-Modus-Wahl → ChatInput bereit; "Kurz strukturieren" befüllt Input mit Struktur-Prompt
- `workspace-types.ts`: `Conversation` um `intention` + `current_project_id` erweitert; `WorkspaceState` um `pendingIntention` + `pendingCurrentProjectId`
- `workspace-actions.ts`: `newConversation()` liest `pendingIntention` / `pendingCurrentProjectId` aus Context und schreibt sie in den DB-Insert; reset nach Erfolg
- `useWorkspaceState.ts`: Pending-State + `convActions`-Übergabe + Select-Felder erweitert
- `ChatArea.tsx`: IntentionGate/FocusedFlow/EmptyState basierend auf `intentionChoice` (lokaler State, reset bei `activeConvId → null`)

**Architektur-Entscheidungen:**
- `IntentionGate` ersetzt `EmptyState` als erste Ansicht; `EmptyState` bleibt als "Offen"-Pfad erhalten
- `pendingIntention` + `pendingCurrentProjectId` in State (kein API-Call) — werden erst bei `newConversation()` in DB geschrieben
- "Kurz strukturieren" = pre-filled Prompt statt eigener API-Route (einfacher, nutzt denselben LLM-Flow)
- `focus_log` ist APPEND ONLY — Intention-Wechsel werden protokolliert aber nie überschrieben
- System-Prompt-Injection in `ai-chat` Edge Function: Edge Function liest `intention` + `current_project_id` aus DB via `conversation_id` — keine Client-seitigen Änderungen nötig (TODO: Edge Function updaten)

**TypeScript:** 0 Errors. Design-Lint: 0 Errors, 38 Warnings.

---

## 2026-03-20 — Chat-Input Cleanup (nach Plan L)

**Was entfernt wurde:**
- `ChatInput.tsx`: Rollen-Dropdown, Capability/Modus-Dropdown, Outcome-Dropdown, Workspace-Button + Workspace-Erstellen-Formular — reduziert auf Input + Send-Button
- `useWorkspaceState.ts` / `workspace-types.ts` / `workspace-actions.ts` / `workspace-chat.ts`: `activeRoleId`, `activeCapabilityId`, `activeOutcomeId` vollständig entfernt
- `PromptBuilderModal.tsx` + `/api/chat/prompt-builder/` — entfernt
- `promptBuilderOpen`/`setPromptBuilderOpen` State — entfernt

**Architektur-Entscheidungen:**
- `role_id` und `workflow_plan` werden nicht mehr an die Edge Function `ai-chat` übergeben — Roles/Capabilities sind implizit via `detectRole()` / `detectCapability()` (noch nicht implementiert, aber das ist die Richtung)
- `agent_id` wird bei neuen Conversations immer `null` — kein manuelles Setzen mehr möglich
- Der `'Prompt verfeinern'` Chip sendet jetzt `'Hilf mir, meinen nächsten Prompt zu formulieren.'` als normalen User-Prompt — Inline-Gespräch statt Modal
- Sentinel `__PROMPT_BUILDER__` vollständig entfernt

**TypeScript:** 0 Errors. Design-Lint: 0 Errors, 38 Warnings.

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

---

### 2026-03-24 — Web Search + Rich Link Previews

**Ampel:** 🟢
**Prompt:** Feature — Web Search + Rich Link Previews

**Entscheidung:**
Web Search via Anthropic `web_search_20260209` Server-Tool (kein externer Dienst, kein API-Key).
Toggle in SessionPanel → `user_preferences.web_search_enabled` (Migration 067).
Edge Function: `callAnthropic()` + `tools/beta-Header` wenn aktiviert; `streamAnthropic()` erkennt `server_tool_use`-Blöcke → emittiert `{ type: "searching" }` → sammelt `web_search_result`-Quellen → übergibt als `sources[]` im `done`-Event.
Client: `isSearching`-State durch den gesamten Props-Stack (`useWorkspaceState` → `workspace-chat.ts` → `WorkspaceLayout` → `ChatArea`).
SourcesBar: YouTube-Thumbnails (img.youtube.com/vi/{id}/mqdefault.jpg), Artikel-Cards mit Google Favicon API, horizontales Scrolling.

**Anpassungen:**
- `src/lib/workspace-types.ts`: SearchSource, sources auf ChatMessage, isSearching/setIsSearching auf WorkspaceState
- `src/components/workspace/SourcesBar.tsx` (neu)
- `src/app/globals.css`: SourcesBar-CSS + carea-searching-Indicator + @keyframes searching-pulse
- `supabase/migrations/20260324000067_user_prefs_web_search.sql`

**Offene Punkte:** keine

**Neue Lernmuster:**
- Anthropic Server-Tool (`web_search_20260209`) ist komplett server-seitig — kein Client-Code für Search-Execution, nur SSE-Events parsen

---

### 2026-03-24 — Fix Markdown Rendering

**Ampel:** 🟢
**Prompt:** Fix — Markdown Rendering im Chat

**Entscheidung:**
Root-Cause: `@tailwind base` (Preflight) setzt alle Browser-Defaults zurück — `strong` verliert `font-weight: bold`, `ul/ol` verlieren `list-style`, Überschriften verlieren Größen.
`ReactMarkdown` + `remarkGfm` war bereits korrekt eingebaut (`ChatMessage.tsx`, `renderLines()`-Funktion, `makeMdComponents`-Factory). Kein Komponenten-Umbau nötig — nur CSS.
Fix: ~90 Zeilen CSS in `globals.css`, scoped auf `.cmsg-bubble--assistant .cmsg-content`.

**Anpassungen:**
- `src/app/globals.css` — Markdown-Styles für p, strong, h1–h4, ul/ol, a, blockquote, hr, table

**Offene Punkte:** keine

**Neue Lernmuster:**
- Tailwind Preflight löscht alle Browser-Defaults — Markdown-Rendering braucht explizite CSS-Restaurierung, auch wenn ReactMarkdown korrekt verwendet wird

---

### 2026-03-24 — Hotfix System-Prompt: Toro fragt zuerst (SPARK-Regeln)

**Ampel:** 🟢
**Prompt:** Hotfix — System-Prompt: Toro fragt zuerst

**Entscheidung:**
Zwei System-Prompt-Ebenen angepasst:
1. Edge Function (`buildSystemPrompt` in `supabase/functions/ai-chat/index.ts`): Regeln 2+3 erweitert mit konkreten FRAGT-ZUERST- vs. STARTET-DIREKT-Beispielen + expliziten Direkt-Start-Triggern.
2. API-Route (`src/lib/workspace-context.ts`): Alle drei Builder-Funktionen (`buildWorkspaceContext`, `buildCardContext`, `buildPresentationContext`) bekommen eine kompakte "Erst fragen, dann bauen"-Regelblock angehängt.

**Anpassungen:** keine weiteren

**Offene Punkte:** keine

**Neue Lernmuster:**
- Tropen OS hat zwei voneinander unabhängige Chat-Systeme mit separaten System-Prompts: Edge Function (Workspace-Chat) + workspace-context.ts (Canvas/Card-Chat) — beide müssen bei Verhaltensänderungen synchron gepflegt werden
