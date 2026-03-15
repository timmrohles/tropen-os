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

| Feature | Status |
|---------|--------|
| Agenten-System Phase 2 (Zuweisung zu Projekten/Chats) | Offen |
| Prompt-Bibliothek Phase 3 (DB-backed, org-weit) | Offen |
| Wissenschafts-Paket | Offen |
| Marketing-Paket: 10 Agenten + Integrationen | Offen |
| Toro Guard (4-Schichten-System) | Offen |
| n8n/Make Integration | Offen |
| Real-Time Websuche | Offen |
| Voice Output (UI für Dify-Feature) | Offen |
| Multimodalität und Dateiupload | Offen |
| Kosten-Forecast im SessionPanel | Offen |

---

## Offene Bugs (Stand 2026-03-14)

| Bug | Status |
|-----|--------|
| Art. 50 KI-VO: UI-Banner / persistente KI-Kennzeichnung im Chat | ⬜ Offen |
| Toro Guard Level-Slider (statt alles/nichts) | ⬜ Offen |
| Admin-Dashboard (Kosten- und Modell-Kontrolle für B2B) | ⬜ Offen |
