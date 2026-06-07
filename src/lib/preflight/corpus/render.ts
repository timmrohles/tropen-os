// src/lib/preflight/corpus/render.ts
import { generateObject } from 'ai'
import { z } from 'zod'
import { anthropic } from '@/lib/llm/anthropic'
import type { PreflightPivots, NodeAnalysis, DecisionMap } from '../types'
import type { ConventionRule, ConventionSection } from './types'
import { RULE_CORPUS } from './rule-corpus'

/** Leitet deterministisch Filter-Tags aus Pivots (primär Stack) + Analyse ab. Kein LLM. */
export function deriveCorpusTags(pivots: PreflightPivots, nodes: NodeAnalysis[]): string[] {
  const tags = new Set<string>()
  const stack = pivots.stack.toLowerCase()

  if (/\b(react|next\.?js|remix|gatsby)\b/.test(stack)) tags.add('stack:react')
  if (/\bnext\.?js\b/.test(stack)) tags.add('stack:next')
  if (/\b(vue|nuxt)\b/.test(stack)) tags.add('stack:vue')

  if (pivots.platform === 'web' || pivots.platform === 'both') tags.add('platform:web')
  if (pivots.platform === 'native' || pivots.platform === 'both') tags.add('platform:native')

  const dbKeywords = /\b(supabase|postgres|postgresql|mysql|mongo|mongodb|prisma|drizzle|firebase|sqlite|planetscale)\b/
  const authKeywords = /\b(supabase|firebase|clerk|nextauth|auth0|cognito|lucia)\b/
  const nodeIds = nodes.map((n) => n.id.toLowerCase()).join(' ')
  if (dbKeywords.test(stack) || /\b(db|database|schema|migration)\b/.test(nodeIds)) tags.add('db:true')
  if (authKeywords.test(stack) || /\b(auth|login|session)\b/.test(nodeIds)) tags.add('auth:true')

  if (pivots.commercialModel !== 'none' && pivots.commercialModel !== 'unsure') tags.add('commerce:true')

  return [...tags]
}

/** Regel enthalten, wenn universell (kein appliesWhen) ODER mind. ein Tag passt. */
export function filterCorpus(corpus: ConventionRule[], tags: string[]): ConventionRule[] {
  return corpus.filter((r) => !r.appliesWhen || r.appliesWhen.some((t) => tags.includes(t)))
}

const SECTION_ORDER: ConventionSection[] = [
  'code-rules', 'naming', 'structure', 'db', 'error-handling', 'security', 'maintenance',
]
const SECTION_TITLE: Record<ConventionSection, string> = {
  overview: 'Projekt-Überblick',
  architecture: 'Architektur-Entscheidungen',
  'code-rules': 'Code-Regeln (nicht verhandelbar)',
  naming: 'Namenskonventionen',
  structure: 'Ordnerstruktur & was gehört wohin',
  db: 'Datenbank-Zugriff & Migrationen',
  'error-handling': 'Fehlerbehandlung',
  security: 'Sicherheit & Secrets',
  maintenance: 'Pflege dieser Datei',
}

/** Rendert die gefilterten Regeln deterministisch zu Markdown — KEIN LLM. */
export function renderBaseline(rules: ConventionRule[]): string {
  const out: string[] = []
  for (const section of SECTION_ORDER) {
    const inSec = rules.filter((r) => r.section === section)
    if (inSec.length === 0) continue
    out.push(`## ${SECTION_TITLE[section]}`)
    for (const r of inSec) {
      const tag = r.severity === 'must' ? '**Pflicht:**' : 'Empfehlung:'
      out.push(`- ${tag} ${r.rule}${r.rationale ? ` (${r.rationale})` : ''}`)
    }
    out.push('')
  }
  return out.join('\n').trimEnd()
}

const PROJECT_LAYER_SCHEMA = z.object({
  title: z.string(),
  overview: z.string(),
  architecture: z.string(),
})

/** Baseline (deterministisch) + ein LLM-Pass nur für Projekt-Überblick + Architektur. */
export async function renderConventions(
  text: string, nodes: NodeAnalysis[], pivots: PreflightPivots, decisions: DecisionMap,
): Promise<string> {
  const tags = deriveCorpusTags(pivots, nodes)
  const rules = filterCorpus(RULE_CORPUS, tags)
  const baseline = renderBaseline(rules)

  const decisionsText = Object.entries(decisions)
    .map(([id, d]) => (d.choice === 'parked' ? `${id}: offen` : `${id}: ${d.value ?? 'übernommen'}`))
    .join('\n')

  const { object } = await generateObject({
    model: anthropic('claude-sonnet-4-20250514'),
    schema: PROJECT_LAYER_SCHEMA,
    system: 'Du schreibst NUR zwei Abschnitte einer Konventions-Datei: einen kurzen Projekt-Überblick und die Architektur-Entscheidungen (inkl. Datenmodell). Schreibe KEINE allgemeinen Code-/Naming-/Security-Regeln — die kommen aus einer separaten Baseline. Kurz, konkret, projektbezogen.',
    prompt: `PROJEKT-BESCHREIBUNG:\n${text}\n\n---\nGETROFFENE ENTSCHEIDUNGEN:\n${decisionsText || '(keine)'}\n\n---\nLiefere title, overview (2–3 Sätze) und architecture (Stack + Schlüssel-Entscheidungen + ggf. Datenmodell).`,
  })

  return [
    `# ${object.title}`,
    '',
    '## Projekt-Überblick',
    object.overview,
    '',
    '## Architektur-Entscheidungen',
    object.architecture,
    '',
    baseline,
  ].join('\n')
}
