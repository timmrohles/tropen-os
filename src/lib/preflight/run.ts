// src/lib/preflight/run.ts
import { normalizeInput } from './ingest'
import { analyzeInput } from './analyze'
import { buildGapList } from './gaps'
import type { PreflightPivots, GapList, ResultSummary, NodeAnalysis } from './types'

/** Deterministische Heuristik: ist der Input zu knapp für eine fundierte Analyse? */
export function isThinInput(normalizedText: string, gaps: Pick<GapList, 'decidedCount'>): boolean {
  return normalizedText.trim().length < 280 || gaps.decidedCount <= 2
}

/** Analyse-Phase: Lücken ohne Startpaket (Generierung folgt separat nach Entscheidungen). */
export async function analyzePreflight(
  raw: string,
  pivots: PreflightPivots,
): Promise<{ summary: ResultSummary; gaps: GapList; nodes: NodeAnalysis[] }> {
  const text = normalizeInput(raw)
  const { nodes, projectLabel } = await analyzeInput(text, pivots)
  const gaps = buildGapList(nodes)
  const thin = isThinInput(text, gaps)
  const headline =
    gaps.red.length > 0
      ? `${gaps.red.length} Dinge solltest du zuerst entscheiden — fang oben an.`
      : 'Keine Blocker — du kannst loslegen.'
  return { summary: { projectLabel, headline, thin }, gaps, nodes }
}
