#!/usr/bin/env node
/**
 * Final benchmark v7: ALL 49 repos (41 Lovable + 8 Mixed) in one run.
 * Full checker stack (233 rules, 25 categories).
 */
import { writeFileSync, mkdirSync } from 'fs'
import { join, resolve } from 'path'
import { extractRepoFromGitHub } from '../lib/benchmark/tarball-extractor'
import { discoverRepos } from '../lib/benchmark/repo-discovery'
import { buildAuditContextFromFiles, runAudit } from '../lib/audit'
import { calculateStats, formatStats, type RepoResult } from '../lib/benchmark/stats'
import { supabaseAdmin } from '../lib/supabase-admin'

const ROOT = resolve(process.cwd())
const OUTPUT_DIR = join(ROOT, 'docs', 'audit-reports')

interface RepoSpec { owner: string; repo: string; topic: string }

const MIXED_REPOS: RepoSpec[] = [
  { owner: 'zebbern', repo: 'Devonz', topic: 'bolt' },
  { owner: 'hkirat', repo: 'bolt.newer', topic: 'bolt' },
  { owner: 'ntegrals', repo: 'december', topic: 'bolt' },
  { owner: 'thedaviddias', repo: 'llms-txt-hub', topic: 'cursor' },
  { owner: 'PageAI-Pro', repo: 'vibe-coding-starter', topic: 'cursor' },
  { owner: 'FutureExcited', repo: 'vibe-rules', topic: 'cursor' },
  { owner: 'nemanjam', repo: 'nextjs-prisma-boilerplate', topic: 'manual' },
  { owner: 'vercel', repo: 'next-forge', topic: 'manual' },
]

function toDbStatus(s: string): string { return s.replace(/-/g, '_') }

async function scanRepo(
  spec: RepoSpec, token: string, orgId: string,
): Promise<(RepoResult & { topic: string }) | null> {
  const label = `${spec.owner}/${spec.repo}`
  process.stdout.write(`  [${spec.topic.padEnd(7)}] ${label}...`)
  const start = Date.now()

  try {
    const fm = await extractRepoFromGitHub(spec.owner, spec.repo, token)
    const files = Object.entries(fm).map(([p, c]) => ({ path: p, content: c }))
    const tsFiles = files.filter(f => /\.(ts|tsx|js|jsx)$/.test(f.path))
    if (tsFiles.length < 3) {
      console.log(` SKIP (${tsFiles.length} files) [${Date.now() - start}ms]`)
      return null
    }

    const ctx = await buildAuditContextFromFiles(files, 4096)
    const report = await runAudit(ctx, { rootPath: '', skipModes: ['cli', 'external-tool'] })

    // Persist
    const totalScore = report.categories.reduce((s, c) => s + c.weightedScore * c.weight, 0)
    const totalMax = report.categories.reduce((s, c) => s + c.weightedMax * c.weight, 0)
    const allFindings = report.categories.flatMap(c =>
      c.ruleResults.flatMap(r => r.findings.map(f => ({ ...f, ruleId: r.ruleId, categoryId: c.categoryId })))
    )

    await supabaseAdmin.from('audit_runs').insert({
      organization_id: orgId, project_name: `benchmark/${label}`,
      trigger_type: 'scheduled', total_score: totalScore, total_max: totalMax,
      percentage: report.automatedPercentage, status: toDbStatus(report.status),
      total_rules: report.automatedRuleCount + report.manualRuleCount,
      automated_rules: report.automatedRuleCount, manual_rules: report.manualRuleCount,
      total_findings: allFindings.length, critical_findings: report.criticalFindings.length,
      full_report: report as unknown as Record<string, unknown>,
      is_benchmark: true, source_repo_url: `https://github.com/${label}`,
    })

    const dur = Date.now() - start
    console.log(` ${report.automatedPercentage.toFixed(1)}% ${report.status} (${allFindings.length} findings) [${dur}ms]`)

    return {
      owner: spec.owner, repo: spec.repo, url: `https://github.com/${label}`,
      score: report.automatedPercentage, status: report.status,
      totalFindings: allFindings.length, criticalFindings: report.criticalFindings.length,
      fileCount: files.length, scanDurationMs: dur, topic: spec.topic,
    }
  } catch {
    const dur = Date.now() - start
    console.log(` ERROR [${dur}ms]`)
    return null
  }
}

async function main() {
  const token = process.env.GITHUB_TOKEN ?? process.env.Github ?? ''
  if (!token) { console.error('Token required'); process.exit(1) }

  const { data: org } = await supabaseAdmin.from('organizations').select('id').limit(1).single()
  const orgId = org?.id ?? ''

  console.log('\n  Tropen OS — Final Benchmark v7')
  console.log('  ═══════════════════════════════\n')

  // Discover Lovable repos
  const lovable = await discoverRepos(token, { topic: 'lovable-dev', maxResults: 50 })
  const lovableSpecs: RepoSpec[] = lovable.map(r => ({ owner: r.owner, repo: r.repo, topic: 'lovable' }))

  const allSpecs = [...lovableSpecs, ...MIXED_REPOS]
  console.log(`  Total: ${allSpecs.length} repos (${lovableSpecs.length} Lovable + ${MIXED_REPOS.length} Mixed)\n`)

  const results: (RepoResult & { topic: string })[] = []
  const allFindingDetails: Array<{ ruleId: string; message: string; fixType: string; repo: string }> = []

  for (const spec of allSpecs) {
    const result = await scanRepo(spec, token, orgId)
    if (result) {
      results.push(result)
      // We don't have per-finding details here, but stats will work from results
    }
  }

  // Stats
  const stats = calculateStats(results, allFindingDetails)
  console.log(formatStats(stats))

  // Topic breakdown
  console.log('\n  Score by topic:')
  for (const topic of ['lovable', 'bolt', 'cursor', 'manual']) {
    const tr = results.filter(r => r.topic === topic)
    if (tr.length === 0) continue
    const avg = tr.reduce((s, r) => s + r.score, 0) / tr.length
    const scores = tr.map(r => r.score).sort((a, b) => a - b)
    const min = scores[0], max = scores[scores.length - 1]
    console.log(`    ${topic.padEnd(8)}: ${avg.toFixed(1)}% avg (${tr.length} repos, ${min.toFixed(1)}–${max.toFixed(1)}%)`)
  }

  // Distribution
  const dist = { prototype: 0, risky: 0, stable: 0, production: 0 }
  for (const r of results) {
    if (r.score >= 90) dist.production++
    else if (r.score >= 80) dist.stable++
    else if (r.score >= 60) dist.risky++
    else dist.prototype++
  }
  console.log(`\n  Distribution: ${dist.production} Production, ${dist.stable} Stable, ${dist.risky} Risky, ${dist.prototype} Prototype`)

  // Save
  mkdirSync(OUTPUT_DIR, { recursive: true })
  const outPath = join(OUTPUT_DIR, 'benchmark-2026-04-15-v7-final.json')
  writeFileSync(outPath, JSON.stringify({
    date: new Date().toISOString(),
    version: 'v7-final',
    checkerStack: { totalRules: 233, automated: 169, manual: 64, categories: 25 },
    stats: { ...stats, distribution: dist },
    topicBreakdown: ['lovable', 'bolt', 'cursor', 'manual'].map(topic => {
      const tr = results.filter(r => r.topic === topic)
      const scores = tr.map(r => r.score)
      return {
        topic, count: tr.length,
        avg: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10 : 0,
        min: scores.length ? Math.min(...scores) : 0,
        max: scores.length ? Math.max(...scores) : 0,
      }
    }),
    repos: results.map(r => ({
      name: `${r.owner}/${r.repo}`, topic: r.topic, url: r.url,
      score: r.score, status: r.status, findings: r.totalFindings,
      critical: r.criticalFindings, files: r.fileCount, durationMs: r.scanDurationMs,
    })),
  }, null, 2))
  console.log(`\n  Saved: ${outPath}`)
}

main().catch(e => { console.error(e); process.exit(1) })
