# Design: Smarte Projekte Phase 2

**Datum:** 2026-03-09
**Status:** Approved
**Scope:** /projects-Seite, erweiterte Projekteigenschaften, Kontext-Textfeld
**Nicht in Scope:** Agenten-System (Phase 3), Community (Phase 4), Auto-Extraktion Gedächtnis (Phase 3)

---

## Ziel

Projekte von passiven Ordnern zu smarten Arbeitsbereichen upgraden. User können pro Projekt Kontext, Ton, Sprache und Zielgruppe hinterlegen. Toro liest diesen Kontext bei jedem Chat im Projekt (Phase 3: Edge Function). Neue `/projects`-Seite als zentraler Anlaufpunkt.

---

## DB-Schema

### Migration `016_smart_projects.sql`

Erweitert die bestehende `projects`-Tabelle um:

```sql
ALTER TABLE projects
  ADD COLUMN description   TEXT,
  ADD COLUMN context       TEXT,
  ADD COLUMN tone          TEXT DEFAULT 'casual'
    CHECK (tone IN ('formal','casual','technical','creative')),
  ADD COLUMN language      TEXT DEFAULT 'auto'
    CHECK (language IN ('de','en','auto')),
  ADD COLUMN target_audience TEXT DEFAULT 'internal'
    CHECK (target_audience IN ('internal','customers','public')),
  ADD COLUMN memory        TEXT,
  ADD COLUMN updated_at    TIMESTAMPTZ DEFAULT NOW();
```

- Keine neue Tabelle — kein breaking change
- `memory` bleibt leer bis Phase 3
- `linked_projects UUID[]` kommt in Phase 3
- Bestehende Rows erhalten NULL-Werte → alle Felder optional

---

## API

### `src/app/api/projects/route.ts`

Muster wie andere Admin-Routes — `supabaseAdmin` (Service Role, bypasses RLS).

| Method | Aktion |
|--------|--------|
| GET | Alle Projekte des Workspace (inkl. Chat-Zähler via JOIN) |
| POST | Neues Projekt anlegen |
| PATCH | Projekt-Eigenschaften aktualisieren |
| DELETE | Hard-Delete (Chats behalten project_id=NULL via ON DELETE SET NULL) |

Query-Parameter: `workspace_id` (required)

---

## Seite: `/projects`

**Route:** `src/app/projects/page.tsx`
**Typ:** Client Component (`'use client'`)
**Auth:** Supabase Client, redirect wenn kein User

### Layout

```
┌─────────────────────────────────────────────────────┐
│  [Tab 1: Meine Projekte] [Tab 2: 🔒] [Tab 3: 🔒] [Tab 4: Vorlagen]  │
├──────────────────────────┬──────────────────────────┤
│                          │                          │
│   Projekt-Grid           │   Detail-Panel           │
│   (linke Spalte)         │   (rechte Spalte)        │
│                          │   erscheint bei Auswahl  │
│                          │                          │
└──────────────────────────┴──────────────────────────┘
```

### Tab 1 – Meine Projekte (funktional)

**Linke Spalte — Projekt-Grid:**
- Karten-Grid (2–3 Spalten je Viewport)
- Pro Karte: Name, Beschreibung (truncated), Chat-Zähler, Ton-Badge
- "+ Neues Projekt"-Button oben rechts
- Aktive Karte hebt sich ab (`.chip--active`-Stil)
- Leere State: Illustration + "Noch keine Projekte" + CTA

**Rechte Spalte — Detail-Panel:**
Erscheint wenn Projekt ausgewählt. Felder:
1. **Name** — Text Input
2. **Beschreibung** — Text Input (einzeilig)
3. **Kontext** — Textarea (groß) + HintBox (siehe unten)
4. **Ton** — Select: Formell / Locker / Technisch / Kreativ
5. **Sprache** — Select: Deutsch / Englisch / Auto
6. **Zielgruppe** — Select: Intern / Kunden / Öffentlichkeit
7. Speichern-Button (PATCH), Löschen-Button (DELETE mit Bestätigung)

**HintBox Kontext-Feld:**
```
💡 Was ist der Projekt-Kontext?
Schreib hier alles, was Toro über dieses Projekt wissen soll —
Hintergrund, Ziele, Einschränkungen, wichtige Begriffe.

Beispiel: "Dieses Projekt ist für den Launch unserer neuen App 'Waldpfad'.
Zielgruppe: 30–50 jährige Outdoor-Enthusiasten. Budget: 50.000 €.
Launch-Termin: 15. Mai 2026."

ℹ️ Auto-Extraktion (Toro liest Chats und ergänzt den Kontext automatisch)
kommt in Phase 3.
```

### Tab 2 – Meine Agenten (Platzhalter)

- `Lock`-Icon (Phosphor) + "Kommt in Phase 3"
- Teaser: "Erstelle eigene Agenten, weise sie Projekten zu und teile sie mit deinem Team."
- Link: `mailto:hello@tropen-os.de?subject=Interesse: Agenten-System`

### Tab 3 – Community (Platzhalter)

- `Lock`-Icon (Phosphor) + "Kommt in Phase 4"
- Teaser: "Entdecke öffentliche Agenten, teile deine eigenen und baue auf dem Wissen der Community auf."
- Link: `mailto:hello@tropen-os.de?subject=Interesse: Community`

### Tab 4 – Vorlagen (funktional)

- Karten-Ansicht aus `src/lib/prompt-templates.ts`
- Pro Vorlage: Name, Beschreibung, Kategorie-Badge, Felder-Liste
- "In Chat einfügen"-Button → redirect zu `/workspaces/[id]?template=[slug]`
- Workspace-ID aus URL oder User-Default-Workspace

---

## Navigation

`LeftNav.tsx` bekommt einen Link zu `/projects` (Phosphor `Folders`-Icon — bereits importiert).

---

## Design-System

- `const s: Record<string, React.CSSProperties>` für Layout/Spacing
- CSS-Variablen: `var(--bg-base)`, `var(--bg-surface)`, `var(--accent)`, `var(--color-border)`
- Klassen: `.t-primary`, `.t-secondary`, `.t-dezent`, `.chip`, `.chip--active`
- Icons: Phosphor React (`@phosphor-icons/react`)
- Kein Tailwind in Komponenten-Dateien

---

## Projekt-Gedächtnis Roadmap

- **Phase 2 (jetzt):** Manuelles `context`-Textfeld im Projekt-Detail. User füllt selbst aus.
- **Phase 3:** Toro extrahiert automatisch Personen, Deadlines, Entscheidungen und offene Fragen aus dem Chat-Verlauf via eigenem Dify-Workflow → schreibt in `projects.memory`.

---

## Dateien die erstellt/geändert werden

| Datei | Aktion |
|-------|--------|
| `supabase/migrations/016_smart_projects.sql` | Neu |
| `src/app/api/projects/route.ts` | Neu |
| `src/app/projects/page.tsx` | Neu |
| `src/components/workspace/LeftNav.tsx` | +Link zu /projects |
