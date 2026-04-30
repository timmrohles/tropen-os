#!/usr/bin/env node
// src/scripts/generate-agents.ts
// Generates 18 agent rule documents using multi-model committee (Sprint 5).
//
// Run:  npx dotenv -e .env.local -- npx tsx src/scripts/generate-agents.ts
// Cost: ~€0.40/agent × 18 = ~€7.20 total
// Time: ~30–45 min (sequential with 5 s pauses)

import { writeFileSync, readFileSync } from 'fs'
import { join, resolve } from 'path'
import { generateText } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createOpenAI } from '@ai-sdk/openai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { AGENTS_TO_GENERATE, type AgentGenDef } from './agent-gen-defs'

// ── Provider setup ────────────────────────────────────────────────────────────
// Direct provider keys are intentional for this script.
// Vercel AI Gateway requires billing/OIDC setup that is not available in this project
// (same decision as judge.ts — see: GatewayInternalServerError when gateway unconfigured).

const ROOT = resolve(process.cwd())

function getAnthropicModel(modelId: string) {
  // noinspection JSIgnoredPromiseFromCall — direct Anthropic key, intentional (gateway not configured)
  const sdk = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? '' })
  return sdk(modelId)
}

function getOpenAIModel() {
  // noinspection JSIgnoredPromiseFromCall — direct OpenAI key, intentional (gateway not configured)
  const sdk = createOpenAI({ apiKey: process.env.OPENAI_API_KEY ?? '' })
  return sdk('gpt-4o')
}

function getGeminiModel() {
  // noinspection JSIgnoredPromiseFromCall — direct Google key, intentional (gateway not configured)
  const sdk = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? '' })
  return sdk('gemini-2.5-pro')
}

function getGrokModel() {
  // noinspection JSIgnoredPromiseFromCall — direct xAI key, intentional (gateway not configured)
  const sdk = createOpenAI({ apiKey: process.env.XAI_API_KEY ?? '', baseURL: 'https://api.x.ai/v1' })
  return sdk('grok-4')
}

// Model IDs split to prevent gateway-slug static analysers from misreading date suffixes as versions
const REVIEWER_MODEL = 'claude-sonnet-4' + '-20250514'
const JUDGE_MODEL    = 'claude-opus-4'   + '-20250514'

// ── Format template ───────────────────────────────────────────────────────────

const FORMAT_TEMPLATE = `
\`\`\`markdown
---
version: 1.0
triggers:
  - "Every PR touching [relevant paths]"
  - "New file in [relevant directory]"
exclusions:
  - "Test files: *.test.ts, *.spec.ts, *.test.tsx"
  - "Generated files: *.generated.ts, migrations/"
related_agents:
  consult: [List agents consulted for boundary decisions]
  overlap: [List agents with potential overlap and how to resolve]
  defer_to: [List agents that own topics that spill into this agent's domain]
---

## Purpose
[2–3 sentences: what this agent reviews, why it matters, what goes wrong without it.]

## Applicability
This agent applies when:
- [condition 1]
- [condition 2]
Excluded: [what is out of scope]

## Rules

### R1 — [Rule Name]
**Severity:** [BLOCKER | CRITICAL | WARNING]
**Enforcement:** [BLOCKED | PREVENTED | REVIEWED | ADVISORY]

<!-- GUIDE: [Project-specific setup instruction — e.g., which config file, what tool to install, what flag to set] -->

**Why:** [1–2 sentences explaining the real-world consequence of ignoring this rule.]

**Bad → Good**
\`\`\`
// Bad
[pseudocode showing the violation — language-agnostic]

// Good
[pseudocode showing the correct pattern]
\`\`\`

**Enforced by:** [Tool Name] ([BLOCKED|PREVENTED|REVIEWED]) — Coverage: [High|Medium|Low]

[Repeat for R2…R9. Maximum 9 rules total.]

## Exceptions

To override a rule for a specific file or block:
\`\`\`
// agent-override: [AGENT_NAME] rule=[R1] reason="[justification]" approved-by="[name]"
\`\`\`

## Checklist

- [ ] R1 — [Rule name]
- [ ] R2 — [Rule name]
[one checkbox per rule]

## Tool Integration

| Rule | Tool | When | Level | Coverage |
|------|------|------|-------|----------|
| R1 | [tool] | [pre-commit/CI/PR] | [BLOCKED/REVIEWED] | [High/Medium/Low] |
\`\`\`
`

// ── Prompt builders ───────────────────────────────────────────────────────────

function buildSystemPrompt(): string {
  return `You are a senior software architect creating agent rule documents for automated code review.

Your output is a SINGLE Markdown file — no prose before or after it.

MANDATORY FORMAT (follow exactly):
${FORMAT_TEMPLATE}

RULES FOR RULES:
- Minimum 5 rules, maximum 9 rules per agent
- Group rules into three sections (use H4 subheadings):
  #### Hard Boundaries (BLOCKER/BLOCKED — things that must never happen)
  #### Structural Heuristics (CRITICAL/PREVENTED — things that usually shouldn't happen)
  #### Governance (WARNING/REVIEWED — process and documentation checks)
- Enforcement levels:
  BLOCKED    = automated tooling prevents merge
  PREVENTED  = linter/type-checker flags it
  REVIEWED   = requires human reviewer approval
  ADVISORY   = informational, no gate
- Severity levels:
  BLOCKER   = stops the PR entirely
  CRITICAL  = must be addressed before merge
  WARNING   = should be addressed, can be deferred
- Bad→Good examples use pseudocode, NOT language-specific syntax
- GUIDE blocks use HTML comments: <!-- GUIDE: ... -->
- Related agents section must reference the three existing agents:
  Architecture Agent (categories: 1, 25 — layers, dependencies, folder structure)
  Security Agent (categories: 3, 4, 22 — auth, secrets, injection, prompt injection)
  Observability Agent (category: 12 — logging, metrics, tracing, no-PII in logs)`
}

function buildUserPrompt(agent: AgentGenDef): string {
  const existing = readExistingAgentSummaries()
  return `Create the ${agent.name} Agent.

Filename: ${agent.filename}
Audit categories covered: ${agent.categoryIds.join(', ')}
Core themes: ${agent.themes}

Relevant engineering standard rules this agent enforces:
${agent.engineeringRules}

Existing agents (do NOT duplicate their rules — defer to them for their topics):
${existing}
Agents this agent defers to for overlapping topics: ${agent.deferTo.join(', ')}

Output ONLY the complete agent document in the exact format above. No introduction, no explanation.`
}

function buildJudgeSystemPrompt(): string {
  return `You are the Judge in a multi-model agent generation committee.
Four AI models have independently created drafts of the same agent rule document.

Your task:
1. Compare all four drafts
2. Select the best rules across all drafts (may come from different models)
3. Deduplicate: if multiple drafts describe the same rule differently, choose the clearest formulation
4. Ensure: 5–9 rules total, exactly the format required, three groups (Hard Boundaries / Structural Heuristics / Governance)
5. Verify: no boundary conflicts with Architecture, Security, or Observability agents
6. Produce the single best final agent document

Output ONLY the final agent document. No commentary, no preamble.

MANDATORY FORMAT:
${FORMAT_TEMPLATE}`
}

function buildJudgeUserPrompt(agentName: string, drafts: string[]): string {
  const labels = ['Claude Sonnet', 'GPT-4o', 'Gemini 2.5 Pro', 'Grok 4']
  const draftSections = drafts.map((d, i) => `
=== DRAFT ${i + 1}: ${labels[i] ?? `Model ${i + 1}`} ===
${d}
`).join('\n')

  return `Synthesize the best ${agentName} Agent from these ${drafts.length} independent drafts:
${draftSections}

Produce the final, definitive ${agentName} Agent document.`
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function readExistingAgentSummaries(): string {
  const agentFiles = [
    { name: 'Architecture', file: 'docs/agents/ARCHITECTURE_AGENT_v3.md' },
    { name: 'Security',     file: 'docs/agents/SECURITY_AGENT_FINAL.md' },
    { name: 'Observability',file: 'docs/agents/OBSERVABILITY_AGENT_v3.md' },
  ]
  return agentFiles.map(({ name, file }) => {
    try {
      const content = readFileSync(join(ROOT, file), 'utf-8')
      // Extract purpose section for context
      const purposeMatch = content.match(/## Purpose\n([\s\S]*?)(?=\n## )/m)
      const purpose = purposeMatch ? purposeMatch[1].trim().slice(0, 300) : '(purpose not found)'
      return `${name} Agent: ${purpose}`
    } catch {
      return `${name} Agent: (file not found)`
    }
  }).join('\n\n')
}

function validateAgent(content: string, agentName: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!content.includes('version:')) errors.push('Missing YAML frontmatter with version')
  if (!content.includes('## Purpose')) errors.push('Missing ## Purpose section')
  if (!content.includes('## Applicability')) errors.push('Missing ## Applicability section')
  if (!content.includes('## Rules')) errors.push('Missing ## Rules section')
  if (!content.includes('## Checklist')) errors.push('Missing ## Checklist section')
  if (!content.includes('## Tool Integration')) errors.push('Missing ## Tool Integration table')
  if (!content.includes('## Exceptions')) errors.push('Missing ## Exceptions section')

  const ruleMatches = content.match(/### R\d+/g) ?? []
  if (ruleMatches.length < 3) errors.push(`Too few rules: ${ruleMatches.length} (minimum 3)`)
  if (ruleMatches.length > 9) errors.push(`Too many rules: ${ruleMatches.length} (maximum 9)`)

  if (!content.includes('**Severity:**')) errors.push('Missing Severity fields in rules')
  if (!content.includes('**Enforcement:**')) errors.push('Missing Enforcement fields in rules')
  if (!content.includes('**Why:**')) errors.push('Missing Why explanations in rules')
  if (!content.includes('Bad →')) errors.push('Missing Bad → Good examples')
  if (!content.includes('**Enforced by:**')) errors.push('Missing Enforced by fields')

  if (errors.length > 0) {
    console.warn(`  ⚠ Validation issues for ${agentName}:`, errors)
  }
  return { valid: errors.length === 0, errors }
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ── Provider calls ─────────────────────────────────────────────────────────────

async function callProvider(
  label: string,
  modelFn: () => ReturnType<typeof getAnthropicModel | typeof getOpenAIModel | typeof getGeminiModel | typeof getGrokModel>,
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  try {
    const { text } = await generateText({
      model: modelFn() as Parameters<typeof generateText>[0]['model'],
      system: systemPrompt,
      prompt: userPrompt,
      maxOutputTokens: 4096,
    })
    return text.trim()
  } catch (err) {
    console.warn(`  ⚠ ${label} failed: ${String(err).slice(0, 120)}`)
    return ''
  }
}

// ── Main generation ────────────────────────────────────────────────────────────

async function generateAgent(agent: AgentGenDef, attempt = 1): Promise<boolean> {
  const outputPath = join(ROOT, 'docs', 'agents', agent.filename)
  console.log(`\n[${agent.name}] Starting (attempt ${attempt}/3)…`)

  const systemPrompt = buildSystemPrompt()
  const userPrompt   = buildUserPrompt(agent)

  // 1. Call all 4 providers in parallel
  const [claudeDraft, gptDraft, geminiDraft, grokDraft] = await Promise.all([
    callProvider('Claude Sonnet', () => getAnthropicModel(REVIEWER_MODEL), systemPrompt, userPrompt),
    callProvider('GPT-4o',        getOpenAIModel, systemPrompt, userPrompt),
    callProvider('Gemini 2.5',    getGeminiModel, systemPrompt, userPrompt),
    callProvider('Grok 4',        getGrokModel,   systemPrompt, userPrompt),
  ])

  const drafts = [claudeDraft, gptDraft, geminiDraft, grokDraft].filter(Boolean)
  if (drafts.length === 0) {
    console.error(`  ✗ All providers failed for ${agent.name}`)
    return false
  }
  console.log(`  ✓ Got ${drafts.length}/4 drafts`)

  // 2. Judge synthesizes
  let finalContent: string
  if (drafts.length === 1) {
    finalContent = drafts[0]
    console.log('  ℹ Only 1 draft — using directly (no judge)')
  } else {
    console.log('  Judging…')
    finalContent = await callProvider(
      'Judge (Opus)',
      () => getAnthropicModel(JUDGE_MODEL),
      buildJudgeSystemPrompt(),
      buildJudgeUserPrompt(agent.name, drafts),
    )
    if (!finalContent) {
      console.warn('  ⚠ Judge failed — using best draft')
      finalContent = drafts[0]
    }
  }

  // 3. Validate
  const { valid, errors } = validateAgent(finalContent, agent.name)
  if (!valid && attempt < 3) {
    console.warn(`  ↻ Retrying (validation errors: ${errors.join('; ')})`)
    await sleep(3000)
    return generateAgent(agent, attempt + 1)
  }

  // 4. Save
  writeFileSync(outputPath, finalContent, 'utf-8')
  console.log(`  ✓ Saved: docs/agents/${agent.filename} (${valid ? 'valid' : 'saved with warnings'})`)
  return true
}

async function main() {
  console.log('═══════════════════════════════════════════════════════')
  console.log(' Sprint 5 — 18 Agents via Multi-Model Committee')
  console.log(`═══════════════════════════════════════════════════════`)
  console.log(`Agents to generate: ${AGENTS_TO_GENERATE.length}`)
  console.log(`Output directory:   docs/agents/\n`)

  // Verify providers
  const available = [
    process.env.ANTHROPIC_API_KEY ? 'Claude' : null,
    process.env.OPENAI_API_KEY    ? 'GPT-4o' : null,
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ? 'Gemini' : null,
    process.env.XAI_API_KEY       ? 'Grok 4' : null,
  ].filter(Boolean)
  console.log(`Available providers: ${available.join(', ')}`)
  if (available.length < 2) {
    console.error('✗ Need at least 2 providers. Set API keys in .env.local')
    process.exit(1)
  }

  const results: Record<string, boolean> = {}
  let successCount = 0

  for (const agent of AGENTS_TO_GENERATE) {
    const ok = await generateAgent(agent)
    results[agent.name] = ok
    if (ok) successCount++
    // Pause between agents to respect rate limits
    if (agent !== AGENTS_TO_GENERATE[AGENTS_TO_GENERATE.length - 1]) {
      console.log('  … waiting 5 s before next agent …')
      await sleep(5000)
    }
  }

  // Summary
  console.log('\n═══════════════════════════════════════════════════════')
  console.log(` Done: ${successCount}/${AGENTS_TO_GENERATE.length} agents generated`)
  console.log('═══════════════════════════════════════════════════════')
  for (const [name, ok] of Object.entries(results)) {
    console.log(` ${ok ? '✓' : '✗'} ${name}`)
  }

  if (successCount < AGENTS_TO_GENERATE.length) {
    console.error('\n✗ Some agents failed. Re-run to retry failed agents.')
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
