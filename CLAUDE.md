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
Schritt UI-1  Read src/components/_DESIGN_REFERENCE.tsx  ← PFLICHT, keine Ausnahme
Schritt UI-2  CLAUDE.md → Abschnitt "Komponenten-Patterns" lesen
Schritt UI-3  CLAUDE.md → Abschnitt "Code-Regeln" lesen
```

Bei AI-Features zusätzlich:
```
Schritt AI-1  cat docs/AI\ Act\ Risk\ Navigator\ Hochrisiko.pdf
Schritt AI-2  cat docs/tuev-ai-matrix-mapping-tropen.docx
```

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
[ ] Keine Emoji als Icons, keine anderen Icon-Libraries (HeroIcons, Lucide etc.)?
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
| pptxgenjs | ^3 | PowerPoint-Export für Präsentations-Artifacts (`/api/artifacts/export-pptx`) |
| openai | latest | TTS via `openai.audio.speech.create` in `/api/tts` |

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
| Projekt-Einstieg, Chips, Prompt-Builder (Plan L) | `claude-haiku-4-5-20251001` |
| Feed Stage 3 (Deep Analysis) | `claude-sonnet-4-20250514` |

Feed Stage 1: kein API-Aufruf — regelbasiert.
SDK: **AI SDK** (`ai` + `@ai-sdk/anthropic`) — Provider-Instanz via `@/lib/llm/anthropic`. Nie `@anthropic-ai/sdk` direkt importieren.
Alle Modell-Calls gehen über `src/lib/llm/anthropic.ts` → `generateText()` oder `streamText()`.
AI SDK v6 Felder: `maxOutputTokens` (nicht `maxTokens`), `usage.inputTokens` / `usage.outputTokens`.

### API-Key Management

**Aktuell:** Anthropic API-Key gehört Tropen Research UG (nicht mehr persönlicher Account).

**Env-Variablen:**
- `ANTHROPIC_API_KEY` → Vercel Environment Variables
- `ANTHROPIC_API_KEY` → Supabase Edge Function Secrets

**Budget-System:**
- `check_and_reserve_budget(org_id, p_workspace_id, estimated_cost)` RPC (Migration 005 + 012)
- Kosten-Schätzungen: `src/lib/budget.ts` — `ESTIMATED_COSTS`
- Enforcement: alle LLM-Call-Routes + Edge Function + Perspectives ✅
- Fail-open: RPC-Fehler → Aufruf erlaubt (kein Ausfall wegen Budget-Check)
- Budget erschöpft → HTTP 402, `code: 'BUDGET_EXHAUSTED'`

**Enforcement-Status (Stand 2026-03-25):**
| Route | Status |
|-------|--------|
| `supabase/functions/ai-chat` (Haupt-Chat) | ✅ |
| `/api/perspectives/query` | ✅ |
| `/api/chat/stream` (Canvas/Card-Chat) | ✅ |
| `/api/images/generate` | ✅ |
| `/api/tts` | ✅ |

**Cloud-Budget-Alerts:**
- Anthropic Console: Alert bei $100/Monat einrichten (TODO: manuell konfigurieren)
- `organizations.budget_limit` (NUMERIC) — NULL = kein Limit
- `departments.budget_limit` — NULL = kein Dept-Limit

**Preiskalkulation (grob):**
- claude-sonnet: ~$3 / 1M Input-Tokens → ~$0.004 pro Nachricht
- claude-haiku: ~$0.25 / 1M Input-Tokens → ~$0.0004 pro Nachricht
- DALL-E 3: ~$0.04 pro Bild
- OpenAI TTS: ~$0.008 pro Anfrage
- Typischer User: ~500K Tokens/Monat ≈ €1.50
- Zielpreis: 29–49€/User/Monat → ~95% Marge

### Chart-Bibliotheken (ADR-005)

| Kontext | Bibliothek | Warum |
|---------|-----------|-------|
| App-UI Charts (Dashboard, KPIs, Analytics) | `@tremor/react` v4 | React 19 nativ, Tailwind, kein Design-Aufwand |
| Artifact-Charts (Toro generiert on-demand) | `echarts` via CDN im iFrame | JSON-Konfiguration für Toro, 50+ Chart-Typen, kein pnpm-Package in App |
| Präsentations-Artifacts | Reveal.js via CDN im iFrame | Toro generiert HTML/Slides, kein pnpm-Package in App |

**Regel:** Chart fester UI-Bestandteil → Tremor. Chart von Toro generiert → ECharts (CDN). Präsentation von Toro → Reveal.js (CDN). Recharts direkt → nicht mehr neu verwenden.
Installiert: `@tremor/react@4.0.0-beta-tremor-v4.4` (React 19 nativ), `echarts@^6` (für mögliche direkte Nutzung).

### Dify — abgelöst (✅ 2026-03-17)

Dify wurde vollständig entfernt. `jungle-order` nutzt jetzt Anthropic direkt (`claude-haiku-4-5-20251001`).
`DIFY_API_KEY` und `DIFY_API_URL` können aus den Supabase Edge Function Secrets entfernt werden.

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
- ❌ **Emoji als Icons verboten** — kein `📁`, `✅`, `🔔` o.ä. als funktionale UI-Icons
- ❌ **Andere Icon-Libraries verboten** — kein Tailwind HeroIcons, Lucide, React Icons, Radix Icons
- ❌ **Unicode-Zeichen als Icons verboten** — kein `→`, `×`, `✓` als interaktive Elemente

#### Drawer-System / Modal-Backdrop
- Backdrop-Standard: `className="modal-backdrop"` (reines Backdrop-Div) oder `className="modal-overlay"` (Backdrop + flex-center)
- Farbe: `rgba(26,23,20,0.45)` + `backdrop-filter: blur(2px)` — **niemals `rgba(0,0,0,...)`**
- zIndex als inline `style={{ zIndex: N }}` ergänzen wenn CSS-Default nicht passt
- Escape schließt immer
- Animation: `200ms ease-out`
- Kein Inline-Style in Drawer-Komponenten — CSS-Klassen aus `globals.css`

#### Aktions-Icons — verbindliche Zuordnung

**Nie eigene Icons erfinden — immer aus dieser Tabelle:**

| Aktion | Icon (Phosphor) | Position | Sichtbar |
|--------|----------------|----------|----------|
| Öffnen / Detail | `ArrowSquareOut` | Karte hover | hover |
| Bearbeiten | `PencilSimple` | [···] Menü | immer |
| Archivieren | `Archive` | [···] Menü | immer |
| Duplizieren | `Copy` | [···] Menü | immer |
| Löschen | `Trash` | [···] Menü — immer ROT | immer |
| Download | `DownloadSimple` | Karte hover | hover |
| In Chat öffnen | `ChatCircle` | Karte hover | hover |
| Neu erstellen | `Plus` | page-header-actions | immer |
| Suchen | `MagnifyingGlass` | Filter-Bar links | immer |
| Schließen (Modal) | `X` | oben rechts | immer |
| Speichern | `FloppyDisk` | Button mit Label | immer |
| Teilen | `ShareNetwork` | [···] Menü | immer |
| Umbenennen | `PencilSimple` | [···] Menü | immer |

**Karten-Aktionen — Standard-Pattern:**
```
Ruhezustand:  [Titel + Meta]
Bei Hover:    [Titel + Meta] [↓] [···]
Klick [···]:  Umbenennen / Bearbeiten
              Archivieren
              Duplizieren
              ──────────────
              Löschen        ← immer rot, immer unten
```

**Regeln:**
- `Trash` / Löschen IMMER im [···] Menü — **nie direkt auf der Karte**
- Archivieren ist KEINE destruktive Aktion — trotzdem im Menü
- [···] = `DotsThree` Icon, `weight="bold"`
- Hover-Aktionen: `opacity: 0` → `opacity: 1` über CSS `.card:hover .card-actions { opacity: 1 }`
- Löschen: immer `className="dropdown-item dropdown-item--danger"`
- Download/Öffnen dürfen direkt auf Karte sichtbar sein (hover, nicht destruktiv)

#### Body-Gradient
`background-attachment: fixed` auf `body` — Page-Wrapper dürfen **kein `background`** setzen, damit der Radial-Gradient durchscheint.

---

## Code-Regeln

### Nicht-verhandelbar (gilt bei jeder Aktion)

- TypeScript strict mode — kein `any` ohne Kommentar mit Begründung
- Keine Business-Logik in UI-Komponenten oder `page.tsx`
- Alle externen APIs hinter Abstraktionslayer (`/src/lib` + `/src/actions`)
- Kein direkter DB-Zugriff aus dem Frontend
- Keine Secrets im Code oder in der Git-History
- Structured Logging only — kein `console.log` in Produktion
- Kein PII in Logs
- Dateien > 300 Zeilen sind eine Warnung, > 500 Zeilen eine Verletzung
- Jedes neue Feature braucht Tests
- Neue Env-Variablen immer in `.env.example` dokumentieren — Secrets nie in `.env.local` committen

### Error-Handling

- Standardisierte Error-Typen aus `src/lib/errors.ts`
- API-Routes: try/catch + strukturierte JSON-Response `{ error: string, code?: string }`
- Nie generische Error-Messages an den Client — immer spezifische, hilfreiche Meldungen
- Zod-Validation via `validateBody()` in jeder API-Route — vor jeder Business-Logik
- Auth-Check via `getAuthUser()` als erste Zeile in jeder API-Route

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
  /actions              # Server Actions (cards, workspaces, feeds, chat, connections)
  /app                  # Nur Routing — kein Business-Code
  /components
    /ui                 # Primitive Komponenten
    /layout             # Strukturelle Komponenten (AppShell, Sidebar, TopBar, BottomNav)
    /workspace          # Workspace-Feature-Komponenten (Canvas, ChatPanel, DetailPanel)
    /workspaces         # Workspace-Liste-Komponenten (CardTile, WorkspacesList)
    /ws                 # Canvas-Ansicht-Komponenten
  /db                   # Drizzle Schema (nur Typen + Migrations-Referenz, keine Queries)
  /hooks                # Shared Custom Hooks (useWorkspaceState, useRightSidebar, useFocusTrap)
  /lib                  # Business-Logik, LLM-Layer, Resolver, Validators
    /llm                # Anthropic, OpenAI, Router, Model-Selector
    /feeds              # Feed-Ingestion, Distribution, Cost-Estimation
    /validators         # Zod-Schemas für API-Routes
  /types                # Globale TypeScript-Typen
  /utils                # Supabase Client-Utilities
/docs
  /product              # Produktdokumentation (RAG, Onboarding, etc.)
  /adr                  # Architecture Decision Records
  /plans                # Feature-Specs (agents-spec.md, etc.)
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

# Edge Function deployen (nach Änderungen an supabase/functions/ai-chat/index.ts)
supabase functions deploy ai-chat
```

**WICHTIG: Edge Function muss nach jeder Änderung an `supabase/functions/ai-chat/index.ts` manuell deployed werden!**
Letzter Deploy: 2026-03-25 (toro_address + language_style ins System-Prompt; Migration 071)

**Fallstricke:**
- `.env.local` muss Unix-Zeilenenden (LF) haben — CRLF bricht den Parser
- Migration-Nummern: Legacy-Migrationen 001–033 nutzen einfache Nummern (`030_name.sql`). Ab Migration 034+ gilt Timestamp-Format (`YYYYMMDDHHMMSS_name.sql`) — Supabase CLI Standard.

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
| 20260319000050_shared_chats.sql | conversations: share_token, shared_at, share_scope, shared_from_id + Indexes |
| 20260319000052_library_extend_existing.sql | ALTER capabilities/outcomes/skills: name, scope, icon, source_id etc. |
| 20260319000053_library_new_tables.sql | CREATE roles/library_versions/org_library_settings/user_library_settings |
| 20260319000054_library_new_tables_fix.sql | Fix: roles_insert policy, idx_roles_name_active, idx_lib_versions_org |
| 20260319000055_library_cards.sql | cards: role_id UUID + skill_id UUID |
| 20260319000056_library_seed.sql | 7 system+package roles geseedet; package_agents → roles migriert |
| 20260319000059_memory_extraction_log.sql | memory_extraction_log (APPEND ONLY): KI-Gedächtnis-Extraktion aus Konversationen |
| 20260320000060_project_memory_feeds.sql | project_memory: organization_id, memory_type, source_url, metadata; DROP NOT NULL on type |
| 20260320000061_chat_prompt_builder.sql | conversations: 'prompt_builder' added to conversation_type CHECK |
| 20260320000062_intention_system.sql | conversations: intention, current_project_id, drift_detected, focus_since_message; focus_log (APPEND ONLY) |
| 20260320000063_artifacts_react_type.sql | artifacts: type CHECK erweitert um 'react', 'data', 'image', 'other' |
| 20260320000064_workspace_cards_extend.sql | workspaces: project_id UUID FK; cards: source ('manual'/'chat_artifact'), source_conversation_id UUID FK |
| 20260322000065_perspectives.sql | perspective_avatars (scope/org/user/system, is_tabula_rasa, RLS), perspective_user_settings (pin/sort), 5 System-Avatare geseedet |
| 20260324000066_user_prefs_link_previews.sql | user_preferences: link_previews BOOLEAN DEFAULT true |
| 20260324000067_user_prefs_web_search.sql | user_preferences: web_search_enabled BOOLEAN DEFAULT false |
| 20260325000070_user_prefs_emoji_style.sql | user_preferences: emoji_style VARCHAR DEFAULT 'minimal', suggestions_enabled BOOLEAN DEFAULT true |
| 20260325000071_user_prefs_toro_address.sql | user_preferences: toro_address VARCHAR DEFAULT '', language_style TEXT DEFAULT '' |
| 20260325000072_intention_guided.sql | conversations.intention: 'open' → NULL (migrated), CHECK updated to ('focused', 'guided') |
| 20260325000073_projects_extend.sql | projects: emoji+context columns, goal+instructions→context migration; project_memory: deleted_at soft-delete + updated RLS; project_documents table + RLS; project-docs storage bucket; projects_with_stats view |
| 20260325000074_projects_archive_merge.sql | projects: archived_at column; projects_with_stats view refreshed |
| 20260325000075_workspaces_items.sql | workspaces: description+emoji+item_count columns, department_id nullable; workspace_items table + RLS + item_count trigger |
| 20260325000076_workspace_members_share.sql | workspaces: share_token+share_role+share_active columns; workspace_members table + RLS |
| 20260325000077_workspace_comments.sql | workspaces: comment_count column; workspace_comments table + RLS + comment_count trigger |
| 20260325000078_workspace_comments_item.sql | workspace_comments: item_id UUID FK nullable (per-item comment threads) |
| 20260325000079_workspaces_archive.sql | workspaces: archived_at TIMESTAMPTZ nullable + index (reversible soft-archive) |
| 20260325000080_workspace_items_agent.sql | workspace_items: item_type constraint updated — adds 'agent', keeps 'note' for backwards-compat |
| 20260325000081_org_assistant_image.sql | organization_settings: ai_assistant_image_url TEXT DEFAULT NULL |
| 20260325000082_dashboard_widgets.sql | dashboard_widgets (user_id, org_id, widget_type, position, size, config, is_visible) + RLS; user_preferences: dashboard_setup_done BOOLEAN |
| 20260325000083_rename_to_cockpit.sql | dashboard_widgets → cockpit_widgets; dashboard_setup_done → cockpit_setup_done; RLS policy recreated as cockpit_widgets_own |

**Cockpit Widget System (Stand 2026-03-25):**
Route `/cockpit` (war `/dashboard`), Sidebar-Icon: Speedometer.
Widgets: 8 Typen, alle mit echten Daten. API-Routes unter `/api/cockpit/*`.
- `feed-highlights` → top 5 Feed-Artikel (letzte 24h, Score DESC)
- `recommendation` → regelbasiert (kein LLM): Feeds → Inaktivität → Budget
- `recent-activity` → letzte Chats + Artefakte des Users (max 6)
- `projects` → aktive Projekte mit Chat-Count (max 4)
- `artifact-stats` → Anzahl diese Woche + gesamt + letzte 3
- `team-activity` → Admin-only: Chats + Artefakte der Org (letzte 2 Tage)
- `budget` → Admin-only: Budget-% + Fortschrittsbalken + Euro-Werte
- `quick_actions` → statisch: 6 Links (kein API-Call)
Komponenten: `src/components/cockpit/widgets/` (8 Widget-Komponenten + shared.tsx)
CSS-Klassen: `widget-content`, `widget-feed-*`, `widget-toro-*`, `widget-list-*`, `widget-budget-*`, `widget-quick-*`, `widget-skeleton-*`

**Cockpit Widget-Roadmap (docs/plans/widget-katalog.md):**
| Stufe | Wann | Widgets |
|-------|------|---------|
| 1 — intern | ✅ jetzt | W-01…W-08 (alle gebaut) |
| 2 — MCP | Q3 2026 | W-09 E-Mail, W-11 Kalender, W-14 Slack, W-15 HubSpot, W-16 Analytics, W-17 Drive |
| 3 — Agent | Q4 2026 | W-10 E-Mail-Prio ⭐, W-12 Meeting-Prep ⭐, W-13 Meeting-Scribe ⭐, W-18/W-19 Custom |
Prioritäts-Agenten: E-Mail-Agent (Haiku, tägl. 07:00) → Kalender-Agent (Haiku, tägl. + 30min vor Meeting) → Meeting-Scribe (Whisper + Sonnet, on-demand)
Pakete: Kommunikation / Vertrieb / Marketing / Custom
widgetCatalog.ts braucht bei Stufe 2+: Felder `tier` (1/2/3) + `package` + `requiresMcp`

**APPEND ONLY Tabellen** (niemals UPDATE oder DELETE): `card_history`, `project_memory`, `feed_processing_log`, `feed_data_records`, `feed_runs`, `agent_runs`, `memory_extraction_log`

### Feeds — Distributions + Run-History (Plan J1 — Stand 2026-03-20)

| Datei | Inhalt |
|-------|--------|
| `src/app/api/feeds/[id]/distributions/route.ts` | GET list + POST create |
| `src/app/api/feeds/[id]/distributions/[distId]/route.ts` | DELETE |
| `src/lib/feeds/distributor.ts` | project target_type implementiert → project_memory |
| `src/app/feeds/_components/RunHistoryPanel.tsx` | Run-Details mit Kosten + Fehler |
| `src/app/feeds/_components/DistributionsPanel.tsx` | Outputs konfigurieren (project/workspace/notification) |
| `src/app/feeds/_components/NotificationBadge.tsx` | Ungelesene Notifications mit Badge + Dropdown |

**Distributions-Regeln:**
- Nur owner/admin darf Distributions anlegen/löschen
- target_type 'notification': target_id ist Dummy-UUID (alle Org-Member werden notifiziert)
- target_type 'project': Items landen in project_memory (memory_type='feed_item')
- target_type 'workspace': Items landen in knowledge_entries (entry_type='feed')
- min_score (1–10) filtert: Items unter dem Score werden nicht weitergeleitet

### Feature-Dokumentation

Detaillierte Dokumentation aller implementierten Features ist ausgelagert in:
→ **`docs/product/feature-registry.md`**

Enthält: Guided Workflows, Projekte + Workspaces (Plan F), AccountSwitcher, Transformations-Engine (Plan E), Chat & Context (Plan D), Skills-System (Plan J2a), Agenten-System (Plan J2b+J2c), Library-System (Capability + Outcome + Role + Skill), Feeds-Distributions (Plan J1), Perspectives (Plan L).

### Perspectives — Parallele KI-Perspektiven (Stand 2026-03-23)

| Datei | Inhalt |
|-------|--------|
| `supabase/migrations/20260322000065_perspectives.sql` | perspective_avatars + perspective_user_settings, RLS, 5 System-Seeds |
| `src/app/api/perspectives/avatars/route.ts` | GET (mit pin-settings) + POST (user/org-scope) |
| `src/app/api/perspectives/avatars/[id]/route.ts` | PATCH + DELETE (soft) — nur eigene user-scoped Avatare |
| `src/app/api/perspectives/avatars/[id]/copy/route.ts` | POST — kopiert als scope='user' |
| `src/app/api/perspectives/settings/route.ts` | GET + PATCH — pin/sort pro User |
| `src/app/api/perspectives/query/route.ts` | POST — paralleles SSE-Streaming (Promise.all), Tabula-Rasa-Guard |
| `src/app/api/perspectives/post-to-chat/route.ts` | POST — Perspectives-Antwort als assistant-Nachricht einfügen |
| `src/components/workspace/PerspectivesStrip.tsx` | Strip über ChatInput: Avatar-Pills, Info-Popover, Befragen-Button |
| `src/components/workspace/PerspectivesBottomSheet.tsx` | Bottom-Sheet: SSE-Stream, Kopieren, In-Chat-Posten, 60vh/92vh |
| `src/app/perspectives/page.tsx` | Verwaltungsseite: Tabs System/Org/Meine, Avatar-Grid, CRUD |
| `src/app/perspectives/_components/AvatarFormDrawer.tsx` | Drawer für eigene Avatare erstellen/bearbeiten |

**Perspectives-Regeln:**
- `is_tabula_rasa=true` → Avatar bekommt **nur den letzten User-Turn** (kein Projektkontext) — server-seitig erzwungen
- SSE-Events: `{ avatarId, delta }` pro Chunk · `{ avatarId, done, tokensUsed }` pro Avatar · `{ done: true }` am Ende
- Budget-Check via `check_and_reserve_budget` RPC vor jedem Query
- Scope-Hierarchie: system → org → user; system-Avatare sind read-only + nicht löschbar

**Kurzreferenz für häufig benötigte Regeln:**
- Guided Workflows: `detectWorkflow()` macht **keinen** LLM-Call — reine Keyword-Logik
- Vor jedem LLM-Call: `POST /api/library/resolve { capabilityId, outcomeId, roleId?, skillId? }`
- Agenten: Max 1 gleichzeitiger Run pro Agent, agent_runs ist APPEND ONLY
- Scope-Hierarchie (alle Entitäten): system → package → org → user → public

### CI-Pipeline (Stand 2026-03-18)

Design System Lint (`node scripts/ci/lint-design-system.mjs`) läuft als CI-Step und blockiert bei Errors.

**Häufige Fehlerquellen (alle behoben):**
- Hex-Farben im Code → nur `var(--)` erlaubt; `var(--error, #hex)` als Fallback ebenfalls verboten
- `console.log/warn/error` in Produktion → `createLogger('scope')` aus `src/lib/logger.ts`
- Icon `weight="thin"` oder `weight="regular"` → nur `weight="bold"` oder `weight="fill"`
- Dateien > 500 Zeilen → CI-Error; > 300 Zeilen → Warning; große Dateien aufteilen

**write-test-results.mjs** läuft mit `|| true` — fehlende Secrets blockieren CI nicht.

**OpenAI-Client:** Lazy-Init via `getOpenAI()` + Proxy in `src/lib/llm/openai.ts` — kein `new OpenAI()` auf Modul-Ebene (wirft bei fehlendem `OPENAI_API_KEY` zur Build-Zeit).

---

## Systemische Lektionen aus dem Markt

> Abgeleitet aus Langdock-Analyse + Marktbeobachtung, März 2026.
> Diese Prinzipien gelten für jedes neue Feature und jede Architektur-Entscheidung.

**1. Model-Agnostik ist kein Feature — es ist das Fundament**
Kein Lock-in auf ein Modell. Jeder externe Modellanbieter sitzt hinter einer Abstraktionsschicht. Der Smart Router entscheidet — nicht der Code.
Konsequenz: Jeder neue API-Call zu einem Modell geht durch `src/lib/llm/router.ts` — niemals direkt in einer Route oder Komponente.

**2. Org-Governance ist das eigentliche Produkt für KMU**
User kaufen nicht weil die KI gut ist — Org-Admins kaufen weil sie Kontrolle haben. Welche Modelle sind erlaubt? Welche Capabilities? Welches Budget?
Konsequenz: Jedes neue Feature braucht eine Admin-Konfigurationsebene. Nicht als Nachgedanke — als erster Schritt beim Design.

**3. Keine eigene Infrastruktur — saubere Integrationsschicht**
Tropen OS trainiert kein eigenes Modell. Betreibt keine GPU-Cluster. Ist eine Abstraktionsschicht über bestehenden Diensten. Das hält das Team klein und die Marge hoch.
Konsequenz: Wenn ein Feature eigene Infrastruktur braucht, ist das ein Signal für einen externen Dienst (n8n, Supabase, Vercel) — nicht für Eigenbau.

**4. Community-Effekt ist der Wachstumsmotor**
Langdock wächst ohne Sales über Weiterempfehlungen. Tropen OS baut denselben Effekt über Community ein: geteilte Agenten, Templates, Workflows.
Konsequenz: Community ist kein "Nice to have" in Phase 3 — es ist die Wachstumsstrategie. Jedes Feature das Teilen ermöglicht, hat strategische Priorität.

**5. Tenant-Isolation ist nicht verhandelbar — bei jedem neuen Feature**
Die kritischste systemische Lektion: Org-Isolation muss von Tag 1 stimmen. Nachrüsten ist ein Albtraum.

Checkliste für jedes neue Feature:
```
□ Haben alle DB-Queries ein organization_id WHERE-Filter?
□ Haben alle neuen Tabellen RLS-Policies?
□ Können Daten einer Org jemals zu einer anderen Org gelangen?
□ Sind externe Dienste (n8n, Feeds) per Org getrennt?
□ Sind Community-Inhalte explizit als "public" markiert — alles andere ist privat?
```

Konkrete Risikostellen:

| Feature | Risiko | Maßnahme |
|---------|--------|----------|
| n8n Workflows | Shared Instanz — Workspace-Scope muss stimmen | `n8n_workspace_id` per Org, nie teilen |
| Community-Templates | Öffentliche Inhalte müssen explizit opt-in sein | scope-Feld: user/org/public — Default: user |
| Live-Systeme | Öffentliche URLs dürfen keine Org-Daten leaken | Auth-Check auf jedem Live-Endpoint |
| Feed-Distributions | Feed-Items dürfen nicht Org-übergreifend fließen | `organization_id` auf feed_items Pflichtfeld |

**6. Basis perfektionieren vor Ausführung**
Langdock hat zwei Jahre Chat und Wissen gebaut — dann erst Workflows. Tropen OS baut beides parallel. Das ist riskanter aber möglich — wenn die Basis (Chat, Projekte, Wissensbasis) stabil ist.
Konsequenz: Plan F (Workspaces) und Plan J (Feeds/Agenten) erst deployen wenn die bestehenden Features stabil und bug-frei sind. Kein Feature-Race auf wackeliger Basis.

---

## Pending UI/Chat Tasks (nicht in phase2-plans.md)

Kleine Verbesserungen, die beim Testen aufgefallen sind — noch kein eigener Plan.
Details: `memory/project_pending_ui_tasks.md`

| Task | Status | Notiz |
|------|--------|-------|
| Artifacts-Seite Redesign | ✅ gebaut | ArtifactMenu (DotsThree+Umbenennen+Löschen), alle 8 Typen, hover-actions, inline rename, empty-state mit ChatCircle-CTA (2026-03-25) |
| Artefakte Vorschau Modal | ✅ gebaut | Klick auf Karte → ArtifactPreviewModal (ArtifactRenderer, Escape+Backdrop schließen, "Im Chat öffnen"), Mobile Fullscreen (2026-03-25). TODO: /artefakte/[id] eigene Seite wenn Sharing-Feature kommt |
| Markdown-Rendering im Chat | ✅ bereits vorhanden | `react-markdown` + `remarkGfm` in `ChatMessage.tsx` — war fälschlich als offen notiert |
| Artifact iframe-Höhe | ✅ gebaut | ResizeObserver + postMessage `iframe-resize` in `ArtifactRenderer.tsx`, max 800px (2026-03-23) |
| Session-Panel Warnungen | ✅ gebaut | 5px-Dot + 11px-Text statt Warn-Boxen — `.sp-warning-badge` in `globals.css` (2026-03-23) |
| Rechtes Panel Redesign | ✅ gebaut | `right-panel-*` CSS-Klassen, custom `PanelSelect` Komponente (`.dropdown`-System), Section-Icons (MapPin/Bird/Layout), Sidebar-Collapse-Button im Header, "Einklappen"-Text entfernt (2026-03-25) |
| Voice-to-Text | ✅ gebaut | Web Speech API, Mic-Button im ChatInput (2026-03-20) — Hydration-Fix: `hasSpeech` via `useEffect` (2026-03-23) |
| Dokument-Upload im Chat | ✅ gebaut | PDF/Bild Base64 via `attachmentRef` → Anthropic `document`/`image` content block (2026-03-23) |
| PowerPoint-Export | ✅ gebaut | `pptxgenjs`, `/api/artifacts/export-pptx`, Button in `ArtifactRenderer.tsx` für Präsentations-Artifacts (2026-03-23) |
| Text-to-Speech | ✅ gebaut | `useTTS` Hook, `/api/tts` (OpenAI tts-1, voice=nova), [🔊] Button in `MessageActions.tsx` (2026-03-25) |
| Action Layer Hotfix | ✅ gebaut | ToroBadge außen rechts, DotsThree entfernt, neue Actions (Kürzen/E-Mail/Übersetzen/Bild/Perspektive), Mobile Bottom Sheet, `useMediaQuery` (2026-03-25) |
| Voice Input Flag (TTS Aufgabe 4) | ⬜ TODO | `onSendMessage`-Prop-Kette refactorn — `wasVoiceInput` Ref in ChatArea, `onVoiceInput` Callback in ChatInput, Flag im API-Body, Edge Function: kürzere Antwort bei voiceInput=true |
| Hydration-Fehler (ChatInput, RecentlyUsed, AppFooter) | ✅ behoben | `hasSpeech` → useEffect; `suppressHydrationWarning` auf Zeit-/Jahr-Spans (2026-03-23) |
| React-Artifacts TypeScript-Support | ✅ gebaut | sucrase-Transform `['jsx', 'typescript']` in `/api/artifacts/transform/route.ts` (2026-03-23) |
| Workspaces Redesign (Prompt A–C) | ✅ gebaut | workspace_items+members+comments (Mig 075–077); neue /workspaces page (client, grid+search+create); /workspaces/[id] Detail-Page (Tabs: Inhalte/Mitglieder/Kommentare/Einstellungen); /shared/[token] öffentliche Freigabe-Seite; workspace_items/members/comments/share API-Routes (2026-03-25) |

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
| `docs/product/architecture-navigation.md` | Produkt-Nordstern: Navigation, Workspace-Konzept, Live/Agenten/Community |
| `docs/product/roadmap.md` | Produkt-Roadmap, offene Pläne |
| `docs/product/migrations.md` | Vollständige Migrations-Übersicht 001–aktuell |
| `docs/product/rag-architecture.md` | RAG, pgvector, Wissensbasis-Schema |
| `docs/product/onboarding.md` | Onboarding-Schritte, AI Act, Email-Templates |
| `docs/product/superadmin.md` | Superadmin-Tool, Client-Anlage-Ablauf |
| `docs/product/jungle-order.md` | Jungle Order Edge Function, Soft Delete, Multi-Select |
| `docs/plans/agents-spec.md` | Agenten-System: Definition, Typen, DB-Schema, Agent-Engine, Plan J2 Scope |
| `docs/adr/*.md` | Architecture Decision Records (aktuell ADR-001 bis ADR-005) |
| `docs/product/feature-registry.md` | Feature-Dokumentation: Guided Workflows, Workspaces, Skills, Agents, Library, Transformationen |
| `docs/screenshots/` | UI-Screenshots (Design-Audit, Superadmin, Workspace, Canvas) |
| `docs/superpowers/n8n-integration-konzept.md` | n8n Integration: Toro generiert Workflows, kein Editor, Hetzner VPS Frankfurt, N8nClient API, Phase 2–4 |

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
