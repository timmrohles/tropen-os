// src/lib/preflight/export-prompt.ts
import type { Gap, PreflightResult } from './types'

// ─── buildDecisionPrompt ──────────────────────────────────────────────────────
// Deterministic — no LLM, no randomness.
// Produces a copy-paste-ready prompt for the user to paste into their LLM
// (Claude, Cursor, etc.) to walk through all open decisions together.

function formatRedGap(index: number, gap: Gap): string {
  const lines: string[] = [
    `### ${index}. ${gap.frage}`,
    `- Was das heißt: ${gap.plain ?? gap.warum}`,
    `- Empfehlung: ${gap.action ?? gap.default}`,
    `- Warum wichtig: ${gap.warum}`,
  ]
  return lines.join('\n')
}

function formatYellowGap(gap: Gap): string {
  return `- ${gap.frage}: ${gap.action ?? gap.default}`
}

export function buildDecisionPrompt(result: PreflightResult): string {
  const { summary, gaps } = result
  const { red, yellow } = gaps

  const parts: string[] = []

  // ── Opening ──────────────────────────────────────────────────────────────
  parts.push(
    `Ich baue: ${summary.projectLabel}.\n` +
    `Bevor ich loslege, muss ich diese Grundlagen-Entscheidungen treffen. Geh sie mit mir durch — frag nach, wo dir Kontext fehlt, schlag pro Punkt eine konkrete Entscheidung vor, und fass am Ende meine getroffenen Entscheidungen zusammen.`,
  )

  // ── Zuerst entscheiden (red) ──────────────────────────────────────────────
  if (red.length > 0) {
    const redSection = [
      `## Zuerst entscheiden (${red.length})`,
      ...red.map((gap, i) => formatRedGap(i + 1, gap)),
    ].join('\n\n')
    parts.push(redSection)
  }

  // ── Kann später (yellow) ──────────────────────────────────────────────────
  if (yellow.length > 0) {
    const yellowSection = [
      `## Kann später (${yellow.length})`,
      ...yellow.map(gap => formatYellowGap(gap)),
    ].join('\n')
    parts.push(yellowSection)
  }

  return parts.join('\n\n')
}
