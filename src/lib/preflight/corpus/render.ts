// src/lib/preflight/corpus/render.ts
import type { PreflightPivots, NodeAnalysis } from '../types'
import type { ConventionRule, ConventionSection } from './types'

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
