// src/lib/preflight/corpus/render.ts
import { generateObject } from 'ai'
import { z } from 'zod'
import { anthropic } from '@/lib/llm/anthropic'
import type { PreflightPivots, NodeAnalysis, DecisionMap } from '../types'
import type { ConventionRule, ConventionSection } from './types'
import { RULE_CORPUS } from './rule-corpus'
import { GENERATED_CORPUS } from './rule-corpus.generated'

/** Hand-Seed + Komitee-generierter Korpus, gemerged. Einzige Quelle für renderConventions. */
export const FULL_CORPUS: ConventionRule[] = [...RULE_CORPUS, ...GENERATED_CORPUS]

const STACK_KEYWORDS: Array<[RegExp, string]> = [
  [/\bnext\.?js\b/, 'stack:next'],
  [/\bremix\b/, 'stack:remix'],
  [/\bgatsby\b/, 'stack:react'],
  [/\bastro\b/, 'stack:astro'],
  [/\bnuxt\b/, 'stack:nuxt'],
  [/\bsveltekit|svelte\b/, 'stack:svelte'],
  [/\bsolid(js)?\b/, 'stack:solid'],
  [/\bangular\b/, 'stack:angular'],
  [/\bvue\b/, 'stack:vue'],
  [/\b(react native|expo)\b/, 'stack:react-native'],
  [/\breact\b/, 'stack:react'],
  [/\b(django|fastapi|flask|python)\b/, 'stack:python'],
  [/\b(rails|ruby on rails)\b/, 'stack:rails'],
  [/\blaravel\b/, 'stack:php'],
  [/\b(spring|kotlin\s+spring)\b/, 'stack:java'],
  [/\.net\b|\b(dotnet|asp\.net|c#)/, 'stack:dotnet'],
  [/\bflutter\b/, 'stack:flutter'],
  [/\bswiftui|\bswift\b/, 'stack:swift'],
  [/\bkotlin\b/, 'stack:kotlin'],
  [/\bgolang|\bgo\b/, 'stack:go'],
  [/\b(express|nest(js)?|node(\.?js)?)\b/, 'stack:node'],
  [/\bphp\b/, 'stack:php'],
]

/** Leitet deterministisch Filter-Tags aus Pivots (primär Stack) + Analyse ab. Kein LLM. */
export function deriveCorpusTags(pivots: PreflightPivots, nodes: NodeAnalysis[]): string[] {
  const tags = new Set<string>()
  const stack = pivots.stack.toLowerCase()

  for (const [re, tag] of STACK_KEYWORDS) {
    if (re.test(stack)) tags.add(tag)
  }
  if (tags.has('stack:next')) tags.add('stack:react')

  if (pivots.platform === 'web' || pivots.platform === 'both') tags.add('platform:web')
  if (pivots.platform === 'native' || pivots.platform === 'both') tags.add('platform:native')

  const dbKeywords = /\b(supabase|postgres|postgresql|mysql|mongo|mongodb|prisma|drizzle|firebase|sqlite|planetscale)\b/
  const authKeywords = /\b(supabase|firebase|clerk|nextauth|auth0|cognito|lucia)\b/
  const nodeIds = nodes.map((n) => n.id.toLowerCase()).join(' ')
  if (dbKeywords.test(stack) || /\b(db|database|schema|migration)\b/.test(nodeIds)) tags.add('db:true')
  if (authKeywords.test(stack) || /\b(auth|login|session)\b/.test(nodeIds)) tags.add('auth:true')

  const aiKeywords = /\b(openai|anthropic|claude|gpt|gemini|llm|ai-sdk|ai sdk|langchain|vercel ai|mistral|huggingface)\b/
  if (aiKeywords.test(stack) || nodes.some((n) => /\bai\b|llm|gpt/i.test(n.id))) tags.add('ai:true')

  if (pivots.commercialModel !== 'none' && pivots.commercialModel !== 'unsure') tags.add('commerce:true')

  return [...tags]
}

/** Regel enthalten, wenn universell (kein appliesWhen) ODER mind. ein Tag passt. */
export function filterCorpus(corpus: ConventionRule[], tags: string[]): ConventionRule[] {
  return corpus.filter((r) => !r.appliesWhen || r.appliesWhen.some((t) => tags.includes(t)))
}

const SECTION_ORDER: ConventionSection[] = [
  'code-rules', 'naming', 'structure', 'db', 'error-handling', 'testing', 'git', 'security', 'maintenance',
]
const SECTION_TITLE: Record<ConventionSection, string> = {
  overview: 'Projekt-Überblick',
  architecture: 'Architektur-Entscheidungen',
  'code-rules': 'Code-Regeln (nicht verhandelbar)',
  naming: 'Namenskonventionen',
  structure: 'Ordnerstruktur & was gehört wohin',
  db: 'Datenbank-Zugriff & Migrationen',
  'error-handling': 'Fehlerbehandlung',
  testing: 'Tests',
  git: 'Git & Versionskontrolle',
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
  const rules = filterCorpus(FULL_CORPUS, tags)
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
