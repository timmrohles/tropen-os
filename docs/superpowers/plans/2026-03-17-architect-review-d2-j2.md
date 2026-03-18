# Architect Review — Plan D2 + Plan J2
> **Erstellt:** 2026-03-17
> **Status:** ⏳ Wartet auf Entscheidungen von Timm
> **Nächster Schritt:** Entscheidungen treffen → Build-Prompts finalisieren → bauen

---

## Was geprüft wurde

1. **Plan D (neue Version)** — Workspace Chat Context
   Spec wurde eingereicht die Workspace-Chat-Kontext-Injection beschreibt:
   buildWorkspaceContext, buildCardContext, workspace_messages erweitern,
   Skill-Context-Integration, Zeitdimension (getMessagesAt).

2. **Agenten-Spec (Plan J2)** — Agenten-System + Skills
   Vollständige Spec für skills-Tabelle, Skill-Resolver, Agent-Engine,
   Multi-Step-Runs, Scheduled/Reactive/Contextual Trigger.

---

## Review 1 — Plan D2: Workspace Chat Context

### Ampel: 🟡 Gelbes Licht

Kann gebaut werden — mit 5 Anpassungen.

### Was bereits existiert (Schritt 0 Ergebnis)

| Was | Status | Migration |
|-----|--------|-----------|
| `workspace_messages` Tabelle | ✅ EXISTS | 035 |
| `src/lib/project-context.ts` | ✅ EXISTS (als `loadProjectContext()`) | — |
| `src/app/api/chat/stream/route.ts` | ✅ EXISTS | — |
| `buildWorkspaceContext()` | ❌ fehlt | — |
| Workspace Chat API (SSE) | ❌ fehlt | — |
| `getMessagesAt()` | ❌ fehlt | — |

### workspace_messages — fehlende Spalten

Die bestehende Tabelle (Migration 035) hat:
```
id, workspace_id, card_id, role, content, context_snapshot, token_usage, created_at
```

Fehlend laut neuer Spec:
- `skill_id UUID` (nullable)
- `cost_eur NUMERIC` (nullable)
- `model_used TEXT` (nullable)

### Pflicht-Anpassungen für den Build-Prompt

1. **Migration als ALTER schreiben** (nicht CREATE IF NOT EXISTS):
   ```sql
   ALTER TABLE workspace_messages ADD COLUMN IF NOT EXISTS skill_id UUID;
   ALTER TABLE workspace_messages ADD COLUMN IF NOT EXISTS cost_eur NUMERIC;
   ALTER TABLE workspace_messages ADD COLUMN IF NOT EXISTS model_used TEXT;
   ```

2. **project-context.ts nicht überschreiben** — `loadProjectContext()` existiert bereits.
   Der Build-Prompt muss explizit sagen: "Erweitere `loadProjectContext()` wenn nötig,
   erstelle `buildProjectContext()` nur als Alias wenn die Signatur abweicht."

3. **Planname korrigieren** — "Plan D" ist bereits als ✅ Fertig markiert (CLAUDE.md).
   Diesen Plan nennen: **"Plan D2 — Workspace Chat Context"** oder alternativ in Plan C einordnen
   da Workspaces Plan C waren. Empfehlung: D2.

4. **buildWorkspaceContext: eine Query mit JOINs** — keine Card-Loop-Queries.
   Bei Workspaces mit 20+ Karten entsteht sonst N+1-Problem.

5. **Skill-Context als Stub-Datei** anlegen (`src/lib/skill-context.ts`) mit TODO-Kommentar —
   nicht als bedingter `if (skillsTableExists)` Block im Context-Builder.

### Zeitdimension — offene Frage

`getMessagesAt()` und `getContextSnapshot(at)` sind nützlich aber erhöhen Scope.
**Frage für Timm:** In D2 einbauen oder auf Plan K (Geteilte Chats) verschieben?

### Neue Dateien (D2)

```
src/lib/workspace-context.ts        NEU — buildWorkspaceContext, buildCardContext, buildContextSnapshot
src/lib/skill-context.ts            NEU — Stub (TODO: implementieren wenn skills-Tabelle existiert)
src/actions/workspace-chat.ts       NEU — sendWorkspaceMessage, streamWorkspaceMessage, getWorkspaceMessages
src/app/api/workspaces/[id]/chat/route.ts          NEU — POST (SSE) + GET
src/app/api/workspaces/[id]/chat/snapshot/route.ts NEU — GET ?at=ISO
src/app/api/workspaces/[id]/chat/summarize/route.ts NEU — POST
supabase/migrations/045_workspace_messages_extend.sql  NEU — ALTER TABLE
```

### Geänderte Dateien (D2)

```
src/lib/project-context.ts          ERWEITERN (buildProjectContext falls Alias nötig)
src/app/api/chat/stream/route.ts    ERWEITERN (workspace-context hook wenn workspace_id vorhanden)
CLAUDE.md                           AKTUALISIEREN (neue Tabellen-Spalten, neue Dateien)
docs/architect-log.md               EINTRAG
```

---

## Review 2 — Plan J2: Agenten-System + Skills

### Ampel: 🔴 Rotes Licht — 5 Entscheidungen nötig

### agents-Tabelle: aktuelles Schema (Migration 025)

```sql
agents (
  id, user_id, organization_id, name, description,
  system_prompt, visibility, display_order, created_at, updated_at
)
```

**Kein** scope, trigger_type, skill_ids, is_template, requires_package.
Existing rows: Marketing-Paket-Agenten (inserted in Migration 026/041).
ALTER TABLE muss Default-Werte für bestehende Rows definieren.

### Kritische Befunde

#### 1. Skills vs. Capabilities — Überschneidung

Die `capabilities`-Tabelle (Migration 039) hat:
- `scope` (system/package/org/user) — identisch mit Skills
- `system_prompt` — beschreibt WIE Toro arbeitet
- `package_id`, `organization_id` — identische Hierarchie

Skills laut Spec definieren auch WIE (via `instructions`).
Das sind zwei Spalten für dasselbe Konzept.

**Mögliche Auflösungen:**
```
Option A: Skills ergänzen Capabilities
  capabilities.system_prompt = technische Basis (Tool-Routing, Modell)
  skill.instructions          = inhaltliche Anweisung (was analysieren, wie schreiben)
  → capabilities.system_prompt wird deprecated, Skills übernehmen den inhaltlichen Teil
  → AgentStep referenziert: capability_id (Routing) + skill_id (Inhalt)

Option B: Skills ersetzen capabilities.system_prompt
  capabilities.system_prompt löschen (ALTER TABLE)
  Alle bestehenden system_prompts als Seeds in skills migrieren
  → Risiko: Breaking Change für bestehende Guided Workflows

Option C: Skills sind eigenständig, keine Verbindung zu Capabilities
  Capabilities bleiben wie sie sind (Modell-Routing)
  Skills sind reiner Kontext für Agenten (keine Guided Workflows)
  → Einfachste Option, kein Migration-Risiko
```
**Empfehlung: Option C** — sauberste Trennung, kein Risiko für bestehende Features.

#### 2. Plan-Nummern-Konflikt

| Dokument | Plan J |
|----------|--------|
| ARCHITECT.md (Nächste Pläne) | Geteilte Chats + Team-Antwort |
| phase2-plans.md | Produktion (Feeds, Dashboards, Agents) |
| Agenten-Spec | Plan J2 (Sub-Plan von "Produktion") |

Diese müssen synchronisiert werden bevor gebaut wird.

#### 3. Cron-Runner-Entscheidung

| Option | Pro | Contra |
|--------|-----|--------|
| Supabase pg_cron | Keine Extra-Kosten, DB-nah, kein Vercel Pro nötig | HTTP-Call zu Next.js API nötig, weniger Debugging |
| Vercel Cron Jobs | Einfach in Next.js, gutes Logging | Vercel Pro ($20/mo) nötig |

Empfehlung: **Supabase pg_cron** (wenn kein Vercel Pro vorhanden).

#### 4. agents ALTER — Migration-Plan für existing rows

Neue Pflicht-Spalten brauchen Defaults für ~10-20 Marketing-Paket-Rows:
```sql
ALTER TABLE agents ADD COLUMN scope TEXT NOT NULL DEFAULT 'user';
-- Dann: Marketing-Paket-Agents auf 'package' setzen
UPDATE agents SET scope = 'package' WHERE organization_id IS NULL
  AND name IN ('Campaign Planner', 'Brand Voice Writer', ...);
```
Exakte Namen der Marketing-Paket-Agents müssen geprüft werden (Migration 041).

#### 5. Scope — Plan J2 ist zu groß für einen Build

**Pflicht-Aufteilung:**

| Sub-Plan | Inhalt | Voraussetzung |
|----------|--------|---------------|
| **J2a** | skills-Tabelle + RLS + Seed, agent_skills, skill-resolver.ts, /api/skills/* | D2 fertig |
| **J2b** | agents ALTER + Migration, agent_runs Tabelle, agent-engine.ts, /api/agents/* | J2a fertig |
| **J2c** | Scheduled Trigger (Cron), Webhook, n8n, Toro-Vorschlag-Logik, Paket-Seeds | J2b fertig |

### Neue Tabellen je Sub-Plan

**J2a:**
```
skills (id, name, title, scope, org_id, user_id, requires_package, instructions,
        context_requirements, governance_rules, quality_criteria, input_schema,
        output_type, trigger_keywords, is_active, is_template, version,
        created_by_role, source_skill_id, deleted_at, created_at, updated_at)
agent_skills (agent_id, skill_id, priority)
```

**J2b:**
```
agents — ALTER (scope, trigger_type, trigger_config, capability_steps, skill_ids,
                input_sources, output_targets, requires_approval, max_cost_eur,
                requires_package, created_by_role, source_agent_id, is_template,
                last_run_at, next_run_at, run_count)
agent_runs (id, agent_id, organization_id, user_id, triggered_by, trigger_payload,
            status, steps_completed, steps_total, skills_used, input_summary,
            output_artifact_id, output_summary, token_usage, cost_eur, error_message,
            error_step, started_at, completed_at) — APPEND ONLY
```

**J2c:**
- Cron-Config in vercel.json oder pg_cron-Setup
- Keine neuen Tabellen

### RLS-Lücken (J2)

| Tabelle | Risiko | Fix |
|---------|--------|-----|
| `skills` | Paket-Skills sichtbar wenn Paket nicht aktiv | Prüfung via `org_packages` in RLS oder API-Layer |
| `agent_skills` | Junction ohne direkte RLS möglich | Sichtbarkeit über agent-RLS delegieren |
| `agent_runs` | `organization_id` muss bei INSERT gesetzt werden | In agent-engine.ts sicherstellen |
| `agent_runs.trigger_payload` | Kann PII von Webhooks enthalten | Retention-Policy definieren |

### DSGVO-Punkt (J2)

`agent_runs.trigger_payload` und `output_summary` können PII enthalten.
APPEND ONLY bedeutet: keine automatische Löschung.
→ Retention-Policy (z.B. 90 Tage) muss vor J2c definiert werden.

---

## Offene Entscheidungen für Timm

### Für Plan D2 (eine Entscheidung)

| # | Frage | Optionen |
|---|-------|----------|
| D1 | Zeitdimension (getMessagesAt) in D2 oder auf Plan K? | A: In D2 · B: Plan K |

### Für Plan J2 (fünf Entscheidungen)

| # | Frage | Optionen | Empfehlung |
|---|-------|----------|------------|
| J1 | Skills vs. Capabilities: Wie trennen? | A: ergänzen · B: ersetzen · C: eigenständig | C |
| J2 | Plan-Nummern: ARCHITECT.md oder phase2-plans.md korrigieren? | Beide synchronisieren | — |
| J3 | Cron-Runner: Supabase pg_cron oder Vercel Cron? | Supabase · Vercel | Supabase |
| J4 | agents ALTER: Marketing-Agents bekommen scope='package'? | Ja · Nein | Ja |
| J5 | Toro-Vorschlag: opt-in DEFAULT false bestätigt? | Ja · Nein | Ja |

---

## Empfohlene Build-Reihenfolge

```
1. Entscheidungen treffen (D1, J1–J5)
2. Plan D2 bauen (🟡 nach Anpassungen)
3. Plan J2a bauen (🟡 nach D2 + J1/J2 geklärt)
4. Plan J2b bauen (🟡 nach J2a + J3/J4 geklärt)
5. Plan J2c bauen (nach J2b + J5 + Retention-Policy)
```

Gesamtaufwand: ~4 Build-Sessions.

---

## Sofort zu aktualisierende Dokumente (nach Entscheidungen)

- [x] `ARCHITECT.md` → Nächste Pläne-Reihenfolge synchronisieren (Plan J Konflikt) ✅ 2026-03-18
- [x] `docs/phase2-plans.md` → Plan J Sub-Pläne präzisieren ✅ 2026-03-18
- [ ] `docs/phase2-plans.md` → Plan D2 eintragen (wenn D2 gebaut wird)
- [ ] `CLAUDE.md` → Plan-Status aktualisieren (wenn D2 gebaut wird)
- [ ] `docs/architect-log.md` → Eintrag für diesen Review

---

*Review durchgeführt von Claude Code am 2026-03-17*
*Basis: ARCHITECT.md, CLAUDE.md, phase2-plans.md, Migrations 025–044*
