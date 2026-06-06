// src/lib/preflight/run.ts
import { normalizeInput } from './ingest'
import { analyzeInput } from './analyze'
import { buildGapList } from './gaps'
import { generateStartpaket } from './generate'
import { auditMigrationSql } from './migration-audit'
import type { PreflightResult, PreflightPivots, GapList } from './types'

/** Deterministische Heuristik: ist der Input zu knapp für eine fundierte Analyse? */
export function isThinInput(normalizedText: string, gaps: Pick<GapList, 'decidedCount'>): boolean {
  return normalizedText.trim().length < 280 || gaps.decidedCount <= 2
}

export async function runPreflight(raw: string, pivots: PreflightPivots): Promise<PreflightResult> {
  const text = normalizeInput(raw)
  const { nodes, projectLabel } = await analyzeInput(text, pivots)
  const gaps = buildGapList(nodes)
  const thin = isThinInput(text, gaps)
  const startpaket = await generateStartpaket(text, nodes, pivots)
  if (startpaket.migrationDraft) {
    startpaket.migrationDraft.warnings = await auditMigrationSql(startpaket.migrationDraft.sql)
  }

  const headline =
    gaps.red.length > 0
      ? `${gaps.red.length} Dinge solltest du zuerst entscheiden — fang oben an.`
      : 'Keine Blocker — du kannst loslegen.'

  return {
    summary: { projectLabel, headline, thin },
    gaps,
    startpaket,
  }
}
