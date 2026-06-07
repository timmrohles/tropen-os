// src/lib/preflight/types.ts
export type Kosten = 'red' | 'yellow'
export type NodeStatus = 'decided' | 'open' | 'na'

// ─── Intake-Pivots (kurze Abfrage vor der Analyse) ──────────────────────────────
// Jeder Pivot erlaubt 'unsure' — "weiß nicht / noch offen" wird zu einer Lücke, kein Pflichtfeld.
export type BuildTool = 'claude-code' | 'cursor' | 'lovable' | 'bolt' | 'other' | 'unsure'
export type BusinessModel = 'b2c' | 'b2b' | 'internal' | 'unsure'
export type GeoScope = 'eu' | 'non_eu' | 'global' | 'unsure'
export type Platform = 'web' | 'native' | 'both' | 'unsure'
export type CommercialModel = 'none' | 'shop' | 'subscription' | 'marketplace' | 'unsure'

export interface PreflightPivots {
  buildTool: BuildTool
  businessModel: BusinessModel
  audienceRegion: GeoScope
  hosting: GeoScope
  stack: string
  platform: Platform
  commercialModel: CommercialModel
}

/** Füllt fehlende/neue Pivot-Felder mit Defaults (Rückwärtskompatibilität für alte Läufe). */
export function normalizePivots(raw: Partial<PreflightPivots> | null | undefined): PreflightPivots {
  const r = (raw ?? {}) as Partial<PreflightPivots>
  return {
    buildTool: r.buildTool ?? 'unsure',
    businessModel: r.businessModel ?? 'unsure',
    audienceRegion: r.audienceRegion ?? 'unsure',
    hosting: r.hosting ?? 'unsure',
    stack: typeof r.stack === 'string' ? r.stack : '',
    platform: r.platform ?? 'unsure',
    commercialModel: r.commercialModel ?? 'none',
  }
}

/** Tool → Konventions-Dateiname. */
export const CONVENTIONS_FILENAME: Record<BuildTool, string> = {
  'claude-code': 'CLAUDE.md',
  cursor: '.cursorrules',
  lovable: 'AGENTS.md',
  bolt: 'AGENTS.md',
  other: 'AGENTS.md',
  unsure: 'AGENTS.md',
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
  /** true, wenn der Input zu knapp für eine fundierte Analyse ist. */
  thin?: boolean
}

export interface PreflightResult {
  summary: ResultSummary
  gaps: GapList
  startpaket: Startpaket
}

/** Listen-Eintrag auf /preflight. */
export interface PreflightProjectListItem {
  id: string
  name: string
  stack: string
  redCount: number
  updatedAt: string
}

/** Detail-Ansicht /preflight/[id]: Projekt + neuestes Ergebnis + Input des letzten Runs. */
export interface PreflightProjectDetail {
  id: string
  name: string
  pivots: PreflightPivots
  input: string
  result: PreflightResult
}

export type DecisionChoice = 'default' | 'custom' | 'parked'
export interface Decision { choice: DecisionChoice; value?: string }
export type DecisionMap = Record<string, Decision>

/** Mindeststandard erreicht: jede offene rote Lücke hat eine Entscheidung. */
export function isMinStandardMet(gaps: GapList, decisions: DecisionMap): boolean {
  return gaps.red.every(g => decisions[g.id] !== undefined)
}
