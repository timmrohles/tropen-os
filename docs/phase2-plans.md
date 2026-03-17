# Tropen OS — Phase 2 Pläne
> Detaillierte Pläne für Phase 2. Vollständige Plan-Dokumente: `docs/superpowers/plans/`
> Stand: 2026-03-17

---

## Governance-Regel: Feature-Parität mit Claude.ai

> Gilt als permanente Architektur-Entscheidung. Wird bei jedem neuen
> Claude.ai-Feature geprüft.

### Prinzip

Claude.ai ist unser wichtigstes Referenz-Produkt. Jedes neue Feature
das Anthropic für Claude.ai baut wird durch drei Filter geprüft:
```
Filter 1: Ist das für KMU-Teams relevant?
Filter 2: Können wir es governance-konform machen?
Filter 3: Passt es in unser Capability + Outcome System?
```

Wenn alle drei Filter zutreffen → Feature kommt auf die Roadmap.

### Drei Kategorien

**Kategorie A – Automatisch verfügbar**
Alles was im Modell selbst steckt bekommen wir automatisch
weil wir direkt die Anthropic API nutzen:
- Extended Thinking
- Besseres Reasoning bei jedem Modell-Update
- Multimodalität (Bilder, PDFs)
- Stärkere Code-Generierung
→ Kein To-Do. Kommt von selbst.

**Kategorie B – Wir bauen selbst (besser für KMU)**
UI-Features die Claude.ai für anonyme Millionen-User baut –
wir bauen das Äquivalent für Teams mit Kontext und Governance:

| Claude.ai Feature | Tropen OS Äquivalent | Status |
|---|---|---|
| Artifacts | Artefakte + Workspace-Karten | ✅ vorhanden |
| Projects | Projekte mit Gedächtnis | ✅ vorhanden |
| Memory | project_memory + Wissenbasis | ✅ vorhanden |
| Skills | Capabilities + Pakete | 🔄 Plan 1 |
| Geteilte Chats (read-only) | Geteilte Chats mit Team-Antwort | ⬜ Plan J |
| Interaktive Workflows | Workspace + Karten | 🔄 Plan C-F |
| Tabellen-Rendering | Outcome: Tabelle | 🔄 Plan 1 |
| Chat-Vorschau bei Teilen | Artefakt vom Typ shared_chat | ⬜ Plan J |
| Kollaborative Chats | Team-Chat in Projekten | ⬜ Phase 3 |

**Kategorie C – Nicht verfügbar via API**
Diese Features leben in Claude.ai als Produkt –
nicht im API-Modell. Wir haben eigene Äquivalente:

| Claude.ai intern | Unser Äquivalent | Warum besser |
|---|---|---|
| Claude Skills (intern) | Capabilities + Pakete | Org-konfigurierbar |
| Claude Memory (intern) | project_memory | Strukturiert, transparent |
| Claude Projects (intern) | Projekte + Workspace | Tiefer integriert |

→ Kein To-Do. Eigene Lösung ist strukturell überlegen.

### Warum unser Ansatz strukturell überlegen ist

Claude.ai baut für Millionen anonyme User.
Wir bauen für Teams die sich kennen:
```
Claude.ai:    User → Modell → Antwort
Tropen OS:    User → Org-Kontext → Projekt-Gedächtnis
              → Wissenbasis → Capability → Outcome
              → Governance-Check → Modell → Artefakt
```

Jeder Schritt ist für KMU-Teams relevanter als die
generische Claude.ai-Erfahrung.

### Permanente To-Do-Liste: Claude.ai beobachten

Bei jedem größeren Claude.ai-Release prüfen:

- [ ] Welche neuen Features hat Anthropic angekündigt?
- [ ] Kategorie A, B oder C?
- [ ] Falls B: In welchen Plan gehört es?
- [ ] CLAUDE.md und phase2-plans.md aktualisieren

**Verantwortlich:** Timm – nach jedem Anthropic-Release-Blogpost
**Frequenz:** Bei jedem Major-Release (ca. monatlich)
**Quelle:** https://www.anthropic.com/news

### Aktuelle offene Punkte (Stand März 2026)

- [ ] Geteilte Chats mit Vorschau → evaluieren für Plan J
- [ ] Claude.ai Operator-Features → evaluieren für Superadmin
- [ ] Neue Modell-Capabilities bei Claude 4 → in model_catalog aufnehmen
- [ ] Extended Thinking via API → für Reasoning-Capability aktivieren

---

## Übersicht: Phase 2 Pläne

| Plan | Thema | Status |
|------|-------|--------|
| **Plan A** | DB-Fundament (Migrationen 030–033 + RLS-Fixes) | ✅ Fertig |
| **Plan B** | Projects CRUD + Gedächtnis + Context-Awareness | ✅ Fertig |
| **Plan C** | Workspaces + Card Engine (API, Stale, Export, Chat) | ✅ Fertig |
| **Plan G** | Feeds — 3-stufige Pipeline, Cron, Newscenter UI | ✅ Fertig |
| **Plan 1** | Capability + Outcome System (DB + API + Resolver) | ✅ Fertig |
| **Plan D** | Chat & Context Integration | ✅ Fertig |
| **Plan E** | Transformations-Engine | ✅ Fertig |
| **Plan F** | UI (Projekte + Workspaces + Feeds-Settings) | ✅ Fertig |
| **Plan J** | Geteilte Chats + Team-Antwort | ⬜ Geplant |

---

## Plan 1 — Capability + Outcome System

**Ziel:** Fundament für Chat, Workspace, Agenten und Feeds.
Capabilities beschreiben womit Toro arbeitet, Outcomes was rauskommt.

**Dokument:** `docs/superpowers/plans/2026-03-17-capability-outcome-system.md`

**Umfang:**
- Migrationen 039 + 040 (DB-Schema + Seed)
- `capability-resolver.ts` (resolveWorkflow, getValidOutcomes, resolveCardType)
- API-Routes: GET /api/capabilities, POST /api/capabilities/resolve, PATCH settings + org-settings
- model_catalog Extension (label, context_window, is_eu_hosted, capabilities)

**Status:** 🔄 In Planung (2026-03-17)

---

## Plan D — Chat & Context Integration

**Ziel:** Projekt-Kontext und Capability/Outcome fließen in jeden Chat-Call.

**Umfang (geplant):**
- Projekt-Kontext-Injection beim AI-Aufruf (Gedächtnis + Wissensbasis → System-Prompt)
- Capability + Outcome als Chat-Parameter
- Memory-Warnung im Chat-Header (85%-Trigger)
- Workspace-Chat-Context (knowledge_entries → Chat)

**Status:** ✅ Fertig (2026-03-17)

**Implementiert:**
- `supabase/functions/ai-chat/index.ts` — `workflow_plan` param, project_memory injection, memory_warning event
- `src/lib/project-context.ts` — `loadProjectContext()` mit parallelen Queries
- `src/app/api/chat/stream/route.ts` — Auth-Fix (getAuthUser), Capability-Routing via resolveWorkflow
- Guided Workflow Engine + API Routes (detect, workflows CRUD, settings, resolve)

---

## Plan E — Transformations-Engine

**Ziel:** KI-gestützte Vorschläge: Projekt → Workspace / Agent / Feed

**Umfang (geplant):**
- `POST /api/transformations` — analyze + suggest + build + link
- Immer: Vorschau → Bestätigung → Ausführung (nie destruktiv)

**Status:** ✅ Fertig (2026-03-17)

**Implementiert:**
- `src/lib/validators/transformations.ts` — Zod-Schemas (analyze, create, execute)
- `src/app/api/transformations/analyze/route.ts` — AI-Analyse via claude-haiku, gibt Suggestions zurück
- `src/app/api/transformations/route.ts` — GET (list) + POST (create pending)
- `src/app/api/transformations/[id]/route.ts` — GET (detail) + PATCH (execute → workspace oder feed + transformation_link)

---

## Plan F — UI (Projekte + Workspaces + Feeds-Settings)

**Ziel:** Vollständige UI für alle Phase-2-Backend-Features.

**Umfang (geplant):**
- Projekte-Seite: Liste mit Gedächtnis-Zähler, Wissensbasis-Tab
- Workspaces-Seite: Karten-Graph-View, Outcome-Board
- Feeds-Settings: Source-Management, Pipeline-Konfiguration

**Status:** ✅ Fertig (2026-03-17)

**Implementiert:**
- `GET /api/projects`: `project_memory(count)` in Liste
- `src/app/projects/page.tsx`: Memory-Count-Badge + Gedächtnis-Tab
- `src/app/workspaces/page.tsx`: Workspace-Liste (Server Component) statt redirect
- `src/components/workspaces/WorkspacesList.tsx`: Karten mit Status + Karten-Zähler + Create
