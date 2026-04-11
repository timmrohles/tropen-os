// ── Typen ─────────────────────────────────────────────────────────────────────

export type Status = 'offen' | 'in_arbeit' | 'erledigt' | 'blockiert' | 'geplant' | 'teilweise'

export interface Todo {
  id: string
  titel: string
  beschreibung?: string
  status: Status
  kategorie: string
  prioritaet: 'hoch' | 'mittel' | 'niedrig'
  referenz?: string   // z.B. 'Art. 50 KI-VO', 'WCAG 2.1 AA'
}
