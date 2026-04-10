import type { Status } from './todo.types'
import { TODOS } from './todoData'

// ── Konstanten & Helpers ───────────────────────────────────────────────────────

export const STATUS_CONFIG: Record<Status, { label: string; bg: string; color: string }> = {
  offen:     { label: 'Bereit',    bg: 'var(--accent-subtle)',  color: 'var(--accent)' },
  in_arbeit: { label: 'In Arbeit', bg: 'var(--accent-subtle)',  color: 'var(--accent)' },
  erledigt:  { label: 'Erledigt',  bg: 'var(--success-bg)',     color: 'var(--success)' },
  blockiert: { label: 'Blockiert', bg: 'var(--error-bg)',       color: 'var(--error)' },
  geplant:   { label: 'Backlog',   bg: 'var(--info-bg)',        color: 'var(--info)' },
  teilweise: { label: 'Teilweise', bg: 'var(--warning-bg)',     color: 'var(--warning)' },
}

export const PRIO_CONFIG: Record<string, { label: string; color: string }> = {
  hoch:     { label: 'Hoch',     color: 'var(--error)' },
  mittel:   { label: 'Mittel',   color: 'var(--warning)' },
  niedrig:  { label: 'Niedrig',  color: 'var(--text-tertiary)' },
}

export const KATEGORIEN = [...new Set(TODOS.map(t => t.kategorie))]

// ── Styles ─────────────────────────────────────────────────────────────────────

export const s: Record<string, React.CSSProperties> = {
  controls:    { display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap', alignItems: 'center' },
  stats:       { display: 'flex', gap: 24, marginBottom: 28, flexWrap: 'wrap' },
  statCard:    { padding: '12px 20px', background: 'var(--bg-surface)', borderRadius: 8, border: '1px solid var(--border)' },
  statValue:   { fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 },
  statLabel:   { fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' },
  section:     { marginBottom: 36 },
  sectionTitle:{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-tertiary)', marginBottom: 12 },
  card:        { background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px', marginBottom: 8 },
  cardHeader:  { display: 'flex', alignItems: 'flex-start', gap: 12, justifyContent: 'space-between' },
  cardTitle:   { fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', flex: 1 },
  cardDesc:    { fontSize: 12, color: 'var(--text-tertiary)', marginTop: 5, lineHeight: 1.5 },
  cardMeta:    { display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' },
  ref:         { fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'monospace' },
  badgeRow:    { display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 },
  empty:       { padding: '32px 0', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 },
}

export function badgeStyle(bg: string, color: string): React.CSSProperties {
  return { fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 4, background: bg, color, whiteSpace: 'nowrap' }
}
