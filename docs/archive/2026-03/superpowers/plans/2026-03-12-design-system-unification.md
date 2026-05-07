# Design-System Unification Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Alle Seiten auf ein einheitliches Design-Schema bringen — gleiche Abstände, Klassen, Icon-Farben, Chip-Stil, Buttons und Mobile-Verhalten.

**Architecture:** Keine neuen Komponenten. Drei Angriffspunkte: (1) `globals.css` für Token-Fixes, Chip-Redesign und Mobile-Regeln, (2) Admin-Seiten für Layout/Button/Card-Unification, (3) Hauptseiten (Settings, Knowledge, Dashboard) für dasselbe. Dashboard ist Referenz.

**Tech Stack:** Next.js 15, React 19, TypeScript, Phosphor Icons, CSS-Klassen aus globals.css (`.card`, `.btn`, `.btn-primary`, `.btn-ghost`, `.btn-danger`, `.btn-sm`, `.btn-icon`, `.chip`, `.chip--active`, `.page-header`, `.page-header-title`, `.list-row`, `.dropdown`)

---

## Chunk 1: globals.css — Foundation

### Task 1: Token-Fixes (alte Dark-Theme-Farben bereinigen)

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: ci-badge Farben auf Grün-System umstellen**

In `globals.css`, Zeile ~544:
```css
/* Vorher: */
.ci-badge { ... background: #a3b554; color: #1a2e1a; ... }

/* Nachher: */
.ci-badge { font-size: 12px; font-weight: 700; background: var(--accent-light); color: var(--accent-dark); border-radius: 4px; padding: 2px 7px; border: none; letter-spacing: 0.05em; text-transform: lowercase; order: -1; }
```

- [ ] **Step 2: ci-checkbox Farben fixen**

In `globals.css`, Zeile ~556:
```css
/* Vorher: */
.ci-checkbox:checked { background: #a3b554; border-color: #a3b554; background-image: url("...stroke='%231a2e1a'..."); }
.ci-checkbox:not(:checked):hover { border-color: #a3b554; ... }

/* Nachher: */
.ci-checkbox:checked { background: var(--accent); border-color: var(--accent); background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'%3E%3Cpath d='M2 6l3 3 5-5' stroke='%23ffffff' stroke-width='2' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: center; }
.ci-checkbox:not(:checked):hover { border-color: var(--accent); background: var(--accent-subtle); }
```

- [ ] **Step 3: carea-sel-btn--merge fixen**

In `globals.css`, Zeile ~604:
```css
/* Vorher: */
.carea-sel-btn--merge { background: #a3b554; color: #1a2e1a; font-weight: 600; border-color: #a3b554; }
.carea-sel-btn--merge:hover { background: #b8cc5f; border-color: #b8cc5f; }

/* Nachher: */
.carea-sel-btn--merge { background: var(--accent); color: #fff; font-weight: 600; border-color: var(--accent); }
.carea-sel-btn--merge:hover { background: var(--accent-dark); border-color: var(--accent-dark); }
```

- [ ] **Step 4: TemplateDrawer Farben fixen**

In `globals.css`:
```css
/* .tdrawer-accept:hover — Zeile ~655: */
.tdrawer-accept:hover:not(:disabled) { background: var(--accent-dark); }

/* .tdrawer-use-btn — Zeile ~678: */
.tdrawer-use-btn { display: flex; align-items: center; gap: 4px; background: var(--accent); border: none; border-radius: 6px; padding: 5px 10px; font-size: 12px; font-weight: 600; color: #fff; cursor: pointer; }

/* .tdrawer-template-pill--active — Zeile ~662: */
.tdrawer-template-pill--active { background: var(--accent); border-color: var(--accent); color: #fff; font-weight: 600; }

/* .tdrawer-shared-badge — Zeile ~686: */
.tdrawer-shared-badge { display: inline-block; margin-left: 6px; font-size: 10px; font-weight: 600; color: var(--accent); background: var(--accent-subtle); border-radius: 4px; padding: 1px 5px; vertical-align: middle; }
```

- [ ] **Step 5: cmsg-icon Farben fixen**

In `globals.css`, Zeile ~582:
```css
/* Vorher: */
.cmsg-icon--check { color: #a3b554; }
.cmsg-icon--eco   { color: #a3b554; }
.cmsg-icon--arrow { color: #a3b554; }

/* Nachher: */
.cmsg-icon--check { color: var(--accent); }
.cmsg-icon--eco   { color: var(--accent); }
.cmsg-icon--arrow { color: var(--accent); }
```

- [ ] **Step 6: Visuell prüfen**

```bash
cd "/c/Users/timmr/tropen OS" && pnpm dev
```
Browser öffnen → `/ws/[id]` → Chat-Nachrichten mit Icons ansehen. Checkboxen in Multi-Select. Merge-Button in Aktionsleiste. Alles grün (kein Gelbgrün mehr).

---

### Task 2: Chip-Redesign — Variante A

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Chip-Klassen auf Variante A umstellen**

In `globals.css`, die bestehenden `.chip` und `.chip--active` Blöcke (Zeile ~169) ersetzen:

```css
.chip {
  display: inline-flex; align-items: center;
  padding: 5px 12px;
  background: var(--active-bg);
  border: 1px solid var(--active-bg);
  border-radius: var(--radius-full);
  color: var(--active-text);
  font-size: 13px; font-weight: 500; cursor: pointer;
  transition: all var(--t-fast); white-space: nowrap;
  box-shadow: var(--shadow-xs);
}
.chip:hover { background: var(--accent-dark); border-color: var(--accent-dark); color: #fff; }
.chip--active {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}
```

- [ ] **Step 2: Visuell prüfen**

Browser → `/projects` → Tab-Leiste und Filter-Chips ansehen. Chips müssen dunkelgrün (#1A2E23) sein. Aktiver Chip mittelgrün (#2D7A50).

---

### Task 3: Mobile CSS-Regeln hinzufügen

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Mobile-Regeln am Ende des bestehenden `@media (max-width: 768px)` Blocks ergänzen**

In `globals.css`, den bestehenden `@media (max-width: 768px)` Block suchen (Zeile ~135) und INNERHALB davon ergänzen:

```css
@media (max-width: 768px) {
  /* Bestehende Padding-Regeln bleiben */
  .content-max, .content-narrow, .content-wide {
    padding-left: 16px;
    padding-right: 16px;
  }

  /* NEU: Page-Header stapeln */
  .page-header { flex-direction: column; gap: 12px; }
  .page-header-actions { width: 100%; justify-content: flex-start; }

  /* NEU: Admin-Tabellen scrollbar */
  .table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .table-scroll table { min-width: 600px; }
}
```

- [ ] **Step 2: Commit Chunk 1**

```bash
cd "/c/Users/timmr/tropen OS"
git add src/app/globals.css
git commit -m "style: unify design tokens, chip redesign (Variante A), mobile rules"
```

---

## Chunk 2: Settings & Knowledge Pages

### Task 4: Settings Page — Layout & Styles

**Files:**
- Modify: `src/app/settings/page.tsx`

- [ ] **Step 1: `s`-Objekt bereinigen — veraltete Variablen und Button-Farbe**

Im `s`-Objekt oben in der Datei:

```typescript
const s: Record<string, React.CSSProperties> = {
  page: { paddingTop: 32, paddingBottom: 48 },
  section: {
    background: 'rgba(255,255,255,0.72)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    border: '1px solid rgba(255,255,255,0.65)',
    borderRadius: 14,
    padding: '20px 24px',
    marginBottom: 20,
    boxShadow: '0 2px 8px rgba(26,23,20,0.06)',
  },
  sectionTitle: {
    fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    color: 'var(--text-tertiary)', marginBottom: 16, display: 'block',
  },
  row: { display: 'flex', flexDirection: 'column' as const, gap: 6, marginBottom: 16 },
  label: { fontSize: 13, color: 'var(--text-secondary)' },
  input: {
    background: '#fff', border: '1px solid var(--border-medium)',
    color: 'var(--text-primary)', borderRadius: 8, padding: '8px 12px',
    fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' as const,
  },
  inputReadonly: { opacity: 0.5, cursor: 'not-allowed' },
  select: {
    background: '#fff', border: '1px solid var(--border-medium)',
    color: 'var(--text-primary)', borderRadius: 8, padding: '8px 32px 8px 12px',
    fontSize: 14, outline: 'none', width: '100%', cursor: 'pointer',
    boxSizing: 'border-box' as const, appearance: 'none' as const,
  },
  sliderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  sliderValue: { color: 'var(--text-primary)', fontWeight: 600, fontSize: 13 },
  toggleRow: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  toggleLabel: { fontSize: 13, color: 'var(--text-secondary)' },
  toggleNote: { fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 },
  comingSoon: { fontSize: 12, color: 'var(--text-tertiary)', fontStyle: 'italic', marginBottom: 8, display: 'block' },
  hint: { fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4, lineHeight: 1.5, display: 'block' },
  hintBest: { fontSize: 11, color: 'var(--accent)', marginTop: 3, display: 'block' },
  hintWarn: { fontSize: 11, color: 'var(--warning)', marginTop: 3, display: 'block' },
  expertToggle: { display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: 12, padding: '8px 0', marginTop: 4 },
}
```

- [ ] **Step 2: Page-Wrapper + Heading auf Design-System umstellen**

Im JSX den äußeren Wrapper und die Überschrift ändern:

```tsx
// Vorher:
<div className="content-narrow" style={s.page}>
  <h1 style={s.heading}>Einstellungen</h1>

// Nachher:
<div className="content-narrow" style={{ paddingTop: 32, paddingBottom: 48 }}>
  <div className="page-header" style={{ marginBottom: 24 }}>
    <div className="page-header-text">
      <h1 className="page-header-title">Einstellungen</h1>
      <p className="page-header-sub">Profil, Präferenzen und Datenschutz</p>
    </div>
  </div>
```

- [ ] **Step 3: `s.select` auf einheitlichen Select-Style umstellen**

In `s`-Objekt den `select`-Eintrag:
```typescript
select: {
  background: '#fff', border: '1px solid var(--border-medium)',
  color: 'var(--text-primary)', borderRadius: 8,
  padding: '8px 32px 8px 12px', fontSize: 14, outline: 'none',
  width: '100%', cursor: 'pointer',
  boxSizing: 'border-box' as const, appearance: 'none' as const,
},
```

- [ ] **Step 4: Save-Button auf Design-System umstellen**

```tsx
// Vorher:
<button style={s.saveBtn} onClick={save} disabled={saving}>

// Nachher:
<button className="btn btn-primary" onClick={save} disabled={saving} style={{ marginTop: 8 }}>
```

- [ ] **Step 5: `var(--text-muted)` vollständig ersetzen**

Suche in der gesamten Datei nach `text-muted` und ersetze jeden Treffer durch `text-tertiary`:
```bash
grep -n "text-muted" "/c/Users/timmr/tropen OS/src/app/settings/page.tsx"
```
Alle gefundenen Stellen: `s.sectionTitle`, `s.comingSoon`, `s.hint`, `s.expertToggle`, inline "Letzte Sessions"-Label, inline `ticket_ref` Style — alle → `var(--text-tertiary)`.

- [ ] **Step 6: Visuell prüfen**

Browser → `/settings`. Seitentitel soll in Plus Jakarta Sans 26px erscheinen. Sections als Glasmorphismus-Karte. Save-Button grün mit weißem Text.

---

### Task 5: Knowledge Page — Layout & Icon-Farben

**Files:**
- Modify: `src/app/knowledge/page.tsx`

- [ ] **Step 1: Page-Header hinzufügen und Layout-Wrapper anpassen**

Die `return`-Statement-Struktur (suche nach dem bestehenden `<div` mit `paddingTop`) ersetzen:

```tsx
return (
  <div className="content-max" style={{ paddingTop: 32, paddingBottom: 48 }}>

    <div className="page-header" style={{ marginBottom: 24 }}>
      <div className="page-header-text">
        <h1 className="page-header-title">Wissensbasis</h1>
        <p className="page-header-sub">Dokumente für Toro – Org, User und Projekt-Ebene</p>
      </div>
    </div>

    {/* Tabs */}
    <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
      {(['user', 'org', 'project'] as Tab[]).map(t => (
        <button
          key={t}
          onClick={() => setTab(t)}
          className={tab === t ? 'chip chip--active' : 'chip'}
        >
          {t === 'user' ? <Users size={13} /> : t === 'org' ? <Books size={13} /> : <FolderOpen size={13} />}
          {t === 'user' ? 'Mein Wissen' : t === 'org' ? 'Organisations-Wissen' : 'Projekt-Wissen'}
        </button>
      ))}
    </div>

    {/* bestehender Inhalt (Upload, Dokumente) bleibt */}
```

- [ ] **Step 2: fileIcon()-Funktion: hardcodete Farben durch CSS-Vars ersetzen**

```typescript
function fileIcon(type: string | null) {
  switch (type?.toLowerCase()) {
    case 'pdf':  return <FilePdf size={20} weight="fill" style={{ color: 'var(--error)' }} />
    case 'docx': return <FileDoc size={20} weight="fill" style={{ color: 'var(--accent)' }} />
    case 'csv':  return <FileCsv size={20} weight="fill" style={{ color: 'var(--accent)' }} />
    default:     return <FileText size={20} weight="fill" style={{ color: 'var(--text-tertiary)' }} />
  }
}
```

- [ ] **Step 3: Upload-Bereich mobile-freundlich machen**

In der Upload-Zone (Drop-Zone-Div) eine feste Breite durch responsive Breite ersetzen:
```tsx
// Vorher (falls feste Breite vorhanden):
style={{ width: 400, ... }}

// Nachher:
style={{ width: '100%', maxWidth: 600, ... }}
```

- [ ] **Step 4: Loading-State vereinheitlichen**

```tsx
// Vorher (oder fehlendes Muster):
if (loading) return <div>Lade…</div>

// Nachher:
if (loading) return (
  <div className="content-max" style={{ paddingTop: 32, paddingBottom: 48 }}>
    <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', paddingTop: 48 }}>Lade…</p>
  </div>
)
```

- [ ] **Step 5: Visuell prüfen**

Browser → `/knowledge`. Seitentitel korrekt. Tabs als dunkelgrüne Chips. Datei-Icons nutzen CSS-Vars.

- [ ] **Step 5: Commit Chunk 2**

```bash
cd "/c/Users/timmr/tropen OS"
git add src/app/settings/page.tsx src/app/knowledge/page.tsx
git commit -m "style: unify settings and knowledge pages to design system"
```

---

## Chunk 3: Admin Pages

### Task 6: admin/logs — Page-Header + Tabellen-Fix

**Files:**
- Modify: `src/app/admin/logs/page.tsx`

- [ ] **Step 1: Fehlenden React-Import ergänzen und Layout anpassen**

Ganz oben `import React from 'react'` ergänzen (wird für `React.CSSProperties` in `s` benötigt).

- [ ] **Step 2: Return-Statement umschreiben**

```tsx
return (
  <div className="content-max" style={{ paddingTop: 32, paddingBottom: 48 }}>

    <div className="page-header" style={{ marginBottom: 24 }}>
      <div className="page-header-text">
        <h1 className="page-header-title">Usage Logs</h1>
        <p className="page-header-sub">{count ?? 0} Einträge gesamt · Zeige die letzten 100</p>
      </div>
    </div>

    <div className="card">
      <div className="table-scroll">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Zeit', 'Organisation', 'User', 'Department', 'Modell', 'Tokens (in/out)', 'Kosten'].map(h => (
                <th key={h} style={s.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(logs ?? []).length === 0 && (
              <tr>
                <td colSpan={7} style={s.empty}>Noch keine Logs vorhanden</td>
              </tr>
            )}
            {(logs ?? []).map((log) => {
              const org = log.organizations as unknown as { name: string } | null
              const user = log.users as unknown as { full_name: string | null; email: string } | null
              const ws = log.workspaces as unknown as { name: string } | null
              const model = log.model_catalog as unknown as { name: string; provider: string } | null
              const time = new Date(log.created_at).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })
              return (
                <tr key={log.id}>
                  <td style={s.td}>{time}</td>
                  <td style={s.td}>{org?.name ?? '—'}</td>
                  <td style={s.td}>{user?.full_name ?? user?.email ?? '—'}</td>
                  <td style={s.td}>{ws?.name ?? '—'}</td>
                  <td style={s.td}>
                    <span style={{
                      ...s.badge,
                      background: model?.provider === 'openai' ? 'var(--accent-subtle)' : 'rgba(99,102,241,0.10)'
                    }}>
                      {model?.name ?? '—'}
                    </span>
                  </td>
                  <td style={s.td}>{log.tokens_input ?? 0} / {log.tokens_output ?? 0}</td>
                  <td style={{ ...s.td, color: 'var(--accent)', fontWeight: 600 }}>€{(log.cost_eur ?? 0).toFixed(4)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>

  </div>
)
```

- [ ] **Step 3: `s`-Objekt anpassen**

```typescript
const s: Record<string, React.CSSProperties> = {
  th: { textAlign: 'left', fontSize: 12, color: 'var(--text-tertiary)', padding: '10px 14px', borderBottom: '1px solid var(--border)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' },
  td: { fontSize: 13, color: 'var(--text-primary)', padding: '10px 14px', borderBottom: '1px solid var(--border)' },
  empty: { fontSize: 13, color: 'var(--text-tertiary)', padding: 32, textAlign: 'center' },
  badge: { fontSize: 11, padding: '2px 8px', borderRadius: 4, color: 'var(--text-secondary)', border: '1px solid var(--border-medium)' },
}
```

---

### Task 7: admin/budget — Page-Header + Tabellen-Fix

**Files:**
- Modify: `src/app/admin/budget/page.tsx`

- [ ] **Step 1: Bestehende `s`-Objekte durch Design-System-Klassen ersetzen**

Lies die vollständige Datei um `s.h1`, `s.h2`, `s.sub`, `s.table`, `s.th`, `s.td`, `s.empty` zu finden.

Neues `s`-Objekt am Ende der Datei (oder ersetze bestehendes):
```typescript
const s: Record<string, React.CSSProperties> = {
  th: { textAlign: 'left', fontSize: 12, color: 'var(--text-tertiary)', padding: '10px 14px', borderBottom: '1px solid var(--border)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' },
  td: { fontSize: 13, color: 'var(--text-primary)', padding: '10px 14px', borderBottom: '1px solid var(--border)' },
  empty: { fontSize: 13, color: 'var(--text-tertiary)', padding: 32, textAlign: 'center' },
}
```

- [ ] **Step 2: Return-Statement umschreiben**

```tsx
if (loading) return (
  <div className="content-max" style={{ paddingTop: 32, paddingBottom: 48 }}>
    <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', paddingTop: 48 }}>Lade…</p>
  </div>
)

return (
  <div className="content-max" style={{ paddingTop: 32, paddingBottom: 48 }}>

    <div className="page-header" style={{ marginBottom: 24 }}>
      <div className="page-header-text">
        <h1 className="page-header-title">Budget-Limits</h1>
        <p className="page-header-sub">Monatliches Ausgaben-Limit pro Organisation und Department. Leer lassen = kein Limit.</p>
      </div>
    </div>

    <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Organisationen</h2>
    <div className="card" style={{ marginBottom: 32 }}>
      <div className="table-scroll">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>
            <th style={s.th}>Organisation</th>
            <th style={s.th}>Plan</th>
            <th style={s.th}>Budget / Monat (€)</th>
            <th style={s.th}></th>
          </tr></thead>
          <tbody>
            {orgs.length === 0 && <tr><td colSpan={4} style={s.empty}>Keine Organisationen</td></tr>}
            {orgs.map((org) => (
              <BudgetRow key={org.id} label={org.name} sub={org.plan} value={org.budget_limit} saving={saving === org.id} onSave={(v) => setBudget('organization', org.id, v)} />
            ))}
          </tbody>
        </table>
      </div>
    </div>

    <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Departments</h2>
    <div className="card">
      <div className="table-scroll">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>
            <th style={s.th}>Department</th>
            <th style={s.th}>Organisation</th>
            <th style={s.th}>Budget / Monat (€)</th>
            <th style={s.th}></th>
          </tr></thead>
          <tbody>
            {workspaces.length === 0 && <tr><td colSpan={4} style={s.empty}>Keine Departments</td></tr>}
            {workspaces.map((ws) => (
              <BudgetRow key={ws.id} label={ws.name} sub={ws.organizations?.name ?? ''} value={ws.budget_limit} saving={saving === ws.id} onSave={(v) => setBudget('workspace', ws.id, v)} />
            ))}
          </tbody>
        </table>
      </div>
    </div>

  </div>
)
```

- [ ] **Step 3: BudgetRow-Komponente — Save-Button anpassen**

In der `BudgetRow`-Komponente (am Ende der Datei) den Speichern-Button:
```tsx
// Vorher: <button style={...}>Speichern</button>
// Nachher:
<button
  className="btn btn-primary btn-sm"
  onClick={() => onSave(localValue)}
  disabled={saving}
>
  {saving ? '…' : 'Speichern'}
</button>
```

---

### Task 8: admin/users — Page-Header + Buttons + Tabelle

**Files:**
- Modify: `src/app/admin/users/page.tsx`

- [ ] **Step 1: Vollständige Datei lesen um `s`-Objekt zu finden**

```bash
cat "/c/Users/timmr/tropen OS/src/app/admin/users/page.tsx" | tail -80
```

- [ ] **Step 2: Return-Statement Wrapper + Header umbauen**

```tsx
return (
  <div className="content-max" style={{ paddingTop: 32, paddingBottom: 48 }}>

    <div className="page-header" style={{ marginBottom: 24 }}>
      <div className="page-header-text">
        <h1 className="page-header-title">User-Verwaltung</h1>
        <p className="page-header-sub">Teammitglieder einladen und Rollen verwalten</p>
      </div>
      <div className="page-header-actions">
        <button
          className="btn btn-primary"
          onClick={() => { setShowInvite(v => !v); setFeedback('') }}
        >
          {showInvite ? 'Abbrechen' : '+ User einladen'}
        </button>
      </div>
    </div>
```

- [ ] **Step 3: Invite-Box als Card**

```tsx
{showInvite && (
  <div className="card" style={{ marginBottom: 24 }}>
    <div className="card-header">
      <span className="card-header-label">User einladen</span>
    </div>
    <div className="card-body" style={{ padding: '16px 20px' }}>
      <form onSubmit={invite} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{ fontSize: 12, color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>E-Mail</label>
          <input
            style={{ background: '#fff', border: '1px solid var(--border-medium)', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' as const, color: 'var(--text-primary)' }}
            type="email" placeholder="Email-Adresse" value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)} required autoFocus
          />
        </div>
        <div style={{ minWidth: 140 }}>
          <label style={{ fontSize: 12, color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>Rolle</label>
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as 'member' | 'viewer' | 'admin')}
            style={{ background: '#fff', border: '1px solid var(--border-medium)', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}
          >
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <button className="btn btn-primary" type="submit" disabled={sending}>
          {sending ? 'Wird gesendet…' : 'Einladen'}
        </button>
      </form>
      {feedback && <p style={{ margin: '12px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>{feedback}</p>}
    </div>
  </div>
)}
```

- [ ] **Step 4: Rollen-Toggle-Buttons in User-Tabelle anpassen**

In der User-Tabelle gibt es je User einen Rollen-Selector/Button. Dieser muss auf Design-System umgestellt werden:
```tsx
// Vorher: custom style button oder select
// Nachher: select mit einheitlichem Style:
<select
  value={user.role}
  onChange={(e) => changeRole(user.id, e.target.value)}
  style={{ background: '#fff', border: '1px solid var(--border-medium)', borderRadius: 8, padding: '5px 10px', fontSize: 12, outline: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}
>
  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
</select>
```

- [ ] **Step 5: Delete-Button je User als btn-icon mit error-Farbe**

```tsx
// Vorher: custom style button
// Nachher:
<button
  className="btn-icon"
  onClick={() => deleteUser(user.id)}
  title="User entfernen"
  style={{ color: 'var(--error)' }}
>
  <Trash size={14} weight="bold" />
</button>
```

- [ ] **Step 6: User-Tabelle in Card + table-scroll wrappen**

```tsx
<div className="card">
  <div className="table-scroll">
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      {/* bestehende thead/tbody mit aktualisierten Button-Styles */}
    </table>
  </div>
</div>
```

Th-Styles:
```typescript
th: { textAlign: 'left', fontSize: 12, color: 'var(--text-tertiary)', padding: '10px 14px', borderBottom: '1px solid var(--border)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' },
td: { fontSize: 13, color: 'var(--text-primary)', padding: '10px 14px', borderBottom: '1px solid var(--border)' },
```

---

### Task 9: admin/models — Page-Header + Buttons + Tabelle

**Files:**
- Modify: `src/app/admin/models/page.tsx`

- [ ] **Step 1: Vollständige Datei ab Zeile 80 lesen**

Lies `src/app/admin/models/page.tsx` ab Zeile 80 um das vollständige JSX zu sehen.

- [ ] **Step 2: Return-Statement anpassen**

```tsx
return (
  <div className="content-max" style={{ paddingTop: 32, paddingBottom: 48 }}>

    <div className="page-header" style={{ marginBottom: 24 }}>
      <div className="page-header-text">
        <h1 className="page-header-title">Modelle</h1>
        <p className="page-header-sub">AI-Modelle verwalten und Kosten konfigurieren</p>
      </div>
      <div className="page-header-actions">
        <button className="btn btn-primary" onClick={() => setShowNew(v => !v)}>
          {showNew ? 'Abbrechen' : '+ Neues Modell'}
        </button>
      </div>
    </div>
```

- [ ] **Step 3: Toggle-Button je Modell anpassen**

```tsx
// Vorher: custom style button
// Nachher:
<button
  className={model.is_active ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'}
  onClick={() => toggleActive(model)}
>
  {model.is_active ? 'Aktiv' : 'Inaktiv'}
</button>
```

- [ ] **Step 4: Edit/Delete-Buttons anpassen**

```tsx
<button className="btn btn-ghost btn-sm" onClick={() => startEdit(model)}>Bearbeiten</button>
<button className="btn btn-danger btn-sm" onClick={() => deleteModel(model.id)}>Löschen</button>
```

- [ ] **Step 5: Provider-Select Style einheitlich**

```tsx
style={{ background: '#fff', border: '1px solid var(--border-medium)', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}
```

- [ ] **Step 6: New-Model-Form auf Mobile responsive machen**

In der New-Model-Form (falls vorhanden als row mit mehreren Feldern):
```tsx
// Vorher: display flex, row, no wrap
// Nachher:
style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}
```

- [ ] **Step 7: Tabelle in Card + table-scroll wrappen** (wie in Task 8)

---

### Task 10: admin/branding — Page-Header + Buttons + Card

**Files:**
- Modify: `src/app/admin/branding/page.tsx`

- [ ] **Step 1: Return-Statement Wrapper + Header**

```tsx
// Vorher:
<div className="content-max">
  <h1 style={s.h1}>Co-Branding</h1>

// Nachher:
<div className="content-max" style={{ paddingTop: 32, paddingBottom: 48 }}>
  <div className="page-header" style={{ marginBottom: 24 }}>
    <div className="page-header-text">
      <h1 className="page-header-title">Co-Branding</h1>
      <p className="page-header-sub">Passe Logo, Farbe und den Namen deines KI-Assistenten an.</p>
    </div>
  </div>
```

- [ ] **Step 2: Formular-Section als Card**

```tsx
// Vorher:
<div style={s.section}>

// Nachher:
<div className="card" style={{ marginBottom: 20 }}>
  <div style={{ padding: '20px 24px' }}>
```

Und das schließende `</div>` anpassen.

- [ ] **Step 3: Save-Button anpassen**

```tsx
// Vorher:
<button style={s.saveBtn} onClick={save} disabled={saving || uploading}>

// Nachher:
<button className="btn btn-primary" onClick={save} disabled={saving || uploading} style={{ marginTop: 8 }}>
```

- [ ] **Step 4: Remove-Logo-Button anpassen**

```tsx
// Vorher:
<button style={s.removeBtn} onClick={...}>Entfernen</button>

// Nachher:
<button className="btn btn-ghost btn-sm" onClick={...}>Entfernen</button>
```

- [ ] **Step 5: Premium-Section als Card**

```tsx
// Vorher:
<div style={s.premiumSection}>

// Nachher:
<div className="card">
  <div style={{ padding: '20px 24px' }}>
```

- [ ] **Step 6: Premium-Link-Button anpassen**

```tsx
// Vorher:
<a href="mailto:..." style={s.premiumBtn}>

// Nachher:
<a href="mailto:hello@tropen.de?subject=Anfrage%20White-Label%20Tropen%20OS" className="btn btn-ghost">
```

- [ ] **Step 7: Commit Chunk 3**

```bash
cd "/c/Users/timmr/tropen OS"
git add src/app/admin/logs/page.tsx src/app/admin/budget/page.tsx src/app/admin/users/page.tsx src/app/admin/models/page.tsx src/app/admin/branding/page.tsx
git commit -m "style: unify all admin pages to design system (page-header, card, btn)"
```

---

## Chunk 4: Dashboard, Projects & Cleanup

### Task 11: Dashboard — Card-Klassen + Mobile Grid

**Files:**
- Modify: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Komplette Dashboard-Datei lesen**

```bash
wc -l "/c/Users/timmr/tropen OS/src/app/dashboard/page.tsx"
```
Dann vollständig lesen um alle `card`-Inline-Style-Stellen zu finden.

- [ ] **Step 2: `const card`-Objekt entfernen und KPI-Box-Stellen auf className umstellen**

```tsx
// Vorher:
const card = { background: 'rgba(255,255,255,0.72)', backdropFilter: '...', ... }
<div style={card}>...</div>

// Nachher:
// const card = {...} → löschen
<div className="card" style={{ padding: '16px 20px' }}>...</div>
```

- [ ] **Step 3: KPI-Grid responsive machen**

```tsx
// Vorher:
style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}

// Nachher:
style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}
```

- [ ] **Step 4: Tabellen-Container mit table-scroll wrappen**

Die `<Table>`-Komponente von Tremor:
```tsx
// Vorher:
<Table>...</Table>

// Nachher:
<div className="table-scroll">
  <Table>...</Table>
</div>
```

- [ ] **Step 5: Page-Header hinzufügen**

```tsx
// Am Anfang des return() — vor dem ersten Grid:
<div className="page-header" style={{ marginBottom: 24 }}>
  <div className="page-header-text">
    <h1 className="page-header-title">Dashboard</h1>
    <p className="page-header-sub">KI-Nutzung und Kosten im Überblick</p>
  </div>
  <div className="page-header-actions">
    <Suspense><PeriodTabs /></Suspense>
  </div>
</div>
```

Falls `PeriodTabs` bereits woanders positioniert ist, an passende Stelle verschieben.

---

### Task 12: Projects — Mobile + page-header-sub Klasse

**Files:**
- Modify: `src/app/projects/page.tsx`

- [ ] **Step 1: page-header-sub Klasse nutzen**

```tsx
// Vorher:
<p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
  Organisiere deine Chats, Agenten und Vorlagen
</p>

// Nachher:
<p className="page-header-sub">Organisiere deine Chats, Agenten und Vorlagen</p>
```

- [ ] **Step 2: 2-Column Grid responsive machen**

```tsx
// Vorher (Zeile ~286):
style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 20, alignItems: 'start' }}

// Nachher:
style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 400px', gap: 20, alignItems: 'start' }}
```

Und in globals.css eine `@media (max-width: 768px)` Regel für `.projects-grid` hinzufügen — ODER direkt inline mit einer CSS-Variable:

Einfachste Lösung: ein `<style>`-Tag im JSX (da Client-Component):
```tsx
// Am Anfang des return(), nach dem äußersten div:
<style>{`
  @media (max-width: 900px) {
    .projects-grid { grid-template-columns: 1fr !important; }
  }
`}</style>
```
Dann dem Grid `className="projects-grid"` geben.

- [ ] **Step 3: Tab-Zeile umbrechen**

```tsx
// Vorher:
<div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>

// Nachher:
<div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 0, flexWrap: 'wrap' }}>
```

---

### Task 13: Design-Preview Seite löschen

**Files:**
- Delete: `src/app/design-preview/page.tsx`

- [ ] **Step 1: Seite löschen**

```bash
rm "/c/Users/timmr/tropen OS/src/app/design-preview/page.tsx"
rmdir "/c/Users/timmr/tropen OS/src/app/design-preview"
```

Prüfen ob die Datei in git getrackt ist:
```bash
cd "/c/Users/timmr/tropen OS" && git ls-files src/app/design-preview/page.tsx
```
Wenn Ausgabe leer → war nie committed → kein `git rm` nötig. Wenn Pfad erscheint → `git rm` ausführen (nächster Commit).

- [ ] **Step 2: Finaler visueller Check**

```bash
cd "/c/Users/timmr/tropen OS" && pnpm dev
```

Alle Seiten der Reihe nach öffnen:
- `/dashboard` — KPI-Grid, Cards, Tabelle, Page-Header
- `/settings` — Cards, Sections, Save-Button grün/weiß
- `/knowledge` — Chips dunkelgrün, Icons mit CSS-Vars
- `/admin/users` — Page-Header, Card, Tabelle scrollbar
- `/admin/budget` — Page-Header, Card, Save-Button
- `/admin/models` — Page-Header, Toggle-Buttons, Danger-Delete
- `/admin/branding` — Page-Header, Card, Buttons
- `/admin/logs` — Page-Header, Card, Kosten in Grün
- `/projects` — Mobile-Grid responsive, Tabs umbrechen

Browser DevTools → Responsive Mode auf 375px testen: Page-Header muss stacken, Tabellen horizontal scrollbar sein.

- [ ] **Step 3: Final-Commit**

```bash
cd "/c/Users/timmr/tropen OS"
git add src/app/dashboard/page.tsx src/app/projects/page.tsx
git rm src/app/design-preview/page.tsx
git commit -m "style: unify dashboard, projects, remove design-preview — design system complete"
```
