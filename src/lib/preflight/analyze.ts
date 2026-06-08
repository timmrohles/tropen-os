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

export function buildSystemPrompt(pivots: PreflightPivots): string {
  return `Du bist ein Senior-Software-Architekt. Du prüfst ein Design-/Schema-Dokument gegen eine Foundation-Checkliste (das "Korsett").

BEKANNTE FAKTEN (Pivots — nicht erneut abfragen, sondern als entschieden behandeln):
- Build-Tool: ${pivots.buildTool}
- Geschäftsmodell: ${pivots.businessModel}
- Zielgruppe/Region: ${pivots.audienceRegion}
- Hosting: ${pivots.hosting}
- Stack: ${pivots.stack}
- Plattform: ${pivots.platform}
- Vertriebsmodell: ${pivots.commercialModel}

Leite aus den Pivots direkt ab:
- audienceRegion = 'eu' oder 'global' → L2 (DSGVO) = decided (EU-User → DSGVO gilt)
- hosting = 'eu' → L1 (Datenresidenz) = decided (EU-Hosting bestätigt)
- businessModel = 'b2c' → L4 (BFSG/a11y) = decided (B2C-Web-Pflicht seit 2025 bekannt)
- stack enthält Frontend → F1/F2-Knoten entsprechend auswerten
- stack enthält DB → D1–D7-Knoten entsprechend auswerten
- platform = 'native' oder 'both' → ST1–ST3 (Store) gelten; Web-Performance-Audit (Lighthouse) ist für native n/a
- platform = 'web' oder 'both' → L3 (Impressum), L5 (Cookie-Consent), L4 (BFSG bei b2c) gelten
- commercialModel = 'shop' → FA1–FA3 (Fernabsatz) gelten — ABER nur wenn businessModel = 'b2c'; bei 'b2b' → na
- commercialModel = 'subscription' → FA1–FA3 UND AB1–AB2 gelten (Abo ist auch Fernabsatz); b2c-Vorbehalt wie oben
- commercialModel = 'marketplace' → FA1–FA3 gelten (Verbraucher-Seite); Marktplatz-Betreiberpflichten kurz im plain/action erwähnen
- commercialModel = 'none' → ST*/FA*/AB*-Verkaufsknoten = na
- stack = '' (leer = "weiß nicht") → behandle den Stack als offen UND empfiehl im 'action'-Feld der betroffenen Knoten einen begründeten Default-Stack für den erkannten Projekttyp

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
    model: anthropic('claude-haiku-4-5-20251001'),
    schema: SCHEMA,
    system: buildSystemPrompt(pivots),
    prompt: `KORSETT-KNOTEN:\n${checklist}\n\n---\nDESIGN-DOKUMENT:\n${text}\n\n---\nGib projectLabel und pro Knoten {id, status, evidence?, plain?, action?} zurück.`,
  })

  return { nodes: object.nodes, projectLabel: object.projectLabel }
}
