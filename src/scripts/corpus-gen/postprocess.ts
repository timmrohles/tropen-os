import type { ConventionRule } from '@/lib/preflight/corpus/types'
import { ALL_TAGS, CONTENT_SECTIONS } from '@/lib/preflight/corpus/vocabulary'

/** Extrahiert JSON-Array aus LLM-Antwort (mit/ohne ```-Fences). Nie werfen. */
export function parseRules(text: string): ConventionRule[] {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const body = (fenced ? fenced[1] : text).trim()
  const start = body.indexOf('['), end = body.lastIndexOf(']')
  if (start === -1 || end === -1) return []
  try {
    const arr = JSON.parse(body.slice(start, end + 1))
    return Array.isArray(arr) ? arr : []
  } catch { return [] }
}

/** Behält nur Regeln mit gültiger Section + gültigen Tags (sonst tote Regeln). */
export function validateAgainstVocab(rules: ConventionRule[]): ConventionRule[] {
  return rules.filter(r =>
    r && typeof r.id === 'string' && typeof r.rule === 'string' && r.rule.trim().length > 8 &&
    CONTENT_SECTIONS.includes(r.section) &&
    (r.severity === 'must' || r.severity === 'should') &&
    (!r.appliesWhen || r.appliesWhen.every(t => ALL_TAGS.includes(t))),
  )
}

/** Entfernt IDs die im Seed sind + interne Duplikate (erste gewinnt). */
export function dedupeRules(rules: ConventionRule[], seedIds: Set<string>): ConventionRule[] {
  const seen = new Set(seedIds), out: ConventionRule[] = []
  for (const r of rules) { if (seen.has(r.id)) continue; seen.add(r.id); out.push(r) }
  return out
}
