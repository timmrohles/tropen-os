#!/usr/bin/env node
// src/scripts/review-agents.ts
// Reviews all 18 committee-generated agent documents against AGENT_QUALITY_AGENT.md.
// Outputs per-agent JSON reviews to docs/agents/_reviews/ and a summary.md.
//
// Run:  npx dotenv -e .env.local -- npx tsx src/scripts/review-agents.ts
// Auth: requires AI_GATEWAY_API_KEY or VERCEL_OIDC_TOKEN in .env.local
// Cost: ~€0.05/agent × 18 = ~€0.90 total (Sonnet, single reviewer)

import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'fs'
import { join, resolve } from 'path'
import { generateText } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { AGENT_CATALOG } from '../lib/agents/agent-catalog'

// Direct provider key — intentional for CLI scripts.
// AI Gateway requires billing/credit card setup not available in this project.
// Same approach as generate-agents.ts.
const COMMITTEE_AGENTS = AGENT_CATALOG.filter((a) => a.createdBy === 'committee')

const ROOT = resolve(process.cwd())
const REVIEWS_DIR = join(ROOT, 'docs', 'agents', '_reviews')
const QUALITY_AGENT_PATH = join(ROOT, 'docs', 'agents', 'AGENT_QUALITY_AGENT.md')

// Model ID split to avoid gateway-slug static analysis misreading the date suffix
const REVIEWER_MODEL_ID = 'claude-sonnet-4' + '-20250514'

function getReviewerModel() {
  const sdk = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? '' })
  return sdk(REVIEWER_MODEL_ID)
}

// ── Review output types ───────────────────────────────────────────────────────

interface RuleScore {
  ruleId: string        // e.g. "R1"
  ruleName: string
  pass: boolean
  score: number         // 0–5
  issue: string | null  // null if pass
}

interface AgentReview {
  agentId: string
  agentName: string
  filename: string
  reviewedAt: string
  overallScore: number  // 0–100
  passed: boolean       // true if overallScore >= 70
  ruleScores: RuleScore[]
  strengths: string[]
  gaps: string[]
  recommendation: 'approve' | 'revise' | 'major-revision'
}

// ── Prompts ───────────────────────────────────────────────────────────────────

function buildReviewPrompt(qualityAgentContent: string, agentContent: string, agentName: string): string {
  return `You are performing a quality review of the ${agentName} Agent document.

## Quality Standard (AGENT_QUALITY_AGENT)

${qualityAgentContent}

---

## Document Under Review (${agentName} Agent)

${agentContent}

---

## Your Task

Evaluate the ${agentName} Agent against each rule in the AGENT_QUALITY_AGENT.
For each rule R1–R8, determine: does the ${agentName} Agent document comply?

Return ONLY valid JSON (no markdown fences, no explanation outside JSON):

{
  "overallScore": <0–100 integer>,
  "passed": <true if overallScore >= 70>,
  "ruleScores": [
    {
      "ruleId": "R1",
      "ruleName": "<rule name from quality agent>",
      "pass": <true|false>,
      "score": <0–5 integer>,
      "issue": "<specific issue if fail, or null if pass>"
    }
  ],
  "strengths": ["<specific thing done well>", ...],
  "gaps": ["<specific improvement needed>", ...],
  "recommendation": "approve" | "revise" | "major-revision"
}

Scoring:
- overallScore = average of ruleScores × 20, capped at 100
- "approve"        = overallScore >= 80, no blocking issues
- "revise"         = overallScore 60–79, minor issues
- "major-revision" = overallScore < 60, structural problems

Be specific in issues and strengths — cite actual content from the document.`
}

// ── Core logic ────────────────────────────────────────────────────────────────

async function reviewAgent(
  agentId: string,
  agentName: string,
  filename: string,
  qualityAgentContent: string,
): Promise<AgentReview> {
  const agentPath = join(ROOT, 'docs', 'agents', filename)
  const agentContent = readFileSync(agentPath, 'utf-8')

  const prompt = buildReviewPrompt(qualityAgentContent, agentContent, agentName)

  const { text } = await generateText({
    model: getReviewerModel() as Parameters<typeof generateText>[0]['model'],
    prompt,
    maxOutputTokens: 1024,
    temperature: 0,
  })

  const cleaned = text.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
  const parsed = JSON.parse(cleaned) as Omit<AgentReview, 'agentId' | 'agentName' | 'filename' | 'reviewedAt'>

  return {
    agentId,
    agentName,
    filename,
    reviewedAt: new Date().toISOString(),
    ...parsed,
  }
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

// ── Summary generation ────────────────────────────────────────────────────────

function buildSummaryMarkdown(reviews: AgentReview[]): string {
  const sorted = [...reviews].sort((a, b) => b.overallScore - a.overallScore)
  const avgScore = Math.round(reviews.reduce((s, r) => s + r.overallScore, 0) / reviews.length)
  const approved = reviews.filter((r) => r.recommendation === 'approve').length
  const revise = reviews.filter((r) => r.recommendation === 'revise').length
  const major = reviews.filter((r) => r.recommendation === 'major-revision').length

  const lines: string[] = [
    `# Agent Quality Review — Summary`,
    ``,
    `**Reviewed:** ${new Date().toISOString().slice(0, 10)}`,
    `**Agents reviewed:** ${reviews.length}`,
    `**Average score:** ${avgScore}/100`,
    ``,
    `## Results`,
    ``,
    `| Status | Count |`,
    `|--------|-------|`,
    `| ✅ Approve | ${approved} |`,
    `| 🔶 Revise | ${revise} |`,
    `| 🔴 Major revision | ${major} |`,
    ``,
    `## Scores`,
    ``,
    `| Agent | Score | Status | Top Gap |`,
    `|-------|-------|--------|---------|`,
    ...sorted.map((r) => {
      const icon = r.recommendation === 'approve' ? '✅' : r.recommendation === 'revise' ? '🔶' : '🔴'
      const gap = r.gaps[0] ?? '—'
      const gapTrunc = gap.length > 60 ? gap.slice(0, 57) + '…' : gap
      return `| ${r.agentName} | ${r.overallScore} | ${icon} ${r.recommendation} | ${gapTrunc} |`
    }),
    ``,
    `## Rule Coverage Across All Agents`,
    ``,
    `Which quality rules are most often violated:`,
    ``,
  ]

  // Aggregate rule failures
  const ruleFailCounts: Record<string, number> = {}
  for (const review of reviews) {
    for (const rs of review.ruleScores) {
      if (!rs.pass) {
        ruleFailCounts[rs.ruleId] = (ruleFailCounts[rs.ruleId] ?? 0) + 1
      }
    }
  }

  if (Object.keys(ruleFailCounts).length > 0) {
    lines.push(`| Rule | Failures | % of agents |`)
    lines.push(`|------|----------|-------------|`)
    const sortedRules = Object.entries(ruleFailCounts).sort((a, b) => b[1] - a[1])
    for (const [ruleId, count] of sortedRules) {
      const pct = Math.round((count / reviews.length) * 100)
      lines.push(`| ${ruleId} | ${count} | ${pct}% |`)
    }
  } else {
    lines.push(`All agents pass all quality rules.`)
  }

  lines.push(``)
  lines.push(`## Per-Agent Reviews`)
  lines.push(``)
  lines.push(`Individual JSON reviews: \`docs/agents/_reviews/{agent-id}.json\``)
  lines.push(``)
  lines.push(`### Agents needing revision`)
  lines.push(``)

  const needsWork = sorted.filter((r) => r.recommendation !== 'approve')
  if (needsWork.length === 0) {
    lines.push(`All agents approved.`)
  } else {
    for (const r of needsWork) {
      lines.push(`**${r.agentName}** (${r.overallScore}/100)`)
      for (const gap of r.gaps) {
        lines.push(`- ${gap}`)
      }
      lines.push(``)
    }
  }

  return lines.join('\n')
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════════════')
  console.log(' Agent Quality Review — 18 Committee Agents')
  console.log('═══════════════════════════════════════════════════════')

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('✗ ANTHROPIC_API_KEY not set in .env.local')
    process.exit(1)
  }
  console.log('Auth: ANTHROPIC_API_KEY (direct — gateway billing not configured)')

  // Load quality agent
  if (!existsSync(QUALITY_AGENT_PATH)) {
    console.error('✗ AGENT_QUALITY_AGENT.md not found. Run create-quality-agent.ts first.')
    process.exit(1)
  }
  const qualityAgentContent = readFileSync(QUALITY_AGENT_PATH, 'utf-8')
  console.log(`✓ Loaded AGENT_QUALITY_AGENT.md (${qualityAgentContent.length} chars)`)

  // Ensure output directory exists
  mkdirSync(REVIEWS_DIR, { recursive: true })

  const reviews: AgentReview[] = []
  let successCount = 0

  console.log(`\nReviewing ${COMMITTEE_AGENTS.length} agents with ${REVIEWER_MODEL_ID}…\n`)

  for (let i = 0; i < COMMITTEE_AGENTS.length; i++) {
    const agent = COMMITTEE_AGENTS[i]
    console.log(`[${i + 1}/${COMMITTEE_AGENTS.length}] ${agent.name}…`)

    try {
      const review = await reviewAgent(agent.id, agent.name, agent.filename, qualityAgentContent)
      reviews.push(review)

      const icon = review.recommendation === 'approve' ? '✅' : review.recommendation === 'revise' ? '🔶' : '🔴'
      console.log(`  ${icon} Score: ${review.overallScore}/100 — ${review.recommendation}`)
      if (review.gaps.length > 0) {
        console.log(`  Gap: ${review.gaps[0]}`)
      }

      // Save individual review
      const reviewPath = join(REVIEWS_DIR, `${agent.id}.json`)
      writeFileSync(reviewPath, JSON.stringify(review, null, 2), 'utf-8')
      successCount++
    } catch (err) {
      console.error(`  ✗ Failed: ${String(err).slice(0, 120)}`)
    }

    if (i < COMMITTEE_AGENTS.length - 1) {
      await sleep(1500)
    }
  }

  // Generate summary
  if (reviews.length > 0) {
    const summaryPath = join(REVIEWS_DIR, 'summary.md')
    writeFileSync(summaryPath, buildSummaryMarkdown(reviews), 'utf-8')
    console.log(`\n✓ Summary saved: docs/agents/_reviews/summary.md`)
  }

  // Final report
  const avgScore = reviews.length > 0
    ? Math.round(reviews.reduce((s, r) => s + r.overallScore, 0) / reviews.length)
    : 0
  console.log('\n═══════════════════════════════════════════════════════')
  console.log(` Done: ${successCount}/${COMMITTEE_AGENTS.length} agents reviewed`)
  console.log(` Average score: ${avgScore}/100`)
  console.log('═══════════════════════════════════════════════════════')

  const approve = reviews.filter((r) => r.recommendation === 'approve').length
  const revise  = reviews.filter((r) => r.recommendation === 'revise').length
  const major   = reviews.filter((r) => r.recommendation === 'major-revision').length
  console.log(` ✅ Approve:         ${approve}`)
  console.log(` 🔶 Revise:          ${revise}`)
  console.log(` 🔴 Major revision:  ${major}`)

  if (successCount < COMMITTEE_AGENTS.length) {
    console.error('\n✗ Some reviews failed — re-run to retry')
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
