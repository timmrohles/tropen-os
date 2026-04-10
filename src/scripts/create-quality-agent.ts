#!/usr/bin/env node
// src/scripts/create-quality-agent.ts
// Generates docs/agents/AGENT_QUALITY_AGENT.md using a multi-model committee + Opus judge.
// All model calls route through the Vercel AI Gateway via plain "provider/model" strings.
//
// Run:  npx dotenv -e .env.local -- npx tsx src/scripts/create-quality-agent.ts
// Auth: requires AI_GATEWAY_API_KEY or VERCEL_OIDC_TOKEN in .env.local
// Cost: ~€0.50 (3 reviewers + Opus judge, single agent)

import { writeFileSync } from 'fs'
import { join, resolve } from 'path'
import { generateText } from 'ai'

const ROOT = resolve(process.cwd())
const OUTPUT_PATH = join(ROOT, 'docs', 'agents', 'AGENT_QUALITY_AGENT.md')

// All models route through Vercel AI Gateway — plain "provider/model" string format
// Dots in version numbers are intentional (AI Gateway slug format)
type ModelString = Parameters<typeof generateText>[0]['model']
const REVIEWER_CLAUDE = 'anthropic/claude-sonnet-4.6' as ModelString
const REVIEWER_GPT    = 'openai/gpt-5.4'              as ModelString
const REVIEWER_GROK   = 'xai/grok-4'                  as ModelString
const JUDGE_MODEL     = 'anthropic/claude-opus-4.6'   as ModelString

// ── Format template ────────────────────────────────────────────────────────────

const FORMAT_TEMPLATE = `
\`\`\`markdown
# AGENT_QUALITY_AGENT

## Meta

\`\`\`yaml
version: 1.0
last_updated: <ISO date>
created_by: committee
triggers:
  files:
    - "docs/agents/**/*.md"
  exclusions:
    - "docs/agents/_reviews/**"
related:
  - agent: <id>
    type: delegates | overlaps
    boundary: "<clear statement of where ownership begins/ends>"
\`\`\`

## Purpose
[2–3 sentences: what this meta-agent reviews, why it matters, what breaks without it.]

## Applicability
- Applies when: [list conditions]
- Excluded: [out-of-scope items]

---

## Rules

### HARD BOUNDARIES

### R1 — [Rule Name] [BLOCKER] [BLOCKED]

<!-- GUIDE: [Project-specific setup or enforcement instruction] -->

**Why:** [1–2 sentences on real-world consequences of ignoring this rule.]

**Bad → Good:**
\`\`\`
// ❌ [pseudocode showing violation]

// ✅ [pseudocode showing correct pattern]
\`\`\`

**Enforced by:** [specific tool name] ([BLOCKED|PREVENTED|REVIEWED]) — Coverage: [High|Medium|Low]

[Repeat for R2…R8. Minimum 5 rules, maximum 9.]

### STRUCTURAL HEURISTICS

[Rules in this category use [CRITICAL] [PREVENTED]]

### GOVERNANCE

[Rules in this category use [WARNING] [REVIEWED]]

---

## Exceptions
[Override comment format]

## Checklist
- [ ] R1 — [name]
[one per rule]

## Tool Integration
| Rule | Tool | When | Level | Coverage |
|------|------|------|-------|----------|
[one per rule]
\`\`\`
`

// ── Prompts ────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a principal software architect creating a meta-agent rule document.

This document is the AGENT_QUALITY_AGENT — it defines quality standards for all other agent documents in the Tropen OS codebase.
It is itself an agent document and must follow the exact same format as other agents.

MANDATORY FORMAT:
${FORMAT_TEMPLATE}

CONTEXT:
- Tropen OS uses 21 agent rule documents (3 manual + 18 committee-generated) to govern code reviews
- Each agent document reviews a specific domain (security, testing, accessibility, etc.)
- The quality agent reviews the agent documents themselves — it is a meta-reviewer
- Automated tooling in src/lib/audit/checkers/agent-committee-checker.ts parses these documents
- The review-agents.ts script runs quality checks against every agent document

RULES FOR THE QUALITY AGENT:
- 5–9 rules, grouped into Hard Boundaries / Structural Heuristics / Governance
- Hard Boundaries: structural requirements every agent MUST meet (missing section, missing labels)
- Structural Heuristics: rule quality standards (examples, specificity, boundary statements)
- Governance: process discipline (versioning, checklist alignment, staleness)
- Each rule must be verifiable programmatically or via the review-agents.ts script
- "Enforced by:" must name review-agents.ts or a specific linter rule — not vague "CI checks"
- Bad → Good examples must use pseudocode, not real code

Output ONLY the complete agent document. No introduction, no preamble.`

const USER_PROMPT = `Create the AGENT_QUALITY_AGENT — the meta-agent that defines quality standards for all other agent rule documents in Tropen OS.

The agent must answer: "What makes a good agent document?" with enforced, specific rules.

Key quality dimensions to cover across 5–9 rules:
1. Structural completeness (all required sections present)
2. Rule labeling (severity + enforcement levels on every rule)
3. Rule count bounds (5–9 rules per agent, not too few, not too many)
4. Example quality (every rule has a concrete bad→good example)
5. Boundary delineation (no two agents claim the same topic without a handoff)
6. Enforcement specificity (tool names, not vague process references)
7. Document hygiene (version, last_updated, checklist alignment)

Distribute these across Hard Boundaries / Structural Heuristics / Governance sections.
The highest-severity rules should be the ones that break automated tooling.

Output ONLY the complete AGENT_QUALITY_AGENT document in the exact format above.`

function buildJudgeSystemPrompt(): string {
  return `You are the Judge in a multi-model agent generation committee.
Three AI models have independently created drafts of the AGENT_QUALITY_AGENT document.

Your task:
1. Compare all three drafts
2. Select the best rules across all drafts (rules may come from different models)
3. Deduplicate: if multiple drafts describe the same rule differently, choose the clearest formulation
4. Ensure: 5–9 rules total, correct format, three sections (Hard Boundaries / Structural Heuristics / Governance)
5. Verify: the rules are themselves enforceable by the review-agents.ts script
6. Produce the single best final AGENT_QUALITY_AGENT document

Output ONLY the final document. No commentary, no preamble.

MANDATORY FORMAT:
${FORMAT_TEMPLATE}`
}

function buildJudgeUserPrompt(drafts: string[]): string {
  const labels = ['Claude Sonnet', 'GPT-5.4', 'Grok 4']
  const draftSections = drafts.map((d, i) => `
=== DRAFT ${i + 1}: ${labels[i] ?? `Model ${i + 1}`} ===
${d}
`).join('\n')

  return `Synthesize the best AGENT_QUALITY_AGENT from these ${drafts.length} independent drafts:

${draftSections}

Produce the final, definitive AGENT_QUALITY_AGENT document.`
}

// ── Provider calls ─────────────────────────────────────────────────────────────

async function callModel(label: string, model: ModelString, system: string, prompt: string): Promise<string> {
  try {
    console.log(`  Calling ${label}…`)
    const { text } = await generateText({ model, system, prompt, maxOutputTokens: 4096 })
    console.log(`  ✓ ${label} responded (${text.length} chars)`)
    return text.trim()
  } catch (err) {
    console.warn(`  ⚠ ${label} failed: ${String(err).slice(0, 160)}`)
    return ''
  }
}

// ── Validation ────────────────────────────────────────────────────────────────

function validateAgentDoc(content: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  if (!content.includes('version:'))            errors.push('Missing version in YAML')
  if (!content.includes('## Purpose'))          errors.push('Missing ## Purpose section')
  if (!content.includes('## Applicability'))    errors.push('Missing ## Applicability section')
  if (!content.includes('## Rules'))            errors.push('Missing ## Rules section')
  if (!content.includes('## Checklist'))        errors.push('Missing ## Checklist section')
  if (!content.includes('## Tool Integration')) errors.push('Missing ## Tool Integration section')
  if (!content.includes('## Exceptions'))       errors.push('Missing ## Exceptions section')
  const rules = content.match(/### R\d+/g) ?? []
  if (rules.length < 5) errors.push(`Too few rules: ${rules.length} (min 5)`)
  if (rules.length > 9) errors.push(`Too many rules: ${rules.length} (max 9)`)
  if (!content.includes('**Why:**'))            errors.push('Missing Why explanations')
  if (!content.includes('Bad → Good'))          errors.push('Missing Bad → Good examples')
  if (!content.includes('**Enforced by:**'))    errors.push('Missing Enforced by fields')
  return { valid: errors.length === 0, errors }
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════════════')
  console.log(' AGENT_QUALITY_AGENT — Multi-Model Committee Generation')
  console.log('═══════════════════════════════════════════════════════')

  const gatewayAvailable = !!(process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN)
  if (!gatewayAvailable) {
    console.error('✗ No gateway auth found. Set AI_GATEWAY_API_KEY or run: vercel env pull .env.local')
    process.exit(1)
  }
  console.log(`Gateway auth: ${process.env.AI_GATEWAY_API_KEY ? 'API key' : 'OIDC token'}`)

  // Step 1: Call all reviewers in parallel via AI Gateway
  console.log('\n[Step 1] Calling reviewers in parallel…')
  const [claudeDraft, gptDraft, grokDraft] = await Promise.all([
    callModel('Claude Sonnet 4.6', REVIEWER_CLAUDE, SYSTEM_PROMPT, USER_PROMPT),
    callModel('GPT-5.4',           REVIEWER_GPT,    SYSTEM_PROMPT, USER_PROMPT),
    callModel('Grok 4',            REVIEWER_GROK,   SYSTEM_PROMPT, USER_PROMPT),
  ])

  const drafts = [claudeDraft, gptDraft, grokDraft].filter(Boolean)
  console.log(`\n✓ Got ${drafts.length}/3 drafts`)

  if (drafts.length === 0) {
    console.error('✗ All reviewers failed — check AI_GATEWAY_API_KEY and gateway availability')
    process.exit(1)
  }

  // Step 2: Opus judge synthesizes
  let finalContent: string
  if (drafts.length === 1) {
    console.log('\n[Step 2] Only 1 draft — skipping judge')
    finalContent = drafts[0]
  } else {
    console.log('\n[Step 2] Running Opus 4.6 judge…')
    finalContent = await callModel('Claude Opus 4.6 (judge)', JUDGE_MODEL, buildJudgeSystemPrompt(), buildJudgeUserPrompt(drafts))
    if (!finalContent) {
      console.warn('⚠ Judge failed — using Claude Sonnet draft')
      finalContent = drafts[0]
    }
  }

  // Step 3: Validate
  console.log('\n[Step 3] Validating output…')
  const { valid, errors } = validateAgentDoc(finalContent)
  if (!valid) {
    console.warn(`⚠ Validation issues:\n  ${errors.join('\n  ')}`)
    console.warn('  Saving anyway — review and fix manually')
  } else {
    console.log('✓ Validation passed')
  }

  // Step 4: Save
  writeFileSync(OUTPUT_PATH, finalContent, 'utf-8')
  console.log(`\n✓ Saved: docs/agents/AGENT_QUALITY_AGENT.md`)
  console.log('\nNext step: npx dotenv -e .env.local -- npx tsx src/scripts/review-agents.ts')
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
