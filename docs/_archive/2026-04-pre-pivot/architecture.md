# Tropen OS — Architektur v0.5
> Phase-2-Gesamtarchitektur. Vollständiges Konzeptdokument: `docs/tropen-os-architektur.md`

---

## System-Hierarchie

```
Organization
  └── Department (departments)
        ├── Projekte (projects)     → Wissensbasis + Gedächtnis + Chats
        └── Workspaces (workspaces) → Karten-Graph + Outcomes
```

## DB-Tabellen: Bestehend (NICHT anfassen)

| DB-Tabelle | UI-Label | Bedeutung |
|------------|----------|-----------|
| `departments` | "Department" | Org-weite Einheit |
| `department_members` | — | Mitgliedschaft in Department |
| `conversations` | "Chat" | Einzelnes Gespräch |

## DB-Tabellen: Phase 2 (neu)

| DB-Tabelle | UI-Label |
|------------|----------|
| `projects` | "Projekt" |
| `project_memory` | "Gedächtnis" |
| `workspaces` | "Workspace" |
| `cards` | "Karte" |
| `agents` | "Agent" |
| `feed_sources` | "Quelle" |
| `transformations` | (intern) |

## Routen & Semantik

| Route | Bedeutung |
|-------|-----------|
| `/projects` | Smarte Projektordner — Gedächtnis + Chats + Wissensbasis |
| `/workspace` | Karten-System — Phase 2, API vollständig (Plan C) |
| `/chat` | Einzelnes Gespräch (bestehend, nicht anfassen) |
| `/dashboard` | Org-Übersicht |

## Was NICHT angefasst wird

- `workspaces` Tabelle (= Department)
- `conversations` Tabelle
- `/chat` Route
- `src/lib/supabase-admin.ts`
- Bestehende Department-UI und -Actions

## Toter Code — löschen wenn Build startet

- `/ws/` Route
- Altes `actions/workspaces.ts` (Canvas-System)
- Canvas-Tabellen ohne `tropen_` Präfix

---

## Projekte: Kern-Konzept

Projekte sind smarte Projektordner mit Gedächtnis.
Wissensbasis (Dateien, Notizen, Links) + Chat-History + Projekt-Gedächtnis.
**Keine Aufgabenliste. Keine hardcodierten Felder.** Domänenspezifische Felder via Templates.

### Projekt-Gedächtnis

```typescript
interface MemoryEntry {
  id: string
  type: 'insight' | 'decision' | 'open_question' | 'summary' | 'fact'
  content: string
  sourceConversationId: string
  createdAt: string
  importance: 'high' | 'medium' | 'low'
  tags: string[]
  frozen: boolean
}
```

- Akkumuliert automatisch aus Chats
- Wird bei Context-Window-Warnung eingefroren (Zusammenfassung via Haiku)
- Fließt in jeden neuen Chat im Projekt als Kontext
- Tabelle `project_memory` ist **APPEND ONLY** — niemals UPDATE oder DELETE

### Context-Window-Awareness

- Token-Count nach jeder Message (tiktoken, kein API-Aufruf)
- Füllstand im Chat-Header: `[████████░░] 80%`
- **Warnung bei 85%:** Zusammenfassung ins Gedächtnis anbieten
- Zusammenfassung via `claude-haiku-4-5-20251001`

---

## Workspace + Card Engine (Plan C — Backend fertig 2026-03-14)

**Core-Prinzip:** Ein Workspace ist für mehrstufige, komplexe Aufgaben.
Karten (`input` → `process` → `output`) produzieren zusammen ein Ergebnis.

**Stale-Propagation:** Änderung an Karte → direkte Abhängigkeiten werden auf
`status='stale'` gesetzt (nicht rekursiv). Logik: `src/lib/stale-propagation.ts`

**Briefing-Flow:** `POST /api/workspaces/[id]/briefing` → Toro stellt Fragen →
gibt JSON `{ goal, cards[] }` zurück → Client bestätigt → Cards werden angelegt

**Export:** `chat` und `markdown` implementiert.
`word` / `pdf` / `presentation` → 501 (kommt Plan F/G)

**Zeitdimension:** `getWorkspaceAt(id, date)` aus `src/lib/workspace-time.ts`
rekonstruiert Workspace-Zustand aus `context_snapshot` in `workspace_messages`

**`card_history` ist APPEND ONLY** — kein UPDATE, kein DELETE

### API-Routen (Plan C)

- `GET/POST /api/workspaces` — Liste + anlegen
- `GET/PATCH/DELETE /api/workspaces/[id]`
- `GET/POST /api/workspaces/[id]/cards`
- `PATCH/DELETE /api/workspaces/[id]/cards/[cid]`
- `POST/DELETE /api/workspaces/[id]/connections/[connid]`
- `GET/POST /api/workspaces/[id]/assets/[aid]`
- `GET/POST /api/workspaces/[id]/chat`
- `POST /api/workspaces/[id]/briefing`
- `POST /api/workspaces/[id]/export`
- `GET /api/workspaces/[id]/exports`

---

## Wissens-Hierarchie (für jeden AI-Aufruf)

```
1. Org-Wissen (locked)               → immer
2. Department-Wissen                 → immer
3. Projekt-Gedächtnis                → wenn in Projekt
4. Projekt-Wissensbasis              → wenn in Projekt
5. Workspace-Wissen                  → wenn in Workspace
6. Karten-Wissen                     → wenn in Karten-Chat
7. Feed-Artefakte (relevant)         → wenn zugeordnet
8. suggested/open Konventionen       → Member-Wert oder Default
```

## Kontroll-Spektrum

```typescript
interface ControlledSetting<T> {
  value: T
  controlMode: 'locked' | 'suggested' | 'open'
  setBy: 'org' | 'dept' | 'member'
  explanation?: string
  bestPractice?: string
}
```

Department kann einschränken, nie lockern.
Member kann überschreiben was `'suggested'` oder `'open'` ist.

## AI-Modelle (Phase 2)

| Verwendung | Modell |
|------------|--------|
| Projekt-Chat, Workspace-Chat, Transformations-Engine | `claude-sonnet-4-20250514` |
| Context-Zusammenfassung, Feed Stage 2 | `claude-haiku-4-5-20251001` |
| Feed Stage 3 (Deep) | `claude-sonnet-4-20250514` |

Feed Stage 1: kein API-Aufruf — regelbasiert.
SDK: Anthropic SDK direkt (`ANTHROPIC_API_KEY`) — kein Dify für neue Features.

## Token-Sparsamkeit

- Feed Stage 1: kein API-Aufruf
- Feed Stage 2: Haiku, max 300 Output-Tokens
- Feed Stage 3: Sonnet, max 10 Items pro Batch, Budget-Check vor Aufruf
- Context-Zusammenfassungen: Haiku (nicht Sonnet)
- Token-Count lokal (tiktoken), kein API-Aufruf dafür

## Phase-2-Konventionen

- Neue Tabellen ohne `tropen_` Präfix
- **APPEND ONLY**: `card_history`, `project_memory`, `feed_processing_log`
- Meta-Felder: immer mergen, nie ersetzen (`{ ...existing.meta, ...newFields }`)
- Soft Delete: `deletedAt`, nie hard delete (außer explizit angefordert)
- Zod-Validierung am Anfang jeder Server Action

## Design-Tokens (dunkles Theme für tropen_ Features)

```javascript
tropen: {
  bg:      "#080808",
  surface: "#0e0e0e",
  border:  "#1e1e1e",
  text:    "#e0e0e0",
  muted:   "#444444",
  input:   "#00C9A7",
  process: "#7C6FF7",
  output:  "#F7A44A",
}
// Font: 'DM Mono', monospace
```

Das helle Theme (`var(--bg-base)` = `#EAE9E5`) bleibt für alle vorhandenen Seiten.

## Build-Reihenfolge (Prompts 00–08)

```
Prompt 00 → Migration projects → tropen_projects
Prompt 01 → Schema (alle tropen_ Tabellen)
Prompt 02 → Projekt CRUD + Gedächtnis + Context-Awareness
Prompt 03 → Workspace CRUD + Card Engine
Prompt 04 → Connection Graph
Prompt 05 → Chat & Context (Projekt + Workspace)
Prompt 06 → Transformations-Engine
Prompt 07 → UI (Projekte + Workspaces)
Prompt 08 → Feeds
```

---

## UI-Konsistenz-Standards (Stand 2026-03-25)

Verbindliche Layout-Regeln für alle App-Seiten.
Vollständige Patterns: `src/components/_DESIGN_REFERENCE.tsx` Sections 18–19.

### Filter-Bar Layout

```
┌─────────────────────────────────┐  ← max-width: 400px
│  🔍  Suchen…                    │  ← .search-bar-container + MagnifyingGlass links
└─────────────────────────────────┘
[Alle] [Entwurf] [Aktiv] [Archiviert]  ← .page-filter-row, immer DARUNTER
```

- `.search-bar-container` — Wrapper mit `position: relative; max-width: 400px`
- `.page-filter-row` — Chips-Zeile mit `display: flex; gap: 6px; flex-wrap: wrap; margin-top: 10px`
- **Chips niemals neben dem Suchfeld** — immer in eigener Zeile darunter
- Suchfeld nie `width: 100%` — max-width 400px ist das Limit

### Scrollbars

Global via `globals.css` — kein per-Komponenten-Override nötig:
- `scrollbar-width: thin` (Firefox)
- `4px` Webkit-Scrollbar, Farbe `var(--text-tertiary)` / `var(--border)`

### Empty States

```tsx
<div style={{ padding: '48px 24px', textAlign: 'center' }}>
  <Icon size={32} weight="fill" color="var(--text-tertiary)" />
  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: '12px 0 6px' }}>
    Noch keine [Entitäten]
  </p>
  <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: '0 0 16px' }}>
    Was diese Entität ist + nächster Schritt.
  </p>
  <button className="btn btn-primary">+ [Neue Entität]</button>
</div>
```

- Icon: 32px, `weight="fill"`, `var(--text-tertiary)`
- Beschreibungstext erklärt den Zweck der Entität
- CTA: `btn btn-primary` — **nie ghost als primäre Aktion**

### Seiten-spezifische Icon-Zuordnungen

| Seite | H1-Icon |
|-------|---------|
| Chats | `ChatCircle` |
| Artefakte | `Sparkle` |
| Agenten | `Robot` |
| Projekte | `FolderOpen` |
| Workspaces (Departments) | `ShareNetwork` |
| Feeds | `Newspaper` |
| Dashboard | `House` |
| Einstellungen | `Gear` |
