// src/lib/preflight/types.ts
export type Kosten = 'red' | 'yellow'
export type NodeStatus = 'decided' | 'open' | 'na'

// ─── Intake-Pivots (kurze Abfrage vor der Analyse) ──────────────────────────────
export type BuildTool = 'claude-code' | 'cursor' | 'lovable' | 'bolt' | 'other'
export type BusinessModel = 'b2c' | 'b2b' | 'internal'
export type GeoScope = 'eu' | 'non_eu' | 'global' | 'unsure'

export interface PreflightPivots {
  /** Womit gebaut wird → bestimmt das Konventions-Dateiformat (CLAUDE.md / .cursorrules / …). */
  buildTool: BuildTool
  /** B2C / B2B / intern → Verbraucherrecht, BFSG. */
  businessModel: BusinessModel
  /** Wo die Nutzer sitzen → DSGVO-Ableitung. */
  audienceRegion: GeoScope
  /** Wo gehostet wird → Datenresidenz. */
  hosting: GeoScope
  /** Stack (vorausgefüllt aus dem Doc, vom User bestätigt/korrigiert). Freitext. */
  stack: string
}

/** Tool → Konventions-Dateiname. */
export const CONVENTIONS_FILENAME: Record<BuildTool, string> = {
  'claude-code': 'CLAUDE.md',
  cursor: '.cursorrules',
  lovable: 'AGENTS.md',
  bolt: 'AGENTS.md',
  other: 'CONVENTIONS.md',
}

/** Ein Korsett-Knoten (aus Korsett v2). */
export interface KorsettNode {
  id: string
  domain: string
  frage: string
  warum: string
  default: string
  kosten: Kosten
  /** Knoten gilt nur, wenn dieser Pivot zutrifft (z.B. 'db', 'auth', 'ai'); undefined = universell. */
  appliesWhen?: string
}

export interface NodeAnalysis {
  id: string
  status: NodeStatus
  /** Beleg aus dem Input, der den Status stützt. */
  evidence?: string
  /** Nur bei status='open': jargonfreie Erklärung, auf das Projekt bezogen. */
  plain?: string
  /** Nur bei status='open': konkrete Handlungsempfehlung. */
  action?: string
}

export interface Gap {
  id: string
  domain: string
  frage: string
  warum: string
  default: string
  kosten: Kosten
  /** Klartext-Erklärung (kontextbezogen, vom LLM). */
  plain?: string
  /** Konkrete „was du tun solltest"-Empfehlung. */
  action?: string
}

export interface GapList {
  red: Gap[]
  yellow: Gap[]
  decidedCount: number
  naCount: number
}

export interface MigrationDraft {
  sql: string
  warnings: string[]
}

export interface ConventionsFile {
  filename: string
  content: string
}

export interface Startpaket {
  decisionLog: string
  /** Konventions-Datei im tool-passenden Format (CLAUDE.md / .cursorrules / …). */
  conventions: ConventionsFile
  envExample: string
  migrationDraft?: MigrationDraft
}

/** Kurze Gesamt-Einordnung oben im Ergebnis. */
export interface ResultSummary {
  /** z.B. "Next.js-LMS mit Supabase". Vom LLM. */
  projectLabel: string
  /** 1–2 Sätze: was gefunden wurde + wo anfangen. */
  headline: string
}

export interface PreflightResult {
  summary: ResultSummary
  gaps: GapList
  startpaket: Startpaket
}
