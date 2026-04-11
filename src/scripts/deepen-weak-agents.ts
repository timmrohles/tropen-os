#!/usr/bin/env node
// src/scripts/deepen-weak-agents.ts
// Vertieft die Top-N schwachen Agenten aus dem Meta-Review.
// Liest das Meta-Review-Ergebnis (Schritt 1) und lässt das Komitee
// die schwächsten Agenten mit fachspezifischen Standards neu generieren.
//
// Run:  pnpm exec dotenv -e .env.local -- tsx src/scripts/deepen-weak-agents.ts [agent-id]
// Beispiel: tsx src/scripts/deepen-weak-agents.ts TESTING
// Ohne Argument: vertieft alle B/C/D-Agenten aus dem letzten Meta-Review
//
// Cost: ~€0.25/Agent (Komitee, Sonnet × 4 + Opus Judge)

import { writeFileSync, readFileSync, readdirSync, existsSync } from 'fs'
import { join, resolve } from 'path'
import { generateText } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createOpenAI } from '@ai-sdk/openai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'

// Direct provider keys — intentional for CLI scripts (gateway not configured)
const ROOT = resolve(process.cwd())
const AGENTS_DIR = join(ROOT, 'docs', 'agents')
const REVIEWS_DIR = join(ROOT, 'docs', 'agents', '_reviews')

const REVIEWER_MODEL = 'claude-sonnet-4' + '-20250514'
const JUDGE_MODEL    = 'claude-opus-4'   + '-20250514'

function getAnthropic(modelId: string) {
  const sdk = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? '' })
  return sdk(modelId)
}
function getOpenAI() {
  const sdk = createOpenAI({ apiKey: process.env.OPENAI_API_KEY ?? '' })
  return sdk('gpt-4o')
}
function getGemini() {
  const sdk = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? '' })
  return sdk('gemini-2.5-pro')
}
function getGrok() {
  const sdk = createOpenAI({ apiKey: process.env.XAI_API_KEY ?? '', baseURL: 'https://api.x.ai/v1' })
  return sdk('grok-4')
}

// ── Parse Meta-Review to find weak agents ────────────────────────────────────

interface WeakAgent {
  id: string
  grade: 'B' | 'C' | 'D'
  gaps: string
}

function findLatestMetaReview(): string | null {
  if (!existsSync(REVIEWS_DIR)) return null
  const files = readdirSync(REVIEWS_DIR)
    .filter((f) => f.startsWith('meta-review-') && f.endsWith('.md'))
    .sort()
    .reverse()
  return files[0] ? join(REVIEWS_DIR, files[0]) : null
}

function parseWeakAgentsFromReview(reviewPath: string): WeakAgent[] {
  const content = readFileSync(reviewPath, 'utf-8')
  const weak: WeakAgent[] = []

  // Find table rows: | AGENT_NAME | B | ... |
  const tableRows = content.match(/\|\s*([A-Z_]+)\s*\|\s*([BCD])\s*\|[^\n]*/g) ?? []
  for (const row of tableRows) {
    const match = row.match(/\|\s*([A-Z_]+)\s*\|\s*([BCD])\s*\|/)
    if (match) {
      const id = match[1].replace(/_AGENT$/, '')
      const grade = match[2] as 'B' | 'C' | 'D'

      // Extract gaps from the "Details" section for this agent
      const gapMatch = content.match(
        new RegExp(`### ${id}(?:_AGENT)?[^\n]*\\n([\\s\\S]*?)(?=\\n### |\\n## |$)`, 'm'),
      )
      const gaps = gapMatch ? gapMatch[1].trim().slice(0, 600) : '(no details found)'

      weak.push({ id, grade, gaps })
    }
  }

  return weak.sort((a, b) => {
    const order = { D: 0, C: 1, B: 2 }
    return order[a.grade] - order[b.grade]
  })
}

// ── Build deepening prompt ────────────────────────────────────────────────────

function buildDeepeningPrompt(agentId: string, currentContent: string, gaps: string): string {
  return `Vertiefe den bestehenden ${agentId}_AGENT fachlich.

## Warum Vertiefung nötig

Der Meta-Review hat festgestellt dass dieser Agent fachlich zu dünn ist:

${gaps}

## Bestehender Agent (VOLLSTÄNDIG erhalten — nur ERWEITERN, nicht löschen!)

${currentContent}

## Aufgabe

1. Lies den bestehenden Agent komplett durch
2. Identifiziere welche Regeln fehlen (basierend auf dem echten Fachstandard)
3. Füge die fehlenden Regeln hinzu — OHNE bestehende Regeln zu löschen oder zu ändern
4. Die neuen Regeln sollen:
   - Aus dem echten Standard abgeleitet sein (OWASP, ISTQB, etc.) — nicht vom Engineering-Standard
   - Das gleiche Format haben wie bestehende Regeln (Severity, Enforcement, Why, Bad→Good, Enforced by)
   - Nummerierung fortsetzen (wenn letzter R9 → neue ab R10)
   - In passende Kategorie-Abschnitte eingeordnet werden

5. Aktualisiere den Checklist-Block und die Tool-Integration-Tabelle

Ausgabe: Das vollständige, aktualisierte Agent-Dokument.
NICHT nur die neuen Regeln — das GANZE Dokument mit allen alten + neuen Regeln.`
}

// ── Committee call ────────────────────────────────────────────────────────────

async function callProvider(
  label: string,
  modelFn: () => Parameters<typeof generateText>[0]['model'],
  prompt: string,
): Promise<string> {
  try {
    const { text } = await generateText({
      model: modelFn(),
      prompt,
      maxOutputTokens: 6144,
    })
    return text.trim()
  } catch (err) {
    console.warn(`  ⚠ ${label} failed: ${String(err).slice(0, 120)}`)
    return ''
  }
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

// ── Find agent file by ID ─────────────────────────────────────────────────────

function findAgentFile(agentId: string): string | null {
  const candidates = [
    `${agentId}_AGENT.md`,
    `${agentId}_AGENT_v3.md`,
    `${agentId}_AGENT_FINAL.md`,
    `${agentId}_AGENT_v2.md`,
  ]
  for (const candidate of candidates) {
    const path = join(AGENTS_DIR, candidate)
    if (existsSync(path)) return path
  }

  // Fallback: search for matching file
  const files = readdirSync(AGENTS_DIR).filter((f) => f.startsWith(`${agentId}_`) && f.endsWith('.md'))
  return files[0] ? join(AGENTS_DIR, files[0]) : null
}

// ── Deepen one agent ──────────────────────────────────────────────────────────

async function deepenAgent(agentId: string, gaps: string): Promise<boolean> {
  console.log(`\n[${agentId}] Deepening…`)

  const agentPath = findAgentFile(agentId)
  if (!agentPath) {
    console.error(`  ✗ Agent file not found for: ${agentId}`)
    return false
  }

  const currentContent = readFileSync(agentPath, 'utf-8')
  const currentRules = (currentContent.match(/^### R\d+/gm) ?? []).length
  console.log(`  Current rules: ${currentRules}`)

  const prompt = buildDeepeningPrompt(agentId, currentContent, gaps)

  // 4 reviewers in parallel
  const [claudeDraft, gptDraft, geminiDraft, grokDraft] = await Promise.all([
    callProvider('Claude Sonnet', () => getAnthropic(REVIEWER_MODEL), prompt),
    callProvider('GPT-4o',        getOpenAI,  prompt),
    callProvider('Gemini 2.5',    getGemini,  prompt),
    callProvider('Grok 4',        getGrok,    prompt),
  ])

  const drafts = [claudeDraft, gptDraft, geminiDraft, grokDraft].filter(Boolean)
  if (drafts.length === 0) {
    console.error(`  ✗ All providers failed`)
    return false
  }
  console.log(`  ✓ Got ${drafts.length}/4 drafts`)

  // Judge: wählt die beste Version (meiste + qualitativ hochwertigste neue Regeln)
  const labels = ['Claude Sonnet', 'GPT-4o', 'Gemini 2.5', 'Grok 4']
  const judgePrompt = `Du bist der Judge für die Vertiefung des ${agentId}_AGENT.

Vier Modelle haben den Agenten erweitert. Jedes hat neue Regeln hinzugefügt.

${drafts.map((d, i) => `=== Entwurf ${i + 1}: ${labels[i] ?? `Modell ${i+1}`} ===\n${d}`).join('\n\n')}

Deine Aufgabe:
1. Wähle für jede mögliche neue Regel die beste Formulierung quer durch alle Entwürfe
2. Stelle sicher dass ALLE bestehenden Regeln enthalten sind (nichts darf verloren gehen)
3. Halte das einheitliche Format durch
4. Aktualisiere Checklist und Tool-Integration-Tabelle vollständig

Output: Das vollständige, finale ${agentId}_AGENT Dokument.`

  console.log('  Judging…')
  let finalContent = await callProvider('Judge (Opus)', () => getAnthropic(JUDGE_MODEL), judgePrompt)

  if (!finalContent) {
    console.warn('  ⚠ Judge failed — using Claude draft')
    finalContent = claudeDraft || drafts[0]
  }

  const newRules = (finalContent.match(/^### R\d+/gm) ?? []).length
  console.log(`  Rules: ${currentRules} → ${newRules} (+${newRules - currentRules})`)

  // Save (overwrite existing file)
  writeFileSync(agentPath, finalContent, 'utf-8')
  console.log(`  ✓ Saved: ${agentPath.replace(ROOT + '/', '')}`)
  return true
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  const targetArg = process.argv[2]?.toUpperCase()

  console.log('═══════════════════════════════════════════════════')
  console.log(' Deepen Weak Agents — Fachliche Vertiefung')
  console.log('═══════════════════════════════════════════════════\n')

  let agentsToDeepen: WeakAgent[]

  if (targetArg) {
    // Einzelner Agent angegeben
    agentsToDeepen = [{ id: targetArg, grade: 'B', gaps: 'Manually specified for deepening.' }]
  } else {
    // Aus Meta-Review lesen
    const reviewPath = findLatestMetaReview()
    if (!reviewPath) {
      console.error('Kein Meta-Review gefunden. Zuerst meta-review-agents.ts ausführen.')
      console.error('Oder: tsx src/scripts/deepen-weak-agents.ts TESTING')
      process.exit(1)
    }
    console.log(`Meta-Review: ${reviewPath.replace(ROOT + '/', '')}\n`)
    const allWeak = parseWeakAgentsFromReview(reviewPath)

    if (allWeak.length === 0) {
      console.log('Keine B/C/D-Agenten im Meta-Review gefunden. Alle gut?')
      process.exit(0)
    }

    // Top 4 (sortiert: D > C > B)
    agentsToDeepen = allWeak.slice(0, 4)
  }

  console.log(`Zu vertiefen: ${agentsToDeepen.map((a) => `${a.id} (${a.grade})`).join(', ')}\n`)

  let success = 0
  for (const agent of agentsToDeepen) {
    const ok = await deepenAgent(agent.id, agent.gaps)
    if (ok) success++
    if (agentsToDeepen.indexOf(agent) < agentsToDeepen.length - 1) {
      console.log('  (pausing 5s…)')
      await sleep(5000)
    }
  }

  console.log(`\n═══ Done: ${success}/${agentsToDeepen.length} agents deepened ═══`)
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
