// src/lib/preflight/generate.ts
import { generateObject } from 'ai'
import { z } from 'zod'
import { anthropic } from '@/lib/llm/anthropic'
import { CONVENTIONS_FILENAME } from './types'
import { renderConventions } from './corpus/render'
import { auditMigrationSql } from './migration-audit'
import type { NodeAnalysis, Startpaket, PreflightPivots, DecisionMap } from './types'

const SCHEMA = z.object({
  decisionLog: z.string(),
  envExample: z.string(),
  migrationSql: z.string().optional(),
})

function buildSystemPrompt(pivots: PreflightPivots): string {
  const conventionsFilename = CONVENTIONS_FILENAME[pivots.buildTool]
  return `Du bist ein erfahrener Software-Architekt. Du erhältst ein Design-Dokument und eine Analyse von Architektur-Entscheidungen (NodeAnalysis[]).

BEKANNTE PIVOTS:
- Build-Tool: ${pivots.buildTool} → Konventions-Datei: ${conventionsFilename}
- Geschäftsmodell: ${pivots.businessModel}
- Zielgruppe/Region: ${pivots.audienceRegion}
- Hosting: ${pivots.hosting}
- Stack: ${pivots.stack}

Erzeuge folgende Artefakte:

1. **decisionLog** (Markdown): Liste alle Knoten auf.
   - status=decided → als "decision" mit dem evidence-Text.
   - status=open → als "open_question" mit dem Hinweis "später klären" (yellow = weniger dringend, priorisiere red-Knoten).
   - status=na → kurz als "nicht zutreffend" erwähnen.

2. **envExample**: Ein .env.example-Template mit den durch die Knoten implizierten Secrets und Sub-Prozessoren (LLM-API-Keys, E-Mail-Provider, Datenbank-URL etc.). Nur Variablen-Namen, keine Werte.

3. **migrationSql** (OPTIONAL): Nur erzeugen, wenn das Design-Dokument ein erkennbares Datenbankschema oder Datenmodell enthält. Beginne mit einem SQL-Kommentar "-- ENTWURF: Nicht direkt in Produktion einsetzen. Sorgfältig prüfen und anpassen." Falls kein Datenmodell erkennbar ist, dieses Feld WEGLASSEN.`
}

export async function generateStartpaket(
  text: string,
  analysis: NodeAnalysis[],
  pivots: PreflightPivots,
  decisions: DecisionMap = {},
): Promise<Startpaket> {
  const analysisText = analysis
    .map((n) => `${n.id}: ${n.status}${n.evidence ? ` (${n.evidence})` : ''}`)
    .join('\n')

  const decisionsText = Object.entries(decisions)
    .map(([nodeId, d]) =>
      d.choice === 'parked'
        ? `${nodeId}: BEWUSST GEPARKT (offen lassen, nicht erfinden)`
        : `${nodeId}: ENTSCHIEDEN — ${d.value ?? ''}`,
    )
    .join('\n')

  const { object } = await generateObject({
    model: anthropic('claude-sonnet-4-20250514'),
    schema: SCHEMA,
    system: buildSystemPrompt(pivots),
    prompt: `KNOTENANALYSE:\n${analysisText || '(keine Analyse vorhanden)'}\n\n---\nNUTZER-ENTSCHEIDUNGEN (verbindlich berücksichtigen):\n${decisionsText || '(keine)'}\n\n---\nDESIGN-DOKUMENT:\n${text}\n\n---\nErzeuge decisionLog, envExample und (falls Datenmodell vorhanden) migrationSql. Übernimm die Nutzer-Entscheidungen wörtlich; geparkte Punkte bleiben offen.`,
  })

  const conventionsContent = await renderConventions(text, analysis, pivots, decisions)

  const startpaket: Startpaket = {
    decisionLog: object.decisionLog,
    conventions: { filename: CONVENTIONS_FILENAME[pivots.buildTool], content: conventionsContent },
    envExample: object.envExample,
  }
  if (object.migrationSql) {
    startpaket.migrationDraft = { sql: object.migrationSql, warnings: await auditMigrationSql(object.migrationSql) }
  }
  return startpaket
}
