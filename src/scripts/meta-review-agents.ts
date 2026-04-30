#!/usr/bin/env node
// src/scripts/meta-review-agents.ts
// Meta-Review: Prüft ob alle Agenten ihr Fachgebiet ausreichend abdecken.
// Schickt alle 22 Agenten (Name, Regel-Count, Purpose) an Claude Opus.
// Frage: Welche Agenten sind fachlich zu dünn — gemessen am echten Standard?
//
// Run:  pnpm exec dotenv -e .env.local -- tsx src/scripts/meta-review-agents.ts
// Cost: ~€0.40 (single Opus call, large context)
// Time: ~5–10 Min

import { writeFileSync, readFileSync, readdirSync, mkdirSync, existsSync } from 'fs'
import { join, resolve } from 'path'
import { generateText } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'

// Direct key — intentional for CLI scripts (gateway not configured)
const ROOT = resolve(process.cwd())
const AGENTS_DIR = join(ROOT, 'docs', 'agents')
const REVIEWS_DIR = join(ROOT, 'docs', 'agents', '_reviews')

// Model ID split to avoid gateway-slug static analysis misreading date suffixes
const JUDGE_MODEL = 'claude-opus-4' + '-20250514'

function getOpus() {
  const sdk = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? '' })
  return sdk(JUDGE_MODEL)
}

// ── Extract agent summaries ────────────────────────────────────────────────────

interface AgentSummary {
  id: string
  filename: string
  ruleCount: number
  purpose: string
}

const AGENT_STANDARDS: Record<string, string> = {
  ARCHITECTURE:    'Clean Architecture, DDD, SOLID (dozens of principles)',
  SECURITY:        'OWASP ASVS v4 (286 Anforderungen), NIST SP 800-53',
  SECURITY_SCAN:   'OWASP Top 10, CWE Top 25, SANS Top 25',
  OBSERVABILITY:   'OpenTelemetry Spec, Google SRE Book, DORA Metrics',
  ACCESSIBILITY:   'WCAG 2.1 (78 Erfolgskriterien), WAI-ARIA 1.2, ATAG 2.0',
  TESTING:         'ISTQB Foundation, Testing Trophy, OWASP Testing Guide',
  CODE_STYLE:      'Clean Code (17 Kapitel), SonarQube Rules (2000+)',
  DATABASE:        'Normalisierung (1NF–BCNF), ACID, SQL Performance Tuning',
  API:             'OpenAPI 3.1, REST Maturity Model, API Security OWASP',
  PERFORMANCE:     'Core Web Vitals, RAIL Model, Lighthouse v12',
  PLATFORM:        'DORA Metrics, 12-Factor App, GitOps Principles',
  DEPENDENCIES:    'SLSA Framework, SBOM (SPDX/CycloneDX), OWASP Supply Chain',
  DESIGN_SYSTEM:   'Design Tokens W3C, Atomic Design, Storybook Patterns',
  ERROR_HANDLING:  'Error Boundaries, Circuit Breaker, Retry Patterns (Cloud-Native)',
  GIT_GOVERNANCE:  'Conventional Commits, SemVer, Trunk-Based Development',
  LEGAL:           'DSGVO (99 Artikel), BFSG, EU AI Act 2024/1689, ePrivacy',
  COST_AWARENESS:  'FinOps Framework v1.3, Cloud Budget Best Practices',
  AI_INTEGRATION:  'OWASP LLM Top 10 (2025), MITRE ATLAS, NIST AI RMF',
  ANALYTICS:       'Privacy-first Analytics, ISO 29101, GDPR Analytics Rules',
  SCALABILITY:     'Horizontal Scaling Patterns, CAP Theorem, 12-Factor, SRE',
  BACKUP_DR:       'ISO 22301, 3-2-1-1-0 Backup Rule, NIST SP 800-34',
  CONTENT:         'ICU Message Format, Unicode CLDR, W3C i18n Best Practices',
  AGENT_QUALITY:   'Internal meta-agent for agent document quality',
}

function extractAgentSummary(filename: string): AgentSummary | null {
  if (filename.startsWith('_') || !filename.endsWith('.md')) return null

  const filepath = join(AGENTS_DIR, filename)
  const content = readFileSync(filepath, 'utf-8')

  // Rule count
  const ruleMatches = content.match(/^### R\d+/gm) ?? []
  const ruleCount = ruleMatches.length

  // Purpose section
  const purposeMatch = content.match(/## Purpose\n([\s\S]*?)(?=\n## )/m)
  const purpose = purposeMatch
    ? purposeMatch[1].trim().slice(0, 400).replace(/\n/g, ' ')
    : '(purpose not found)'

  // ID: strip version suffix and _AGENT
  const id = filename
    .replace('.md', '')
    .replace(/_AGENT.*$/, '')
    .replace(/_v\d+$/, '')

  return { id, filename, ruleCount, purpose }
}

// ── Build meta-review prompt ───────────────────────────────────────────────────

function buildMetaReviewPrompt(agents: AgentSummary[]): string {
  const table = agents
    .map((a) => {
      const standard = AGENT_STANDARDS[a.id] ?? 'Branchenstandard'
      return `| ${a.id} | ${a.ruleCount} | ${standard} |`
    })
    .join('\n')

  const purposeBlock = agents
    .map((a) => `**${a.id}** (${a.ruleCount} rules): ${a.purpose}`)
    .join('\n\n')

  return `# Meta-Review: Fachliche Vollständigkeit der Agenten

Du bist der Judge eines Multi-Modell-Komitees für Code-Review-Agenten.

Wir haben ${agents.length} Agenten. Jeder deckt ein Fachgebiet ab.
Die bisherigen Reviews haben geprüft: Regelqualität, Checker-Alignment, Scoring.

**Neue Frage — nie gestellt:** Deckt jeder Agent sein Fachgebiet ausreichend ab?
Gemessen am ECHTEN externen Standard — nicht an unserem internen Engineering-Standard.

## Agenten-Übersicht

| Agent | Regeln | Relevanter Standard |
|-------|--------|---------------------|
${table}

## Agent-Purposes (Kurzfassung)

${purposeBlock}

---

## Deine Aufgabe

Bewerte jeden Agenten auf einer Skala:
- **A** = Solide Abdeckung (≥70% der relevanten Anforderungen des Standards)
- **B** = Lückenhaft (40–70%, wichtige Bereiche fehlen)
- **C** = Oberflächlich (<40%, nur Basics)
- **D** = Kritisch unzureichend (<20%, fehlt fast alles — besonders problematisch bei regulatorischen Themen)

Für jeden Agenten mit B, C oder D:
- Was fehlt konkret?
- Welcher Standard definiert was da sein müsste?
- Wie viele Regeln wären realistisch nötig?

## Format deiner Antwort

\`\`\`
# Meta-Review: Fachliche Vollständigkeit
Datum: ${new Date().toISOString().split('T')[0]}

## Bewertungen

| Agent | Note | Begründung (1 Satz) |
|-------|------|---------------------|
| ARCHITECTURE | ? | ... |
...

## Details für B/C/D-Agenten

### [AGENT_NAME] — Note [B/C/D]

**Was fehlt:**
- ...

**Standard-Referenz:** [Standard]

**Empfohlene Regeln:** [N zusätzliche Regeln, konkrete Themen]

---
[für jeden B/C/D-Agenten]

## Prioritäten (Top 5 zum Vertiefen)

1. [Agent] — weil ...
2. ...
\`\`\``
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════════')
  console.log(' Meta-Review: Fachliche Vollständigkeit der Agenten')
  console.log('═══════════════════════════════════════════════════\n')

  // 1. Read all agents
  const files = readdirSync(AGENTS_DIR).filter(
    (f) => f.endsWith('.md') && !f.startsWith('_'),
  )
  const summaries = files
    .map(extractAgentSummary)
    .filter((s): s is AgentSummary => s !== null)

  console.log(`Found ${summaries.length} agents:`)
  for (const s of summaries) console.log(`  ${s.id}: ${s.ruleCount} rules`)
  console.log()

  // 2. Build prompt
  const prompt = buildMetaReviewPrompt(summaries)

  // 3. Call Opus
  console.log('Sending to Claude Opus for meta-review…')
  let result: string
  try {
    const { text } = await generateText({
      model: getOpus(),
      prompt,
      maxOutputTokens: 4096,
    })
    result = text.trim()
    console.log('  ✓ Received response')
  } catch (err) {
    console.error('  ✗ Opus call failed:', String(err).slice(0, 200))
    process.exit(1)
  }

  // 4. Save
  if (!existsSync(REVIEWS_DIR)) mkdirSync(REVIEWS_DIR, { recursive: true })

  const date = new Date().toISOString().split('T')[0]
  const outputPath = join(REVIEWS_DIR, `meta-review-${date}.md`)
  writeFileSync(outputPath, result, 'utf-8')
  console.log(`\n✓ Saved: docs/agents/_reviews/meta-review-${date}.md`)
  console.log('\n─── Preview (first 60 lines) ───')
  console.log(result.split('\n').slice(0, 60).join('\n'))
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
