// src/lib/preflight/generate.ts
import { generateObject } from 'ai'
import { z } from 'zod'
import { anthropic } from '@/lib/llm/anthropic'
import { CONVENTIONS_FILENAME } from './types'
import { auditMigrationSql } from './migration-audit'
import type { NodeAnalysis, Startpaket, PreflightPivots, DecisionMap } from './types'

const SCHEMA = z.object({
  decisionLog: z.string(),
  conventionsContent: z.string(),
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

2. **conventionsContent**: Den Inhalt der Datei "${conventionsFilename}" für das Projekt.
   ${pivots.buildTool === 'claude-code'
     ? 'Format: CLAUDE.md — eine strukturierte Markdown-Datei die Claude Code als Kontext für das Projekt dient. Enthält: Projektbeschreibung, Tech-Stack, wichtige Konventionen, Code-Regeln, DB-Zugriff, API-Pattern, wichtige Pfade.'
     : pivots.buildTool === 'cursor'
     ? 'Format: .cursorrules — Regeln und Konventionen für den Cursor-AI-Editor. Enthält: Sprach-/Framework-Präferenzen, Namenskonventionen, Datei-/Ordnerstruktur, verbotene Patterns, wichtige Abhängigkeiten.'
     : pivots.buildTool === 'lovable' || pivots.buildTool === 'bolt'
     ? 'Format: AGENTS.md — Anweisungen für den AI-Build-Agent. Enthält: Projektbeschreibung, gewünschter Stack, Konventionen, was der Agent tun/nicht tun soll, Architektur-Entscheidungen.'
     : 'Format: CONVENTIONS.md — allgemeine Konventions-Datei. Enthält: Projektbeschreibung, Tech-Stack, Code-Konventionen, Architektur-Prinzipien, wichtige Regeln.'
   }
   Leite die Inhalte aus den entschiedenen Knoten und vernünftigen Defaults für offene Punkte ab. Passe den Ton und die Tiefe dem jeweiligen Tool an.

3. **envExample**: Ein .env.example-Template mit den durch die Knoten implizierten Secrets und Sub-Prozessoren (LLM-API-Keys, E-Mail-Provider, Datenbank-URL etc.). Nur Variablen-Namen, keine Werte.

4. **migrationSql** (OPTIONAL): Nur erzeugen, wenn das Design-Dokument ein erkennbares Datenbankschema oder Datenmodell enthält. Beginne mit einem SQL-Kommentar "-- ENTWURF: Nicht direkt in Produktion einsetzen. Sorgfältig prüfen und anpassen." Falls kein Datenmodell erkennbar ist, dieses Feld WEGLASSEN.`
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
    prompt: `KNOTENANALYSE:\n${analysisText || '(keine Analyse vorhanden)'}\n\n---\nNUTZER-ENTSCHEIDUNGEN (verbindlich berücksichtigen):\n${decisionsText || '(keine)'}\n\n---\nDESIGN-DOKUMENT:\n${text}\n\n---\nErzeuge decisionLog, conventionsContent, envExample und (falls Datenmodell vorhanden) migrationSql. Übernimm die Nutzer-Entscheidungen wörtlich; geparkte Punkte bleiben offen.`,
  })

  const startpaket: Startpaket = {
    decisionLog: object.decisionLog,
    conventions: { filename: CONVENTIONS_FILENAME[pivots.buildTool], content: object.conventionsContent },
    envExample: object.envExample,
  }
  if (object.migrationSql) {
    startpaket.migrationDraft = { sql: object.migrationSql, warnings: await auditMigrationSql(object.migrationSql) }
  }
  return startpaket
}
