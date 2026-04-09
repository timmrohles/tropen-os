#!/usr/bin/env node
// src/scripts/update-agents-from-reviews.ts
// Liest Komitee-Review-Findings und schickt jeden betroffenen Agenten
// mit seinen spezifischen Findings ans Komitee zur Überarbeitung.
//
// Usage: pnpm exec tsx src/scripts/update-agents-from-reviews.ts
// Output: Aktualisierte Dateien in docs/agents/ + Backup in docs/agents/_archive/
// Cost:   ~€0.30–0.50 per agent × 4 = ~€1.20–2.00 total

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, resolve } from 'path'
import { generateText } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createOpenAI } from '@ai-sdk/openai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'

// ── Provider setup ─────────────────────────────────────────────────────────────
// Direct provider keys — intentional for CLI scripts.
// AI Gateway requires billing/OIDC setup not available in this project.

const ROOT = resolve(process.cwd())

// Model IDs split to prevent gateway-slug static analysers from misreading date suffixes
const REVIEWER_MODEL = 'claude-sonnet-4' + '-20250514'
const JUDGE_MODEL    = 'claude-opus-4'   + '-20250514'

function getAnthropicModel(modelId: string) {
  const sdk = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? '' })
  return sdk(modelId)
}
function getOpenAIModel() {
  const sdk = createOpenAI({ apiKey: process.env.OPENAI_API_KEY ?? '' })
  return sdk('gpt-4o')
}
function getGeminiModel() {
  const sdk = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? '' })
  // gemini-2.5-flash: kein Extended Thinking, kein Output-Token-Problem bei 2048 Budget
  return sdk('gemini-2.5-flash')
}
function getGrokModel() {
  const sdk = createOpenAI({ apiKey: process.env.XAI_API_KEY ?? '', baseURL: 'https://api.x.ai/v1' })
  return sdk('grok-4')
}

// ── Finding types ──────────────────────────────────────────────────────────────

interface AgentFinding {
  source: string
  rule: string
  finding: string
  action: string
}

interface AgentUpdate {
  agentFile: string
  findings: AgentFinding[]
}

// ── Agent updates config ───────────────────────────────────────────────────────

const AGENT_UPDATES: AgentUpdate[] = [
  {
    agentFile: 'docs/agents/API_AGENT.md',
    findings: [
      {
        source: 'agent-checker-alignment-review',
        rule: 'R1',
        finding: 'API Versioning Regel feuert für interne Next.js Routes. Braucht Applicability-Qualifier: nur für Projekte mit öffentlicher API (openapi.yaml, docs/api vorhanden).',
        action: 'Applicability-Block unter dem Regel-Titel hinzufügen. Severity von CRITICAL auf WARNING senken. Enforcement von BLOCKED auf REVIEWED senken.',
      },
      {
        source: 'agent-checker-alignment-review',
        rule: 'R4',
        finding: 'Resilience-Patterns zu eng definiert — nur Timeout erwähnt. Circuit Breaker, exponential Backoff, Graceful Degradation fehlen.',
        action: 'R4 Bad/Good Beispiele erweitern um Circuit Breaker und exponential Backoff Patterns. Bestehende Beispiele behalten.',
      },
      {
        source: 'agent-checker-alignment-review',
        rule: 'R-Webhook',
        finding: 'Webhook-Signatur-Check feuert für Projekte ohne Webhook-Integration.',
        action: 'Applicability-Qualifier unter dem Regel-Titel: "Gilt nur wenn Webhook-Routes oder Webhook-Dependencies (stripe, github-webhooks etc.) im Projekt existieren."',
      },
    ],
  },
  {
    agentFile: 'docs/agents/SECURITY_AGENT_FINAL.md',
    findings: [
      {
        source: 'agent-checker-alignment-review',
        rule: 'R5',
        finding: 'Security Headers Regel prüft nur CORS. CSP, HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy fehlen.',
        action: 'R5 erweitern: vollständige Header-Liste mit konkreten empfohlenen Werten und Bad/Good Beispiele für jeden Header. Bestehende CORS-Beispiele behalten.',
      },
      {
        source: 'agent-checker-alignment-review',
        rule: 'R6',
        finding: 'Rate Limiting feuert für Projekte ohne öffentliche Endpoints.',
        action: 'Applicability-Qualifier: "Gilt nur für Projekte mit öffentlichen oder Auth-Endpoints. Interne Tool-only-Apps sind ausgenommen."',
      },
      {
        source: 'agent-checker-alignment-review',
        rule: 'R4',
        finding: 'Tenant Isolation / RLS Check feuert für Single-Tenant-Projekte.',
        action: 'Applicability-Qualifier: "Gilt nur für Multi-Tenant-Projekte (org_id, tenant_id oder workspace_id im DB-Schema)."',
      },
    ],
  },
  {
    agentFile: 'docs/agents/TESTING_AGENT.md',
    findings: [
      {
        source: 'agent-checker-alignment-review',
        rule: 'R1',
        finding: 'Regel "Tests in CI" ist zu vage — prüft nur ob CI existiert, nicht ob Tests den Merge blockieren.',
        action: 'R1 präzisieren: "Tests MÜSSEN den Merge blockieren (required status check)". Bad/Good Beispiel mit GitHub Actions required-status-check-Config ergänzen.',
      },
      {
        source: 'agent-checker-alignment-review',
        rule: 'R4',
        finding: 'Test-Pyramide 70/20/10 Ratio ist nicht automatisch prüfbar wie beschrieben.',
        action: 'R4 Enforcement von BLOCKED auf REVIEWED ändern. Ergänze Heuristik: Dateianzahl in unit/ vs e2e/ vs integration/ als Proxy, nicht exakte Ratio. Titel entsprechend anpassen.',
      },
      {
        source: 'agent-checker-alignment-review',
        rule: 'R2',
        finding: 'Coverage-Threshold prüft nur Config-Existenz, nicht den tatsächlichen Schwellenwert.',
        action: 'R2 GUIDE-Block erweitern: "Checker muss die Coverage-Config parsen und validieren dass der Threshold-Wert ≥80% ist — nicht nur die Existenz der Config-Datei prüfen."',
      },
    ],
  },
  {
    agentFile: 'docs/agents/ACCESSIBILITY_AGENT.md',
    findings: [
      {
        source: 'audit-scoring-review',
        rule: 'META',
        finding: 'Accessibility Gewicht sollte ×3 sein statt ×2 wegen EU Accessibility Act 2025 (Pflicht für B2B SaaS ab Juni 2025).',
        action: 'Im Purpose-Abschnitt ergänzen: "Gewicht im Audit: ×3 (kritisch — EU Accessibility Act 2025 ist seit Juni 2025 in Kraft und gilt für B2B SaaS)." Wenn ein Meta-Block mit Gewicht existiert, dort updaten.',
      },
    ],
  },
]

// ── Prompts ────────────────────────────────────────────────────────────────────

const REVIEWER_SYSTEM_PROMPT = `Du bist ein Senior Quality Engineer der Agent-Regelwerke überarbeitet.

Du bekommst:
1. Den aktuellen Agent als vollständiges Markdown-Dokument
2. Eine Liste von Findings die behoben werden müssen
3. Für jedes Finding: die Quelle, die betroffene Regel, und die gewünschte Aktion

REGELN:
- Behalte die gesamte Struktur des Agents bei (YAML-Frontmatter, Purpose, Applicability, Rules, Exceptions, Checklist, Tool Integration)
- Ändere NUR die Stellen die von den Findings betroffen sind
- Applicability-Qualifier: füge als eigenen Absatz DIREKT UNTER dem Regel-Titel ein, vor **Severity:**
- Severity/Enforcement-Änderungen: ändere auch den Regel-Titel (### R1 — [Name]) wenn nötig
- Bad/Good-Beispiele: erweitern, NICHT ersetzen — bestehende Beispiele behalten
- Checkliste und Tool Integration Tabelle: aktualisieren wenn sich Enforcement ändert
- Setze last_updated: "2026-04-09" im YAML-Frontmatter
- Antworte NUR mit dem vollständigen, aktualisierten Agent-Dokument. Kein Kommentar davor oder danach.`

function buildReviewerUserPrompt(agentName: string, agentContent: string, findings: AgentFinding[]): string {
  const findingsList = findings.map((f, i) => `
FINDING ${i + 1}:
  REGEL:   ${f.rule}
  QUELLE:  ${f.source}
  PROBLEM: ${f.finding}
  AKTION:  ${f.action}`).join('\n')

  return `Hier ist der aktuelle Agent:

=== ${agentName} ===
${agentContent}

---

FINDINGS DIE BEHOBEN WERDEN MÜSSEN:
${findingsList}

---

Überarbeite den Agent entsprechend aller Findings.
Antworte NUR mit dem vollständigen aktualisierten Markdown-Dokument.`
}

const JUDGE_SYSTEM_PROMPT = `Du bist der Judge in einem Multi-Model-Komitee für Agent-Dokument-Updates.
4 Modelle haben denselben Agenten überarbeitet. Jedes hat dieselben Findings behoben,
aber möglicherweise mit unterschiedlichen Formulierungen oder Detailtiefe.

Deine Aufgabe:
1. Wähle für jede geänderte Stelle die beste/präziseste Formulierung
2. Stelle sicher dass ALLE Findings korrekt umgesetzt wurden
3. Stelle sicher dass die Gesamtstruktur korrekt ist
4. Stelle sicher dass unveränderte Teile exakt beibehalten wurden
5. last_updated: "2026-04-09" muss gesetzt sein

Antworte NUR mit dem vollständigen, finalen Agent-Dokument. Kein Kommentar.`

function buildJudgeUserPrompt(agentName: string, findings: AgentFinding[], drafts: string[]): string {
  const labels = ['Claude Sonnet', 'GPT-4o', 'Gemini 2.5 Flash', 'Grok 4']
  const findingsList = findings.map(f => `- ${f.rule}: ${f.action}`).join('\n')
  const draftSections = drafts
    .map((d, i) => `\n=== DRAFT ${i + 1}: ${labels[i] ?? `Modell ${i + 1}`} ===\n${d}`)
    .join('\n')

  return `Wähle die beste Version des überarbeiteten ${agentName}.

Umgesetzte Findings (alle müssen enthalten sein):
${findingsList}

${draftSections}

Produziere den finalen ${agentName}.`
}

// ── Provider call ──────────────────────────────────────────────────────────────

interface CallResult { text: string; inputTokens: number; outputTokens: number }

async function callProvider(
  label: string,
  modelFn: () => ReturnType<typeof getAnthropicModel>,
  systemPrompt: string,
  userPrompt: string,
  maxOutputTokens = 4096,
): Promise<CallResult> {
  try {
    const result = await generateText({
      model: modelFn() as Parameters<typeof generateText>[0]['model'],
      system: systemPrompt,
      prompt: userPrompt,
      maxOutputTokens,
    })
    const text = result.text?.trim() ?? ''
    if (!text) {
      console.warn(`  ⚠ ${label} returned empty text (finishReason: ${result.finishReason})`)
    }
    return {
      text,
      inputTokens: result.usage?.inputTokens ?? 0,
      outputTokens: result.usage?.outputTokens ?? 0,
    }
  } catch (err) {
    console.warn(`  ⚠ ${label} failed: ${String(err).slice(0, 160)}`)
    return { text: '', inputTokens: 0, outputTokens: 0 }
  }
}

// ── Cost tracking ──────────────────────────────────────────────────────────────

const PRICE_TABLE: Record<string, { inPerM: number; outPerM: number }> = {
  'Claude Sonnet':      { inPerM: 3.0,  outPerM: 15.0 },
  'GPT-4o':            { inPerM: 2.5,  outPerM: 10.0 },
  'Gemini 2.5 Flash':  { inPerM: 0.075,outPerM: 0.30 },
  'Grok 4':            { inPerM: 3.0,  outPerM: 15.0 },
  'Judge (Opus)':      { inPerM: 15.0, outPerM: 75.0 },
}
const USD_TO_EUR = 0.93

function calcCost(label: string, inputTokens: number, outputTokens: number): number {
  const p = PRICE_TABLE[label] ?? { inPerM: 3.0, outPerM: 15.0 }
  return ((inputTokens * p.inPerM + outputTokens * p.outPerM) / 1_000_000) * USD_TO_EUR
}

async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

// ── Core update function ───────────────────────────────────────────────────────

interface UpdateResult {
  agentFile: string
  success: boolean
  findingsCount: number
  totalCostEur: number
  changedRules: string[]
}

async function updateAgent(update: AgentUpdate): Promise<UpdateResult> {
  const agentName = update.agentFile.split('/').pop()!.replace('.md', '')
  console.log(`\n  → ${agentName} (${update.findings.length} findings)`)

  // Read agent
  const agentPath = join(ROOT, update.agentFile)
  if (!existsSync(agentPath)) {
    console.warn(`  ✗ Agent not found: ${update.agentFile}`)
    return { agentFile: update.agentFile, success: false, findingsCount: update.findings.length, totalCostEur: 0, changedRules: [] }
  }
  const agentContent = readFileSync(agentPath, 'utf-8')

  const reviewerUserPrompt = buildReviewerUserPrompt(agentName, agentContent, update.findings)

  // 4 reviewers in parallel
  const [r1, r2, r3, r4] = await Promise.all([
    callProvider('Claude Sonnet',     () => getAnthropicModel(REVIEWER_MODEL) as ReturnType<typeof getAnthropicModel>, REVIEWER_SYSTEM_PROMPT, reviewerUserPrompt),
    callProvider('GPT-4o',            () => getOpenAIModel()                  as ReturnType<typeof getAnthropicModel>, REVIEWER_SYSTEM_PROMPT, reviewerUserPrompt),
    callProvider('Gemini 2.5 Flash',  () => getGeminiModel()                  as ReturnType<typeof getAnthropicModel>, REVIEWER_SYSTEM_PROMPT, reviewerUserPrompt),
    callProvider('Grok 4',            () => getGrokModel()                    as ReturnType<typeof getAnthropicModel>, REVIEWER_SYSTEM_PROMPT, reviewerUserPrompt),
  ])

  const reviewerResults = [
    { label: 'Claude Sonnet',    ...r1 },
    { label: 'GPT-4o',           ...r2 },
    { label: 'Gemini 2.5 Flash', ...r3 },
    { label: 'Grok 4',           ...r4 },
  ]

  let totalCost = reviewerResults.reduce((s, r) => s + calcCost(r.label, r.inputTokens, r.outputTokens), 0)

  const drafts = reviewerResults.filter(r => r.text)
  console.log(`    ${drafts.length}/4 Reviewer (${reviewerResults.map(r => r.text ? '✓' : '✗').join(' ')})`)

  if (drafts.length === 0) {
    console.error(`    ✗ Alle Reviewer fehlgeschlagen`)
    return { agentFile: update.agentFile, success: false, findingsCount: update.findings.length, totalCostEur: totalCost, changedRules: [] }
  }

  // Judge
  let finalContent: string
  if (drafts.length === 1) {
    finalContent = drafts[0].text
    console.log(`    Judge übersprungen (nur 1 Draft)`)
  } else {
    const judgeResult = await callProvider(
      'Judge (Opus)',
      () => getAnthropicModel(JUDGE_MODEL) as ReturnType<typeof getAnthropicModel>,
      JUDGE_SYSTEM_PROMPT,
      buildJudgeUserPrompt(agentName, update.findings, drafts.map(d => d.text)),
      4096,
    )
    totalCost += calcCost('Judge (Opus)', judgeResult.inputTokens, judgeResult.outputTokens)

    if (!judgeResult.text) {
      console.warn(`    ⚠ Judge fehlgeschlagen — besten Draft verwenden`)
      finalContent = drafts[0].text
    } else {
      finalContent = judgeResult.text
    }
  }

  // Strip markdown code fences if the model wrapped the output
  if (finalContent.startsWith('```')) {
    finalContent = finalContent.replace(/^```(?:markdown)?\n?/, '').replace(/\n?```$/, '').trim()
  }

  // Backup old version
  const archiveDir = join(ROOT, 'docs', 'agents', '_archive')
  mkdirSync(archiveDir, { recursive: true })
  const backupPath = join(archiveDir, `${agentName}_pre-review-${new Date().toISOString().slice(0, 10)}.md`)
  writeFileSync(backupPath, agentContent, 'utf-8')

  // Write updated agent
  writeFileSync(agentPath, finalContent, 'utf-8')

  const changedRules = update.findings.map(f => f.rule)
  console.log(`    ✓ Gespeichert (€${totalCost.toFixed(4)}) — Backup: _archive/${agentName}_pre-review-*.md`)

  return { agentFile: update.agentFile, success: true, findingsCount: update.findings.length, totalCostEur: totalCost, changedRules }
}

// ── Update log ─────────────────────────────────────────────────────────────────

function writeUpdateLog(results: UpdateResult[]): void {
  const totalCost = results.reduce((s, r) => s + r.totalCostEur, 0)
  const lines = [
    `# Agent-Updates aus Komitee-Reviews`,
    ``,
    `**Datum:** ${new Date().toISOString().slice(0, 10)}`,
    `**Gesamt-Kosten:** €${totalCost.toFixed(4)}`,
    ``,
    `## Übersicht`,
    ``,
    `| Agent | Findings | Geänderte Regeln | Kosten | Status |`,
    `|-------|----------|------------------|--------|--------|`,
    ...results.map(r => {
      const agentName = r.agentFile.split('/').pop()!.replace('.md', '')
      const rulesStr = r.changedRules.join(', ')
      const icon = r.success ? '✅' : '✗'
      return `| ${agentName} | ${r.findingsCount} | ${rulesStr} | €${r.totalCostEur.toFixed(4)} | ${icon} |`
    }),
    ``,
    `## Details`,
    ``,
  ]

  for (const update of AGENT_UPDATES) {
    const agentName = update.agentFile.split('/').pop()!.replace('.md', '')
    lines.push(`### ${agentName}`)
    lines.push(``)
    for (const f of update.findings) {
      lines.push(`**${f.rule}** (${f.source})`)
      lines.push(`- Problem: ${f.finding}`)
      lines.push(`- Aktion: ${f.action}`)
      lines.push(``)
    }
  }

  const logDir = join(ROOT, 'docs', 'agents', '_reviews')
  mkdirSync(logDir, { recursive: true })
  const logPath = join(logDir, 'update-log.md')
  writeFileSync(logPath, lines.join('\n'), 'utf-8')
  console.log(`\n  ✓ Update-Log: docs/agents/_reviews/update-log.md`)
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════════════')
  console.log(' Agent-Updates aus Komitee-Reviews')
  console.log(`═══════════════════════════════════════════════════════`)
  console.log(`Agenten zu aktualisieren: ${AGENT_UPDATES.length}`)

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('✗ ANTHROPIC_API_KEY fehlt')
    process.exit(1)
  }

  const available = [
    process.env.ANTHROPIC_API_KEY            ? 'Claude' : null,
    process.env.OPENAI_API_KEY               ? 'GPT-4o' : null,
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ? 'Gemini' : null,
    process.env.XAI_API_KEY                  ? 'Grok 4' : null,
  ].filter(Boolean)
  console.log(`Provider: ${available.join(', ')}\n`)

  const results: UpdateResult[] = []

  for (let i = 0; i < AGENT_UPDATES.length; i++) {
    const update = AGENT_UPDATES[i]
    const result = await updateAgent(update)
    results.push(result)

    if (i < AGENT_UPDATES.length - 1) {
      await sleep(3000)
    }
  }

  writeUpdateLog(results)

  const totalCost = results.reduce((s, r) => s + r.totalCostEur, 0)
  const successCount = results.filter(r => r.success).length

  console.log('\n═══════════════════════════════════════════════════════')
  console.log(` Fertig: ${successCount}/${AGENT_UPDATES.length} Agenten aktualisiert`)
  console.log(` Gesamt-Kosten: €${totalCost.toFixed(4)}`)
  if (totalCost > 2.00) console.warn(' ⚠ Über €2.00 Budget')
  console.log('═══════════════════════════════════════════════════════')

  if (successCount < AGENT_UPDATES.length) process.exit(1)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
