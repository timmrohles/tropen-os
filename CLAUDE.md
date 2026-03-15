# Tropen OS — CLAUDE.md
> Einzige Quelle der Wahrheit für Claude Code.

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
[ ] Nur className="card" für Cards — nie eigene box-styles?
[ ] Nur className="btn btn-*" für Buttons — nie eigene button-styles?
[ ] Nur Phosphor Icons (@phosphor-icons/react), weight="bold" oder weight="fill"?
[ ] H1-Icons: color="var(--text-primary)" — KEIN var(--accent) in Überschriften?
[ ] Ausschließlich CSS-Variablen für Farben — keine Hex-Werte im Code?
[ ] Kein manuelles paddingTop/paddingBottom — content-Klassen enthalten das automatisch?
[ ] Kein background auf Page-Wrapper — Body-Gradient muss durchscheinen?
[ ] Semantisches HTML: <button> für Aktionen, <a href> für Navigation, nie <div onClick>?
[ ] Alle interaktiven Elemente per Tastatur erreichbar, Fokus-Indikator sichtbar?
[ ] Icons ohne sichtbaren Text haben aria-label oder aria-hidden="true"?
```

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

**APPEND ONLY Tabellen** (niemals UPDATE oder DELETE): `card_history`, `project_memory`, `feed_processing_log`

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
