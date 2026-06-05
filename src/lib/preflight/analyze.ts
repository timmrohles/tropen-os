// src/lib/preflight/analyze.ts
import { generateObject } from 'ai'
import { z } from 'zod'
import { anthropic } from '@/lib/llm/anthropic'
import { KORSETT } from './korsett'
import type { NodeAnalysis } from './types'

const SCHEMA = z.object({
  nodes: z.array(
    z.object({
      id: z.string(),
      status: z.enum(['decided', 'open', 'na']),
      evidence: z.string().optional(),
    }),
  ),
})

const SYSTEM = `Du bist ein Senior-Software-Architekt. Du prüfst ein Design-/Schema-Dokument gegen eine Foundation-Checkliste (das "Korsett"). Für JEDEN Knoten entscheide:
- "decided": Das Dokument zeigt eine getroffene Entscheidung dazu (gib kurze evidence).
- "open": Trifft auf das Projekt zu, ist aber im Dokument NICHT entschieden.
- "na": Trifft auf dieses Projekt nicht zu (z.B. KI-Knoten ohne KI-Features).
Sei ehrlich: bei vagem Input sind die meisten Knoten "open". Erfinde keine Entscheidungen.`

export async function analyzeInput(text: string): Promise<NodeAnalysis[]> {
  const checklist = KORSETT.map(
    (n) =>
      `${n.id} [${n.domain}${n.appliesWhen ? `, gilt-wenn:${n.appliesWhen}` : ''}]: ${n.frage}`,
  ).join('\n')

  const { object } = await generateObject({
    model: anthropic('claude-sonnet-4-20250514'),
    schema: SCHEMA,
    system: SYSTEM,
    prompt: `KORSETT-KNOTEN:\n${checklist}\n\n---\nDESIGN-DOKUMENT:\n${text}\n\n---\nGib pro Knoten {id, status, evidence?} zurück.`,
  })

  return object.nodes
}
