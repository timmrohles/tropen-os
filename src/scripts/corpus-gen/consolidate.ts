import type { ConventionRule } from '@/lib/preflight/corpus/types'

/** Pack-Quellen, deren Regeln NICHT in den Konventions-Korpus gehören (→ ADR-032 Compliance / meta). */
export const EXCLUDED_SOURCES = ['DSGVO', 'AI_ACT', 'BFSG', 'LEGAL', 'AGENT_QUALITY']

/** Behält Regeln, deren source KEINEN ausgeschlossenen Pack-Namen enthält (case-insensitive). */
export function filterBySource(rules: ConventionRule[]): ConventionRule[] {
  return rules.filter((r) => {
    const src = (r.source ?? '').toUpperCase()
    return !EXCLUDED_SOURCES.some((ex) => src.includes(ex))
  })
}

/** Gruppiert Regeln nach section. */
export function groupBySection(rules: ConventionRule[]): Record<string, ConventionRule[]> {
  const out: Record<string, ConventionRule[]> = {}
  for (const r of rules) (out[r.section] ??= []).push(r)
  return out
}
