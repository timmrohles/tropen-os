'use client'

/**
 * _DESIGN_REFERENCE.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Tropen OS — Lebende Design-Referenz
 *
 * ZWECK: Diese Datei ist die einzige Quelle der Wahrheit für alle UI-Patterns.
 * Claude Code liest diese Datei bevor es neue Komponenten oder Seiten baut.
 *
 * ROUTE: /design-reference (nur sichtbar wenn NEXT_PUBLIC_SHOW_DESIGN_REF=true)
 * NICHT für Produktion — nur für Entwicklung und Claude Code als Referenz.
 *
 * WIE MAN DIESE DATEI BENUTZT (für Claude Code):
 * Bevor du eine neue Seite oder Komponente baust:
 * 1. Lies diese Datei
 * 2. Identifiziere welche Patterns du brauchst
 * 3. Kopiere das Pattern exakt — ändere nur Inhalte, nie die Klassen
 *
 * WIE MAN DIESE DATEI UPDATED (für Claude Code):
 * - Neues Pattern: neuen Abschnitt mit <Section> ergänzen
 * - Bestehendes Pattern ändern: nur wenn globals.css sich geändert hat
 * - Niemals Patterns entfernen ohne explizite Anweisung von Timm
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  House, Gear, Plus, Trash, Download, BookmarkSimple,
  MagnifyingGlass, Bell, User, ArrowRight, Check,
  Warning, Info, X, CaretDown, DotsThree,
  FolderOpen, ChatCircle, Brain, Leaf, Buildings,
  Sparkle, List, GridFour,
  DownloadSimple, PencilSimple, Archive, Copy,
} from '@phosphor-icons/react'

// ─── Guard: nur in Entwicklung sichtbar ──────────────────────────────────────
if (
  process.env.NODE_ENV === 'production' &&
  process.env.NEXT_PUBLIC_SHOW_DESIGN_REF !== 'true'
) {
  // Seite existiert im Build, ist aber nicht erreichbar
}

// ─── Hilfskomponenten für die Referenz-Darstellung ───────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 64 }}>
      <div style={{
        borderBottom: '2px solid var(--accent)',
        paddingBottom: 8,
        marginBottom: 32,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: 'var(--accent)' }}>
          {title}
        </h2>
      </div>
      {children}
    </section>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <p className="t-label" style={{ marginBottom: 10 }}>{label}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-start' }}>
        {children}
      </div>
    </div>
  )
}

function Code({ children }: { children: string }) {
  return (
    <pre className="t-mono" style={{
      background: 'var(--bg-surface-2)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-sm)',
      padding: '8px 12px',
      fontSize: 11,
      color: 'var(--text-secondary)',
      margin: '8px 0 0',
      overflowX: 'auto',
      whiteSpace: 'pre-wrap',
    }}>
      {children}
    </pre>
  )
}

// ─── Haupt-Komponente ─────────────────────────────────────────────────────────

export default function DesignReference() {
  return (
    <div className="content-max">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-header-title">
            <Sparkle size={22} color="var(--text-primary)" weight="fill" />
            Design Reference
          </h1>
          <p className="page-header-sub">
            Lebende Dokumentation aller UI-Patterns — Quelle der Wahrheit für Claude Code
          </p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-ghost">
            <Gear size={14} weight="bold" /> Einstellungen
          </button>
          <button className="btn btn-primary">
            <Plus size={14} weight="bold" /> Neu
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          1. PAGE LAYOUT
      ══════════════════════════════════════════════════════════════════ */}
      <Section title="1. Page Layout — Content-Breiten">
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <span className="card-header-label">Verbindliche Regel</span>
          </div>
          <div className="card-body" style={{ padding: 16 }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 16px' }}>
              Jede Seite verwendet genau eine content-Klasse. Kein manuelles
              paddingTop/paddingBottom — das ist automatisch enthalten.
              Kein background auf dem Wrapper — der Body-Gradient muss durchscheinen.
            </p>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Klasse', 'Max-Width', 'Verwenden für'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '6px 12px 6px 0',
                      color: 'var(--text-tertiary)', fontWeight: 600, fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['content-max',    '1400px', 'Dashboard, Audit, Settings, Knowledge, Projects'],
                  ['content-narrow', '720px',  'Login, Onboarding, Forgot-Password'],
                  ['content-wide',   '1400px', 'Alias für content-max — backwards compat, nicht neu verwenden'],
                  ['content-full',   '100%',   'Chat-Interface, Full-Bleed-Layouts'],
                ].map(([cls, width, usage]) => (
                  <tr key={cls} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '8px 12px 8px 0' }}>
                      <code className="t-mono" style={{ color: 'var(--accent)' }}>.{cls}</code>
                    </td>
                    <td style={{ padding: '8px 12px 8px 0', color: 'var(--text-secondary)' }}>{width}</td>
                    <td style={{ padding: '8px 0', color: 'var(--text-tertiary)' }}>{usage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <Code>{`// ✅ RICHTIG
<div className="content-max">
  <div className="page-header">…</div>
  {/* content */}
</div>

// ❌ FALSCH — nie manuelles padding, nie background
<div className="content-max" style={{ paddingTop: 32, background: 'var(--bg-base)' }}>
  …
</div>`}
        </Code>
      </Section>

      {/* ══════════════════════════════════════════════════════════════════
          2. PAGE HEADER
      ══════════════════════════════════════════════════════════════════ */}
      <Section title="2. Page Header — Pflicht auf jeder Seite">
        <div className="card">
          <div className="card-body" style={{ padding: 16 }}>
            {/* Beispiel: Standard */}
            <p className="t-label" style={{ marginBottom: 12 }}>Standard</p>
            <div className="page-header" style={{ marginBottom: 0 }}>
              <div className="page-header-text">
                <h1 className="page-header-title">
                  <FolderOpen size={22} color="var(--text-primary)" weight="fill" />
                  Projekte
                </h1>
                <p className="page-header-sub">Alle deine Projekte auf einen Blick</p>
              </div>
              <div className="page-header-actions">
                <button className="btn btn-ghost">
                  <Gear size={14} weight="bold" /> Einstellungen
                </button>
                <button className="btn btn-primary">
                  <Plus size={14} weight="bold" /> Neu
                </button>
              </div>
            </div>
          </div>
        </div>
        <Code>{`<div className="page-header">
  <div className="page-header-text">
    <h1 className="page-header-title">
      {/* Icon: size=22, color="var(--text-primary)", weight="fill" */}
      {/* ❌ KEIN var(--accent) für H1-Icons */}
      <FolderOpen size={22} color="var(--text-primary)" weight="fill" />
      Seitentitel
    </h1>
    <p className="page-header-sub">Untertitel</p>
  </div>
  <div className="page-header-actions">
    <button className="btn btn-ghost">Einstellungen</button>
    <button className="btn btn-primary">+ Neu</button>
  </div>
</div>
{/* page-header hat automatisch margin-bottom: 32px */}`}
        </Code>
      </Section>

      {/* ══════════════════════════════════════════════════════════════════
          3. BUTTONS
      ══════════════════════════════════════════════════════════════════ */}
      <Section title="3. Buttons">
        <Row label="Varianten">
          <button className="btn btn-primary">
            <Plus size={14} weight="bold" /> Primary
          </button>
          <button className="btn btn-ghost">
            <Gear size={14} weight="bold" /> Ghost
          </button>
          <button className="btn btn-danger">
            <Trash size={14} weight="bold" /> Danger
          </button>
          <button className="btn btn-primary" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
            Disabled
          </button>
        </Row>
        <Row label="Größen">
          <button className="btn btn-primary">Standard (13px)</button>
          <button className="btn btn-sm btn-ghost">Small (12px)</button>
          <button className="btn-icon" aria-label="Einstellungen">
            <Gear size={16} weight="bold" />
          </button>
          <button className="btn-icon" aria-label="Mehr Optionen">
            <DotsThree size={16} weight="bold" />
          </button>
        </Row>
        <Code>{`<button className="btn btn-primary">
  <Plus size={14} weight="bold" /> Neu
</button>
<button className="btn btn-ghost">Ghost</button>
<button className="btn btn-danger">Löschen</button>
<button className="btn btn-sm btn-ghost">Klein</button>
<button className="btn-icon" aria-label="Einstellungen">
  <Gear size={16} weight="bold" />
</button>

{/* ❌ FALSCH — nie eigene button-styles */}
<button style={{ background: '#2D7A50', color: '#fff', padding: '8px 16px' }}>
  Falsch
</button>`}
        </Code>
      </Section>

      {/* ══════════════════════════════════════════════════════════════════
          4. CARDS
      ══════════════════════════════════════════════════════════════════ */}
      <Section title="4. Cards">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Standard Card mit Header */}
          <div>
            <p className="t-label" style={{ marginBottom: 10 }}>Mit Header</p>
            <div className="card">
              <div className="card-header">
                <span className="card-header-label">
                  <Brain size={12} weight="bold" /> Quellen
                </span>
                <button className="btn btn-sm btn-ghost">
                  <Plus size={12} weight="bold" /> Hinzufügen
                </button>
              </div>
              <div className="card-body">
                <span className="card-section-label">Aktiv</span>
                <button className="list-row list-row--active">
                  Produkthandbuch 2026
                  <span className="badge">42</span>
                </button>
                <button className="list-row">
                  Markenrichtlinien
                  <span className="badge">18</span>
                </button>
                <div className="card-divider" />
                <span className="card-section-label">Archiviert</span>
                <button className="list-row">
                  Alte Preisliste 2024
                  <span className="badge">7</span>
                </button>
                <button className="list-row list-row--add">
                  <Plus size={14} weight="bold" /> Neue Quelle
                </button>
              </div>
            </div>
          </div>

          {/* Flat Card */}
          <div>
            <p className="t-label" style={{ marginBottom: 10 }}>Ohne Header (flat content)</p>
            <div className="card">
              <div className="card-body" style={{ padding: 16 }}>
                <h3 style={{ margin: '0 0 8px' }}>Projekt-Gedächtnis</h3>
                <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: '0 0 16px', lineHeight: 1.6 }}>
                  Akkumuliert automatisch Key Insights aus deinen Chats.
                  Warnung bei 85% Context-Auslastung.
                </p>
                <button className="btn btn-ghost" style={{ width: '100%' }}>
                  <Download size={14} weight="bold" /> Zusammenfassung exportieren
                </button>
              </div>
            </div>
          </div>
        </div>
        <Code>{`{/* ✅ RICHTIG — immer className="card" */}
<div className="card">
  <div className="card-header">
    <span className="card-header-label">Titel</span>
    <button className="btn btn-sm btn-ghost">Aktion</button>
  </div>
  <div className="card-body">
    <span className="card-section-label">Abschnitt</span>
    {/* list-rows */}
    <div className="card-divider" />
  </div>
</div>

{/* ❌ FALSCH — nie eigene box-styles */}
<div style={{ background: 'rgba(255,255,255,0.72)', borderRadius: 12, border: '1px solid ...' }}>
  …
</div>`}
        </Code>
      </Section>

      {/* ══════════════════════════════════════════════════════════════════
          5. LIST ROWS
      ══════════════════════════════════════════════════════════════════ */}
      <Section title="5. List Rows">
        <div style={{ maxWidth: 360 }}>
          <div className="card">
            <div className="card-body">
              <button className="list-row list-row--active">
                <ChatCircle size={14} weight="fill" />
                Aktiver Eintrag
                <span className="badge">3</span>
              </button>
              <button className="list-row">
                <FolderOpen size={14} weight="bold" />
                Normaler Eintrag
              </button>
              <button className="list-row">
                Nur Text
                <span className="badge">12</span>
              </button>
              <div className="card-divider" />
              <button className="list-row list-row--add">
                <Plus size={14} weight="bold" /> Hinzufügen
              </button>
            </div>
          </div>
        </div>
        <Code>{`<button className="list-row list-row--active">
  <Icon size={14} weight="fill" />
  Aktiver Eintrag
  <span className="badge">3</span>
</button>
<button className="list-row">Normaler Eintrag</button>
<button className="list-row list-row--add">
  <Plus size={14} weight="bold" /> Hinzufügen
</button>`}
        </Code>
      </Section>

      {/* ══════════════════════════════════════════════════════════════════
          6. CHIPS / FILTER-PILLS
      ══════════════════════════════════════════════════════════════════ */}
      <Section title="6. Chips / Filter-Pills">
        <Row label="Zustände">
          <div className="chip chip--active">Alle</div>
          <div className="chip">Entwurf</div>
          <div className="chip">Aktiv</div>
          <div className="chip">Archiviert</div>
        </Row>
        <Row label="Als Tabs / Filter-Leiste">
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <div className="chip chip--active">
              <List size={12} weight="bold" style={{ marginRight: 4 }} /> Liste
            </div>
            <div className="chip">
              <GridFour size={12} weight="bold" style={{ marginRight: 4 }} /> Kacheln
            </div>
          </div>
        </Row>
        <Code>{`<div className="chip chip--active">Aktiv</div>
<div className="chip">Inaktiv</div>

{/* Mit Icon */}
<div className="chip chip--active">
  <List size={12} weight="bold" /> Liste
</div>`}
        </Code>
      </Section>

      {/* ══════════════════════════════════════════════════════════════════
          7. BADGES (Status)
      ══════════════════════════════════════════════════════════════════ */}
      <Section title="7. Badges — Status-Labels">
        <Row label="Semantische Varianten">
          <span className="badge badge--success">Aktiv</span>
          <span className="badge badge--warning">Ausstehend</span>
          <span className="badge badge--error">Fehler</span>
          <span className="badge badge--info">Info</span>
          <span className="badge badge--neutral">Archiviert</span>
          <span className="badge">Standard</span>
        </Row>
        <Code>{`<span className="badge badge--success">Aktiv</span>
<span className="badge badge--warning">Ausstehend</span>
<span className="badge badge--error">Fehler</span>
<span className="badge badge--info">Info</span>
<span className="badge badge--neutral">Archiviert</span>
<span className="badge">Standard (Zähler)</span>`}
        </Code>
      </Section>

      {/* ══════════════════════════════════════════════════════════════════
          8. INPUTS
      ══════════════════════════════════════════════════════════════════ */}
      <Section title="8. Inputs">
        <div style={{ maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label htmlFor="ref-input-1" style={{ fontSize: 13, fontWeight: 500,
              color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              Standard Input
            </label>
            <input
              id="ref-input-1"
              className="input"
              placeholder="Placeholder-Text…"
              type="text"
            />
          </div>
          <div>
            <label htmlFor="ref-input-2" style={{ fontSize: 13, fontWeight: 500,
              color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              Disabled
            </label>
            <input
              id="ref-input-2"
              className="input"
              placeholder="Nicht editierbar"
              disabled
            />
          </div>
          <div>
            <label htmlFor="ref-textarea" style={{ fontSize: 13, fontWeight: 500,
              color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              Textarea
            </label>
            <textarea
              id="ref-textarea"
              className="input"
              placeholder="Mehrzeiliger Text…"
              rows={3}
              style={{ resize: 'vertical' }}
            />
          </div>
        </div>
        <Code>{`{/* Label + Input immer zusammen — für Accessibility */}
<label htmlFor="field-id" style={{ fontSize: 13, fontWeight: 500,
  color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
  Label
</label>
<input id="field-id" className="input" placeholder="…" type="text" />

{/* Textarea */}
<textarea className="input" rows={3} style={{ resize: 'vertical' }} />

{/* ❌ FALSCH — nie eigene input-styles */}
<input style={{ border: '1px solid #ccc', borderRadius: 8, padding: '8px 12px' }} />`}
        </Code>
      </Section>

      {/* ══════════════════════════════════════════════════════════════════
          9. DROPDOWN
      ══════════════════════════════════════════════════════════════════ */}
      <Section title="9. Dropdown">
        <div style={{ maxWidth: 240 }}>
          <div className="dropdown animate-dropdown">
            <button className="dropdown-item">
              <User size={14} weight="bold" /> Profil bearbeiten
            </button>
            <button className="dropdown-item dropdown-item--active">
              <Bell size={14} weight="bold" /> Benachrichtigungen
            </button>
            <div className="dropdown-divider" />
            <button className="dropdown-item">
              <Download size={14} weight="bold" /> Exportieren
            </button>
            <div className="dropdown-divider" />
            <button className="dropdown-item dropdown-item--danger">
              <Trash size={14} weight="bold" /> Löschen
            </button>
          </div>
        </div>
        <Code>{`<div className="dropdown">
  <button className="dropdown-item">
    <Icon size={14} weight="bold" /> Aktion
  </button>
  <button className="dropdown-item dropdown-item--active">Aktiv</button>
  <div className="dropdown-divider" />
  <button className="dropdown-item dropdown-item--danger">
    <Trash size={14} weight="bold" /> Löschen
  </button>
</div>`}
        </Code>
      </Section>

      {/* ══════════════════════════════════════════════════════════════════
          10. ICONS — REGELN
      ══════════════════════════════════════════════════════════════════ */}
      <Section title="10. Icons — Regeln">
        <div className="card">
          <div className="card-body" style={{ padding: 16 }}>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Kontext', 'Größe', 'Weight', 'Farbe'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '6px 12px 6px 0',
                      color: 'var(--text-tertiary)', fontWeight: 600, fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['NavBar', '18px', 'bold', 'var(--text-secondary)'],
                  ['Page-Header H1', '22px', 'fill', 'var(--text-primary) ← nie var(--accent)'],
                  ['Cards / Listen', '16px', 'bold oder fill', 'var(--text-secondary)'],
                  ['Inline / Button', '14px', 'bold', 'erbt vom Parent'],
                  ['Status / CTA', '16px', 'fill', 'var(--accent) oder semantisch'],
                ].map(([ctx, size, weight, color]) => (
                  <tr key={ctx} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '8px 12px 8px 0', color: 'var(--text-primary)', fontWeight: 500 }}>{ctx}</td>
                    <td style={{ padding: '8px 12px 8px 0', color: 'var(--text-secondary)' }}>{size}</td>
                    <td style={{ padding: '8px 12px 8px 0', color: 'var(--text-secondary)' }}>{weight}</td>
                    <td style={{ padding: '8px 0', color: 'var(--text-tertiary)', fontSize: 12 }}>{color}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <Row label="Erlaubte Weights (bold + fill)">
          <House size={20} weight="bold" color="var(--text-primary)" />
          <House size={20} weight="fill" color="var(--accent)" />
          <Gear size={20} weight="bold" color="var(--text-secondary)" />
          <Brain size={20} weight="fill" color="var(--accent)" />
          <Leaf size={20} weight="fill" color="var(--active-bg)" />
        </Row>
        <Code>{`{/* ✅ RICHTIG */}
import { House, Gear } from '@phosphor-icons/react'

<House size={22} color="var(--text-primary)" weight="fill" />  // H1
<Gear  size={16} color="var(--text-secondary)" weight="bold" /> // Card

{/* ❌ FALSCH */}
import { HomeIcon } from '@heroicons/react/24/outline'  // verbotene Library
<House size={22} weight="duotone" />                    // verbotenes Weight
<House size={22} color="#2D7A50" />                     // Hex statt CSS-Variable`}
        </Code>
      </Section>

      {/* ══════════════════════════════════════════════════════════════════
          11. FARBEN — CSS VARIABLEN
      ══════════════════════════════════════════════════════════════════ */}
      <Section title="11. Farben — CSS-Variablen (nie Hex hardcoden)">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
          {[
            { var: '--bg-base',       hex: '#EAE9E5',             label: 'Background' },
            { var: '--bg-surface',    hex: 'rgba(255,255,255,.8)', label: 'Surface / Card' },
            { var: '--text-primary',  hex: '#1A1714',             label: 'Text Primary' },
            { var: '--text-secondary',hex: '#4A4540',             label: 'Text Secondary' },
            { var: '--text-tertiary', hex: '#6B6560',             label: 'Text Tertiary' },
            { var: '--accent',        hex: '#2D7A50',             label: 'Akzent Grün' },
            { var: '--accent-light',  hex: '#D4EDDE',             label: 'Akzent Hell' },
            { var: '--active-bg',     hex: '#1A2E23',             label: 'Active / Selected' },
            { var: '--error',         hex: '#C0392B',             label: 'Error' },
            { var: '--warning',       hex: '#C07A2A',             label: 'Warning' },
          ].map(({ var: v, hex, label }) => (
            <div key={v} style={{ display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 12px', background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <div style={{
                width: 28, height: 28, borderRadius: 'var(--radius-sm)',
                background: `var(${v})`,
                border: '1px solid var(--border-medium)',
                flexShrink: 0,
              }} />
              <div>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {label}
                </p>
                <code className="t-mono" style={{ color: 'var(--text-tertiary)', fontSize: 10 }}>
                  var({v})
                </code>
              </div>
            </div>
          ))}
        </div>
        <Code>{`{/* ✅ RICHTIG — immer CSS-Variablen */}
style={{ color: 'var(--text-primary)' }}
style={{ background: 'var(--accent)' }}
style={{ borderColor: 'var(--border-medium)' }}

{/* ❌ VERBOTEN — nie Hex-Werte */}
style={{ color: '#1A1714' }}           // verwende var(--text-primary)
style={{ background: '#2D7A50' }}      // verwende var(--accent)
style={{ background: '#a3b554' }}      // altes Grün — komplett abgelöst
className="bg-[#a3b554]"              // auch in Tailwind verboten`}
        </Code>
      </Section>

      {/* ══════════════════════════════════════════════════════════════════
          12. TYPOGRAFIE
      ══════════════════════════════════════════════════════════════════ */}
      <Section title="12. Typografie">
        <div className="card">
          <div className="card-body" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <p className="t-label" style={{ marginBottom: 6 }}>Display / H1 (page-header-title)</p>
              <h1 className="page-header-title" style={{ margin: 0 }}>Seitentitel Display</h1>
            </div>
            <div className="card-divider" />
            <div>
              <p className="t-label" style={{ marginBottom: 6 }}>H2</p>
              <h2 style={{ margin: 0 }}>Abschnittstitel H2</h2>
            </div>
            <div className="card-divider" />
            <div>
              <p className="t-label" style={{ marginBottom: 6 }}>H3</p>
              <h3 style={{ margin: 0 }}>Unterabschnitt H3</h3>
            </div>
            <div className="card-divider" />
            <div>
              <p className="t-label" style={{ marginBottom: 6 }}>Body (14px) + t-secondary</p>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                Fließtext in der Standardgröße. Zeilenhöhe 1.6. Mindestgröße 12px.
              </p>
            </div>
            <div className="card-divider" />
            <div>
              <p className="t-label" style={{ marginBottom: 6 }}>Label-Klasse (.t-label)</p>
              <span className="t-label">Abschnittsbezeichnung</span>
            </div>
            <div className="card-divider" />
            <div>
              <p className="t-label" style={{ marginBottom: 6 }}>Mono (.t-mono)</p>
              <span className="t-mono">const value = 42 // JetBrains Mono</span>
            </div>
          </div>
        </div>
        <Code>{`<h1 className="page-header-title">Seitentitel</h1>  // Plus Jakarta Sans 800
<h2>Abschnittstitel</h2>                              // Inter 500
<h3>Unterabschnitt</h3>                               // Inter 500
<p style={{ color: 'var(--text-secondary)' }}>Text</p>
<span className="t-label">Label</span>                // 11px uppercase
<span className="t-mono">code</span>                  // JetBrains Mono 12px`}
        </Code>
      </Section>

      {/* ══════════════════════════════════════════════════════════════════
          13. SKELETON LOADING
      ══════════════════════════════════════════════════════════════════ */}
      <Section title="13. Skeleton Loading">
        <div style={{ maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="skeleton" style={{ height: 20, borderRadius: 'var(--radius-sm)' }} />
          <div className="skeleton" style={{ height: 16, width: '70%', borderRadius: 'var(--radius-sm)' }} />
          <div className="skeleton" style={{ height: 16, width: '50%', borderRadius: 'var(--radius-sm)' }} />
        </div>
        <Code>{`{/* Loading-State mit Skeleton */}
{isLoading ? (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    <div className="skeleton" style={{ height: 20 }} />
    <div className="skeleton" style={{ height: 16, width: '70%' }} />
  </div>
) : (
  <p>{content}</p>
)}`}
        </Code>
      </Section>

      {/* ══════════════════════════════════════════════════════════════════
          14. MODALS / DRAWERS — BACKDROP STANDARD
      ══════════════════════════════════════════════════════════════════ */}
      <Section title="14. Modals & Drawers — Backdrop Standard">
        <div className="card">
          <div className="card-body" style={{ padding: 16 }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 16px', lineHeight: 1.6 }}>
              Alle Backdrops verwenden <strong>rgba(26,23,20,0.45) + blur(2px)</strong> — nie rgba(0,0,0,...).
              Zwei Klassen: <code className="t-mono">.modal-backdrop</code> für reine Backdrop-Divs,
              <code className="t-mono">.modal-overlay</code> für Backdrop + zentrierten Inhalt.
            </p>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Klasse', 'Verwendung'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '6px 12px 6px 0',
                      color: 'var(--text-tertiary)', fontWeight: 600, fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['.modal-backdrop', 'Reines Backdrop-Div — kein Inhalt darin; zIndex via inline style'],
                  ['.modal-overlay',  'Backdrop + flex center für zentrierte Modals; default z-index: 400'],
                ].map(([cls, usage]) => (
                  <tr key={cls} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '8px 12px 8px 0' }}>
                      <code className="t-mono" style={{ color: 'var(--accent)' }}>{cls}</code>
                    </td>
                    <td style={{ padding: '8px 0', color: 'var(--text-secondary)' }}>{usage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <Code>{`{/* ✅ Reines Backdrop (Drawer/Panel) */}
<div className="modal-backdrop" style={{ zIndex: 200 }} onClick={onClose} />
<div role="dialog" style={{ position: 'fixed', top: 0, right: 0, ... }}>Panel</div>

{/* ✅ Zentrierter Modal */}
<div className="modal-overlay" style={{ zIndex: 300 }} onClick={onClose}>
  <div onClick={e => e.stopPropagation()}>Modal-Inhalt</div>
</div>

{/* ✅ Drawer mit flex-end — kein modal-overlay möglich */}
<div style={{
  position: 'fixed', inset: 0,
  background: 'rgba(26,23,20,0.45)',
  backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)',
  zIndex: 100, display: 'flex', alignItems: 'stretch', justifyContent: 'flex-end'
}} onClick={onClose}>

{/* ❌ FALSCH — nie schwarze Backdrops */}
<div style={{ background: 'rgba(0,0,0,0.4)' }} />
<div style={{ background: 'rgba(0,0,0,0.5)' }} />`}
        </Code>
      </Section>

      {/* ══════════════════════════════════════════════════════════════════
          15. CHAT INPUT — DESKTOP LAYOUT
      ══════════════════════════════════════════════════════════════════ */}
      <Section title="15. Chat Input — Desktop Layout">
        <div className="card">
          <div className="card-body" style={{ padding: 16 }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 12px', lineHeight: 1.6 }}>
              Chat-Eingabe ist auf Desktop auf <strong>760px zentriert</strong>.
              Äußerer <code className="t-mono">.carea-input-wrap</code> spannt volle Breite,
              innerer <code className="t-mono">.carea-input-inner</code> begrenzt auf max 760px.
            </p>
          </div>
        </div>
        <Code>{`{/* ✅ RICHTIG */}
<div className="carea-input-wrap">
  <div className="carea-input-inner">
    <ChatInput ... />
    <p className="chat-ai-disclaimer">…</p>
  </div>
</div>

{/* ❌ FALSCH — maxWidth direkt am wrap */}
<div className="carea-input-wrap" style={{ maxWidth: 760 }}>
  <ChatInput />
</div>`}
        </Code>
      </Section>

      {/* ══════════════════════════════════════════════════════════════════
          16. KARTEN-AKTIONEN & ICON-STANDARD
      ══════════════════════════════════════════════════════════════════ */}
      <Section title="16. Karten-Aktionen & Icon-Standard">
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <span className="card-header-label">Verbindliche Regel</span>
          </div>
          <div className="card-body" style={{ padding: 16 }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 12px', lineHeight: 1.6 }}>
              <strong>Trash / Löschen niemals direkt auf der Karte.</strong> Immer im [···] Menü.
              Hover-Aktionen (Download, Öffnen) dürfen direkt auf der Karte erscheinen — opacity: 0 → 1.
            </p>
          </div>
        </div>

        {/* Ruhezustand */}
        <p className="t-label" style={{ marginBottom: 8 }}>Ruhezustand</p>
        <div style={{ maxWidth: 300, marginBottom: 20 }}>
          <div className="card" style={{ padding: '14px 16px' }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>Projektname</div>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>vor 2 Std. · 3 Chats</div>
          </div>
        </div>

        {/* Hover mit Aktionen */}
        <p className="t-label" style={{ marginBottom: 8 }}>Hover — Aktionen sichtbar</p>
        <div style={{ maxWidth: 300, marginBottom: 20 }}>
          <div className="card" style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>Projektname</div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>vor 2 Std. · 3 Chats</div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="btn-icon" title="Download" aria-label="Download">
                  <DownloadSimple size={14} weight="bold" />
                </button>
                <button className="btn-icon" title="Mehr" aria-label="Mehr Optionen">
                  <DotsThree size={14} weight="bold" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* [···] Menü */}
        <p className="t-label" style={{ marginBottom: 8 }}>[···] Menü — Standard-Inhalt</p>
        <div style={{ maxWidth: 220, marginBottom: 20 }}>
          <div className="dropdown">
            <button className="dropdown-item">
              <PencilSimple size={14} weight="bold" /> Bearbeiten
            </button>
            <button className="dropdown-item">
              <Archive size={14} weight="bold" /> Archivieren
            </button>
            <button className="dropdown-item">
              <Copy size={14} weight="bold" /> Duplizieren
            </button>
            <div className="dropdown-divider" />
            <button className="dropdown-item dropdown-item--danger">
              <Trash size={14} weight="bold" /> Löschen
            </button>
          </div>
        </div>

        {/* Icon-Tabelle */}
        <p className="t-label" style={{ marginBottom: 8 }}>Icon-Zuordnung (verbindlich)</p>
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-body" style={{ padding: 16 }}>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Aktion', 'Icon', 'Wo'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '6px 12px 6px 0',
                      color: 'var(--text-tertiary)', fontWeight: 600, fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Öffnen',      'ArrowSquareOut', 'Karte hover'],
                  ['Bearbeiten',  'PencilSimple',   '[···] Menü'],
                  ['Archivieren', 'Archive',        '[···] Menü'],
                  ['Duplizieren', 'Copy',           '[···] Menü'],
                  ['Löschen 🔴',  'Trash',          '[···] Menü — danger'],
                  ['Download',    'DownloadSimple', 'Karte hover'],
                  ['In Chat',     'ChatCircle',     'Karte hover'],
                  ['Neu',         'Plus',           'page-header-actions'],
                  ['Suchen',      'MagnifyingGlass','Filter-Bar'],
                  ['Schließen',   'X',              'Modal oben rechts'],
                  ['Speichern',   'FloppyDisk',     'Button mit Label'],
                  ['Teilen',      'ShareNetwork',   '[···] Menü'],
                ].map(([action, icon, where]) => (
                  <tr key={action} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '6px 12px 6px 0', color: 'var(--text-primary)' }}>{action}</td>
                    <td style={{ padding: '6px 12px 6px 0' }}>
                      <code className="t-mono" style={{ color: 'var(--accent)', fontSize: 11 }}>{icon}</code>
                    </td>
                    <td style={{ padding: '6px 0', color: 'var(--text-tertiary)', fontSize: 12 }}>{where}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <Code>{`{/* ✅ RICHTIG — Hover-Aktionen + [···] Menü */}
<div className="card" style={{ padding: '14px 16px' }}>
  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
    <div>{/* Titel + Meta */}</div>
    <div className="card-actions">           {/* opacity: 0, card:hover → opacity: 1 */}
      <button className="btn-icon" title="Download">
        <DownloadSimple size={14} weight="bold" />
      </button>
      <button className="btn-icon" title="Mehr">
        <DotsThree size={14} weight="bold" />
      </button>
    </div>
  </div>
</div>

{/* ✅ RICHTIG — Löschen im Menü, mit danger */}
<button className="dropdown-item dropdown-item--danger">
  <Trash size={14} weight="bold" /> Löschen
</button>

{/* ❌ FALSCH — Trash direkt auf Karte */}
<button className="btn-icon" onClick={handleDelete}>
  <Trash size={14} weight="bold" />
</button>`}
        </Code>
      </Section>

      {/* ══════════════════════════════════════════════════════════════════
          17. ANIMATIONS
      ══════════════════════════════════════════════════════════════════ */}
      <Section title="17. Animationen">
        <Row label="Einblenden (.animate-in)">
          <div className="card animate-in" style={{ padding: 16 }}>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
              fadeIn — 200ms ease
            </p>
          </div>
        </Row>
        <Row label="Dropdown (.animate-dropdown)">
          <div className="dropdown animate-dropdown" style={{ padding: 8, maxWidth: 200 }}>
            <button className="dropdown-item">slideDown — 150ms</button>
          </div>
        </Row>
        <Code>{`{/* Einblenden */}
<div className="animate-in">Erscheint beim Mount</div>

{/* Dropdown */}
{isOpen && (
  <div className="dropdown animate-dropdown">
    …
  </div>
)}

{/* Drawer — immer 200ms ease-out */}
style={{ transition: 'transform 200ms ease-out' }}`}
        </Code>
      </Section>

      {/* ══════════════════════════════════════════════════════════════════
          18. FILTER-BAR — SUCHFELD + CHIPS-LAYOUT
      ══════════════════════════════════════════════════════════════════ */}
      <Section title="18. Filter-Bar — Suchfeld + Chips-Layout (Konsistenz-Standard)">
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <span className="card-header-label">Verbindliche Regel</span>
          </div>
          <div className="card-body" style={{ padding: 16 }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 12px', lineHeight: 1.6 }}>
              <strong>Suchfeld max-width: 400px.</strong> Chips/Filter-Pills <strong>immer darunter</strong> —
              niemals in einer Zeile neben dem Suchfeld. Beide Elemente haben Klassen aus globals.css.
            </p>
            {/* Live-Beispiel */}
            <div className="search-bar-container" style={{ marginBottom: 12 }}>
              <MagnifyingGlass
                size={14}
                weight="bold"
                color="var(--text-tertiary)"
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              />
              <input
                className="input"
                placeholder="Suchen…"
                style={{ paddingLeft: 34 }}
              />
            </div>
            <div className="page-filter-row">
              <button className="chip chip--active">Alle</button>
              <button className="chip">Entwurf</button>
              <button className="chip">Aktiv</button>
              <button className="chip">Archiviert</button>
            </div>
          </div>
        </div>
        <Code>{`{/* ✅ RICHTIG — Suchfeld + Chips darunter */}
<div className="search-bar-container">
  <MagnifyingGlass
    size={14} weight="bold" color="var(--text-tertiary)"
    style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
  />
  <input className="input" placeholder="Suchen…" style={{ paddingLeft: 34 }} />
</div>
<div className="page-filter-row">
  <button className="chip chip--active">Alle</button>
  <button className="chip">Kategorie A</button>
</div>

{/* ❌ FALSCH — Chips neben dem Suchfeld */}
<div style={{ display: 'flex', gap: 8 }}>
  <input style={{ flex: 1 }} placeholder="Suchen…" />
  <button className="chip chip--active">Alle</button>
</div>

{/* ❌ FALSCH — Suchfeld 100% breit */}
<input style={{ width: '100%' }} placeholder="Suchen…" />`}
        </Code>

        {/* Scrollbar-Standard */}
        <div className="card" style={{ marginTop: 24 }}>
          <div className="card-header">
            <span className="card-header-label">Dezente Scrollbars (global)</span>
          </div>
          <div className="card-body" style={{ padding: 16 }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
              Globale Scrollbars: <code className="t-mono">scrollbar-width: thin</code> (Firefox)
              und <code className="t-mono">4px</code> Scrollbar-Track/Thumb (WebKit).
              Farbe: <code className="t-mono">var(--border)</code> / <code className="t-mono">var(--text-tertiary)</code>.
              Kein manuelles Überschreiben pro Komponente nötig — gilt automatisch via globals.css.
            </p>
          </div>
        </div>
        <Code>{`/* globals.css — global, kein Override nötig */
* {
  scrollbar-width: thin;
  scrollbar-color: var(--text-tertiary) transparent;
}
*::-webkit-scrollbar { width: 4px; height: 4px; }
*::-webkit-scrollbar-track { background: transparent; }
*::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
*::-webkit-scrollbar-thumb:hover { background: var(--text-tertiary); }`}
        </Code>
      </Section>

      {/* ══════════════════════════════════════════════════════════════════
          19. EMPTY STATES
      ══════════════════════════════════════════════════════════════════ */}
      <Section title="19. Empty States — Standard-Pattern">
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-body" style={{ padding: 40, textAlign: 'center' }}>
            <ChatCircle size={32} weight="fill" color="var(--text-tertiary)" aria-hidden="true" />
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: '12px 0 6px' }}>
              Noch keine Chats
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: '0 0 16px', lineHeight: 1.5 }}>
              Starte ein neues Gespräch um loszulegen.
            </p>
            <button className="btn btn-primary">
              <Plus size={14} weight="bold" /> Neuen Chat starten
            </button>
          </div>
        </div>
        <Code>{`{/* Empty State — verbindliches Pattern */}
{items.length === 0 && (
  <div style={{ padding: '48px 24px', textAlign: 'center' }}>
    <IconName size={32} weight="fill" color="var(--text-tertiary)" aria-hidden="true" />
    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: '12px 0 6px' }}>
      Noch keine [Entitäten]
    </p>
    <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: '0 0 16px', lineHeight: 1.5 }}>
      Erklärungstext was diese Entität ist + was man jetzt tun kann.
    </p>
    <button className="btn btn-primary">
      <Plus size={14} weight="bold" /> [Neue Entität] erstellen
    </button>
  </div>
)}

{/* Regeln:
  - Icon: 32px, weight="fill", color="var(--text-tertiary)"
  - Titel: 14px, fontWeight 600, color="var(--text-primary)"
  - Beschreibung: 13px, color="var(--text-tertiary)", lineHeight 1.5
  - CTA: btn btn-primary mit Plus-Icon
  - KEIN btn-ghost als primäre Aktion im Empty State
*/}`}
        </Code>
      </Section>

      {/* ══════════════════════════════════════════════════════════════════
          20. SECTION-TAG — Eyebrow Label (Landing Page Standard)
      ══════════════════════════════════════════════════════════════════ */}
      <Section title="20. Section-Tag — Eyebrow Label">
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-body" style={{ padding: 24 }}>
            <p className="t-label" style={{ marginBottom: 16 }}>Vor jeder Section-Headline — helles Layout</p>
            {/* Live-Beispiel helles Layout */}
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 12,
              fontFamily: 'var(--font-mono, monospace)', fontSize: 12,
              color: 'var(--accent)', marginBottom: 12, letterSpacing: '0.02em',
            }}>
              <span style={{ width: 28, height: 1, background: 'rgba(45,122,80,0.3)', flexShrink: 0 }} />
              Was wir finden
            </span>
            <h2 style={{ margin: 0, fontSize: 28, fontFamily: 'var(--font-display, "Plus Jakarta Sans", sans-serif)', fontWeight: 700 }}>
              Section Headline
            </h2>
          </div>
        </div>
        <Code>{`{/* ✅ Section-Tag vor Headline — helles Layout */}
<span style={{
  display: 'inline-flex', alignItems: 'center', gap: 12,
  fontFamily: 'var(--font-mono, monospace)', fontSize: 12,
  color: 'var(--accent)', marginBottom: 20, letterSpacing: '0.02em',
}}>
  <span style={{ width: 28, height: 1, background: 'rgba(45,122,80,0.3)', flexShrink: 0 }} />
  Deine Projekte
</span>

{/* ✅ Section-Tag — dunkles Layout (auf var(--active-bg)) */}
<span style={{
  display: 'inline-flex', alignItems: 'center', gap: 12,
  fontFamily: 'var(--font-mono, monospace)', fontSize: 12,
  color: 'rgba(77,184,122,0.85)', marginBottom: 20, letterSpacing: '0.02em',
}}>
  <span style={{ width: 28, height: 1, background: 'rgba(77,184,122,0.3)', flexShrink: 0 }} />
  EU-Compliance
</span>

{/* ❌ FALSCH — Section ohne Tag */}
<h2>Was wir finden</h2>`}
        </Code>
      </Section>

      {/* ══════════════════════════════════════════════════════════════════
          21. DUNKLE SECTIONS (Hero / CTA-Bereiche)
      ══════════════════════════════════════════════════════════════════ */}
      <Section title="21. Dunkle Sections — Hero & CTA">
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-body" style={{ padding: 16 }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 12px', lineHeight: 1.6 }}>
              Dunkle Sections verwenden <code className="t-mono">var(--active-bg)</code> (#1A2E23).
              Volle Viewport-Breite mit negativem Margin-Trick. Maximal 3 dunkle Sections pro Seite.
              Nie zwei dunkle Sections direkt hintereinander.
            </p>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <tbody>
                {[
                  ['Hintergrund',  'var(--active-bg)   → #1A2E23'],
                  ['Text',         '#ffffff'],
                  ['Subtext',      'rgba(255,255,255,0.7)'],
                  ['Tag-Farbe',    'rgba(77,184,122,0.85)'],
                  ['Section-Pad',  '80px vertikal (Desktop), 48px (Mobile)'],
                ].map(([k, v]) => (
                  <tr key={k} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '6px 12px 6px 0', fontWeight: 600, color: 'var(--text-secondary)', width: 140 }}>{k}</td>
                    <td style={{ padding: '6px 0' }}><code className="t-mono" style={{ color: 'var(--accent)' }}>{v}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <Code>{`{/* ✅ Dunkle Section — volle Breite */}
<section style={{
  background: 'var(--active-bg)',
  padding: '80px 0',
  width: '100vw',
  marginLeft: 'calc(-50vw + 50%)',
}}>
  <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 clamp(20px, 5vw, 56px)' }}>
    {/* Section-Tag */}
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 12,
      fontFamily: 'var(--font-mono, monospace)', fontSize: 12,
      color: 'rgba(77,184,122,0.85)', marginBottom: 20,
    }}>
      <span style={{ width: 28, height: 1, background: 'rgba(77,184,122,0.3)', flexShrink: 0 }} />
      EU-Compliance
    </span>
    <h2 style={{
      fontFamily: 'var(--font-display, "Plus Jakarta Sans", sans-serif)',
      fontWeight: 800, color: '#ffffff',
    }}>
      Headline
    </h2>
  </div>
</section>

{/* Streifenrhythmus: dunkel → hell → dunkel → hell → dunkel
    Nie zwei dunkle Sections direkt hintereinander */}`}
        </Code>
      </Section>

      {/* ══════════════════════════════════════════════════════════════════
          22. NUMMERIERTE FEATURE-LISTE
      ══════════════════════════════════════════════════════════════════ */}
      <Section title="22. Nummerierte Feature-Liste">
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-body" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
            {[
              { n: '01', title: 'Projekt verbinden', desc: 'Ordner auswählen — dein Code bleibt lokal.' },
              { n: '02', title: 'Scan in 60 Sekunden', desc: '25 Kategorien. 195 Regeln.' },
              { n: '03', title: 'Aufgaben für deine KI', desc: 'Jedes Finding wird zum kopierbaren Prompt.' },
            ].map(({ n, title, desc }) => (
              <div key={n} style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-tertiary)', minWidth: 28, flexShrink: 0 }}>
                  {n}
                </span>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px' }}>{title}</h3>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <Code>{`{/* ✅ Nummerierte Feature-Liste — statt Icon-Karten */}
<div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
  <span style={{
    fontSize: 14, fontWeight: 500,
    color: 'var(--text-tertiary)', minWidth: 28, flexShrink: 0,
  }}>01</span>
  <div>
    <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px' }}>
      Titel
    </h3>
    <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
      Beschreibung
    </p>
  </div>
</div>

{/* ❌ FALSCH — drei gleiche Boxen mit farbiger Border links
    (das ist das "KI-generiert"-Muster, das wir vermeiden) */}
<div style={{ borderLeft: '3px solid var(--accent)', paddingLeft: 16 }}>…</div>`}
        </Code>
      </Section>

      {/* ══════════════════════════════════════════════════════════════════
          23. SCORE-FARBEN
      ══════════════════════════════════════════════════════════════════ */}
      <Section title="23. Score-Farben">
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-body" style={{ padding: 24 }}>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {[
                { score: '91%', label: 'Production Grade', color: 'var(--accent)',   bg: 'rgba(45,122,80,0.12)' },
                { score: '83%', label: 'Stable',           color: 'var(--accent)',   bg: 'rgba(45,122,80,0.12)' },
                { score: '71%', label: 'Risky',            color: '#E5A000',         bg: 'rgba(229,160,0,0.12)' },
                { score: '42%', label: 'Prototype',        color: 'var(--error)',    bg: 'rgba(192,57,43,0.12)' },
              ].map(({ score, label, color, bg }) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: 40, fontWeight: 800, color, lineHeight: 1, display: 'block' }}>{score}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, color, background: bg, display: 'inline-block', marginTop: 6 }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <Code>{`{/* Score-Farben — verbindliche Zuordnung */}
const STATUS_COLOR = {
  production_grade: 'var(--accent)',   // #2D7A50 grün
  stable:           'var(--accent)',   // #2D7A50 grün
  risky:            '#E5A000',         // amber — NICHT #d97706 oder orange
  prototype:        'var(--error)',    // rot
}

{/* ✅ Score-Anzeige */}
<span style={{ fontSize: 40, fontWeight: 800, color: STATUS_COLOR[status], lineHeight: 1 }}>
  {score}%
</span>`}
        </Code>
      </Section>

    </div>
  )
}
