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
| 90–100% | 🟢 Production Grade |
| 80–89% | 🟡 Stable |
| 60–79% | 🟠 Risky |
| < 60% | 🔴 Prototype |

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
[ ] Section-Tag (Monospace, grün, mit Linie) über jeder Section-Headline?
[ ] Nummerierte Listen (01/02/03) statt drei gleiche Icon-Karten mit farbiger Border links?
[ ] Score-Farbe korrekt: grün (var(--accent)) für Production/Stable, amber (#E5A000) für Risky, rot (var(--error)) für Prototype?
[ ] Maximal 3 dunkle Sections (var(--active-bg)) pro Seite — nie zwei direkt hintereinander?
[ ] Section-Padding: 80px Desktop, 48px Mobile?
[ ] Display-Headlines (H1, H2) in var(--font-display) = Plus Jakarta Sans, fontWeight 700/800?
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
| Next.js | ^15.5.15 | App Router, `'use client'` wo nötig — auf 16.x warten bis Turbopack NFT-Bug gefixt (ADR-019) |
| React | ^19 | |
| TypeScript | ^5 | strict mode, kein `any` ohne Begründung |
| Tailwind CSS | ^3.4 | nur global styles — Seiten nutzen `const s: Record<string, React.CSSProperties>` |
| Supabase | @supabase/ssr + supabase-js | Auth + DB + Storage |
| Sentry | @sentry/nextjs ^10 | Server + Client + Edge — via `src/lib/monitoring/` Adapter |
| Upstash Redis | @upstash/ratelimit | Rate Limiting via `src/lib/ratelimit/` Adapter |
| resend | ^6 | E-Mail via `src/lib/email/` Adapter — austauschbar gegen SMTP |
| nodemailer | ^8 | SMTP-Adapter für Self-Hosting |
| pnpm | — | Package Manager |
| pptxgenjs | ^3 | PowerPoint-Export für Präsentations-Artifacts (`/api/artifacts/export-pptx`) |
| next-intl | ^4.9.1 | i18n — Locales: `en` (default), `de`; messages in `messages/*.json`; config in `src/i18n/` |
| openai | latest | TTS via `openai.audio.speech.create` in `/api/tts` |
| ignore | ^7 | .gitignore parsing für File Discovery in src/lib/repo-map/ |
| @ai-sdk/openai | ^1.x | GPT-5.4 via Vercel AI Gateway (Multi-Model Review Pipeline) |
| @ai-sdk/google | ^1.x | Gemini 2.5 Pro via Vercel AI Gateway (Multi-Model Review Pipeline) |

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
| Multi-Model Review (Reviewer 1) | `anthropic/claude-sonnet-4.6` via AI Gateway |
| Multi-Model Review (Reviewer 2) | `openai/gpt-5.4` via AI Gateway |
| Multi-Model Review (Reviewer 3) | `google/gemini-2.5-pro` via AI Gateway |
| Multi-Model Review (Reviewer 4) | `deepseek/deepseek-chat` via AI Gateway |
| Multi-Model Review (Judge) | `anthropic/claude-opus-4.6` via AI Gateway |

Feed Stage 1: kein API-Aufruf — regelbasiert.
SDK: **AI SDK** (`ai` + `@ai-sdk/anthropic`) — Provider-Instanz via `@/lib/llm/anthropic`. Nie `@anthropic-ai/sdk` direkt importieren.
Alle Modell-Calls gehen über `src/lib/llm/anthropic.ts` → `generateText()` oder `streamText()`.
Multi-Model Review: plain `"provider/model"` Strings → automatisch über Vercel AI Gateway geroutet. Auth: `AI_GATEWAY_API_KEY` oder `VERCEL_OIDC_TOKEN`.
AI SDK v6 Felder: `maxOutputTokens` (nicht `maxTokens`), `usage.inputTokens` / `usage.outputTokens`.

### CLI Scripts

| Script | Befehl | Beschreibung |
|--------|--------|-------------|
| Repo Map Generator | `npx tsx src/scripts/generate-repo-map.ts [--budget 4096]` | Scannt Tropen OS Repo selbst, schreibt Ergebnis in `docs/repo-map/` — Stufe 1 (2026-04-13): additives Ranking, Re-Export-Tracking, AST-Cache |
| Audit Runner | `pnpm exec tsx src/scripts/run-audit.ts [--skip-cli] [--budget N]` | Standard audit (fast) — external-tool checks skipped by default |
| Audit mit externen Tools | `pnpm exec tsx src/scripts/run-audit.ts --with-tools [--lighthouse-url URL] [--deep-secrets]` | Aktiviert depcruise, ESLint-detailed, gitleaks, Bundle-Analyse, optionales Lighthouse |
| Audit Dashboard | `/audit` (App-Route, requireOrgAdmin) | Interaktives Dashboard: Score-Hero, Kategorie-Breakdown, Findings-Table, Score-Trend (Tremor), Run-Historie; POST /api/audit/trigger startet neuen Run und persistiert in DB |
| Externes Projekt scannen | `/audit/scan` (App-Route) | Verbindet lokalen Projektordner via File System Access API; Client liest Dateien, POST /api/projects/scan startet Audit |
| Agent Generator | `env $(grep -v '^#' .env.local | grep -v ':' | xargs) pnpm exec tsx src/scripts/generate-agents.ts` | Generiert 18 Agent-Dokumente via 4-Modell-Komitee + Opus-Judge; ~€7–10 Gesamtkosten; Ergebnisse in `docs/agents/` |
| Meta-Review Agenten | `env $(grep -v '^#' .env.local | grep -v ':' | xargs) pnpm exec tsx src/scripts/meta-review-agents.ts` | Fachliche Vollständigkeitsprüfung aller Agenten via Opus; ~€0.40; Ergebnis in `docs/agents/_reviews/meta-review-YYYY-MM-DD.md` |
| Deep Agents Generator | `env $(grep -v '^#' .env.local | grep -v ':' | xargs) pnpm exec tsx src/scripts/generate-deep-agents.ts [dsgvo\|bfsg\|ai-act]` | Erstellt regulatorische Deep Agents (DSGVO/BFSG/AI Act) via Komitee; ~€1.50; Ergebnisse in `docs/agents/` |
| Schwache Agenten vertiefen | `env $(grep -v '^#' .env.local | grep -v ':' | xargs) pnpm exec tsx src/scripts/deepen-weak-agents.ts [AGENT_ID]` | Vertieft Top-N schwache Agenten aus Meta-Review; ~€0.25/Agent; ohne Argument: Top-4 aus letztem Meta-Review |
| Komitee-Review (einzeln) | `env $(grep -v '^#' .env.local | grep -v ':' | xargs) pnpm exec tsx src/scripts/committee-review.ts --config reviews/<name>.ts` | Generisches 4-Modell-Komitee (Sonnet + GPT-4o + Gemini 2.5 Flash + Grok 4) + Opus-Judge; ~€0.35–0.50 pro Review; Ergebnis in `docs/committee-reviews/<name>-review.md` |
| Komitee-Review (alle) | `env $(grep -v '^#' .env.local | grep -v ':' | xargs) pnpm exec tsx src/scripts/committee-review.ts --all` | Führt alle registrierten Reviews nacheinander aus (5s Pause dazwischen) |
| Benchmark (Testbench) | `env $(grep -v '^#' .env.local | grep -v ':' | xargs) pnpm exec tsx src/scripts/benchmark.ts --topic lovable-dev --max 10` | Scannt öffentliche GitHub-Repos per Tarball-API; Ergebnisse in DB (is_benchmark=true) + `docs/benchmark-results/`; braucht GITHUB_TOKEN |
| Benchmark Mixed | `env $(grep -v '^#' .env.local | grep -v ':' | xargs) pnpm exec tsx src/scripts/benchmark-mixed.ts` | Scannt spezifische Repos (Bolt/Cursor/Manual) per Tarball-API; Ergebnisse in DB + `docs/audit-reports/` |
| Benchmark v7 Final | `env $(grep -v '^#' .env.local | grep -v ':' | xargs) pnpm exec tsx src/scripts/benchmark-v7-final.ts` | Scannt alle 49 Repos (41 Lovable + 8 Mixed) in einem Run |

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

### Chart-Bibliotheken (ADR-008)

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
| `var(--bg-surface)` | `rgba(255,255,255,0.80)` | Cards, Panels **in der Seite** (kein Floating) |
| `var(--bg-surface-solid)` | `#FFFFFF` | Modals, Drawer, Dropdowns, Sheets — alle schwebenden Elemente |
| `var(--bg-tooltip)` | `#FFFFFF` | Tooltips, Popovers, Inline-Hinweisboxen |
| `var(--bg-nav)` | `rgba(255,255,255,0.72)` | Navigation |
| `var(--text-primary)` | `#1A1714` | Haupttext, H1-Icons |
| `var(--text-secondary)` | `#4A4540` | Sekundärtext |
| `var(--text-tertiary)` | `#6B6560` | Hilfstext, Labels |
| `var(--accent)` | `#2D7A50` | CTAs, Status, aktive Zustände |
| `var(--accent-light)` | `#D4EDDE` | Chip active, Highlights |
| `var(--active-bg)` | `#1A2E23` | Aktive Pill, Selected State |
| `var(--border)` | `rgba(26,23,20,0.08)` | Standard-Border |

**Das alte Dunkelgrün-Theme (`#0d1f16`, `#134e3a`, `#a3b554`) ist abgelöst — nie verwenden.**

**Floating-Element-Regel (nicht verhandelbar):**
- `--bg-surface` (halbtransparent) → **nur** für Cards/Panels die fester Bestandteil der Seite sind
- Alles was schwebt (Modal, Drawer, Dropdown, Sheet, Tooltip, Popover) → `--bg-surface-solid` oder `--bg-tooltip`
- Niemals `var(--bg-surface)` für `position: fixed/absolute` Elemente mit `z-index`

### Content-Breiten (verbindlich — genau eine pro Seite)

| Klasse | Max-Width | Verwendet für |
|--------|-----------|---------------|
| `.content-max` | 1400px | Standard-Seiten (Dashboard, Audit, Settings, Knowledge, Projects) |
| `.content-narrow` | 720px | Formular-Seiten (Login, Onboarding, Forgot-Password) |
| `.content-wide` | 1400px | Alias für content-max — backwards compat, nicht neu verwenden |
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

#### Section-Tag (Eyebrow Label — vor jeder Section-Headline)
```tsx
{/* Helles Layout */}
<span style={{
  display: 'inline-flex', alignItems: 'center', gap: 12,
  fontFamily: 'var(--font-mono, monospace)', fontSize: 12,
  color: 'var(--accent)', marginBottom: 20, letterSpacing: '0.02em',
}}>
  <span style={{ width: 28, height: 1, background: 'rgba(45,122,80,0.3)', flexShrink: 0 }} />
  Deine Projekte
</span>

{/* Dunkles Layout (auf var(--active-bg)) */}
<span style={{
  display: 'inline-flex', alignItems: 'center', gap: 12,
  fontFamily: 'var(--font-mono, monospace)', fontSize: 12,
  color: 'rgba(77,184,122,0.85)', marginBottom: 20,
}}>
  <span style={{ width: 28, height: 1, background: 'rgba(77,184,122,0.3)', flexShrink: 0 }} />
  EU-Compliance
</span>
```
- Monospace-Font, 12px, kein uppercase
- Grün `var(--accent)` auf hellem, `rgba(77,184,122,0.85)` auf dunklem Hintergrund
- Immer `marginBottom: 20` vor der Headline

#### Dunkle Section (Hero / CTA)
```tsx
<section style={{
  background: 'var(--active-bg)',
  padding: '80px 0',
  width: '100vw',
  marginLeft: 'calc(-50vw + 50%)',
}}>
  <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 clamp(20px, 5vw, 56px)' }}>
    <h2 style={{ fontFamily: 'var(--font-display, "Plus Jakarta Sans", sans-serif)', color: '#ffffff', fontWeight: 800 }}>
      Headline
    </h2>
  </div>
</section>
```
- Maximal 3 dunkle Sections pro Seite
- Nie zwei dunkle Sections direkt hintereinander
- Streifenmuster: dunkel → hell → dunkel → hell → dunkel

#### Nummerierte Feature-Liste (statt Icon-Karten)
```tsx
<div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
  <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-tertiary)', minWidth: 28, flexShrink: 0 }}>
    01
  </span>
  <div>
    <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px' }}>Titel</h3>
    <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>Beschreibung</p>
  </div>
</div>
```
- Statt drei gleiche Karten mit farbiger Border links ("KI-generiert"-Muster)
- Nummer in `var(--text-tertiary)`, 14px, fontWeight 500

#### User-Bubble Struktur — NICHT ANFASSEN

**Kein DOM-Wrapper** um User-Messages. `.cmsg.cmsg--user` ist direktes Flex-Kind von `.carea-messages`.
`.pbi-wrapper` und `.pbi-expansion` folgen als Fragment-Siblings — kein gemeinsamer Wrapper-Div.

```tsx
{isUser ? (
  <>
    <div className="cmsg cmsg--user">       {/* direktes Flex-Kind von .carea-messages */}
      <div className="cmsg-bubble-wrap">...</div>
      <div className="cmsg-avatar-user">...</div>
    </div>
    {showPbTrigger && (
      <>
        <div className="pbi-wrapper">...</div>
        <div className="pbi-expansion">...</div>
      </>
    )}
  </>
) : ...}
```

**Warum:** Jeder zusätzliche Wrapper-Div zwischen `.carea-messages` (flex-column) und `.cmsg.cmsg--user`
bricht das Flex-Breitenverhalten. `.carea-messages` hat nur `overflow-y: auto` — kein `overflow-x`.
Ein Wrapper ohne `min-width: 0` kann horizontal aus dem Viewport wachsen. `min-width: 0; overflow: hidden`
auf dem Wrapper clippt nur den Inhalt, löst aber nicht das Layout-Problem.

**Regeln:**
- Niemals einen `<div>`-Wrapper um `.cmsg.cmsg--user` einführen
- Prompt-Builder und ähnliche Elemente immer als Fragment-Siblings nach `.cmsg.cmsg--user`
- Nicht anfassen: Assistant-Bubble, Split-View-Logik, PromptBuilderInline, Streaming

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
- Backdrop-Farbe: `rgba(26,23,20,0.45)` + `backdrop-filter: blur(2px)` — **niemals `rgba(0,0,0,...)`**
- **Modal/Drawer-Hintergrund: immer `var(--bg-surface-solid)` (#FFFFFF) — niemals `var(--bg-surface)` (halbtransparent)**
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
    /[locale]           # Alle App-Seiten unter Locale-Prefix (/en, /de)
    /api                # API-Routes — kein Locale-Prefix
    /auth               # OAuth callback — kein Locale-Prefix
    /s                  # Share-Links /s/[token] — kein Locale-Prefix
  /i18n                 # next-intl config: routing.ts, request.ts, navigation.ts
  /messages             # Übersetzungen: en.json, de.json
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
    /repo-map           # Repo Map Generator: file-discovery, parser, symbol-extractor, reference-analyzer, graph-ranker, map-compressor, formatters/
  /types                # Globale TypeScript-Typen
  /utils                # Supabase Client-Utilities
  /modules              # Modul-spezifische Logik (Ziel-Struktur, Migration läuft schrittweise)
    /feeds              # components/ hooks/ lib/ — Feed-UI, Hooks, Business-Logik
    /workspaces         # components/ hooks/ lib/
    /agents             # components/ hooks/ lib/
    /perspectives       # components/ hooks/ lib/
    /chat               # components/ hooks/ lib/
  /core                 # Framework-unabhängiger Kern (kein Import aus modules/)
    /auth /billing /org /user
/src/scripts            # CLI-Scripts: generate-repo-map.ts (Dogfooding — scannt Tropen OS selbst)
/docs
  /product              # Produktdokumentation (RAG, Onboarding, etc.)
  /adr                  # Architecture Decision Records
  /plans                # Feature-Specs (agents-spec.md, etc.)
  /webapp-manifest      # Engineering Standards & Audit System
  /repo-map             # Repo Map Output: tropen-os-map.json/txt/stats.json (generiert von generate-repo-map.ts)
/src/lib/audit
  /prompt-export        # Regelbasierte Fix-Prompt-Engine (kein LLM — deterministisch, kostenlos)
    types.ts            # PromptFinding, ToolTarget, GeneratedPrompt, RepoContextSnippet
    template-engine.ts  # buildFixPrompt(finding, tool, repoMap?) — 5 Sections (Problem/Wo/Warum/Fix/Validierung)
    repo-context.ts     # extractRepoContext() — Symbols+Deps aus RepoMap, max 2000 Token
    index.ts            # Re-Exports
  schema-drift-check.ts # detectDbProvider() + checkSchemaDrift() — always score 5, info finding when DB detected
/src/app/[locale]/(app)/audit/_components
  FixPromptDrawer.tsx   # Portal-Drawer (right-side) — Tool-Chips (Cursor/Claude Code/Generic), formatted prompt, copy; mode:'single'|'group'; Escape+Backdrop close; 200ms slideInRight
  /checkers             # Automatisierte Prüffunktionen pro Themenbereich
    file-system-checker.ts       # Datei-Existenz-Checks
    repo-map-checker.ts          # Symbol- und Struktur-Checks via RepoMap
    documentation-checker.ts     # Docs-Checks (ADR, Runbooks, etc.)
    cli-checker.ts               # Shell-basierte Checks
    agent-committee-checker.ts   # Sprint 5b: 30+ Checks der 18 Komitee-Agenten
    slop-detection-checker.ts   # Sprint 11: cat-26 KI-Code-Hygiene (5 Regeln: Placeholder, Fingerprints, Overcommenting, Placeholder-Credentials, Mixed Language)
  rule-registry.ts              # Alle ~70 AuditRule-Einträge mit agentSource + check-Funktion
  index.ts                      # buildAuditContext (Disk) + buildAuditContextFromFiles (in-memory)
  page-data.ts                  # fetchAuditRuns, fetchScanProjects, fetchAuditFindings etc.
/src/lib/file-access             # File System Access API — browser-only
  types.ts                      # ProjectFile, DirectoryReadResult, ScanRequest
  browser-check.ts              # isFileSystemAccessSupported(), getBrowserInfo()
  file-filter.ts                # DEFAULT_IGNORE_DIRS/FILES, createFileFilter(), getLanguage()
  directory-reader.ts           # readDirectory(handle, onProgress?) — async, no disk access
  stack-detector.ts             # detectStack(files) → DetectedStack — Framework/DB/Auth/Styling/Testing/Deployment/Flags
/src/app/audit/scan
  page.tsx                      # Scan-Seite: Projekt verbinden + verbundene Projekte
  _components/
    ConnectProjectCard.tsx      # "use client" — 3-Schritt-Flow: reading → profile → scanning
    ScanProgress.tsx            # Fortschrittsanzeige (reading/uploading/analyzing)
    ProjectList.tsx             # Liste verbundener Projekte mit Link zu /audit?project=<id>
    ProjectProfileStep.tsx      # Auto-Detect-Anzeige + 4-Fragen-Interview (Chips) + N/A-Kategorien
/src/app/api/projects/scan
  route.ts                      # POST — empfängt Dateien + Profil, baut AuditContext, persistiert in DB
/src/app/superadmin/agents
  page.tsx                       # Superadmin-Seite: Agent Rule Packs (Search, Filter, Stats)
  agents.types.ts                # AgentTableRow-Interface
  _components/
    AgentTable.tsx               # Sortierbare Tabelle mit Status-Badges
    AgentDetailDrawer.tsx        # Rechts-Drawer 520px: Rules-Liste, Markdown-Preview
    AgentHealthBadge.tsx         # Status-Badge mit 90-Tage-Outdated-Logik
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
| 20260327000084_feature_flags.sql | organization_settings: features JSONB DEFAULT (feeds/workspaces/agents/perspectives=true, rest=false) |
| 20260327000085_llm_governance.sql | model_catalog: governance fields (display_name, flag, is_eu_hosted, is_open_source, suitable_levels, cost_input_per_m, etc.); org_model_config + user_model_preferences + RLS; Mistral model seeds |
| 20260327000086_extract.sql | knowledge_sources: extraction columns (applied via repair — rolled back) |
| 20260327000087_extract_index.sql | placeholder (repair-applied, superseded by 088) |
| 20260327000088_extract_full.sql | knowledge_sources: document_type, extracted_metadata, extraction_status/confidence/model/error, user_confirmed, extracted_at; idx_knowledge_contracts |
| 20260327000089_workflow_adapter.sql | organization_settings: workflow_provider (windmill/n8n/none), workflow_base_url, workflow_api_key_enc |
| 20260327000090_tenant_isolation_fixes.sql | transformation_links RLS: USING(TRUE) → org-scoped via source workspace/project |
| 20260327000091_deactivate_mistral.sql | model_catalog: Mistral-Modelle is_active=false (Provider nicht in Edge Function unterstützt) |
| 20260330000092_bookmarks_full_content.sql | bookmarks: full_content TEXT Spalte für vollständigen Nachrichtentext |
| 20260330000093_conversations_intention_default.sql | conversations.intention: DEFAULT NULL gesetzt |
| 20260330000094_model_catalog_capabilities.sql | model_catalog: capabilities JSONB DEFAULT '["general"]'; GIN-Index; Seeds für Anthropic/GPT/Mistral |
| 20260408000095_audit_tables.sql | audit_runs (APPEND ONLY), audit_category_scores (APPEND ONLY), audit_findings (status updatable); RLS via get_my_organization_id() |
| 20260408000096_audit_agent_source.sql | audit_findings: agent_source CHECK('core'/'architecture'/'security'/'observability') DEFAULT 'core', agent_rule_id TEXT, enforcement TEXT |
| 20260408000097_audit_review_fields.sql | audit_runs: review_type, models_used, judge_model, review_cost_eur, quorum_met; audit_findings: consensus_level, models_flagged, avg_confidence |
| 20260409000101_audit_fixes_consensus.sql | audit_fixes: fix_mode ('quick'/'consensus'), risk_level ('safe'/'moderate'/'critical'), risk_details JSONB, drafts JSONB DEFAULT '[]', judge_explanation TEXT |
| 20260409000102_audit_findings_affected_files.sql | audit_findings: affected_files TEXT[] + fix_hint TEXT — multi-file finding support |
| 20260409000103_scan_projects.sql | scan_projects Tabelle (id, org_id, name, source, file_count, total_size_bytes, last_scan_at, last_score, detected_stack) + audit_runs.scan_project_id FK |
| 20260409000105_audit_agent_source_security_scan.sql | audit_findings: agent_source CHECK erweitert um 'security-scan' (Sprint 7) |
| 20260409000106_project_profile.sql | scan_projects: profile JSONB, is_public, live_url, is_live, audience, compliance_requirements, not_applicable_categories |
| 20260410000107_audit_agent_source_regulatory.sql | audit_findings: agent_source CHECK erweitert um 'dsgvo', 'bfsg', 'ai-act' |
| 20260410000108_audit_tasks.sql | audit_tasks: finding_id FK, title/severity/rule_id/file_path snapshot, completed + completed_at, RLS via get_my_organization_id() |
| 20260415000112_audit_findings_not_relevant_reason.sql | audit_findings: not_relevant_reason TEXT Spalte fuer "Nicht relevant"-Begruendungen |

**Navigation — Produkt-Pivot (Stand 2026-04-10):**
Tropen OS ist ein "Production Readiness Guide für Vibe-Coders". Die Nav spiegelt die 3 Kern-Features.

Neue Sidebar-Struktur (alle Rollen):
- **Dashboard** → `/dashboard` (Projekt-Übersicht, Score-Cards, Onboarding-Hero)
- **Audit** → `/audit` (Detail-Ansicht, Top-5-Findings, Score-Trend)
- Admin-only: Budget, Logs, User, Branding, Department
- Superadmin: zusätzlich interne Tools (QA, To-Dos, Design Ref)

Eingefroren (Routen existieren, nicht in Nav):
- `/chat`, `/projects`, `/artifacts`, `/workspaces`, `/feeds`, `/agenten`
- "Neuer Chat"-Button entfernt aus Sidebar-Bottom

Dashboard (`/dashboard`):
- Server Component mit `fetchScanProjects` + `fetchAuditRuns`
- Kein Projekt → Hero + 3 Track-Karten (Speedrun / Guided / Rescue)
- Hat Projekte → Card-Grid: Score (groß), Status-Badge, Trend-Pfeil, "Noch X% bis [Status]"
- Routing: /audit?project=[id] für externe Projekte, /audit für internes Tropen OS

Audit Top-5-Findings (`src/app/[locale]/(app)/audit/_components/Top5FindingsCards.tsx`):
- Zeigt die 5 kritischsten offenen **Gruppen** (Rule-ID gruppiert; Impact-Score: Severity → uniqueFileCount)
- Aktionen: Task (POST /api/audit/tasks, group-level), Fix-Prompt (FixPromptDrawer mode="group"), × Dismiss (PATCH alle Findings der Gruppe)
- Klick auf Zeile scrollt zu `[data-rule-id="..."]` in FindingsTable, Fallback #findings-table

Audit Findings-Liste (`src/app/[locale]/(app)/audit/_components/FindingsTable.tsx`):
- **Ein Pattern für alles:** Alle Findings als `RecommendationCard` — keine Tabelle mehr
- Grouped mode: `groupFindings()` aus `src/lib/audit/group-findings.ts` → RecommendationCards; jede Gruppe in `<div data-rule-id="...">`
- Flat mode: jedes Finding als group-of-1 (`singleFindingAsGroup`) → gleicher RecommendationCard-Stil
- Entfernt: Tabelle, Fix-Generierung, Bulk-Select/Export, UPPERCASE-Header, Status-Dropdowns inline
- Geteilte Gruppenlogik: `src/lib/audit/group-findings.ts` — einzige Quelle für beide Komponenten

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

**APPEND ONLY Tabellen** (niemals UPDATE oder DELETE): `card_history`, `project_memory`, `feed_processing_log`, `feed_data_records`, `feed_runs`, `agent_runs`, `memory_extraction_log`, `audit_runs`, `audit_category_scores`

### Feature-Flags (Stand 2026-03-27)

Feature-Flags steuern per Org welche Module aktiv sind. Superadmin togglet via "Features"-Button in `/superadmin/clients`.

| Flag | Default | Steuert |
|------|---------|---------|
| `feeds` | true | Feeds-Seite + Sidebar-Eintrag |
| `workspaces` | true | Workspaces-Seite + Sidebar-Eintrag |
| `agents` | true | Agenten-Seite + Sidebar-Eintrag |
| `perspectives` | true | Perspectives-Seite |
| `mcp` | false | MCP-Verbindungen |
| `briefing` | false | Toro Morning Briefing |
| `document_ai` | false | Dokument-KI |
| `image_gen` | false | Bildgenerierung |

**Dateien:**
- `src/lib/features.ts` — Server: `isFeatureEnabled(orgId, flag)`, `requireFeature()`, `updateFeatureFlags()`
- `src/hooks/useFeatureFlags.ts` — Client: `useFeatureFlags()`, `useFeature(flag)`
- `src/components/FeatureGate.tsx` — Client-Guard-Komponente (redirect auf /cockpit wenn disabled)
- `supabase/migrations/20260327000084_feature_flags.sql` — `features JSONB` in `organization_settings`

**Regeln:**
- Feature-gated Seiten (feeds, workspaces, agenten, perspectives) haben `<FeatureGate flag="...">` als äußersten Wrapper
- Sidebar filtert Nav-Items basierend auf `features` aus `organization_settings`
- Fail-open: Bei DB-Fehler → Feature als aktiviert behandeln
- `pnpm lint:features` prüft ob alle Guards vorhanden sind

### Service Adapter System (Stand 2026-03-27)

Alle externen Dienste sind hinter Adaptern gekapselt. Self-Hoster können eigene Dienste nutzen — kein Code-Change, nur `.env`.

| Adapter | Env-Var | Optionen | Dateien |
|---------|---------|----------|---------|
| E-Mail | `EMAIL_PROVIDER` | `resend` (default) \| `smtp` \| `none` | `src/lib/email/` |
| Monitoring | `MONITORING_PROVIDER` | `sentry` (default) \| `none` | `src/lib/monitoring/index.ts` |
| Rate Limiting | `RATELIMIT_PROVIDER` | `upstash` (default) \| `memory` \| `none` | `src/lib/ratelimit/index.ts` |
| Workflow Engine | `WORKFLOW_PROVIDER` | `windmill` \| `n8n` (Stub) \| `none` (default) | `src/lib/workflow/` |

**Regeln:**
- Alle E-Mails über `sendEmail()` aus `@/lib/email` — nie direkt Resend/nodemailer importieren
- Monitoring in lib/API Code über `captureException()` aus `@/lib/monitoring` — error.tsx Komponenten behalten direkten Sentry-Import (Next.js Error Boundaries)
- Rate Limiting über `checkRateLimit(profile, identifier)` aus `@/lib/ratelimit` — proxy.ts nutzt diesen Adapter
- Workflow-Trigger über `getWorkflowAdapter(orgId)` aus `@/lib/workflow` — nie direkt Windmill/n8n aufrufen
- Fail-open bei fehlender Konfiguration (kein Crash)

**Workflow Adapter (Stand 2026-03-27):**
| Datei | Inhalt |
|-------|--------|
| `src/lib/workflow/types.ts` | `WorkflowAdapter` Interface + Typen |
| `src/lib/workflow/windmill.ts` | `WindmillAdapter` (vollständig) — workflowId: `{workspace}/{script_path}` |
| `src/lib/workflow/n8n.ts` | `N8nAdapter` (Stub — implementieren wenn Kunde kommt) |
| `src/lib/workflow/index.ts` | `getWorkflowAdapter(orgId)` Factory + `encodeApiKey/decodeApiKey` |
| `src/app/api/admin/workflow-config/route.ts` | GET (has_api_key, provider, base_url) + PATCH |
| `src/components/settings/WorkflowSettingsSection.tsx` | Admin-UI: Radio + URL + Key-Felder |
| `src/app/admin/integrations/page.tsx` | Admin-Seite (Sidebar: Integrationen, Plugs-Icon) |

**Org-Konfiguration:** `organization_settings.workflow_provider/base_url/api_key_enc` (Migration 089).
**API-Key-Encoding:** Base64 für MVP — für Produktion auf pgcrypto oder dedicated secrets umstellen.
**Priorität:** Org-DB-Einstellung > ENV-Fallback > NullAdapter (none).

### LLM Governance (Stand 2026-03-27)

Org-Admins steuern welche Modelle genutzt werden. User können (wenn erlaubt) situativ übersteuern.

| Datei | Inhalt |
|-------|--------|
| `src/lib/llm/model-resolver.ts` | `resolveModel(orgId, taskType, options?)` — Hierarchie: session → user-perm → org-override → org-level+filter → fallback |
| `src/lib/llm/provider.ts` | `getProviderModel(modelId)` — Anthropic / Mistral / Fallback |
| `src/app/api/models/org-config/route.ts` | GET + PATCH (admin-only) — level, filter_eu_only, filter_open_source, user rights |
| `src/app/api/models/available/route.ts` | GET — Modelle nach Org-Config gefiltert |
| `src/app/api/models/user-prefs/route.ts` | GET + PATCH — user-eigene Präferenzen (nur wenn Org erlaubt) |
| `src/components/settings/ModelGovernanceSection.tsx` | UI-Section auf Admin-Models-Seite: Level-Karten, Filter-Checkboxen, Modell-Liste, User-Rechte |

**Governance-Hierarchie (höchste Priorität zuerst):**
1. `session_model` / `session_level` (User, situativ — nur wenn `allow_situational_select`)
2. `model_overrides[taskType]` (User, permanent — nur wenn `allow_user_model_select`)
3. `level` (User, permanent — nur wenn `allow_user_level_select`)
4. `org_model_config.level + filter_eu_only + filter_open_source`
5. Absoluter Fallback: `claude-haiku-4-5-20251001`

**Eco-Modus** (level = eco oder cheap):
- `ECO_SYSTEM_SUFFIX` ans System-Prompt anhängen
- `ECO_CONTEXT_MESSAGES = 8` (statt 20)
- `ECO_MEMORY_CHUNKS = 3` (statt 10)

**Mistral-Provider:** `MISTRAL_API_KEY` in `.env` — bei fehlendem Key automatischer Anthropic-Fallback (kein Crash).

### Toro Extract — Dokumenten-Extraktion (Stand 2026-03-27)

Automatische Metadaten-Extraktion nach Dokument-Upload. Toro erkennt Typ + extrahiert strukturierte Daten.

| Datei | Inhalt |
|-------|--------|
| `src/lib/knowledge/extract/classifier.ts` | `classifyDocument(content, filename)` — Haiku erkennt Typ + Konfidenz |
| `src/lib/knowledge/extract/schemas.ts` | `EXTRACTION_SCHEMAS` für invoice / contract / offer |
| `src/lib/knowledge/extract/extractor.ts` | `extractMetadata(content, docType)` — Haiku extrahiert Felder als JSON |
| `src/lib/knowledge/extract/index.ts` | `processDocument(sourceId, orgId)` — Orchestrierung, schreibt in knowledge_sources |
| `src/app/api/knowledge/[id]/extract/route.ts` | POST (trigger async) + GET (status + metadata) |
| `src/app/api/cockpit/expiring-contracts/route.ts` | GET contracts expiring within N days |
| `src/components/knowledge/ExtractionPreview.tsx` | Inline-Preview nach Upload (nur wenn status='done') |
| `src/components/cockpit/widgets/ExpiringContractsWidget.tsx` | Cockpit-Widget: ablaufende Verträge (90-Tage-Fenster) |

**Extraktions-Lifecycle:**
1. Upload abgeschlossen + Ingest done → POST `/api/knowledge/[sourceId]/extract` (fire-and-forget)
2. `processDocument`: classify → skip wenn Konfidenz < 0.6 oder type='other' → extract → DB update
3. `ExtractionPreview` zeigt Ergebnis sobald `extraction_status = 'done'` (nur für docs mit status='ready')
4. Cockpit-Widget liest direkt aus `knowledge_sources` über API

**Widget-Katalog:** `expiring_contracts` in `src/lib/cockpit/widgetCatalog.ts` hinzugefügt (size: medium, adminOnly: false)

**Folge-Prompts:** Stufe 2 (Admin-Extraktionsregeln), komplexe Typen, Mistral OCR, Toro Erinnerungen

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

### Checker-Feedback-Prozess (Stand 2026-04-14)

Dogfooding-Feedback wird ueber GitHub Issues + Markdown-Log getrackt. Entscheidung aus Committee Review (einstimmig, 4 Modelle).

**Prozess bei False Positives:**
1. Finding faellt beim Dogfooding auf
2. Kategorisierung: Echtes Problem / False Positive / Bewusste Ausnahme
3. Bei False Positive: GitHub Issue erstellen (Template `.github/ISSUE_TEMPLATE/false-positive.yml`)
4. Checker-Fix implementieren
5. Eintrag in `docs/checker-feedback.md`

**Ziel-FP-Rate:** <10% pro Regel (MVP), <5% nach Year 1.

**Test-Repos:** Jeder Checker-Fix wird gegen 5 Open-Source-Benchmark-Repos getestet (siehe `docs/checker-test-repos.md`).

**Automatisierung:** Erst ab 10 Beta-Usern. Dann: "Finding falsch?"-Button im Produkt + Supabase-Tabelle.

### Audit Checker-Stack (Stand 2026-04-17)

238 Regeln (174 automatisiert, 64 manuell), 26 Kategorien, 28 Agenten.
Vollstaendige Coverage-Tabelle: `docs/audit-reports/checker-coverage-2026-04-15.md`
Sprint 11: +5 Regeln cat-26 (KI-Code-Hygiene via SLOP_DETECTION_AGENT)

**Checker-Dateien:**
| Datei | Regeln | Kategorien |
|-------|--------|-----------|
| `repo-map-checker.ts` | ~10 | cat-1,2,3,5,6,12,15,22,25 |
| `file-system-checker.ts` | ~15 | cat-2,5,7,10,11,14,17,21,23 |
| `ast-analyzer.ts` | — | Zentraler AST-Parser mit SHA-256 LRU-Cache (800 Eintraege) |
| `ast-quality-checker.ts` | 8 | cat-1,2,3,5 (CC, God Components, Error Handling, Secrets, Circular Imports, any, N+1, Error Boundary) |
| `compliance-checker.ts` | 6 | cat-4,5,22 (AGB, Widerruf, Button-Text, Affiliate, AI Transparency, AI Content) |
| `gap-checkers.ts` | 4 | cat-6,9,14,18 (.env.example, TODO, Promises, Loading States) |
| `category-gap-checkers.ts` | 5 | cat-7,11,20 (Performance, CI/CD, Cost Awareness) |
| `state-deps-obs-checkers.ts` | 5 | cat-9,12,14 (fetch-in-effect, Prop Drilling, Store, Major Versions, Error Monitoring) |
| `final-category-checkers.ts` | 9 | cat-8,13,18,21,23 (Backup, Timeout, README, PWA, Deployment) |
| `thin-category-checkers.ts` | 5 | cat-10,15,17,19,23 (Test Framework, Icons, Strings, .gitignore, Deploy Config) |
| `security-scan-checker.ts` | ~10 | cat-3,22,24 |
| `agent-committee-checker.ts` | ~15 | cat-2,4,5,6,8,11,12,14,15,16,19,20 |
| `agent-regulatory-checker.ts` | ~15 | cat-4,16,22 |

**Tier-System:**
| Tier | Regeln | Fuer wen |
|------|--------|---------|
| starter (default) | ~220 | Alle Projekte |
| production | 3 | Teams mit CI/CD |
| enterprise | 6 | Grosse Orgs (SBOM, OpenTelemetry, Vendor-Abstraktion) |

**Profil-gated Compliance-Regeln (ohne Profil = nicht im Score):**
`cat-4-rule-7` (Impressum), `cat-4-rule-11` (Datenschutz), `cat-4-rule-17` (Datenexport), `cat-4-rule-18` (Account-Loeschung), `cat-4-rule-20` (AGB), `cat-4-rule-21` (Widerruf), `cat-16-rule-5` (BFSG Erklaerung), `cat-16-rule-6` (BFSG Feedback)

**Complexity-Factor Scoring:**
Kleine Projekte (<50 Dateien) bekommen Score-Penalty: `log10(fileCount) / log10(100)`. 10 Dateien = Faktor 0.5, 100 Dateien = 1.0.

**fixType-System:**
- `getFixType()` aus `src/lib/audit/checkers/rule-registry.ts` — Node.js only, nie in Client-Komponenten importieren
- `AuditContext.fileContents` Map ermoeglicht In-Memory-Scanning fuer Benchmarks (kein Disk-Zugriff)
- `AuditOptions.excludeRuleIds` fuer Profil-basiertes Compliance-Filtering
- `AuditOptions.tier` fuer Maturity-Level-Filtering (starter/production/enterprise)

### Benchmark-System (Stand 2026-04-15)

Automatisierter Scanner fuer oeffentliche GitHub-Repos per Tarball-API.

**Architektur:**
- `src/lib/benchmark/tarball-extractor.ts` — GitHub Tarball → In-Memory FileMap
- `src/lib/benchmark/repo-discovery.ts` — GitHub Search API mit Filtern
- `src/lib/benchmark/runner.ts` — Orchestrator: discover → download → scan → persist
- `src/lib/benchmark/stats.ts` — Aggregierte Statistiken

**v7-Benchmark (49 Repos):**
| Gruppe | Repos | Avg Score | Verteilung |
|--------|-------|-----------|------------|
| Manual (CI) | 2 | 87.8% | Stable |
| Cursor | 3 | 83.2% | Stable |
| Lovable | 41 | 79.7% | 26 Stable, 14 Risky, 1 Prototype |
| Bolt | 3 | 70.9% | Risky |

**Ergebnisse:** `docs/audit-reports/benchmark-2026-04-15-v7-final.json`
**DB:** `audit_runs` mit `is_benchmark=true`, `source_repo_url` pro Repo

### Quick-Wins + UX-Schicht (Stand 2026-04-15)

**Quick-Wins Algorithmus:** `src/lib/audit/quick-wins.ts`
- Top 5 Findings nach Impact/Aufwand-Score (Severity x Suggestion x fixType)
- Max 1 pro Kategorie, mit estimatedScoreGain
- Gruppierung: today (high+code-fix) / thisWeek (medium+refactoring) / someday (low+manual)

**Score-Percentile:** `src/lib/audit/score-percentile.ts`
- Hardcoded v7-Benchmark-Daten (49 Repos, nach Topic aufgeteilt)
- Anzeige: "Top X% aller gescannten Projekte"

**Self-Assessment:** `src/lib/audit/self-assessment.ts`
- 5 Ja/Nein-Fragen fuer manuelle Checks (Backups, Monitoring, Rate Limiting, RTO/RPO, Legal)
- Antworten in `scan_projects.profile` JSONB (Feld `selfAssessment`)
- Anti-Gaming: `suspicious=true` wenn <10s + alle true
- API: `POST /api/audit/self-assessment`

**UI-Komponenten:**
- `QuickWinsCard.tsx` — Prominente Card mit Copy-to-Clipboard Cursor-Prompts
- `FindingsGroupTabs.tsx` — Chip-Tabs "Heute fixbar / Diese Woche / Irgendwann"
- `AuditTabs.tsx` — Tab-Navigation (Findings / Kategorien / Verlauf)
- `CompliancePanel.tsx` — Domaenen-Uebersicht mit Ampel
- `ProfileOnboarding.tsx` — 3-Schritt-Profil-Formular

**Finding-Aktionen (vereinfacht):**
- "Erledigt" → status=fixed, Undo-Link 5 Sekunden
- "Nicht relevant" → Inline-Dropdown mit 4 Gruenden, status=dismissed + not_relevant_reason
- Fix-Prompt bleibt als primaerer CTA
- "Aufgabenliste" entfernt, "Als bekannt" entfernt
- Filter: Offen (open+acknowledged) / Erledigt (fixed) / Nicht relevant (dismissed)

### Compliance-Domaenen (Stand 2026-04-15)

6 Domaenen mit Profil-basierter Relevanz: `src/lib/audit/compliance-domains.ts`

| Domaene | ID | Emoji | Bussgeld | Relevant wenn |
|---------|-----|-------|----------|---------------|
| Impressum & Recht | impressum | Abmahnrisiko | immer |
| Datenschutz | dsgvo | bis 20 Mio EUR | Login + nicht intern |
| Online-Handel | ecommerce | bis 50.000 EUR | Payment |
| KI-Transparenz | ai-act | bis 35 Mio EUR | AI Features |
| Barrierefreiheit | bfsg | bis 100.000 EUR | DE + B2C |
| Werbekennzeichnung | affiliate | bis 500.000 EUR | Affiliate Links |

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
| Parallel Tabs | ✅ gebaut | `detect-parallel-intent.ts` (Keyword-Erkennung); Confirmation-Bubble in ChatArea (Lightbulb + accent-light); `openNewTabWithConversation` in useChatTabs; POST /api/conversations/create; WorkspaceLayout `handleOpenParallelTabs` (2026-03-30) |
| Modell-Vergleich-Tabs (Plan M) | ✅ gebaut | `ModelComparePopover.tsx` + `Modal.tsx`; Scales-Icon; 2–4 Checkboxen; `handleModelCompare` in ChatArea; `overrideClientPrefs` in sendDirectToNewConv; capabilities JSONB in model_catalog (Mig 094); `detectTaskCategory()` in detect-parallel-intent.ts; capability-basierte Vorauswahl + "Empfohlen"-Badge im Modal (2026-03-30) |
| Voice Input Flag (TTS Aufgabe 4) | ⬜ TODO | `onSendMessage`-Prop-Kette refactorn — `wasVoiceInput` Ref in ChatArea, `onVoiceInput` Callback in ChatInput, Flag im API-Body, Edge Function: kürzere Antwort bei voiceInput=true |
| Hydration-Fehler (ChatInput, RecentlyUsed, AppFooter) | ✅ behoben | `hasSpeech` → useEffect; `suppressHydrationWarning` auf Zeit-/Jahr-Spans (2026-03-23) |
| Hydration-Fehler TopBar + ChatHeaderStrip | ✅ behoben | TopBar `mounted` guard (kein SSR); Bell+Account als CSS-Klassen; ChatHeaderStrip portalt in `#topbar-chat-slot` statt fixed overlay (2026-03-26) |
| Chat Auto-Scroll während Streaming | ✅ gebaut | `lastMsgContent`-Effect in `useWorkspaceState.ts` mit `behavior: 'instant'` — scrollt bei jedem Streaming-Chunk (2026-03-26) |
| Chat-Menü Dropdown weiß | ✅ gebaut | `.wl-conv-menu` auf `#ffffff` + `var(--border)` + `var(--text-secondary)` — Löschen in Rot lesbar (2026-03-26) |
| Chat-Menü: Zusammenfassung | ✅ gebaut | Menü-Eintrag sendet Prompt an Toro: Chat als teilbares Dokument-Artefakt zusammenfassen (2026-03-26) |
| Chat-Menü: Übersicht Artefakte | ✅ gebaut | `artifactsView` State in ChatArea; ersetzt Chat-Nachrichten durch alle Artefakte via ArtifactRenderer; "← Zurück"-Button (2026-03-26) |
| React-Artifacts TypeScript-Support | ✅ gebaut | sucrase-Transform `['jsx', 'typescript']` in `/api/artifacts/transform/route.ts` (2026-03-23) |
| Workspaces Redesign (Prompt A–C) | ✅ gebaut | workspace_items+members+comments (Mig 075–077); neue /workspaces page (client, grid+search+create); /workspaces/[id] Detail-Page (Tabs: Inhalte/Mitglieder/Kommentare/Einstellungen); /shared/[token] öffentliche Freigabe-Seite; workspace_items/members/comments/share API-Routes (2026-03-25) |
| Horizontaler Scroll | ✅ behoben | `html`/`body { overflow-x: hidden }`, `.pbi-wrapper/.pbi-expansion { min-width: 0; overflow: hidden }`, layout-wrapper `overflow: hidden` in chat/layout.tsx + chat/[id]/layout.tsx (2026-03-29) |
| SessionPanel Toggle umbenennen | ✅ gebaut | "Geteilter Bildschirm" → "Artefakt rechts anzeigen"; Hint → "Artefakte öffnen im Seitenpanel" (2026-03-29) |
| Links-Toggle abhängig von Live-Suche | ✅ gebaut | `updatePref` auto-disables `link_previews` bei `web_search_enabled=false`; Toggle visuell deaktiviert (opacity 0.4, pointer-events none) (2026-03-29) |
| Quick-Chips in Toro-Bubble | ✅ gebaut | Externes `.suggestion-pills`-Block entfernt; `.cmsg-chips` innerhalb `.cmsg-bubble--assistant` nach `pending`-Cursor, vor `showActions`; CSS: border-top-divider + "Vorschläge:"-Label + link-style buttons (2026-03-29) |
| TopBar Race Condition (Tabs/ChatName fehlen) | ✅ behoben | Slot-Divs `#topbar-tabs-slot` + `#topbar-chat-slot` in `!mounted`-Branch ergänzt → DOM-Elemente ab erstem Render vorhanden, WorkspaceLayout-useEffect findet sie sofort (2026-03-29) |
| Lesezeichen-Feature | ✅ gebaut | `/lesezeichen` Seite mit Multi-Select, Neuer-Chat, Kombinieren, Löschen; `BookmarkSimple` in Member-Sidebar; "Gespeichert"-Chip auf /artifacts; `full_content TEXT` in bookmarks (Migration 092); Prefill via sessionStorage in SingleChatClient (2026-03-30) |

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
| `docs/product/roadmap.md` | Produkt-Roadmap, offene Pläne (alt) |
| `docs/product/roadmap-2026-q2.md` | **Aktuelle Roadmap Q2/Q3 2026** — Production Readiness Guide für Vibe-Coders, 3 MVP-Features, User-Typen, Kill-the-Darlings, GTM |
| `docs/product/migrations.md` | Vollständige Migrations-Übersicht 001–aktuell |
| `docs/product/rag-architecture.md` | RAG, pgvector, Wissensbasis-Schema |
| `docs/product/onboarding.md` | Onboarding-Schritte, AI Act, Email-Templates |
| `docs/product/superadmin.md` | Superadmin-Tool, Client-Anlage-Ablauf |
| `docs/product/jungle-order.md` | Jungle Order Edge Function, Soft Delete, Multi-Select |
| `docs/plans/agents-spec.md` | Agenten-System: Definition, Typen, DB-Schema, Agent-Engine, Plan J2 Scope |
| `docs/adr/*.md` | Architecture Decision Records (ADR-001 bis ADR-018) |
| `docs/product/feature-registry.md` | Feature-Dokumentation: Guided Workflows, Workspaces, Skills, Agents, Library, Transformationen |
| `docs/screenshots/` | UI-Screenshots (Design-Audit, Superadmin, Workspace, Canvas) |
| `docs/superpowers/n8n-integration-konzept.md` | n8n Integration: Toro generiert Workflows, kein Editor, Hetzner VPS Frankfurt, N8nClient API, Phase 2–4 |
| `docs/repo-map/` | Repo Map Output: tropen-os-map.json/txt/stats.json (generiert von generate-repo-map.ts) |
| `docs/agents/` | **21 Agent Rule Packs** — 3 manuell (Sprint 4a) + 18 per Multi-Model-Komitee (Sprint 5): ARCHITECTURE_AGENT_v3.md, SECURITY_AGENT_FINAL.md, OBSERVABILITY_AGENT_v3.md, CODE_STYLE_AGENT.md, ERROR_HANDLING_AGENT.md, DATABASE_AGENT.md, DEPENDENCIES_AGENT.md, GIT_GOVERNANCE_AGENT.md, BACKUP_DR_AGENT.md, TESTING_AGENT.md, PERFORMANCE_AGENT.md, PLATFORM_AGENT.md, API_AGENT.md, COST_AWARENESS_AGENT.md, SCALABILITY_AGENT.md, ACCESSIBILITY_AGENT.md, DESIGN_SYSTEM_AGENT.md, CONTENT_AGENT.md, LEGAL_AGENT.md, AI_INTEGRATION_AGENT.md, ANALYTICS_AGENT.md |
| `src/lib/agents/agent-catalog.ts` | AgentDefinition-Interface + AGENT_CATALOG mit allen 21 Agenten (id, name, filename, version, categoryIds, themes, ruleCount, status, lastNormalized) — Sprint 5b: alle 18 Komitee-Agenten aktiv |
| `src/lib/audit/checkers/agent-committee-checker.ts` | Sprint 5b: 30+ automatisierte Checks der 18 Komitee-Agenten (Legal, Database, API, Testing, etc.) |
| `src/app/superadmin/agents/` | Superadmin-Seite für Agent Rule Packs: Übersicht, Search, Filter, Detail-Drawer mit Markdown-Preview |
| `src/app/api/superadmin/agents/route.ts` | API: liefert AGENT_CATALOG angereichert mit findingsCount + lastCheckAt aus audit_findings |
| `src/scripts/committee-review.ts` | Generisches Komitee-Review-Framework: 4 Reviewer (Sonnet, GPT-4o, Gemini 2.5 Flash, Grok 4) + Opus-Judge; Config-basiert; ~€0.35–0.50/Review |
| `src/scripts/reviews/*.ts` | Review-Configs: `claude-md.ts`, `audit-scoring.ts`, `fix-engine.ts`, `agent-checker-alignment.ts`, `repo-map.ts`, `dogfooding-feedback.ts` — jede Config definiert contextFiles, systemPrompt, userPrompt, judgePrompt |
| `docs/committee-reviews/` | Komitee-Review-Ergebnisse: `*-review.md` mit Konsens-Levels (EINIG/MEHRHEIT/GESPALTEN), Empfehlungen, Kosten-Tabelle |
| `docs/checker-feedback.md` | Checker Feedback Log: FP-Tracking, bekannte FP-Regeln, Prozess-Beschreibung |
| `docs/checker-test-repos.md` | Benchmark-Repos fuer Checker-Qualitaet (5 Open-Source-Projekte) |
| `.github/ISSUE_TEMPLATE/false-positive.yml` | GitHub Issue Template fuer False Positive Reports |
| `.github/ISSUE_TEMPLATE/checker-improvement.yml` | GitHub Issue Template fuer Checker-Verbesserungen |
| `docs/audit-reports/` | Benchmark-Ergebnisse (v1-v7), Checker-Coverage, Committee-Results, Checker-Gaps |
| `docs/manual-checks.md` | 64 manuelle Checks die statisch nicht pruefbar sind |
| `src/lib/audit/quick-wins.ts` | Quick-Wins-Algorithmus (Top 5 nach Impact/Aufwand) |
| `src/lib/audit/score-percentile.ts` | Percentile-Rank gegen v7-Benchmark |
| `src/lib/audit/self-assessment.ts` | 5 Self-Assessment-Fragen |
| `src/lib/audit/compliance-domains.ts` | 6 Compliance-Domaenen mit Relevanz-Funktionen |
| `src/lib/benchmark/` | Automatisierte Benchmark-Testbench (Tarball + Discovery + Runner + Stats) |

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
