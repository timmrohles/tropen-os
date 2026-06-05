// src/lib/preflight/analyze.ts
import { generateObject } from 'ai'
import { z } from 'zod'
import { anthropic } from '@/lib/llm/anthropic'
import { KORSETT } from './korsett'
import type { NodeAnalysis, PreflightPivots } from './types'

const SCHEMA = z.object({
  projectLabel: z.string(),
  nodes: z.array(
    z.object({
      id: z.string(),
      status: z.enum(['decided', 'open', 'na']),
      evidence: z.string().optional(),
      plain: z.string().optional(),
      action: z.string().optional(),
    }),
  ),
})

function buildSystemPrompt(pivots: PreflightPivots): string {
  return `Du bist ein Senior-Software-Architekt. Du prüfst ein Design-/Schema-Dokument gegen eine Foundation-Checkliste (das "Korsett").

BEKANNTE FAKTEN (Pivots — nicht erneut abfragen, sondern als entschieden behandeln):
- Build-Tool: ${pivots.buildTool}
- Geschäftsmodell: ${pivots.businessModel}
- Zielgruppe/Region: ${pivots.audienceRegion}
- Hosting: ${pivots.hosting}
- Stack: ${pivots.stack}

Leite aus den Pivots direkt ab:
- audienceRegion = 'eu' oder 'global' → L2 (DSGVO) = decided (EU-User → DSGVO gilt)
- hosting = 'eu' → L1 (Datenresidenz) = decided (EU-Hosting bestätigt)
- businessModel = 'b2c' → L4 (BFSG/a11y) = decided (B2C-Web-Pflicht seit 2025 bekannt)
- stack enthält Frontend → F1/F2-Knoten entsprechend auswerten
- stack enthält DB → D1–D7-Knoten entsprechend auswerten

Für JEDEN Knoten entscheide:
- "decided": Das Dokument oder die Pivots zeigen eine getroffene Entscheidung (gib kurze evidence).
- "open": Trifft auf das Projekt zu, ist aber weder im Dokument noch via Pivots entschieden.
- "na": Trifft auf dieses Projekt nicht zu (z.B. KI-Knoten wenn keine KI-Features geplant).

Sei ehrlich: bei vagem Input sind die meisten Knoten "open". Erfinde keine Entscheidungen.

Für JEDEN Knoten mit status='open':
- Schreibe ein 'plain'-Feld: jargonfreie Erklärung auf Deutsch, die konkret auf dieses Projekt bezogen ist. Benutze keine Fachbegriffe ohne Erklärung (z.B. nicht "org_id" ohne Erläuterung — statt dessen "eine Spalte in jeder Tabelle, die speichert welche Firma die Daten gehören"). Schreibe für jemanden der kein Datenbankexperte ist.
- Schreibe ein 'action'-Feld: eine konkrete, imperativische Handlungsempfehlung — was soll die Person jetzt entscheiden oder tun?

Gib außerdem ein 'projectLabel' zurück: eine kurze Beschreibung des Projekts (z.B. "Next.js-LMS mit Supabase", "React-B2C-Shop mit Stripe").`
}

export async function analyzeInput(
  text: string,
  pivots: PreflightPivots,
): Promise<{ nodes: NodeAnalysis[]; projectLabel: string }> {
  const checklist = KORSETT.map(
    (n) =>
      `${n.id} [${n.domain}${n.appliesWhen ? `, gilt-wenn:${n.appliesWhen}` : ''}]: ${n.frage}`,
  ).join('\n')

  const { object } = await generateObject({
    model: anthropic('claude-sonnet-4-20250514'),
    schema: SCHEMA,
    system: buildSystemPrompt(pivots),
    prompt: `KORSETT-KNOTEN:\n${checklist}\n\n---\nDESIGN-DOKUMENT:\n${text}\n\n---\nGib projectLabel und pro Knoten {id, status, evidence?, plain?, action?} zurück.`,
  })

  return { nodes: object.nodes, projectLabel: object.projectLabel }
}
