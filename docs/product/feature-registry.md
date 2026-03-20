# Feature-Registry — Tropen OS

> Ausgelagert aus CLAUDE.md zur Reduzierung der Dateigröße.
> Enthält die detaillierte Dokumentation aller implementierten Features.
> Bei Änderungen an Features: diese Datei aktualisieren.

---

## Guided Workflows (Stand 2026-03-17)

Guided Workflows bieten strukturierte Entscheidungswege: Toro schlägt Optionen vor, User steuert. Maximal 3 Verschachtelungsebenen. Kein LLM-Call bei der Erkennung.

| Datei | Inhalt |
|-------|--------|
| `src/lib/guided-workflow-engine.ts` | `detectWorkflow()`, `resolveOption()`, `buildWorkflowPrompt()` |
| `src/lib/validators/guided.ts` | Zod-Schemas für alle Guided-API-Routes |
| `src/app/api/guided/detect/route.ts` | POST — Workflow-Erkennung via Keywords + Context |
| `src/app/api/guided/workflows/route.ts` | GET + POST — Workflows für User (system + org + user scope) |
| `src/app/api/guided/workflows/[id]/route.ts` | PATCH — Workflow bearbeiten (ownership-guard) |
| `src/app/api/guided/workflows/[id]/copy/route.ts` | POST — Workflow kopieren → user-scope |
| `src/app/api/guided/settings/route.ts` | PATCH — User schaltet Guided Workflows ein/aus |
| `src/app/api/guided/resolve/route.ts` | POST — Option auflösen → next_workflow / capability_plan / custom_input / save_artifact |

**Regeln:**
- `detectWorkflow()` macht **keinen** LLM-Call — reine Keyword-Logik
- Maximal 3 Verschachtelungsebenen (next_workflow_id Chain)
- Jeder Workflow hat immer eine `is_custom: true` Option als Escape
- `guided_enabled = false` überschreibt alles — keine Ausnahmen

---

## UI — Projekte + Workspaces (Plan F — Stand 2026-03-18)

| Datei | Inhalt |
|-------|--------|
| `src/app/projects/page.tsx` | Memory-Count-Badge auf Projektkarten + Gedächtnis-Tab (zeigt project_memory Einträge) |
| `src/app/workspaces/page.tsx` | Server Component — lädt Workspaces via workspace_participants, rendert WorkspacesList |
| `src/components/workspaces/WorkspacesList.tsx` | Client Component — Workspace-Grid mit Status, Karten-Zähler, Create-Dialog |
| `src/app/workspaces/[id]/page.tsx` | Server Component — Auth + Workspace/Cards laden, rendert CanvasClient |
| `src/app/workspaces/[id]/layout.tsx` | Full-screen fixed container (position:fixed, inset:0) für Canvas-Ansicht |
| `src/app/workspaces/[id]/CanvasClient.tsx` | Client: Header, Tabs (Canvas/Silo-Chat/Einstellungen), Karten-Grid, CreateCardModal |
| `src/components/workspaces/CardTile.tsx` | Karten-Kachel: Role-Badge, Status, Stale-Warning, Sources-Zähler |
| `src/app/api/workspaces/[id]/copy/route.ts` | POST — Workspace kopieren (inkl. Cards) |

**Canvas-Regeln:**
- Workspaces-Liste nutzt `workspace_participants` für User-Scoping (kein direkter department_filter)
- project_memory count kommt vom List-Endpoint (kein Extra-Request per Karte)
- Memory-Tab lädt lazy beim ersten Klick, nicht beim Seitenaufruf
- Canvas `/workspaces/[id]` = Grid-Canvas (sort_order); Freeform-Canvas bei `/ws/[id]/canvas` bleibt unberührt
- Karten-API: `POST /api/workspaces/[id]/cards` (createCardSchema: title + role required)
- Workspace-API: `PATCH /api/workspaces/[id]` (updateWorkspacePlanCSchema)
- Migration `20260318000049_conversations_workspace.sql`: conversations um workspace_id, card_id, conversation_type erweitert

---

## AccountSwitcher (Stand 2026-03-18)

**Kein Dropdown-im-Dropdown.** Die 4 Rollen werden direkt inline als Button-Liste gerendert.

- `src/components/NavBar.tsx` — inline Rollenauswahl im NavBar-Dropdown (eigener `viewAsOpen` State)
- `src/components/layout/TopBar.tsx` — inline Rollenauswahl im Account-Panel
- `src/components/AccountSwitcher.tsx` — wird nur noch als Typ-Import verwendet (`type AccountRole`)

---

## Transformations-Engine (Plan E — Stand 2026-03-17)

| Datei | Inhalt |
|-------|--------|
| `src/lib/validators/transformations.ts` | Zod-Schemas: `analyzeSchema`, `createTransformationSchema`, `executeTransformationSchema` |
| `src/app/api/transformations/analyze/route.ts` | POST — AI-Analyse (claude-haiku), kein DB-Write, gibt max. 2 Suggestions zurück |
| `src/app/api/transformations/route.ts` | GET (list by source) + POST (create pending) |
| `src/app/api/transformations/[id]/route.ts` | GET (detail) + PATCH `{ action: 'execute' }` → baut workspace oder feed + transformation_link |

**Regeln:**
- Immer drei Schritte: `analyze` (kein DB-Write) → `create` (pending) → `execute` (baut target)
- `execute` ist **nicht destruktiv** — der Source bleibt erhalten
- `target_type`: nur `'workspace'` und `'feed'` implementiert (kein `'agent'` vorerst)
- DB-Tabellen: `transformations`, `transformation_links` — aus Migration 032

---

## Chat & Context Integration (Plan D — Stand 2026-03-17)

| Datei | Inhalt |
|-------|--------|
| `supabase/functions/ai-chat/index.ts` | `workflow_plan` param, project_memory injection, memory_warning event |
| `src/lib/project-context.ts` | `loadProjectContext()` — parallele Queries: `projects.instructions` + `project_memory` |
| `src/app/api/chat/stream/route.ts` | Auth via `getAuthUser()`, Capability-Routing via `resolveWorkflow()`, `capabilityId`/`outcomeId` params |

**Regeln:**
- `chat/stream` holt `userId` immer via `getAuthUser()` — nie aus dem Request-Body
- `workflow_plan` wird client-seitig via `/api/guided/resolve` aufgelöst (Deno-Edge kennt keinen Node.js-Resolver)
- Memory-Warnung bei >85% context_window — `memory_warning: true` im `done`-Event
- `loadProjectContext()` immer mit `supabaseAdmin` — nie im Client

---

## Skills-System (Plan J2a — Stand 2026-03-18)

**Eigenständig von Capabilities** (Option C: Skills = Kontext für Agenten, Capabilities = Modell-Routing für Chat)

| Datei | Inhalt |
|-------|--------|
| `supabase/migrations/20260318000047_skills.sql` | skills + agent_skills Tabellen + RLS + 6 System-Skill Seeds |
| `src/types/agents.ts` | Skill, AgentSkill Interfaces + mapSkill(), mapAgentSkill() |
| `src/lib/skill-resolver.ts` | getSkillsForUser(), getSkillsForAgent(), resolveSkill(), canAccessSkill(), canModifySkill(), getSystemSkills() |
| `src/app/api/skills/route.ts` | GET (list with visibility filter) + POST (create) |
| `src/app/api/skills/[id]/route.ts` | GET (single) + PATCH (update) + DELETE (soft delete) |

**Skill-Sichtbarkeit:**
- `scope='system'` → immer sichtbar
- `scope='package'` → sichtbar, API-Layer filtert nach `requires_package`
- `scope='org'` → nur eigene Org, nur owner/admin darf anlegen
- `scope='user'` → nur eigener User

---

## Agenten-System (Plan J2b+J2c — Stand 2026-03-18)

**Spec:** `docs/plans/agents-spec.md`

| Datei | Inhalt |
|-------|--------|
| `supabase/migrations/20260318000048_agents_v2.sql` | agents ALTER: scope, trigger_type, trigger_config, capability_steps, input_sources, output_targets, requires_approval, max_cost_eur, emoji, is_active, deleted_at + agent_runs (APPEND ONLY) + 5 Marketing-Paket-Agenten |
| `src/types/agents.ts` | Agent, AgentRun, AgentStep, AgentTriggerConfig, AgentInput, AgentOutput Interfaces + mapAgent(), mapAgentRun() |
| `src/lib/agent-engine.ts` | runAgent(), executeStep(), checkBudget(), calculateNextRun(), checkScheduledTriggers() |
| `src/app/api/agents/route.ts` | GET (list, scope-filter) + POST (create) |
| `src/app/api/agents/[id]/route.ts` | GET (detail + letzten 5 Runs) + PATCH + DELETE (soft) |
| `src/app/api/agents/[id]/copy/route.ts` | POST — als user-scope kopieren |
| `src/app/api/agents/[id]/run/route.ts` | POST — manueller Run (gibt run_id zurück) |
| `src/app/api/agents/[id]/runs/route.ts` | GET — Run-History mit Pagination |
| `src/app/api/agents/runs/[run_id]/route.ts` | GET — einzelner Run |
| `src/app/api/agents/webhook/[agent_id]/route.ts` | POST — eingehender Webhook (HMAC-SHA256) |
| `src/app/api/cron/agents/route.ts` | GET — Vercel Cron (täglich 7 Uhr) → checkScheduledTriggers |
| `vercel.json` | Cron: `/api/cron/agents` `"0 7 * * *"` |

**Scope-Sichtbarkeit:**
- `scope='system'` → alle Users
- `scope='package'` → alle Users (API-Layer prüft requires_package)
- `scope='org'` → nur eigene Org, nur owner/admin darf anlegen
- `scope='user'` → nur eigener User

**Agenten-Engine Regeln:**
- Max 1 gleichzeitiger Run pro Agent (rate-limit via agent_runs.status='running')
- Budget-Check vor jedem Run (30-Tage-Fenster)
- Webhook-Runs erfordern webhook_secret (HMAC-SHA256)
- agent_runs ist APPEND ONLY — kein UPDATE/DELETE

---

## Library-System (Capability + Outcome + Role + Skill)

Vier eigenständige Entitäten — alle resolviert in `src/lib/library-resolver.ts`:

| Entität | Frage | Verwaltet von |
|---------|-------|--------------|
| capabilities | WAS kann Toro? (Modell, Tools) | Superadmin only |
| outcomes | WAS kommt raus? (Format, Karten-Typ) | Superadmin only |
| roles | WER ist Toro? (Fachexpertise, System-Prompt) | Org-Admin + Member |
| skills | WIE arbeitet Toro? (Schritt-für-Schritt) | Org-Admin + Member |

**Resolver:** `src/lib/library-resolver.ts`
**Vor jedem LLM-Call:** `POST /api/library/resolve { capabilityId, outcomeId, roleId?, skillId? }`

**Scope-Hierarchie:** system → package → org → user → public
**Community (scope='public'):** explizites opt-in, nie automatisch

**Abgrenzung Rollen vs. Agenten:**
- Rolle = Toros Fachexpertise im Chat (interaktiv)
- Agent = autonome Ausführung ohne User-Interaktion (Scheduled/Reactive)

**Keine FK-Verbindung** zwischen skills und capabilities.
Skills empfehlen `recommended_capability_type` als String — nie als FK.

**System-Prompt-Baulogik:**
1. Rolle.system_prompt
2. Skill.instructions + Skill-Kontext
3. Capability.system_prompt_injection
4. Outcome.system_prompt_injection

**API routes:**
- `GET /api/library/capabilities` — alle sichtbaren Capabilities
- `GET /api/library/roles` — alle sichtbaren Rollen (ersetzt package_agents)
- `GET /api/library/skills` — alle sichtbaren Skills
- `POST /api/library/resolve` — WorkflowPlan auflösen
- `POST /api/library/roles/[id]/adopt` — kopieren als eigene Basis
- `POST /api/library/roles/[id]/import` — public/system als user-Kopie importieren

**Migrationen:**
| Datei | Inhalt |
|-------|--------|
| 20260319000052_library_extend_existing.sql | ALTER capabilities/outcomes/skills |
| 20260319000053_library_new_tables.sql | CREATE roles/library_versions/settings |
| 20260319000054_library_new_tables_fix.sql | Fix: idx_roles_name_active, insert policy fix |
| 20260319000055_library_cards.sql | cards: role_id + skill_id |
| 20260319000056_library_seed.sql | Seed roles (7 system+package), package_agents → roles |
