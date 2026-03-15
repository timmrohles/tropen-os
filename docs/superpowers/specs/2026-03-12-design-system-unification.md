# Design-System Unification — Spec

**Datum:** 2026-03-12
**Status:** Approved by user

---

## Ziel

Alle Seiten von Tropen OS auf ein einheitliches, reproduzierbares Design-Schema bringen. Das Dashboard dient als Referenz. Jede Seite soll nach diesem Spec aussehen wie aus einem Guss — gleiche Abstände, gleiche Komponenten-Klassen, gleiche Icon-Farben, gleiche Chip- und Button-Stile.

## Architektur

Kein neues Framework, keine neuen Komponenten. Alle Fixes laufen über:
1. `src/app/globals.css` — Token-Korrekturen + Chip-Redesign + neue Responsive-Regeln
2. Individuelle Seiten — Custom-Inline-Styles durch Design-System-Klassen ersetzen

## Tech Stack

Next.js 15 App Router, TypeScript, Phosphor Icons, inline `s`-Objekte (bestehende Konvention), CSS-Klassen aus `globals.css`.

---

## Bestehende Klassen (zur Klarstellung)

Folgende Klassen existieren bereits in `globals.css` und müssen **nicht** neu angelegt werden:
- `.card`, `.card-header`, `.card-header-label`, `.card-body`, `.card-section-label`, `.card-divider`
- `.page-header`, `.page-header-text`, `.page-header-title`, `.page-header-sub`, `.page-header-actions`
- `.btn`, `.btn-primary`, `.btn-ghost`, `.btn-danger`, `.btn-sm`, `.btn-icon`
- `.chip`, `.chip--active`
- `.list-row`, `.list-row--active`, `.list-row--add`, `.badge`
- `.dropdown`, `.dropdown-item`, `.dropdown-item--active`, `.dropdown-item--danger`, `.dropdown-divider`
- `.content-max`, `.content-narrow`, `.content-wide`, `.content-full`

---

## Section 1: Token & CSS-Variablen Fixes

### Problem
- `var(--text-muted)` wird in `settings/page.tsx` und anderen Seiten verwendet — existiert nicht in `:root`
- Alte Dark-Theme-Farben noch aktiv: `#0d1f16` (Button-Text), `#a3b554` (ci-badge, ci-checkbox, carea-sel-btn--merge), `#1a2e1a`, `#b8cc5f`
- `--border-muted` ist ein Backwards-Compat-Alias — sollte nicht in neuen Stilen verwendet werden

### Fixes in globals.css

**Chat-System (Backwards-Compat-Bereinigung):**
- `.ci-badge`: `background: #a3b554; color: #1a2e1a` → `background: var(--accent-light); color: var(--accent-dark)`
- `.ci-checkbox:checked`: `background: #a3b554; border-color: #a3b554` → `background: var(--accent); border-color: var(--accent)` — SVG-Checkmark Farbe `%231a2e1a` → `%23fff`
- `.ci-checkbox:not(:checked):hover`: `border-color: #a3b554` → `border-color: var(--accent)`
- `.carea-sel-btn--merge`: `background: #a3b554; color: #1a2e1a; border-color: #a3b554` → `background: var(--accent); color: #fff; border-color: var(--accent)`
- `.carea-sel-btn--merge:hover`: `background: #b8cc5f; border-color: #b8cc5f` → `background: var(--accent-dark); border-color: var(--accent-dark)`
- `.tdrawer-accept:hover:not(:disabled)`: `background: #b8cc5f` → `background: var(--accent-dark)`
- `.tdrawer-use-btn`: `color: #1a2e1a` → `color: #fff`
- `.tdrawer-shared-badge`: `background: rgba(163,181,84,0.15)` → `background: var(--accent-subtle)`
- `.tdrawer-template-pill--active`: `color: #1a2e1a` → `color: #fff`
- `.cmsg-icon--check`, `.cmsg-icon--eco`, `.cmsg-icon--arrow`: `color: #a3b554` → `color: var(--accent)`

**Seiten-Inline-Fixes (keine globals.css-Änderung — direkt in den Dateien):**
- `settings/page.tsx`: `var(--text-muted)` → `var(--text-tertiary)`, `--border-muted` → `--border`
- `settings/page.tsx` `s.saveBtn`: `color: '#0d1f16'` → `color: '#fff'`

---

## Section 2: Chip-Redesign — Variante A

### Kontext
**Achtung:** Dies ist eine bewusste Umkehrung der bestehenden Defaults.
- **Bisher:** `.chip` = weiß, `.chip--active` = `var(--accent-light)` hellgrün
- **Neu (Variante A):** `.chip` = `var(--active-bg)` dunkelgrün, `.chip--active` = `var(--accent)` mittelgrün

### Neue CSS-Werte in globals.css
```css
.chip {
  background: var(--active-bg);        /* #1A2E23 — dunkel */
  border: 1px solid var(--active-bg);
  color: var(--active-text);           /* #fff */
  /* Padding, font-size, border-radius, transition, box-shadow bleiben */
}
.chip:hover {
  background: var(--accent-dark);
  border-color: var(--accent-dark);
  color: #fff;
}
.chip--active {
  background: var(--accent);           /* #2D7A50 — mittelgrün */
  border-color: var(--accent);
  color: #fff;
}
```

---

## Section 3: Page-Layout Standard

### Pflicht-Struktur für jede Seite (außer Chat/Workspace)

```tsx
<div className="content-max" style={{ paddingTop: 32, paddingBottom: 48 }}>
  <div className="page-header">
    <div className="page-header-text">
      <h1 className="page-header-title">Seitentitel</h1>
      <p className="page-header-sub">Kurze Beschreibung</p>
    </div>
    <div className="page-header-actions">
      {/* Optionale Buttons */}
    </div>
  </div>
  {/* Seiteninhalt */}
</div>
```

### Content-Width Zuordnung (unveränderlich)
| Klasse | Max-Width | Seiten |
|--------|-----------|--------|
| `.content-max` | 1200px | Dashboard, Settings, Knowledge, Admin-Seiten, Projects |
| `.content-narrow` | 720px | Login, Forgot-Password, Reset-Password, Onboarding |
| `.content-wide` | 1400px | Superadmin-Seiten |
| `.content-full` | 100% | Chat/Workspace |

---

## Section 4: Buttons — Einheitliche Klassen

### Regel
Keine inline `s.btn`, `s.saveBtn`, `s.deleteBtn`, `s.premiumBtn` etc. mehr. Ausschließlich:

```tsx
<button className="btn btn-primary">Primäraktion</button>
<button className="btn btn-ghost">Neutral</button>
<button className="btn btn-danger">Löschen</button>
<button className="btn btn-primary btn-sm">Klein</button>
<button className="btn btn-ghost btn-sm">Klein Ghost</button>
<button className="btn btn-danger btn-sm">Klein Danger</button>
<button className="btn-icon"><Icon /></button>
```

### Button-Text auf Primary
- Immer `color: #fff` — niemals `#0d1f16` oder `#1a2e1a`

### Betroffene Seiten mit konkreten Änderungen

**`settings/page.tsx`:**
- `s.saveBtn` (grüner Hintergrund, falscher Text-Color) → `className="btn btn-primary"`

**`admin/users/page.tsx`:**
- `s.btn` (Einladen-Button) → `className="btn btn-primary"`
- Rollen-Buttons (Member/Viewer/Admin Toggle) → `className="btn btn-ghost btn-sm"` / aktiv: `className="btn btn-primary btn-sm"`
- Delete-Button je User → `className="btn-icon"` mit `color: var(--error)` auf dem Icon

**`admin/budget/page.tsx`:**
- Speichern-Button je Zeile → `className="btn btn-primary btn-sm"`

**`admin/models/page.tsx`:**
- "Neues Modell" → `className="btn btn-primary"`
- "Bearbeiten" → `className="btn btn-ghost btn-sm"`
- "Löschen" → `className="btn btn-danger btn-sm"`
- Toggle Active → `className="btn btn-ghost btn-sm"`

**`admin/branding/page.tsx`:**
- `s.saveBtn` (Änderungen speichern) → `className="btn btn-primary"`
- `s.removeBtn` (Logo entfernen) → `className="btn btn-ghost btn-sm"`
- `s.premiumBtn` (White-Label anfragen, `<a>`-Tag) → `className="btn btn-ghost"` auf dem `<a>`-Element

---

## Section 5: Cards — Kein Inline-Duplikat

### Regel
Alle weißen Glasmorphismus-Boxen ausschließlich mit `className="card"`. Kein inline-`background: 'rgba(255,255,255,0.72)'` etc.

### Betroffene Seiten

**`dashboard/page.tsx`:**
- `const card = { background: 'rgba(255,255,255,0.72)'... }` entfernen
- Alle KPI-Boxen und Chart-Container → `className="card"` mit `padding: '16px 20px'` im card-body style
- `const labelStyle` und `const metricStyle` bleiben als inline-`s`-Objekte für die Kennzahlen-Werte (sind Page-spezifisch)

**`settings/page.tsx`:**
- `s.section` (border-radius: 10, bg: var(--bg-surface)) → `className="card"` mit `card-body` padding inline

**`admin/branding/page.tsx`:**
- `s.section` Wrapper um die Formularfelder → `className="card"` + `<div style={{ padding: '20px 24px' }}>`
- `s.premiumSection` → `className="card"` + eigener innerer Padding

**`admin/users/page.tsx`, `admin/budget/page.tsx`, `admin/models/page.tsx`:**
- Tabellen-Wrapper-Divs → `className="card"` (Tabelle direkt darin, kein extra padding auf card)

### Ladestate (einheitlich)
```tsx
if (loading) return (
  <p style={{ color: 'var(--text-tertiary)', padding: '48px 0', textAlign: 'center' }}>Lade…</p>
)
```

---

## Section 6: Icons — Farbhierarchie

### Regel
Niemals hardcodete Hex-Farben auf Icons. Immer CSS-Variablen:

| Kontext | Farbe |
|---------|-------|
| Standard in Listen, Cards | `color: var(--text-secondary)` |
| Aktive Aktion, Hover | `color: var(--text-primary)` |
| Primärfunktion, Highlight | `color: var(--accent)` |
| Fehler, Löschen | `color: var(--error)` |
| Deaktiviert, Hinweis | `color: var(--text-tertiary)` |

### Betroffene Stellen
- `knowledge/page.tsx` `fileIcon()`:
  - `color: '#ef4444'` (PDF) → `color: 'var(--error)'`
  - `color: '#3b82f6'` (DOCX) → `color: 'var(--accent)'`
  - `color: '#22c55e'` (CSV) → `color: 'var(--accent)'`

---

## Section 7: Dropdowns & Selects

### Dropdown-Menüs
Immer `.dropdown` + `.dropdown-item` + `.dropdown-item--active` + `.dropdown-item--danger` + `.dropdown-divider` aus globals.css:
```tsx
<div className="dropdown" style={{ position: 'absolute', minWidth: 180, padding: 4, zIndex: 50 }}>
  <button className="dropdown-item dropdown-item--active">Aktiver Eintrag</button>
  <button className="dropdown-item">Normaler Eintrag</button>
  <div className="dropdown-divider" />
  <button className="dropdown-item dropdown-item--danger">Löschen</button>
</div>
```

### Select-Felder (einheitlich)
```tsx
style={{
  background: '#fff',
  border: '1px solid var(--border-medium)',
  borderRadius: 8,
  padding: '8px 32px 8px 12px',
  color: 'var(--text-primary)',
  fontSize: 13,
  outline: 'none',
  appearance: 'none' as const,
  cursor: 'pointer',
  width: '100%',
  boxSizing: 'border-box' as const,
}}
```

### Betroffene Seiten
- `settings/page.tsx` — `s.select` durch einheitlichen Select-Style ersetzen
- `admin/users/page.tsx` — Role-Select durch einheitlichen Select-Style ersetzen
- `admin/models/page.tsx` — Provider-Select durch einheitlichen Select-Style ersetzen

---

## Section 8: Mobile Responsiveness

### Neue globale CSS-Regeln in globals.css

```css
@media (max-width: 768px) {
  /* Page-Header stapeln */
  .page-header { flex-direction: column; gap: 12px; }
  .page-header-actions { width: 100%; justify-content: flex-start; }

  /* Admin-Tabellen scrollbar */
  .table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .table-scroll table { min-width: 600px; }
}
```

### Seiten-spezifische Markup-Änderungen

**`dashboard/page.tsx`:**
- KPI-Grid (aktuell 4-spaltig): `style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}` → `gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))'`
- Tabellen-Container: `<div className="table-scroll">` um die `<Table>`-Komponente wrappen

**`knowledge/page.tsx`:**
- Tab-Zeile: bestehende flex-row → `flexWrap: 'wrap'` hinzufügen
- Upload-Bereich: bestehende feste Breite → `width: '100%', maxWidth: 600`

**`admin/users/page.tsx`:**
- Tabellen-Container: `<div className="table-scroll">` um die User-Tabelle wrappen
- Invite-Form: `display: 'flex', flexDirection: 'row'` → `flexWrap: 'wrap'` hinzufügen

**`admin/budget/page.tsx`:**
- Tabellen-Container: `<div className="table-scroll">` um beide Tabellen wrappen

**`admin/models/page.tsx`:**
- Tabellen-Container: `<div className="table-scroll">` um Modell-Tabelle wrappen
- New-Model-Form: bestehende row-Felder → `flexWrap: 'wrap'`

**`projects/page.tsx`:**
- 2-Column Grid (Workspace-Liste + Detail): auf Mobile → `gridTemplateColumns: '1fr'`
- Tab-Zeile: `flexWrap: 'wrap'`

---

## Scope: Betroffene Dateien

| Datei | Art der Änderung |
|-------|-----------------|
| `src/app/globals.css` | Chip-Redesign (Variante A), Token-Fixes (a3b554, b8cc5f, 1a2e1a), Mobile page-header + table-scroll Regeln |
| `src/app/settings/page.tsx` | Layout (page-header), Buttons (btn-primary), CSS-Vars (text-muted→tertiary, border-muted→border), Select-Style |
| `src/app/knowledge/page.tsx` | Layout (page-header), Icon-Farben (ef4444→error, 3b82f6→accent), Buttons, Mobile (flex-wrap, max-width) |
| `src/app/dashboard/page.tsx` | Card-Klassen (inline card obj → className="card"), Mobile-Grid (auto-fit), table-scroll |
| `src/app/admin/users/page.tsx` | Layout (page-header), Buttons (btn-primary/ghost), Select-Style, table-scroll |
| `src/app/admin/budget/page.tsx` | Layout (page-header), Buttons (btn-primary btn-sm), table-scroll |
| `src/app/admin/models/page.tsx` | Layout (page-header), Buttons (primary/ghost/danger), Select-Style, Icon-Farben, table-scroll |
| `src/app/admin/branding/page.tsx` | Layout (page-header), Buttons (saveBtn→btn-primary, removeBtn→btn-ghost btn-sm, premiumBtn→btn-ghost), Card-Klassen |
| `src/app/admin/logs/page.tsx` | Layout (page-header), Buttons |
| `src/app/projects/page.tsx` | Mobile-Grid (1fr auf small), Tab-Zeile (flex-wrap) |
| `src/app/design-preview/page.tsx` | **Löschen** nach Fertigstellung |

---

## Nicht im Scope

- Chat/Workspace (`content-full`) — eigene Layout-Logik, kein Handlungsbedarf
- Onboarding, Login, Forgot-Password — `content-narrow`, funktioniert bereits korrekt
- Superadmin-Seiten — eigenes Layout, separater Task
- Neue Features — Spec gilt als Vorlage für alles Neue
