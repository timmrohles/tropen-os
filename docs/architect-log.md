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
