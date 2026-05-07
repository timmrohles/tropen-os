# Build-Prompt: Audit-Seite Tabellen-Welt-Umbau

> **Datum:** 2026-04-28
> **Aufwand:** 6-9 PT
> **Risiko:** Mittel — substantieller UI-Umbau, viele Komponenten betroffen
> **Sequenziell:** ja, vor BP8/BP9/BP10

---

## Pflicht-Lektüre vor Build

- `ARCHITECT.md`
- `CLAUDE.md`
- **`docs/product/marken-brief.md`** — insbesondere Pfeiler 6 (Zwei Welten), 9 (App-Welt-Sektionen), 11 (App-Welt-Disziplinen), zweiter Anker-Satz
- `src/app/globals.css`
- `src/components/_DESIGN_REFERENCE.tsx`
- `docs/audit/tier-distribution.md`

## Auftrag in einem Satz

Audit-Seite (`/audit`) wird in die Tabellen-Welt überführt — Sentry/DataDog-Stil,
durchgängig, mit klaren Spalten-Strukturen, Mono-Schrift als Daten-Standard,
eckigen Kanten und harten Trennlinien.

## Anker-Frage bei Unsicherheit

> *Wie würde Sentry oder DataDog das anzeigen — funktional, klar, ohne Marketing-Polish, mit Tabellen statt Cards?*

Fallback für Empty-States und Coach-Kommentare:
> *Wie würde ein älterer Senior-Engineer mit Geschmack das machen — direkt, kompetent, mit Haltung, aber auf Augenhöhe?*

---

## Phase A — App-Welt-Foundation (CSS + Komponenten-Primitives)

### 1. Neue CSS-Klassen in `globals.css`

```css
/* App-Welt-Tabellen */
.app-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.app-table thead th {
  font-family: var(--font-mono); text-transform: uppercase;
  font-size: 11px; font-weight: 600; letter-spacing: 0.05em;
  color: var(--accent); background: var(--surface-warm);
  padding: 10px 16px; text-align: left;
  border-bottom: 1px solid var(--border);
}
.app-table tbody tr { border-bottom: 1px solid var(--border); transition: background 80ms ease; }
.app-table tbody tr:hover { background: var(--surface-warm); }
.app-table tbody td { padding: 12px 16px; vertical-align: top; }
.app-table td.app-table-mono { font-family: var(--font-mono); font-size: 13px; }

/* App-Welt-Sektionen */
.app-section {
  border: 1px solid var(--border); margin-bottom: 16px;
  background: #ffffff; border-radius: 4px; overflow: hidden;
}
.app-section__header {
  padding: 12px 16px; background: var(--surface-warm);
  border-bottom: 1px solid var(--border);
  display: flex; align-items: center; justify-content: space-between;
  font-family: var(--font-mono); text-transform: uppercase;
  font-size: 12px; font-weight: 600; letter-spacing: 0.05em; color: var(--accent);
}
.app-section__header--accent { background: rgba(168,184,82,0.10); }
.app-section__body { background: #ffffff; }

/* Tier-Tabs (Sentry-Stil) */
.app-tabs {
  display: flex; border-bottom: 1px solid var(--border);
  background: var(--surface-warm);
  position: sticky; top: var(--score-header-height, 0); z-index: 10;
}
.app-tab {
  padding: 14px 24px; font-family: var(--font-mono);
  text-transform: uppercase; font-size: 12px; letter-spacing: 0.05em;
  border-right: 1px solid var(--border); cursor: pointer;
  color: var(--text-secondary); transition: color 80ms;
}
.app-tab:hover { color: var(--text-primary); }
.app-tab--active {
  color: var(--text-primary); background: #ffffff;
  border-bottom: 2px solid var(--accent); margin-bottom: -1px;
}
.app-tab__count { margin-left: 8px; color: var(--text-tertiary); font-size: 11px; }

/* Severity-Indikatoren */
.severity-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
.severity-dot--critical { background: var(--status-danger); }
.severity-dot--high     { background: var(--status-warning); }
.severity-dot--medium   { background: #D9A93C; }
.severity-dot--low      { background: var(--status-info); }
```

### 2. Neue Tabellen-Primitive in `src/components/app-ui/`
- `AppTable.tsx` — generische Tabellen-Komponente
- `AppSection.tsx` — Wrapper mit Header (optional accent-Variant)
- `AppTabs.tsx` — Tier-Tab-Bar (ersetzt AuditTierTabs)

---

## Phase B — Audit-Seite Findings

### 1. Score-Block (Sentry-Stil)
Format: `95.3% │ Production Grade │ ↘ -0.4% │ vor 2 Std.`
- Vertikale Trennlinien zwischen Werten
- Coach-Kommentar darunter (eine Zeile fließend — Plakat-Rest bewusst)
- Score-Skala als horizontale Bar (eckige Kanten)
- In `.app-section` mit Header `SCORE`

### 2. Tier-Tabs
- Bestehende `AuditTierTabs.tsx` durch `AppTabs.tsx` ersetzen
- Sticky unter Score-Block, CSS-Variable `--score-header-height` bleibt
- Mono, Uppercase, untere Akzent-Linie für aktiv

### 3. Sicht-Modi und Filter (Toolbar unter Tabs)
- Links: Sicht-Modi als kleine eckige Buttons
- Rechts: Filter-Dropdowns (Status + Tier, auf 2 reduziert)
- Trennlinie unter Toolbar

### 4. Findings-Tabelle
Spalten: SEV (40px) | TITEL (fluid) | PFAD (Mono, 280px) | +SCO (80px, rechtsbündig)
- Header in Mono-Uppercase
- Hover: ganze Zeile `--surface-warm`
- Klick auf Zeile: Cursor-Prompt expandiert nach unten inline
- Cursor-Prompt-Box: `background: #1E2530`, Mono-Schrift, Border-Radius 6px (Plakat-Rest), Copy-Button rechts

### 5. Quick Wins
- `.app-section__header--accent` mit Limette-Tint
- Header: `⚡ QUICK WINS · 3 schnelle Fixes für direkten Score-Lift`
- Gleiche Tabellen-Struktur wie restliche Findings
- Immer ausgeklappt, nicht kollabierbar

### 6. Restliche Findings
- Section-Header: `RESTLICHE FINDINGS · 138 OFFEN`
- Pagination für >50 Items: "Mehr laden — X weitere"

---

## Phase C — Tier 2 (Metriken) als Tabellen

### 1. Lighthouse-Section
- Empty-State (keine URL): Inline URL-Eingabe + Button
- Befüllter State: 4-Spalten-Tabelle (Performance/A11y/Best Practices/SEO)
- Re-Run-Button im Section-Header

### 2. Bundle-Größe-Section
- Trend-Sparkline als ASCII-Mono-Bars (`▆▅▄▃▂`)
- Top-3-Module-Tabelle

### 3. Cognitive-Complexity-Section
- Tabelle: FUNKTION | DATEI | KOMPLEXITÄT (sortiert absteigend)

---

## Phase D — Tier 3 (Compliance) als Tabellen

### Drei Framework-Sections (DSGVO / BFSG / EU AI Act)
- Section-Header: `⚖ DSGVO` + Status rechts (`🔴 5/8 erfüllt`)
- Tabelle: STATUS | PFLICHT | AKTION
- Status-Spalte: ✓ / ✗ / ➖ (Mono)
- Aktion: `[Fix-Prompt]` oder `[Manuelle Prüfung]`
- Alle ✓: kollabierte Form "Alle Pflichten erfüllt"

---

## Phase E — Mobile (<768px)

- Tabellen → Karten-Listen
- Spalten-Header → Labels in Karte
- Border-Radius 2-4px
- Tier-Tabs → horizontaler Scroll

---

## Phase F — Doku & Self-Audit

1. CLAUDE.md — neue App-Welt-Tabellen-Patterns
2. Design-Reference — plakat-hafte Audit-Patterns als deprecated, neue Tabellen-Patterns
3. architect-log.md
4. Self-Audit — Score-Vergleich

---

## Was NICHT zu tun ist

- Keine Marketing-Polish-Elemente in die App (keine Hero-Gradients, keine Surface-Familie-Wechsel)
- Kein Sentry-Branding kopieren — nur strukturellen Stil
- Cursor-Prompt-Boxen behalten Border-Radius 6px (bewusster Plakat-Rest)
- Coach-Stimme bleibt in Empty-States und Score-Kommentar

---

## Qualitätscheck

- [ ] `pnpm tsc --noEmit && pnpm lint && pnpm build` grün
- [ ] Audit-Seite sofort als App-Welt erkennbar
- [ ] Tier-Tabs sticky beim Scroll
- [ ] Hover-State auf Tabellen-Zeilen funktioniert
- [ ] Mobile (<768px): Tabellen → Karten
- [ ] Coach-Stimme in Empty-States erhalten
- [ ] Marketing-Welt (Landing-Page) visuell unverändert
- [ ] Login-Übergang als visueller Welt-Wechsel erkennbar

## Erfolgs-Kriterium

1. Kompakte Score-Status-Bar mit allen Kerndaten in einer Zeile
2. Klare Tier-Tab-Struktur wie Sentry-Issue-Tabs
3. Sicht-Modi und Filter als eigene Toolbar
4. Findings als echte Tabelle: SEV/TITEL/PFAD/+SCO
5. Quick Wins als hervorgehobene Tabelle mit Limette-Tint-Header
6. Tier 2: tabellarische Metriken-Sektionen
7. Tier 3: drei Framework-Tabellen (DSGVO/BFSG/AI-Act)
8. Coach-Stimme in Empty-States und Score-Kommentar erhalten
9. Mobile: Tabellen → Karten
