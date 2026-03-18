# Tropen OS — CLAUDE.md
> Einzige Quelle der Wahrheit für Claude Code.

---

# ⚠️ System-Architekt

**Lies vor jedem Build zuerst: `ARCHITECT.md`**

Der System-Architekt ist der Bauleiter von Tropen OS.
Kein Feature ohne Architektur-Review.
Kein Build ohne abschließende CLAUDE.md-Aktualisierung.
Kein Build ohne Eintrag in `docs/architect-log.md`.

**Kurzregel:** Lesen → Review → Ampel → Bauen → Dokumentieren

---

# ⛔ STOP — Lies das als Erstes

## Pflicht-Protokoll vor jedem Build

**Keine Ausnahme. Kein optionaler Schritt.**

```
Schritt 1  cat docs/webapp-manifest/manifesto.md
Schritt 2  cat docs/webapp-manifest/engineering-standard.md
Schritt 3  cat docs/webapp-manifest/audit-system.md
Schritt 4  cat docs/phase2-plans.md
Schritt 5  cat ARCHITECT.md
Schritt 6  ls supabase/migrations/ | tail -5 → letzte Migrations lesen
Schritt 7  Architektur-Review durchführen (Template in ARCHITECT.md)
Schritt 8  Ampel bestimmen → dann bauen oder fragen
```

Bei UI-Änderungen zusätzlich:
```
Schritt 9  CLAUDE.md → Abschnitt "Komponenten-Patterns" lesen
Schritt 10 CLAUDE.md → Abschnitt "Code-Regeln" lesen
```

Bei AI-Features zusätzlich:
```
Schritt 11 cat docs/AI\ Act\ Risk\ Navigator\ Hochrisiko.pdf
Schritt 12 cat docs/tuev-ai-matrix-mapping-tropen.docx
```

---

---

## Wie dieses Dokument funktioniert

CLAUDE.md ist ein lebendes Dokument. Claude Code darf und soll es aktuell halten —
aber nur nach diesen Regeln.

### Sektions-Übersicht und Update-Regeln

| Sektion | Wann updaten | Wie updaten |
|---------|-------------|-------------|
| ⚠️ VOR JEDEM UI-BUILD | Wenn neue Design-Pflichten dazukommen | Zeile hinzufügen, nie Zeilen entfernen ohne explizite Anweisung von Timm |
| Tech Stack | Wenn Packages hinzukommen oder Versionen sich ändern | Tabellenzeile ergänzen oder Version anpassen |
| DB-Zugriff Constraint | Nur bei expliziter Anweisung von Timm | Kritische Sektion — nicht eigenständig ändern |
| AI-Modelle | Wenn neue Modelle eingesetzt werden | Tabellenzeile ergänzen oder Modellname aktualisieren |
| Farbpalette | Wenn CSS-Variablen in globals.css geändert werden | Werte synchron halten mit globals.css — nie eigenständig erfinden |
| Content-Breiten | Wenn neue Layout-Klassen in globals.css definiert werden | Tabellenzeile ergänzen |
| Komponenten-Patterns | Wenn neue globale Patterns in globals.css entstehen | Neuen Pattern-Block ergänzen mit Code-Beispiel + Bullet-Regeln |
| Code-Regeln | Wenn neue nicht-verhandelbare Regeln beschlossen werden | Bullet ergänzen — nie bestehende Regeln entfernen |
| Namenskonventionen | Wenn neue Dateitypen oder Konventionen entstehen | Tabellenzeile ergänzen |
| Migrations-Übersicht | Nach jeder neuen Migration automatisch | Zeile in "Letzte relevante Migrationen" ergänzen |
| Referenzdokumentation | Wenn neue docs/ Dateien angelegt werden | Tabellenzeile ergänzen |

### Was Claude Code niemals eigenständig tut

- Den ⚠️ UI-PFLICHTCHECK-Block kürzen oder Punkte entfernen
- Die DB-Zugriff-Constraint-Sektion ändern
- Bestehende Namenskonventionen oder Farbwerte überschreiben
- Die Farbpalette ohne Abgleich mit globals.css ändern
- Sektionen umbenennen, umsortieren oder zusammenführen
- Diesen Governance-Block selbst bearbeiten

### Format-Regeln für Updates

- **Neue Migration:** `| dateiname.sql | Kurzbeschreibung |`
- **Neues Package:** `| Paketname | Version | Einzeiler Verwendungszweck |`
- **Neues Komponenten-Pattern:** vollständiges Code-Beispiel + max. 3 Bullet-Regeln
- **Neue Farbe:** `| \`var(--name)\` | \`#hexwert\` | Verwendung |`
- Keine Fließtext-Blöcke — alles als Tabelle, Liste oder Code-Block
- Kein Entfernen von Inhalten ohne explizite Anweisung von Timm

### Offene Entscheidungen markieren

Wenn Claude beim Update eine Entscheidung von Timm braucht:
```
<!-- TODO(timm): [konkrete Frage] -->
```

---

## Qualitätsstandards — Webapp Manifest

Das Projekt verwendet ein eigenes Audit-System mit 25 Kategorien und gewichtetem Scoring.
Alle Dokumente liegen in `docs/webapp-manifest/`:

| Datei | Inhalt |
|-------|--------|
| `manifesto.md` | 10 Kernprinzipien (Philosophie) |
| `engineering-standard.md` | Konkrete Regeln pro Kategorie (25 Kategorien) |
| `audit-system.md` | Gewichtetes Scoring (0–5 pro Regel, Gewichte 1–3) |
| `audit-report-YYYY-MM-DD.md` | Jeweiliger Audit-Report |
| `templates/audit-report-template.docx` | Report-Vorlage |

**Scoring:** `score = Σ(rule_score × weight) / Σ(max_score × weight) × 100`

| Score | Status |
|-------|--------|
| 85–100% | 🟢 Production Grade |
| 70–84% | 🟡 Stable |
| 50–69% | 🟠 Risky |
| < 50% | 🔴 Prototype |

**Letzter Audit:** 2026-03-15 — Score und Status siehe aktuellen Report.

Bei neuen Features oder größeren Änderungen: relevante Audit-Kategorien berücksichtigen.

---

## ⚠️ VOR JEDEM UI-BUILD — PFLICHTCHECK

Bevor du eine neue Seite, Komponente oder ein UI-Feature baust, prüfe diese Liste.
Kein einziger Punkt ist optional.

```
[ ] content-max / content-narrow / content-wide / content-full gesetzt?
[ ] page-header mit page-header-title + page-header-actions vorhanden?
[ ] H1-Icon: 22px, color="var(--text-primary)", weight="fill", aria-hidden="true"?
[ ] Kein marginBottom/padding override auf page-header — CSS-Klasse regelt das?
[ ] Chips: nur Text, KEINE Icons in Chips?
[ ] Kein Sidebar-Layout — flaches Layout mit Card-Grid + Edit-Card darunter?
[ ] Nur className="card" für Cards — nie eigene box-styles?
[ ] Nur className="btn btn-*" für Buttons — nie eigene button-styles?
[ ] "Neu erstellen"-Aktionen immer in page-header-actions — nie in Sidebar/Content?
[ ] Nur Phosphor Icons (@phosphor-icons/react), weight="bold" oder weight="fill"?
[ ] Ausschließlich CSS-Variablen für Farben — keine Hex-Werte im Code?
[ ] Kein manuelles paddingTop/paddingBottom — content-Klassen enthalten das automatisch?
[ ] Kein background auf Page-Wrapper — Body-Gradient muss durchscheinen?
[ ] Semantisches HTML: <button> für Aktionen, <a href> für Navigation, nie <div onClick>?
[ ] Alle interaktiven Elemente per Tastatur erreichbar, Fokus-Indikator sichtbar?
[ ] Icons ohne sichtbaren Text haben aria-label oder aria-hidden="true"?
```

### Verbindliches Seiten-Layout (Stand 2026-03-16)

Jede App-Seite (außer Auth/Legal/Chat) folgt diesem Aufbau:

```tsx
<div className="content-max">
  {/* 1. Page Header — immer vorhanden */}
  <div className="page-header">
    <div className="page-header-text">
      <h1 className="page-header-title">
        <IconName size={22} color="var(--text-primary)" weight="fill" aria-hidden="true" />
        Seitentitel
      </h1>
      <p className="page-header-sub">Kurzer Untertitel</p>
    </div>
    <div className="page-header-actions">
      <button className="btn btn-primary">+ Neu</button>
    </div>
  </div>

  {/* 2. Filter-Bar — optional, wenn Suche/Filter vorhanden */}
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
    <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
      {/* Suchfeld mit MagnifyingGlass-Icon */}
    </div>
    <div style={{ display: 'flex', gap: 6 }}>
      <button className="chip chip--active">Alle</button>
      <button className="chip">Filter</button>
      {/* Chips: nur Text, KEINE Icons */}
    </div>
  </div>

  {/* 3. Content — Cards in Grid oder Liste */}
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
    <button className="card" style={{ padding: '16px 18px', textAlign: 'left' }}>
      Card-Inhalt
    </button>
  </div>

  {/* 4. Edit-Card — bei Auswahl, UNTER dem Grid */}
  {selected && (
    <div className="card" style={{ padding: 24, marginTop: 16 }}>
      Bearbeitungsformular
    </div>
  )}
</div>
```

**Regeln:**
- Kein Sidebar-Layout — immer flach (Header → Filter → Grid → Edit)
- Chips enthalten nur Text — keine Icons
- "Neu erstellen"-Button immer in `page-header-actions`
- Kein `style`-Override auf `.page-header` (kein marginBottom, padding, background)
- `.page-header-title` hat `display:flex; align-items:center; gap:10px` via CSS

---

## Tech Stack

| Technologie | Version | Hinweis |
|-------------|---------|---------|
| Next.js | ^16.1.6 | App Router, `'use client'` wo nötig |
| React | ^19 | |
| TypeScript | ^5 | strict mode, kein `any` ohne Begründung |
| Tailwind CSS | ^3.4 | nur global styles — Seiten nutzen `const s: Record<string, React.CSSProperties>` |
| Supabase | @supabase/ssr + supabase-js | Auth + DB + Storage |
| Sentry | @sentry/nextjs ^10 | Server + Client + Edge |
| Upstash Redis | @upstash/ratelimit | Rate Limiting in `src/proxy.ts` |
| pnpm | — | Package Manager |

### DB-Zugriff — kritische Constraint

Drizzle ORM funktioniert in dieser Umgebung **nicht** für Queries.

- **Schema-Definition:** Drizzle (für Typen + Migrations-Referenz)
- **Alle Queries:** `supabaseAdmin.from('table').select/insert/update/delete`
- `supabaseAdmin` konfiguriert in `src/lib/supabase-admin.ts`
- DB-Zugriff Client: `createClient()` aus `@/utils/supabase/client`
- DB-Zugriff Server/API: `supabaseAdmin` (Service Role, bypasses RLS) — **nie im Client**

### AI-Modelle

| Verwendung | Modell |
|------------|--------|
| Projekt-Chat, Workspace-Chat, Transformations-Engine | `claude-sonnet-4-20250514` |
| Context-Zusammenfassung, Feed Stage 2 | `claude-haiku-4-5-20251001` |
| Feed Stage 3 (Deep Analysis) | `claude-sonnet-4-20250514` |

Feed Stage 1: kein API-Aufruf — regelbasiert.
SDK: Anthropic SDK direkt (`ANTHROPIC_API_KEY`) — kein Dify für neue Features.

### Dify — abgelöst (✅ 2026-03-17)

Dify wurde vollständig entfernt. `jungle-order` nutzt jetzt Anthropic direkt (`claude-haiku-4-5-20251001`).
`DIFY_API_KEY` und `DIFY_API_URL` können aus den Supabase Edge Function Secrets entfernt werden.

<!-- TODO(timm): Dify komplett ablösen oder parallel weiterführen?
  Stand 2026-03-16: ai-chat Edge Function wurde auf direktes Anthropic/OpenAI-Routing umgestellt.
  Dify läuft noch, wird aber nicht mehr aktiv für Chat genutzt.
  Optionen:
  A) Dify vollständig abschalten (Instanz runterfahren, Env-Vars entfernen)
  B) Dify als Fallback behalten für Jungle Order / komplexe Workflows
  C) Dify komplett ersetzen (Workflows selbst bauen)
  Entscheid ausstehend — bis dahin: Dify nicht aktiv einbinden, bestehende Instanz läuft weiter.
-->

---

## Design System

### Farbpalette (helles Theme — Stand März 2026)

| Variable | Wert | Verwendung |
|----------|------|------------|
| `var(--bg-base)` | `#EAE9E5` | Seitenhintergrund |
| `var(--bg-surface)` | `rgba(255,255,255,0.80)` | Cards, Panels |
| `var(--bg-nav)` | `rgba(255,255,255,0.72)` | Navigation |
| `var(--text-primary)` | `#1A1714` | Haupttext, H1-Icons |
| `var(--text-secondary)` | `#4A4540` | Sekundärtext |
| `var(--text-tertiary)` | `#6B6560` | Hilfstext, Labels |
| `var(--accent)` | `#2D7A50` | CTAs, Status, aktive Zustände |
| `var(--accent-light)` | `#D4EDDE` | Chip active, Highlights |
| `var(--active-bg)` | `#1A2E23` | Aktive Pill, Selected State |
| `var(--border)` | `rgba(26,23,20,0.08)` | Standard-Border |

**Das alte Dunkelgrün-Theme (`#0d1f16`, `#134e3a`, `#a3b554`) ist abgelöst — nie verwenden.**

### Content-Breiten (verbindlich — genau eine pro Seite)

| Klasse | Max-Width | Verwendet für |
|--------|-----------|---------------|
| `.content-max` | 1200px | Standard-Seiten (Dashboard, Settings, Knowledge, Projects, Feeds) |
| `.content-narrow` | 720px | Formular-Seiten (Login, Onboarding, Forgot-Password) |
| `.content-wide` | 1400px | Superadmin-Seiten |
| `.content-full` | 100% | Chat-Interface, Full-Bleed-Layouts |

Vertikales Padding (32px oben / 48px unten) ist **automatisch** in content-Klassen enthalten.
**Kein manuelles `paddingTop`/`paddingBottom`** auf dem content-Wrapper.

### Komponenten-Patterns

#### Cards
```tsx
<div className="card">
  <div className="card-header">
    <span className="card-header-label">Titel</span>
    <button className="btn btn-ghost btn-sm">Aktion</button>
  </div>
  <div className="card-body">
    <span className="card-section-label">Abschnitt</span>
    {/* list-rows */}
    <div className="card-divider" />
  </div>
</div>
```
Immer `className="card"` — nie eigene box-styles erfinden.

#### Buttons
```tsx
<button className="btn btn-primary">+ Neu</button>
<button className="btn btn-ghost">Einstellungen</button>
<button className="btn btn-danger">Löschen</button>
<button className="btn btn-sm btn-ghost">Klein</button>
<button className="btn-icon"><Icon /></button>
```

#### Page-Header (jede Seite — Pflicht)
```tsx
<div className="page-header">
  <div className="page-header-text">
    <h1 className="page-header-title">
      <IconName size={22} color="var(--text-primary)" weight="fill" />
      Seitentitel
    </h1>
    <p className="page-header-sub">Untertitel</p>
  </div>
  <div className="page-header-actions">
    <button className="btn btn-ghost">Einstellungen</button>
    <button className="btn btn-primary">+ Neu</button>
  </div>
</div>
```
- H1-Icons: `color="var(--text-primary)"` — **nie `var(--accent)` (grün) in Überschriften**
- `.page-header` hat automatisch `margin-bottom: 32px` — kein manuelles `marginBottom`

#### List-Rows
```tsx
<button className="list-row list-row--active">Aktiv <span className="badge">3</span></button>
<button className="list-row">Inaktiv</button>
<button className="list-row list-row--add"><PlusIcon /> Hinzufügen</button>
```

#### Chips / Filter-Pills
```tsx
<div className="chip chip--active">Alle</div>
<div className="chip">Kategorie</div>
```

#### Icons
- **Ausschließlich Phosphor Icons** (`@phosphor-icons/react`)
- `weight="bold"` oder `weight="fill"` — nie andere weights
- Größen: NavBar 18px · H1 22px · Cards/Listen 16px · Inline 14px
- **Grün (`var(--accent)`) nur für Status, CTAs, aktive Zustände — nie in H1**

#### Drawer-System
- Backdrop: `rgba(0,0,0,0.4)`, Klick schließt
- Escape schließt immer
- Animation: `200ms ease-out`
- Kein Inline-Style in Drawer-Komponenten — CSS-Klassen aus `globals.css`

#### Body-Gradient
`background-attachment: fixed` auf `body` — Page-Wrapper dürfen **kein `background`** setzen, damit der Radial-Gradient durchscheint.

---

## Code-Regeln

### Nicht-verhandelbar (gilt bei jeder Aktion)

- TypeScript strict mode — kein `any` ohne Kommentar mit Begründung
- Keine Business-Logik in UI-Komponenten oder `page.tsx`
- Alle externen APIs hinter Abstraktionslayer (`/services`)
- Kein direkter DB-Zugriff aus dem Frontend
- Keine Secrets im Code oder in der Git-History
- Structured Logging only — kein `console.log` in Produktion
- Kein PII in Logs
- Dateien > 300 Zeilen sind eine Warnung, > 500 Zeilen eine Verletzung
- Jedes neue Feature braucht Tests

### Namenskonventionen (Next.js Standard)

| Was | Convention | Beispiel |
|-----|-----------|---------|
| React-Komponenten | PascalCase | `UserProfile.tsx` |
| Seiten / App-Routes | kebab-case Ordner | `user-profile/page.tsx` |
| Custom Hooks | camelCase + `use` | `useUserProfile.ts` |
| Utilities / Helpers | camelCase | `formatDate.ts` |
| Konstanten-Werte | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Ordner | kebab-case | `user-management/` |
| Test-Dateien | gleich wie Quelldatei | `UserProfile.test.tsx` |
| Type-Dateien | PascalCase + `.types` | `UserProfile.types.ts` |
| Server Actions | camelCase | `createUser.ts` |
| Stores | camelCase + `Store` | `userStore.ts` |

### Projektstruktur

```
/src
  /app                  # Nur Routing — kein Business-Code
  /components
    /ui                 # Primitive Komponenten
    /layout             # Strukturelle Komponenten
    /[feature]          # Feature-spezifische Komponenten
  /features             # Self-contained Feature-Module
  /hooks                # Shared Custom Hooks
  /lib                  # Utilities, Helpers
  /services             # Business-Logik, externe Abstraktionen
  /types                # Globale TypeScript-Typen
  /config               # Konfiguration, Konstanten
/docs
  /product              # Produktdokumentation (RAG, Onboarding, etc.)
  /adr                  # Architecture Decision Records
  /webapp-manifest      # Engineering Standards & Audit System
```

### Dateihygiene

Claude Code darf eigenständig (meldet kurz, fragt nicht):
- Unused imports entfernen
- Auskommentierten Code löschen
- Leere Dateien / Ordner löschen
- Duplizierte Utility-Funktionen konsolidieren
- Dateien umbenennen die gegen Konventionen verstoßen

Nicht ohne explizite Anweisung:
- Dateien löschen die noch aktive Imports haben
- Umstrukturierung ganzer Feature-Ordner
- Umbenennung von öffentlichen API-Routen

---

## Engineering Standards

### Claude.ai Feature-Parität

Neue Claude.ai-Features werden regelmäßig geprüft und eingeordnet.
Vollständige Governance-Regel: `docs/phase2-plans.md` →
Abschnitt "Governance-Regel: Feature-Parität mit Claude.ai"

Kurzregel für Claude Code:
- Modell-Features: kommen automatisch via API
- UI-Features: wir bauen KMU-optimierte Äquivalente
- Anthropic-interne Features: eigene Lösung bereits vorhanden

---

## Autonomie-Level: Hoch

Wir arbeiten lokal. Kein Produktionssystem gefährdet.

**Claude darf ohne Rückfrage:** Dateien erstellen/bearbeiten/löschen · Dependencies installieren · Git commits ausführen · Datenbankmigrationen erstellen · Konfigurationsdateien ändern · Refactoring · Bugs fixen

**Claude fragt NUR bei:**
- Destruktiven Aktionen die nicht rückgängig zu machen sind (z.B. Datenbank leeren)
- Grundlegenden Architekturentscheidungen die das Gesamtsystem betreffen
- Wenn zwei Lösungswege gleichwertig sind und Timms Präferenz wichtig ist

---

## Datenbank-Migrations-Workflow

Supabase CLI ist global installiert, Projekt verlinkt (Ref: `vlwivsjfmcejhiqluaav`).

```bash
# Neue Migration anlegen und pushen
supabase/migrations/0XX_name.sql schreiben
cd "/c/Users/timmr/tropen OS" && supabase db push

# Migration bereits manuell angewendet?
supabase migration repair --status applied <nummer> → dann db push
```

**Fallstricke:**
- `.env.local` muss Unix-Zeilenenden (LF) haben — CRLF bricht den Parser
- Migration-Nummern: einfache Zahlen (001, 002...), kein Timestamp-Format

### Migrations-Übersicht (001–033+)
→ Vollständige Liste: `docs/product/migrations.md`

Letzte relevante Migrationen:
| Datei | Inhalt |
|-------|--------|
| 030_projects_schema.sql | projects, project_memory (APPEND ONLY) |
| 031_workspaces_schema.sql | workspaces, cards, card_history (APPEND ONLY) |
| 032_support_tables.sql | dept_settings, transformations, templates |
| 033_feed_tables.sql | feed_sources, feed_items, feed_processing_log (APPEND ONLY) |
| 20260314000036_feeds_v2.sql | Feeds v2-Schema mit keywords, min_score, content_hash UNIQUE |
| 20260317000039_capability_outcome_system.sql | capabilities, outcomes, capability_outcomes, org/user settings, guided_workflows Schema |
| 20260317000040_cards_capability.sql | cards Extension: capability_id, outcome_id, sources, last_run_at, next_run_at |
| 20260317000041_guided_workflows_seed.sql | Guided Workflows: 7 System-Workflows + Marketing-Paket geseedet; capability_org_settings um guided_workflows_enabled + allowed_workflow_ids erweitert |
| 20260317000042_feed_dismissed.sql | feed_items: dismissed_at + dismissed_by Spalten für Soft-Hide |
| 20260317000043_feed_topics.sql | feed_topics + feed_topic_sources Tabellen mit RLS |
| 20260317000044_feed_data_sources.sql | feed_data_sources + feed_data_records Tabellen (Daten-Tab) mit RLS |
| 20260318000046_feed_runs.sql | feed_sources: status/paused_at/paused_by/pause_reason; feed_runs (APPEND ONLY); feed_notifications; feed_distributions.target_type += 'notification' |
| 20260318000047_skills.sql | skills + agent_skills Tabellen mit RLS; 6 System-Skills geseedet (Tiefenanalyse, Zusammenfassung, Marktbeobachtung, Wissensextraktion, Berichterstellung, Social-Media) |
| 20260318000048_agents_v2.sql | agents ALTER: scope (visibility migriert), neue Spalten (trigger_type, trigger_config, capability_steps, etc.); agent_runs (APPEND ONLY); 5 Marketing-Paket-Agenten als scope='package' geseedet |
| 20260318000049_conversations_workspace.sql | conversations: workspace_id, card_id, conversation_type Spalten; Index idx_conversations_workspace + idx_conversations_card |

**APPEND ONLY Tabellen** (niemals UPDATE oder DELETE): `card_history`, `project_memory`, `feed_processing_log`, `feed_data_records`, `feed_runs`, `agent_runs`

### Guided Workflows (Stand 2026-03-17)

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

### UI — Projekte + Workspaces (Plan F — Stand 2026-03-18)

| Datei | Inhalt |
|-------|--------|
| `src/app/projects/page.tsx` | Memory-Count-Badge auf Projektkarten + Gedächtnis-Tab (zeigt project_memory Einträge) |
| `src/app/workspaces/page.tsx` | Server Component — lädt Workspaces via workspace_participants, rendert WorkspacesList |
| `src/components/workspaces/WorkspacesList.tsx` | Client Component — Workspace-Grid mit Status, Karten-Zähler, Create-Dialog |
| `src/app/workspaces/[id]/page.tsx` | Server Component — Auth + Workspace/Cards laden, rendert CanvasClient |
| `src/app/workspaces/[id]/layout.tsx` | Full-screen fixed container (position:fixed, inset:0) für Canvas-Ansicht |
| `src/app/workspaces/[id]/CanvasClient.tsx` | Client: Header, Tabs (Canvas/Silo-Chat/Einstellungen), Karten-Grid, CreateCardModal |
| `src/components/workspaces/CardTile.tsx` | Karten-Kachel: Role-Badge, Status, Stale-Warning, Sources-Zähler |

**Canvas-Regeln:**
- Workspaces-Liste nutzt `workspace_participants` für User-Scoping (kein direkter department_filter)
- project_memory count kommt vom List-Endpoint (kein Extra-Request per Karte)
- Memory-Tab lädt lazy beim ersten Klick, nicht beim Seitenaufruf
- Canvas `/workspaces/[id]` = Grid-Canvas (sort_order); Freeform-Canvas bei `/ws/[id]/canvas` bleibt unberührt
- Karten-API: `POST /api/workspaces/[id]/cards` (createCardSchema: title + role required)
- Workspace-API: `PATCH /api/workspaces/[id]` (updateWorkspacePlanCSchema)
- Migration `20260318000049_conversations_workspace.sql`: conversations um workspace_id, card_id, conversation_type erweitert

### Transformations-Engine (Plan E — Stand 2026-03-17)

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

### Chat & Context Integration (Plan D — Stand 2026-03-17)

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

### Skills-System (Plan J2a — Stand 2026-03-18)

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

### Agenten-System (Plan J2b+J2c — Stand 2026-03-18)

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

## Vor jedem Commit

```bash
tsc --noEmit          # muss grün sein
pnpm audit            # keine kritischen CVEs
eslint src/           # keine Fehler
```

---

## Vollständige Referenzdokumentation

| Dokument | Inhalt |
|----------|--------|
| `docs/webapp-manifest/engineering-standard.md` | 25 Kategorien, Regeln, Warnsignale |
| `docs/webapp-manifest/audit-system.md` | Scoring, Gewichtung, Auto-Checks |
| `docs/product/architecture.md` | Phase-2-Architektur, DB-Hierarchie, Kontroll-Spektrum |
| `docs/product/roadmap.md` | Produkt-Roadmap, offene Pläne |
| `docs/product/migrations.md` | Vollständige Migrations-Übersicht 001–aktuell |
| `docs/product/rag-architecture.md` | RAG, pgvector, Wissensbasis-Schema |
| `docs/product/onboarding.md` | Onboarding-Schritte, AI Act, Email-Templates |
| `docs/product/superadmin.md` | Superadmin-Tool, Client-Anlage-Ablauf |
| `docs/product/jungle-order.md` | Jungle Order Edge Function, Soft Delete, Multi-Select |
| `docs/plans/agents-spec.md` | Agenten-System: Definition, Typen, DB-Schema, Agent-Engine, Plan J2 Scope |

---

## Audit durchführen

```
Read docs/webapp-manifest/audit-system.md and
docs/webapp-manifest/engineering-standard.md.

Run all automatable checks, analyze the codebase for
non-automatable rules, score all 25 categories (0–5),
calculate the weighted total, and output a completed
audit report using the template at
docs/webapp-manifest/templates/audit-report-template.md
```
