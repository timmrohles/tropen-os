// src/lib/preflight/types.ts
export type Kosten = 'red' | 'yellow'
export type NodeStatus = 'decided' | 'open' | 'na'

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
}

export interface Gap {
  id: string
  domain: string
  frage: string
  warum: string
  default: string
  kosten: Kosten
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

export interface Startpaket {
  decisionLog: string
  claudeMd: string
  envExample: string
  migrationDraft?: MigrationDraft
}

export interface PreflightResult {
  gaps: GapList
  startpaket: Startpaket
}
