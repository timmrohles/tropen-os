#!/usr/bin/env node
/**
 * Mixed benchmark: scan specific repos from different sources.
 * Usage: env ... pnpm exec tsx src/scripts/benchmark-mixed.ts
 */
import { writeFileSync, mkdirSync } from 'fs'
import { join, resolve } from 'path'
import { extractRepoFromGitHub } from '../lib/benchmark/tarball-extractor'
import { buildAuditContextFromFiles, runAudit } from '../lib/audit'
import { calculateStats, formatStats, type RepoResult } from '../lib/benchmark/stats'
import { getFixType } from '../lib/audit/rule-registry'
import { supabaseAdmin } from '../lib/supabase-admin'

const ROOT = resolve(process.cwd())
const OUTPUT_DIR = join(ROOT, 'docs', 'audit-reports')

interface RepoSpec {
  owner: string
  repo: string
  topic: 'lovable' | 'bolt' | 'cursor' | 'manual'
}

const REPOS: RepoSpec[] = [
  // Bolt.new (5)
  { owner: 'zebbern', repo: 'Devonz', topic: 'bolt' },
  { owner: 'hkirat', repo: 'bolt.newer', topic: 'bolt' },
  { owner: 'ntegrals', repo: 'december', topic: 'bolt' },
  // Cursor (3)
  { owner: 'thedaviddias', repo: 'llms-txt-hub', topic: 'cursor' },
  { owner: 'PageAI-Pro', repo: 'vibe-coding-starter', topic: 'cursor' },
  { owner: 'FutureExcited', repo: 'vibe-rules', topic: 'cursor' },
  // Manual Next.js with CI (2)
  { owner: 'nemanjam', repo: 'nextjs-prisma-boilerplate', topic: 'manual' },
  { owner: 'vercel', repo: 'next-forge', topic: 'manual' },
]

function toDbStatus(s: string): string { return s.replace(/-/g, '_') }

async function main() {
  const token = process.env.GITHUB_TOKEN ?? process.env.Github ?? ''
  if (!token) { console.error('GitHub token required'); process.exit(1) }

  const { data: org } = await supabaseAdmin.from('organizations').select('id').limit(1).single()
  const orgId = org?.id ?? ''

  console.log('\n  Tropen OS — Mixed Benchmark (Bolt + Cursor + Manual)')
  console.log('  ════════════════════════════════════════════════════')
  console.log(`  Repos: ${REPOS.length}\n`)

  const results: (RepoResult & { topic: string })[] = []
  const allFindingDetails: Array<{ ruleId: string; message: string; fixType: string; repo: string }> = []

  for (const spec of REPOS) {
    const label = `${spec.owner}/${spec.repo}`
    process.stdout.write(`  [${spec.topic}] ${label}...`)
    const start = Date.now()

    try {
      const fm = await extractRepoFromGitHub(spec.owner, spec.repo, token)
      const files = Object.entries(fm).map(([p, c]) => ({ path: p, content: c }))
      const tsFiles = files.filter(f => /\.(ts|tsx|js|jsx)$/.test(f.path))

      if (tsFiles.length < 3) {
        console.log(` SKIP (${tsFiles.length} code files) [${Date.now() - start}ms]`)
        results.push({ owner: spec.owner, repo: spec.repo, url: `https://github.com/${label}`,
          score: 0, status: 'error', totalFindings: 0, criticalFindings: 0,
          fileCount: files.length, scanDurationMs: Date.now() - start, error: 'Too few files', topic: spec.topic })
        continue
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

      for (const c of report.categories) {
        for (const r of c.ruleResults) {
          for (const f of r.findings) {
            allFindingDetails.push({ ruleId: r.ruleId, message: f.message, fixType: getFixType(r.ruleId), repo: label })
          }
        }
      }

      const findingCount = allFindings.length
      const dur = Date.now() - start
      console.log(` ${report.automatedPercentage.toFixed(1)}% ${report.status} (${findingCount} findings) [${dur}ms]`)
      results.push({ owner: spec.owner, repo: spec.repo, url: `https://github.com/${label}`,
        score: report.automatedPercentage, status: report.status, totalFindings: findingCount,
        criticalFindings: report.criticalFindings.length, fileCount: files.length,
        scanDurationMs: dur, topic: spec.topic })
    } catch (err) {
      const dur = Date.now() - start
      const msg = err instanceof Error ? err.message.slice(0, 100) : String(err).slice(0, 100)
      console.log(` ERROR: ${msg} [${dur}ms]`)
      results.push({ owner: spec.owner, repo: spec.repo, url: `https://github.com/${label}`,
        score: 0, status: 'error', totalFindings: 0, criticalFindings: 0,
        fileCount: 0, scanDurationMs: dur, error: msg, topic: spec.topic })
    }
  }

  const stats = calculateStats(results, allFindingDetails)
  console.log(formatStats(stats))

  // Score by topic
  console.log('\n  Score by topic:')
  for (const topic of ['bolt', 'cursor', 'manual'] as const) {
    const topicResults = results.filter(r => r.topic === topic && !r.error)
    if (topicResults.length === 0) continue
    const avg = topicResults.reduce((s, r) => s + r.score, 0) / topicResults.length
    console.log(`    ${topic}: ${avg.toFixed(1)}% avg (${topicResults.length} repos)`)
  }

  mkdirSync(OUTPUT_DIR, { recursive: true })
  const outPath = join(OUTPUT_DIR, 'benchmark-2026-04-15-v6-mixed.json')
  writeFileSync(outPath, JSON.stringify({
    date: new Date().toISOString(), stats,
    repos: results.map(r => ({ name: `${r.owner}/${r.repo}`, topic: r.topic, url: r.url,
      score: r.score, status: r.status, findings: r.totalFindings, files: r.fileCount,
      durationMs: r.scanDurationMs, error: r.error ?? null })),
  }, null, 2))
  console.log(`\n  Saved: ${outPath}`)
}

main().catch(e => { console.error(e); process.exit(1) })
