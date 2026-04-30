#!/usr/bin/env node
/**
 * Automated Checker Testbench — scans public GitHub repos.
 *
 * Usage:
 *   env $(grep -v '^#' .env.local | grep -v ':' | xargs) \
 *     pnpm exec tsx src/scripts/benchmark.ts \
 *     --topic lovable-dev --max 10
 *
 * Options:
 *   --topic   GitHub topic to search (default: lovable-dev)
 *   --max     Max repos to scan (default: 10)
 *   --token   GitHub token (or GITHUB_TOKEN env var)
 *   --org-id  Supabase organization ID (or uses first org)
 *
 * Output:
 *   - Console: per-repo results + aggregated statistics
 *   - DB: audit_runs with is_benchmark=true
 *   - File: docs/benchmark-results/benchmark-YYYY-MM-DD.json
 */

import { writeFileSync, mkdirSync } from 'fs'
import { join, resolve } from 'path'
import { runBenchmark } from '../lib/benchmark/runner'
import { supabaseAdmin } from '../lib/supabase-admin'

const ROOT = resolve(process.cwd())
const OUTPUT_DIR = join(ROOT, 'docs', 'benchmark-results')

function parseArgs() {
  const args = process.argv.slice(2)
  let topic = 'lovable-dev'
  let max = 10
  let token = process.env.GITHUB_TOKEN ?? process.env.Github ?? ''
  let orgId = ''

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--topic' && args[i + 1]) { topic = args[++i]; continue }
    if (args[i] === '--max' && args[i + 1]) { max = parseInt(args[++i], 10); continue }
    if (args[i] === '--token' && args[i + 1]) { token = args[++i]; continue }
    if (args[i] === '--org-id' && args[i + 1]) { orgId = args[++i] }
  }

  return { topic, max, token, orgId }
}

async function resolveOrgId(explicit: string): Promise<string> {
  if (explicit) return explicit
  const { data } = await supabaseAdmin
    .from('organizations')
    .select('id')
    .limit(1)
    .single()
  if (!data?.id) {
    console.error('No organization found. Pass --org-id explicitly.')
    process.exit(1)
  }
  return data.id
}

async function main() {
  const { topic, max, token, orgId: explicitOrgId } = parseArgs()

  if (!token) {
    console.error('GitHub token required. Set GITHUB_TOKEN or pass --token.')
    process.exit(1)
  }

  const orgId = await resolveOrgId(explicitOrgId)

  console.log('\n  Tropen OS — Automated Checker Testbench')
  console.log('  ═══════════════════════════════════════')
  console.log(`  Topic:   ${topic}`)
  console.log(`  Max:     ${max}`)
  console.log(`  Org ID:  ${orgId.slice(0, 8)}...`)

  const startTime = Date.now()
  const { results, stats } = await runBenchmark({
    token,
    topic,
    maxRepos: max,
    organizationId: orgId,
  })
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)

  console.log(`\n  Total time: ${elapsed}s`)

  // Write results to file
  mkdirSync(OUTPUT_DIR, { recursive: true })
  const date = new Date().toISOString().slice(0, 10)
  const outputPath = join(OUTPUT_DIR, `benchmark-${date}.json`)
  writeFileSync(outputPath, JSON.stringify({
    date: new Date().toISOString(),
    topic,
    totalRepos: results.length,
    stats,
    repos: results.map((r) => ({
      name: `${r.owner}/${r.repo}`,
      url: r.url,
      score: r.score,
      status: r.status,
      findings: r.totalFindings,
      critical: r.criticalFindings,
      files: r.fileCount,
      durationMs: r.scanDurationMs,
      error: r.error ?? null,
    })),
  }, null, 2))

  console.log(`\n  Results saved: ${outputPath}`)
}

main().catch((err) => {
  console.error('Benchmark failed:', err)
  process.exit(1)
})
