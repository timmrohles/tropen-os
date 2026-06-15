// src/lib/preflight/corpus/vocabulary.ts
// Geschlossenes, geteiltes Vokabular — von deriveCorpusTags, Komitee-Skript UND Tests genutzt.
// Korpus-Tags MÜSSEN Teilmenge von ALL_TAGS sein, sonst tote (nie gerenderte) Regeln.
import type { ConventionSection } from './types'

export const STACK_TAGS = [
  'stack:react', 'stack:next', 'stack:vue', 'stack:nuxt', 'stack:svelte', 'stack:astro',
  'stack:remix', 'stack:solid', 'stack:angular', 'stack:node', 'stack:python', 'stack:rails',
  'stack:go', 'stack:php', 'stack:java', 'stack:dotnet', 'stack:react-native', 'stack:flutter',
  'stack:swift', 'stack:kotlin',
] as const

export const OTHER_TAGS = ['db:true', 'auth:true', 'platform:web', 'platform:native', 'commerce:true', 'ai:true'] as const

export const ALL_TAGS: string[] = [...STACK_TAGS, ...OTHER_TAGS]

/** Sektionen, die aus dem Korpus gerendert werden (overview/architecture = LLM-Schicht, nicht hier). */
export const CONTENT_SECTIONS: ConventionSection[] = [
  'code-rules', 'naming', 'structure', 'db', 'error-handling', 'testing', 'git', 'security', 'maintenance',
]
