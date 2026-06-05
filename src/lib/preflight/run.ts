// src/lib/preflight/run.ts
import { normalizeInput } from './ingest'
import { analyzeInput } from './analyze'
import { buildGapList } from './gaps'
import { generateStartpaket } from './generate'
import { auditMigrationSql } from './migration-audit'
import type { PreflightResult } from './types'

export async function runPreflight(raw: string): Promise<PreflightResult> {
  const text = normalizeInput(raw)
  const analysis = await analyzeInput(text)
  const gaps = buildGapList(analysis)
  const startpaket = await generateStartpaket(text, analysis)
  if (startpaket.migrationDraft) {
    startpaket.migrationDraft.warnings = await auditMigrationSql(startpaket.migrationDraft.sql)
  }
  return { gaps, startpaket }
}
