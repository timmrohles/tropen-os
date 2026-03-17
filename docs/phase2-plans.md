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
| Geteilte Chats (read-only) | Geteilte Chats mit Team-Antwort | ⬜ Plan K |
| Interaktive Workflows | Workspace + Karten | 🔄 Plan C-F |
| Tabellen-Rendering | Outcome: Tabelle | 🔄 Plan 1 |
| Chat-Vorschau bei Teilen | Artefakt vom Typ shared_chat | ⬜ Plan K |
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

- [ ] Geteilte Chats mit Vorschau → evaluieren für Plan K
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
| **Plan J** | Produktion – Live Dashboards, autonome Feeds, scheduled Agents | ⬜ Offen |
| **Plan K** | Geteilte Chats + Team-Antwort | ⬜ Geplant |

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

---

## Plan J — Produktion (Live Artefakte, Feeds autonom, Agents scheduled)

**Ziel:** Tropen OS wird zur Produktions-Plattform.
Artefakte die im Chat entworfen wurden laufen produktiv.
Feeds fließen autonom. Agenten arbeiten auf Schedule.
Das ist der Schritt vom Werkzeug zum Business Operating System.

---

### Das Produktions-Prinzip

Jedes Artefakt hat einen Lifecycle:
```
draft      → entsteht im Chat oder Workspace
review     → wird verfeinert, kommentiert, geteilt
published  → läuft produktiv mit echten Daten
archived   → nicht mehr aktiv, aber vollständig erhalten
```

Kein Artefakt wird gelöscht — nur archiviert.
Jede Version wird erhalten (APPEND ONLY für version_history).

---

### Produktive Artefakt-Typen

#### 1. Dashboards

Im Chat entworfen → produktiv eingesetzt:
```
/dashboard/[id]
├── Eigene URL, teilbar ohne Chat-Kontext
├── Verbindet sich mit Datenquellen:
│   → Feed-Items (automatisch aktualisiert)
│   → Uploads (manuell aktualisiert)
│   → API-Endpoints (per Webhook oder Schedule)
├── Update-Modi:
│   → Manuell: User triggert Aktualisierung
│   → Scheduled: täglich/stündlich/wöchentlich
│   → Event-triggered: neues Feed-Item → Dashboard aktualisiert
├── Sharing:
│   → Intern: Team-Mitglieder mit Org-Account
│   → Extern: öffentlicher Link (optional, Org-Admin entscheidet)
│   → Eingebettet: iFrame in externe Tools
└── Versioniert: jede Daten-Aktualisierung ist ein Snapshot
```

#### 2. Feeds (autonom)

Im Chat konfiguriert → läuft ohne User-Eingriff:
```
/feeds/[id]
├── Quellen: RSS, E-Mail (feed@org.tropen-os.app),
│            Web-Seiten, API-Webhooks, n8n-Trigger
├── Stage-Pipeline läuft autonom:
│   Stage 1: regelbasiert, kein API-Call
│   Stage 2: Haiku scored Items (max 300 Tokens)
│   Stage 3: Sonnet analysiert Top-Items (max 10/Batch)
├── Outputs je nach Konfiguration:
│   → Wissenbasis der Org/Projekt
│   → Karten in Workspace (als dynamische Quelle)
│   → Dashboard (als Datenquelle)
│   → Notification an User/Team
│   → Zusammenfassung als täglicher Chat-Einstieg
├── Run-History: jeder Feed-Run geloggt mit
│   Items gefunden / scored / weitergeleitet / Fehler
└── Pause/Resume: User kann Feed stoppen ohne ihn zu löschen
```

#### 3. Agenten (scheduled)

Im Chat oder Hub konfiguriert → arbeiten autonom:
```
/agents/[id]/runs
├── Trigger-Modi:
│   → Schedule: täglich/wöchentlich/monatlich
│   → Event: neues Feed-Item, neue Nachricht, Webhook
│   → Manuell: User startet Run
├── Jeder Run:
│   → Input aus konfigurierten Quellen
│   → Toro-Aufruf mit Agent-System-Prompt
│   → Output als Artefakt (Text, Tabelle, Dashboard-Update)
│   → Geloggt in agent_runs Tabelle
├── Run-History sichtbar:
│   → Status (success / error / running)
│   → Output-Artefakt verlinkt
│   → Token-Verbrauch + Kosten
│   → Fehler-Details wenn error
└── Budget-Check vor jedem Run:
    → Reicht Org-Budget für diesen Run?
    → Falls nicht: Run pausiert, Notification an Admin
```

#### 4. Dokumente (versioniert)

Im Workspace exportiert → lebendes Dokument:
```
/docs/[id]
├── Eigene URL, zugänglich ohne Workspace-Kontext
├── Versionen:
│   → Jeder Export ist eine Version (v1, v2, v3...)
│   → Versionen vergleichbar
│   → Rollback möglich
├── Team-Features:
│   → Kommentare pro Abschnitt
│   → @Mentions für Team-Mitglieder
│   → Änderungs-Notifications
├── Stale-Warning:
│   → Wenn Workspace-Karten nach Export geändert wurden:
│   → "Dieses Dokument basiert auf Stand [Datum].
│      3 Karten wurden seitdem geändert. Neu exportieren?"
└── Formate: Word, PDF, Markdown, Präsentation
```

---

### Hub als Produktions-Cockpit
```
/hub — komplett neu gedacht

Tabs:
├── Übersicht
│   → Aktive Dashboards (mit Live-Daten-Preview)
│   → Laufende Feeds (Items heute / Fehler)
│   → Scheduled Agents (nächster Run / letzter Status)
│   → Team-Aktivität (wer hat was publiziert)
│
├── Dashboards
│   → Grid aller Dashboards der Org
│   → Filter: Meine / Team / Öffentlich
│   → Neu: aus Chat-Artefakt oder leer
│
├── Feeds
│   → Liste aller Feeds mit Status-Ampel
│   → Items-Vorschau der letzten 24h
│   → Neu: Feed konfigurieren
│
├── Agenten
│   → Alle Agenten mit letztem Run-Status
│   → Run-History pro Agent
│   → Neu: aus Paket-Agent oder custom
│
└── Dokumente
    → Alle exportierten Dokumente
    → Versionsverlauf
    → Sharing-Status
```

---

### Neue DB-Tabellen
```sql
-- Dashboard-Definitionen
dashboards (
  id uuid,
  organization_id uuid,
  workspace_id uuid,        -- null = standalone
  artifact_id uuid,         -- Ursprungs-Artefakt
  created_by uuid,
  title text,
  config jsonb,             -- Chart-Config, Layout, Datenquellen
  status text,              -- draft | published | archived
  update_mode text,         -- manual | scheduled | event
  schedule text,            -- cron expression wenn scheduled
  last_updated_at timestamptz,
  is_public boolean default false,
  share_token text,         -- für externen Link
  created_at timestamptz,
  updated_at timestamptz
)

-- Dashboard-Snapshots (APPEND ONLY)
dashboard_snapshots (
  id uuid,
  dashboard_id uuid,
  data jsonb,               -- Daten zum Zeitpunkt des Snapshots
  triggered_by text,        -- manual | schedule | event
  created_at timestamptz
)

-- Agent-Runs (APPEND ONLY)
agent_runs (
  id uuid,
  agent_id uuid,
  organization_id uuid,
  triggered_by text,        -- schedule | event | manual
  status text,              -- running | success | error | skipped
  input jsonb,
  output_artifact_id uuid,
  token_usage jsonb,
  cost_eur numeric,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz
)

-- Dokument-Versionen (APPEND ONLY)
document_versions (
  id uuid,
  workspace_id uuid,
  export_id uuid,
  version_number integer,
  format text,
  file_url text,
  cards_snapshot jsonb,     -- Karten-Zustand zum Zeitpunkt
  is_stale boolean default false,
  created_by uuid,
  created_at timestamptz
)

-- Dokument-Kommentare
document_comments (
  id uuid,
  document_version_id uuid,
  user_id uuid,
  section_ref text,         -- Verweis auf Abschnitt/Karte
  content text,
  resolved boolean default false,
  created_at timestamptz
)
```

---

### Artefakt-Lifecycle API
```
POST /api/artifacts/[id]/publish
→ Artefakt wird produktiv
→ Je nach Typ: Dashboard-Route, Feed-Start, Agent-Schedule

POST /api/artifacts/[id]/archive
→ Artefakt wird archiviert (nie gelöscht)

GET  /api/artifacts/[id]/versions
→ Alle Versionen eines Artefakts

POST /api/dashboards/[id]/refresh
→ Manueller Daten-Update

GET  /api/feeds/[id]/runs
→ Run-History eines Feeds

POST /api/agents/[id]/run
→ Manuellen Run starten

GET  /api/agents/[id]/runs
→ Run-History eines Agenten
```

---

### Was NICHT gebaut wird in Plan J

- Externe API für Dritte (Phase 5)
- White-Label Dashboard-Sharing (Phase 5)
- Native Mobile App für Dashboard-Viewing (Phase 5)
- Eigenes Chart-Rendering-Service (bleibt ECharts)
- Gmail/Outlook OAuth (bleibt Phase 4)

---

### Technische Prinzipien Plan J

- **APPEND ONLY:** dashboard_snapshots, agent_runs,
  document_versions — niemals UPDATE oder DELETE
- **Budget-Check vor jedem autonomen Run:**
  Agent-Run und Feed Stage 2/3 prüfen Org-Budget
- **Graceful Degradation:**
  Wenn Datenquelle nicht erreichbar →
  letzten Snapshot zeigen mit Timestamp
- **Kosten-Transparenz:**
  Jeder autonome Run zeigt Token-Verbrauch + Kosten
  User sieht im Hub: "Heute: 0.34€ durch 3 Agent-Runs"
