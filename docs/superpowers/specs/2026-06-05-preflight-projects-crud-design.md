# Pre-Flight: Benannte Projekte, CRUD & Repo-Artefakt-Bereich

**Datum:** 2026-06-05
**Branch:** `claude/preflight-impl` (Worktree `preflight`)
**Status:** Freigegeben (Brainstorming abgeschlossen), bereit für Implementierungsplan
**Slice:** Pre-Flight MVP — Ausbaustufe „Projekt-Fläche"

---

## 1. Ziel & Kontext

Die heutige Pre-Flight-Seite ist ein One-Shot: Konzept rein → Ergebnis raus, nicht benannt, nicht wiederfindbar. Sie erklärt zudem nicht, **was** der Nutzer hier tut und **was** er bekommt.

Dieser Slice macht Pre-Flight zu einer einladenden, erklärenden **Projekt-Fläche**:

- Der Nutzer versteht sofort: *„Wir bauen das Fundament deines Repos — mit Regeln, Konventionen und Sicherheits-Leitplanken, damit Claude/Cursor & Co. ohne Drift bauen und alles wartbar, erklärbar und sicher bleibt."*
- Er kann ein Projekt **benennen**, wiederfinden, umbenennen, löschen (volle CRUD).
- Er bekommt einen **Artefakt-Bereich**: die generierten Repo-Dateien als durchsuchbares „Repo", copy-/download-ready.

**Nordstern:** dasselbe Projekt durchläuft später die Audit-Tür („nach dem Bauen"). Das Datenmodell ist darauf vorbereitet, ohne diese Vereinheitlichung jetzt zu bauen.

### Nicht-Ziele (bewusst draußen — Fast-Follow / später)

- **Playwright-E2E-Starter** im Startpaket → eigener Mini-Sprint direkt danach.
- **„Alle als .zip"** → vermeidet jetzt eine Dependency-Entscheidung (JSZip o.ä.).
- **Große Verlaufs-/Historie-Ansicht** → Schema hält den Verlauf, UI zeigt vorerst nur den neuesten Run.
- **Makerkit-Marketing-Block** (großer Screenshot + Nutzentext) → gehört auf die öffentliche, ausgeloggte Seite, nicht ins Werkzeug.
- **Vereinheitlichung mit dem Audit-`projects`-Entity** → separater Architektur-Schritt, braucht ADR (Pivot-Disziplin).

---

## 2. Datenmodell (Container + Verlauf, schlank)

### Neue Tabelle `preflight_projects`

| Spalte | Typ | Hinweis |
|--------|-----|---------|
| `id` | UUID PK | `gen_random_uuid()` |
| `organization_id` | UUID NOT NULL | FK `organizations(id)` ON DELETE CASCADE |
| `user_id` | UUID NOT NULL | FK `auth.users(id)` ON DELETE CASCADE |
| `name` | TEXT NOT NULL | vom Nutzer oder Default = `projectLabel` |
| `pivots` | JSONB NOT NULL | letzte verwendete Intake-Pivots |
| `latest_run_id` | UUID NULL | FK `preflight_runs(id)` ON DELETE SET NULL |
| `created_at` | TIMESTAMPTZ NOT NULL | `now()` |
| `updated_at` | TIMESTAMPTZ NOT NULL | `now()`, bei jeder Mutation gesetzt |
| `deleted_at` | TIMESTAMPTZ NULL | Soft-Delete |

**RLS:** wie `preflight_runs` — Schreibzugriff ausschließlich Service-Role (API), daher **keine** INSERT/UPDATE-Policy.
- `SELECT`: `organization_id = get_my_organization_id()`
- `DELETE`: `user_id = auth.uid()` (DSGVO-Hygiene; reguläres Löschen läuft als Soft-Delete über die API)
- Index: `(organization_id, deleted_at, updated_at DESC)` für die Liste.

### Änderung an `preflight_runs`

- Neue Spalte `project_id UUID NULL` → FK `preflight_projects(id)` ON DELETE CASCADE.
- Nullable, weil bestehende Alt-Zeilen (Testdaten) kein Projekt haben; diese erscheinen nicht in der Projektliste.
- Index `(project_id, created_at DESC)`.

**Zirkuläre FK-Auflösung:** `preflight_projects.latest_run_id → preflight_runs.id` und `preflight_runs.project_id → preflight_projects.id`. Migration legt zuerst `preflight_projects` ohne den `latest_run_id`-FK an, dann `preflight_runs.project_id`, dann `ALTER TABLE preflight_projects ADD CONSTRAINT … latest_run_id`. Beim Insert: erst Projekt (latest_run_id NULL), dann Run mit `project_id`, dann Projekt-UPDATE `latest_run_id`.

---

## 3. API-Routen

Muster wie `/api/projects`: `getAuthUser()` → Org-Check, `validateBody()` (Zod), `supabaseAdmin`, strukturierte Fehler.

| Route | Methode | Verhalten |
|-------|---------|-----------|
| `/api/preflight/analyze` | POST | `{ input, pivots, name? }` → `runPreflight` → Projekt anlegen (name = `name?.trim() || result.summary.projectLabel`) + ersten Run + `latest_run_id` setzen. Budget-Check wie bisher. Antwort: `{ projectId, result }`. |
| `/api/preflight/projects` | GET | Liste der eigenen Org, `deleted_at IS NULL`, sortiert `updated_at DESC`. Pro Projekt: `id, name, pivots, updated_at` + Kurz-Infos aus neuestem Run (Stack aus pivots, `gaps.red.length`). |
| `/api/preflight/projects/[id]` | GET | Projekt + neuestes Run-`result` (Join über `latest_run_id`). 404 wenn nicht in Org. |
| `/api/preflight/projects/[id]` | PATCH | Umbenennen: nur `name` (allowlist), getrimmt, nicht leer. `updated_at` bumpen. |
| `/api/preflight/projects/[id]` | DELETE | Soft-Delete: `deleted_at = now()`. |
| `/api/preflight/projects/[id]/runs` | POST | Neu analysieren: `{ input, pivots }` → `runPreflight` → neuer Run mit `project_id` → `latest_run_id` + `pivots` + `updated_at` updaten. Budget-Check. Antwort: `{ result }`. |

Org-Zugriffsprüfung pro `[id]`: Helper `verifyPreflightProjectAccess(id, me)` analog `verifyProjectAccess` (Superadmin → true; sonst Projekt-`organization_id === me.organization_id`).

### Validatoren (`src/lib/validators/preflight.ts`, ergänzt)

- `preflightBody` (bestehend) → erweitert um optionales `name: z.string().trim().max(120).optional()`.
- `renameProjectBody = z.object({ name: z.string().trim().min(1).max(120) })`.
- Re-Run nutzt `preflightBody` ohne `name`.

---

## 4. Seiten & Komponenten

### `/preflight` (`page.tsx`, Client) — Liste + Leerzustand

**Leerzustand (kein Projekt) — Split:**
- Links: Eyebrow „— PRE-FLIGHT" · Headline „Sorgenfrei starten — kein Drift." · Erklärtext (Repo-Fundament/Regeln/Sicherheit) · 3-Schritt-Zeile (Konzept rein → Lücken & Konventionen → Startpaket) · „Das bekommst du"-Liste (CLAUDE.md/.cursorrules · DECISIONS.md · .env.example · migration.sql).
- Rechts: `IntakePanel` — Name (optional) + 5 Pivots + Konzept-Textarea + DropZone (.md/.txt) → „Analysieren".

**Mit Projekten:**
- Schlanke Erklär-Zeile + page-header mit „+ Neues Projekt" (öffnet `IntakePanel` als Inline-Card oder Modal).
- `ProjectGrid` aus `ProjectCard`s (Name, Stack, Lücken-Zahl, Relativzeit). Karten-`[···]`-Menü: **Umbenennen** (inline), **Löschen** (rot, mit Bestätigung). Klick auf Karte → `/preflight/[id]`.

Daten: GET `/api/preflight/projects` beim Mount. Nach Analyse: Redirect auf `/preflight/[projectId]`.

### `/preflight/[id]` (`[id]/page.tsx`, Client) — Detail / Ergebnis

- page-header: Projektname (inline umbenennbar) + Aktionen „Neu analysieren", „Löschen".
- **Einordnung** (`summary.headline`).
- **Lücken**: bestehende `GapsSection`/`GapCard` (kompakt).
- **Artefakt-Bereich**: `ArtifactBrowser`.

Daten: GET `/api/preflight/projects/[id]`.

### `ArtifactBrowser` (neu) — Repo-Browser

- Linke Spalte: Dateiliste aus `Startpaket` → `conventions.filename`, `DECISIONS.md` (`decisionLog`), `.env.example` (`envExample`), `migration.sql` (`migrationDraft.sql`, nur wenn vorhanden).
- Rechte Spalte: Vorschau der gewählten Datei (Monospace, `--active-bg`-Panel) + „Kopieren" / „⬇ Download" (Browser-Blob).
- Fußzeile: „📋 Alle als Prompt kopieren" (`buildDecisionPrompt`). „Alle als .zip" = Fast-Follow.

### Bestehendes

- `IntakePanel` wird aus der heutigen `page.tsx` extrahiert (Pivots + DropZone + Textarea + Name-Feld), wiederverwendet in Leerzustand und „+ Neu".
- `PreflightResult.tsx` wird zur Detail-Komposition umgebaut (Einordnung + Lücken + ArtifactBrowser); die bisherige „Path B (kommt bald)"-Schaltfläche entfällt — die Artefakte **sind** die generierten Dateien.
- `GapCard`/`GapsSection` unverändert.

### Wiederverwendung vs. Neubau (Recycling-Audit)

Es gibt bereits eine Artefakt-Infrastruktur (`artifacts`-Tabelle, `/api/artifacts`, `ArtifactRenderer`, Artifacts-Seite). Entscheidung pro Baustein:

**Wiederverwenden (direkt importieren/extrahieren):**
- `src/components/workspace/CodeBlock.tsx` — Lazy-Syntax-Highlighter. Direkt für die Datei-Vorschau (`<CodeBlock language="markdown">…</CodeBlock>`). Kein `dynamic()` nötig (kein Chat-Kontext).
- `downloadArtifact()` aus `artifacts/_components/ArtifactCard.tsx` — Blob-Download. Generisch extrahieren nach `src/lib/download.ts` als `downloadTextFile(filename, content)` und im ArtifactBrowser nutzen.
- CSS-Klassen: `btn-icon`, `dropdown`, `dropdown-item`, `dropdown-item--danger`, `animate-dropdown`, `card`, `chip`.

**Referenzieren (Muster spiegeln, nicht importieren):**
- `[···]`-Menü + Inline-Rename + `dropdown-item--danger` aus `ArtifactCard.tsx` → Vorlage für `ProjectCard` (DotsThree/PencilSimple/Trash). Ohne „In Workspace speichern".
- Clipboard: kein wiederverwendbarer Hook vorhanden — `navigator.clipboard.writeText` + 1,8 s-Feedback inline (Muster aus `PerspectivesBottomSheet.tsx`).

**Neu bauen:**
- `ArtifactBrowser` (Split-Pane: Dateiliste + Vorschau, Datei-Auswahl-State) — es gibt keinen Repo-Browser; `ArtifactRenderer` ist für interaktive Renderables (Charts/React/Slides via iframe) und damit overkill für statische Textdateien.
- `ProjectGrid`/`ProjectCard`, `IntakePanel` (Extraktion aus heutiger Seite), die CRUD-Routen.

**Bewusst NICHT wiederverwenden:**
- `artifacts`-Tabelle / `/api/artifacts`: an `conversation_id`/`message_id` gekoppelt und Teil der **eingefrorenen** Phase-2-Navigation. Pre-Flight-Dateien leben bereits in `preflight_runs.result.startpaket` (JSONB) — kein zweiter Speicherort, keine Kopplung an deprecated Surface. Der Artefakt-Bereich ist eine **Sicht** auf dieses JSONB, kein eigener Store.

---

## 5. Datenfluss (Happy Path)

1. Nutzer öffnet `/preflight` ohne Projekte → Split-Leerzustand.
2. Füllt Name (optional) + Pivots + Konzept → „Analysieren" → POST `/api/preflight/analyze`.
3. Server: `runPreflight` → Projekt + Run angelegt, `latest_run_id` gesetzt → `{ projectId, result }`.
4. Client: Redirect `/preflight/[projectId]` → Detail mit Lücken + ArtifactBrowser.
5. Nutzer kopiert/lädt Dateien, benennt das Projekt um, oder „Neu analysieren" (POST `…/runs`).
6. Zurück auf `/preflight` → Projektkarte sichtbar; CRUD verfügbar.

---

## 6. Fehlerbehandlung

- Auth fehlt → 401. Projekt nicht in Org → 404. Zod-Fehler → 400 via `validateBody`. Budget erschöpft → 402 `BUDGET_EXHAUSTED`. `runPreflight`-Reject (Input zu kurz) → 400 mit Meldung (wie heute). DB-Fehler → 500 strukturiert, geloggt via `createLogger`.
- Client: Fehlerbanner im Intake (bestehend), Lade-Spinner, leere Liste → Leerzustand. Löschen mit Inline-Bestätigung („Sicher löschen? Ja/Abbrechen").

---

## 7. Tests

- **Unit (Vitest):** erweiterte Validatoren (`name` optional, `renameProjectBody`); `name ?? projectLabel`-Default-Logik; Mapping Run→Listen-Kurzinfo.
- **Route-Unit** analog `src/app/api/preflight/__tests__/analyze.unit.test.ts`: `projects` GET/POST/PATCH/DELETE + `…/runs` POST — Auth-Guard, Org-Scoping, Soft-Delete, Budget-Check (gemockt).
- Bestehende 35 Tests bleiben grün; `analyze`-Test an die Projekt-Anlage anpassen.
- Vor Commit: `tsc --noEmit`, `eslint src`, `pnpm lint:design`.

---

## 8. Migration

Datei `supabase/migrations/20260605000002_preflight_projects.sql`:
1. `CREATE TABLE preflight_projects` (ohne `latest_run_id`-FK).
2. `ALTER TABLE preflight_runs ADD COLUMN project_id …` + FK + Index.
3. `ALTER TABLE preflight_projects ADD CONSTRAINT fk_latest_run …`.
4. RLS aktivieren + Policies (SELECT org, DELETE own).
5. Indizes.

Regel „Git zuerst, dann DB": Migrationsdatei committen, **dann** `supabase db push` (bzw. MCP `apply_migration` mit anschließender History-Angleichung).

---

## 9. Offene Mini-Entscheidungen (Defaults gesetzt, im Plan finalisierbar)

- „+ Neu" öffnet Intake als **Inline-Card** (kein Modal) — konsistent mit dem flachen Seiten-Layout (CLAUDE.md). Korrigierbar.
- Relativzeit-Formatierung: kleine lokale Util (kein neuer Dep), RSC-frei (Client-Komponente).
