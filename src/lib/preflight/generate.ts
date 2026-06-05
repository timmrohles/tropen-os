// src/lib/preflight/generate.ts
import { generateObject } from 'ai'
import { z } from 'zod'
import { anthropic } from '@/lib/llm/anthropic'
import type { NodeAnalysis, Startpaket } from './types'

const SCHEMA = z.object({
  decisionLog: z.string(),
  claudeMd: z.string(),
  envExample: z.string(),
  migrationSql: z.string().optional(),
})

const SYSTEM = `Du bist ein erfahrener Software-Architekt. Du erhältst ein Design-Dokument und eine Analyse von Architektur-Entscheidungen (NodeAnalysis[]).

Erzeuge folgende Artefakte:

1. **decisionLog** (Markdown): Liste alle Knoten auf.
   - status=decided → als "decision" mit dem evidence-Text.
   - status=open → als "open_question" mit dem Hinweis "später klären" (yellow = weniger dringend, priorisiere red-Knoten).
   - status=na → kurz als "nicht zutreffend" erwähnen.

2. **claudeMd**: Ein CLAUDE.md für das Projekt, das aus den entschiedenen Knoten Konventionen ableitet und vernünftige Defaults für offene Punkte setzt.

3. **envExample**: Ein .env.example-Template, das die durch die entschiedenen Knoten implizierten Secrets und Sub-Prozessoren auflistet (z.B. LLM-API-Keys, E-Mail-Provider, Datenbank-URL). Nur Variablen-Namen, keine Werte.

4. **migrationSql** (OPTIONAL): Nur erzeugen, wenn das Design-Dokument ein erkennbares Datenbankschema oder Datenmodell enthält. Beginne mit einem SQL-Kommentar "-- ENTWURF: Nicht direkt in Produktion einsetzen. Sorgfältig prüfen und anpassen." Falls kein Datenmodell erkennbar ist, dieses Feld WEGLASSEN.`

export async function generateStartpaket(
  text: string,
  analysis: NodeAnalysis[],
): Promise<Startpaket> {
  const analysisText = analysis
    .map((n) => `${n.id}: ${n.status}${n.evidence ? ` (${n.evidence})` : ''}`)
    .join('\n')

  const { object } = await generateObject({
    model: anthropic('claude-sonnet-4-20250514'),
    schema: SCHEMA,
    system: SYSTEM,
    prompt: `KNOTENANALYSE:\n${analysisText || '(keine Analyse vorhanden)'}\n\n---\nDESIGN-DOKUMENT:\n${text}\n\n---\nErzeuge decisionLog, claudeMd, envExample und (falls Datenmodell vorhanden) migrationSql.`,
  })

  const startpaket: Startpaket = {
    decisionLog: object.decisionLog,
    claudeMd: object.claudeMd,
    envExample: object.envExample,
  }

  if (object.migrationSql) {
    startpaket.migrationDraft = {
      sql: object.migrationSql,
      warnings: [], // Audit wird in Task 7 (migration-audit.ts) ergänzt
    }
  }

  return startpaket
}
