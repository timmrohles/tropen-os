# Tropen OS — Produkt-Roadmap
> Stand: 2026-03-14. Pläne liegen in `docs/superpowers/plans/`

---

## ✅ Fertig

### Design-System
- Türkis/Teal vollständig entfernt, `var(--accent)` durchgängig
- Content-Breiten: `.content-max` · `.content-narrow` · `.content-wide` — alle Seiten migriert
- Vertikales Padding automatisch in content-Klassen
- Page-Header Abstand `margin-bottom: 32px`
- Schwarze H1-Icons (`color="var(--text-primary)"`)
- Body-Gradient als globaler Hintergrund

### Chat & Workspace
- Kimi-Style 3-Column Layout (LeftNav 240px, ChatArea flex, ProjectSidebar)
- Multi-Select mit iOS-"Bearbeiten"-Pattern, Merge, Soft-Delete, Papierkorb
- Jungle Order: Struktur-Vorschlag + Zusammenführen via Dify Workflow
- Prompt-Bibliothek Phase 1: 5 Core-Vorlagen + TemplateDrawer

### Phase 2 — DB-Fundament (2026-03-12)
- Plan A: Migrationen 030–033 + RLS-Fixes deployed
- Plan B: Projects CRUD + Gedächtnis + Context-Awareness + ContextBar + MemorySaveModal

### Phase 2 — Backend (2026-03-14)
- **Plan C:** Workspaces + Card Engine — vollständig (API, Stale-Propagation, Export, Chat)
- **Plan G:** Feeds — vollständig (3-stufige Pipeline, Cron, Newscenter UI, Source-Wizard)

### Weitere fertige Features
- Wissensbasis & RAG (pgvector, 3 Ebenen, Dokument-Upload)
- Superadmin-Tool (`/superadmin/clients`)
- Impersonation (Read-only, geloggt, zeitbegrenzt)
- Startseiten-Chat (anonym, 5 Nachrichten)
- Artefakte & Merkliste
- Pakete Phase 1 (Marketing-Paket, 5 Agenten)
- Prompt-Bibliothek Phase 3 (eigene + Team-Vorlagen, DB-backed)
- Kosten-Forecast im SessionPanel (forecastCost, Warnungen ab 5/10 EUR)

---

## 🔴 Nächster Schritt — Plan D

### Plan D — Chat & Context Integration
- Projekt-Kontext-Injection beim AI-Aufruf (Gedächtnis + Wissensbasis → System-Prompt)
- Memory-Warnung im Chat-Header (85%-Trigger sichtbar kommunizieren)
- Workspace-Chat-Context (knowledge_entries fließen in Chat)
- Plan noch zu schreiben

---

## ⬜ Offen (Phase 2)

### Plan E — Transformations-Engine
- `POST /api/transformations` — analyze + suggest + build + link
- Projekt → Workspace / Agent / Feed
- Immer: Vorschau → Bestätigung → Ausführung — nie destruktiv
- Plan noch zu schreiben

### Plan F — UI (Projekte + Workspaces + Feeds-Settings)
- Projekte-Seite neu: Liste mit Gedächtnis-Zähler, Wissensbasis-Tab
- Workspaces-Seite: Karten-Graph-View, Outcome-Board
- Transformations-Trigger als kontextueller Hinweis (kein Nav-Punkt)
- Plan noch zu schreiben

---

## ⬜ Geplant (später)

> **Single Source of Truth:** `src/app/admin/todos/todoDataConcepts.ts`
> Neue Einträge dort pflegen — sie erscheinen automatisch im [Admin Todo-Tracker](/admin/todos).

| ID | Feature | Konzept |
|----|---------|---------|
| `phase2-e` | Plan E — Transformations-Engine | — |
| `phase2-f` | Plan F — UI (Projekte + Workspaces + Feeds-Settings) | — |
| `chart-tremor` | Tremor Migration: App-UI Charts (Dashboard, SessionPanel) | `docs/plans/tremor-migration.md` |
| `chart-echarts` | ECharts Artifact-Renderer: Toro generiert Chart-JSON | `docs/plans/echarts-artifacts.md` |
| `chart-presentations` | Präsentations-System: Reveal.js Slides + PowerPoint-Export | `docs/plans/presentation-artifacts.md` |
| `concept-persp-infra` | Perspectives: Migration + API + 5 System-Avatare | `docs/plans/perspectives-build.md` |
| `concept-persp-strip` | Perspectives: PerspectivesStrip + Bottom-Sheet | `docs/plans/perspectives-build.md` |
| `concept-persp-page` | Perspectives: /perspectives Seite + AvatarFormDrawer | `docs/plans/perspectives-build.md` |
| `concept-toro-scan` | Toro Potenzial-Entdecker Phase 1: KI-Scan im Onboarding | `docs/product/toro-potential-scan.md` |
| `concept-toro-library` | Toro Potenzial-Entdecker Phase 2: Automatisierungs-Bibliothek | `docs/product/toro-potential-scan.md` |
| `concept-toro-observer` | Toro Potenzial-Entdecker Phase 3: Toro beobachtet + schlägt vor | `docs/product/toro-potential-scan.md` |
| `concept-meta-health` | Meta-Agenten Phase 1: Health-Monitor | `docs/product/meta-agenten.md` |
| `concept-meta-optimizer` | Meta-Agenten Phase 2: Quality-Optimizer | `docs/product/meta-agenten.md` |
| `concept-meta-scout` | Meta-Agenten Phase 3: Opportunity-Scout | `docs/product/meta-agenten.md` |
| `concept-agents-phase2` | Agenten-System Phase 2: Zuweisung zu Projekten/Chats | `docs/plans/agents-spec.md` |
| `paket-02` | Marketing-Paket: 10 Agenten + Integrationen | — |
| `paket-03` | Wissenschafts-Paket | — |
| `chat-16` | Toro Guard (4-Schichten-System) | — |
| `proj-04` | n8n/Make Integration | — |
| `chat-17` | Real-Time Websuche | — |
| `chat-18` | Voice Output | — |
| `chat-19` | Multimodalität und Dateiupload | — |

---

## Offene Bugs (Stand 2026-03-14)

| Bug | Status |
|-----|--------|
| Art. 50 KI-VO: UI-Banner / persistente KI-Kennzeichnung im Chat | ⬜ Offen |
| Toro Guard Level-Slider (statt alles/nichts) | ⬜ Offen |
| Admin-Dashboard (Kosten- und Modell-Kontrolle für B2B) | ⬜ Offen |
