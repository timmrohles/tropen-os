// src/lib/benchmark/runner.ts
// Orchestrates benchmark scans: discover repos → download → scan → persist.

import { extractRepoFromGitHub } from './tarball-extractor'
import { discoverRepos, type RepoCandidate } from './repo-discovery'
import { calculateStats, formatStats, type RepoResult, type BenchmarkStats } from './stats'
import { buildAuditContextFromFiles, runAudit } from '@/lib/audit'
import type { AuditReport } from '@/lib/audit/types'
import { getFixType } from '@/lib/audit/rule-registry'
import { supabaseAdmin } from '@/lib/supabase-admin'

export interface BenchmarkOptions {
  token: string
  topic?: string
  maxRepos?: number
  organizationId: string
  triggeredBy?: string
}

interface FindingDetail { ruleId: string; message: string; fixType: string; repo: string }

function toDbStatus(s: string): string {
  return s.replace(/-/g, '_')
}

async function scanRepo(
  candidate: RepoCandidate,
  token: string,
): Promise<{ report: AuditReport; files: Array<{ path: string; content: string }>; durationMs: number } | { error: string; durationMs: number }> {
  const start = Date.now()
  try {
    const fileMap = await extractRepoFromGitHub(candidate.owner, candidate.repo, token)
    const fileArray = Object.entries(fileMap).map(([path, content]) => ({ path, content }))
    const tsFiles = fileArray.filter((f) => /\.(ts|tsx|js|jsx)$/.test(f.path))

    if (tsFiles.length < 5) {
      return { error: `Too few code files (${tsFiles.length})`, durationMs: Date.now() - start }
    }

    const ctx = await buildAuditContextFromFiles(fileArray, 4096)
    const report = await runAudit(ctx, {
      rootPath: '',
      skipModes: ['cli', 'external-tool'],
    })

    return { report, files: fileArray, durationMs: Date.now() - start }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { error: msg.slice(0, 200), durationMs: Date.now() - start }
  }
}

async function persistRun(
  candidate: RepoCandidate,
  report: AuditReport,
  orgId: string,
  triggeredBy?: string,
): Promise<string | null> {
  const totalScore = report.categories.reduce((s, c) => s + c.weightedScore * c.weight, 0)
  const totalMax = report.categories.reduce((s, c) => s + c.weightedMax * c.weight, 0)

  const allFindings = report.categories.flatMap((c) =>
    c.ruleResults.flatMap((r) =>
      r.findings.map((f) => ({ ...f, ruleId: r.ruleId, categoryId: c.categoryId }))
    )
  )

  const { data: run } = await supabaseAdmin
    .from('audit_runs')
    .insert({
      organization_id: orgId,
      project_name: `benchmark/${candidate.owner}/${candidate.repo}`,
      triggered_by: triggeredBy ?? null,
      trigger_type: 'scheduled',
      total_score: totalScore,
      total_max: totalMax,
      percentage: report.automatedPercentage,
      status: toDbStatus(report.status),
      total_rules: report.automatedRuleCount + report.manualRuleCount,
      automated_rules: report.automatedRuleCount,
      manual_rules: report.manualRuleCount,
      total_findings: allFindings.length,
      critical_findings: report.criticalFindings.length,
      full_report: report as unknown as Record<string, unknown>,
      is_benchmark: true,
      source_repo_url: candidate.url,
    })
    .select('id')
    .single()

  if (!run?.id) return null

  if (allFindings.length > 0) {
    await supabaseAdmin.from('audit_findings').insert(
      allFindings.map((f) => ({
        run_id: run.id,
        rule_id: f.ruleId,
        category_id: f.categoryId,
        severity: f.severity,
        message: f.message,
        file_path: f.filePath ?? null,
        line: f.line ?? null,
        suggestion: f.suggestion ?? null,
        agent_source: f.agentSource ?? 'core',
        agent_rule_id: f.agentRuleId ?? null,
        enforcement: f.enforcement ?? null,
        affected_files: f.affectedFiles ?? null,
        fix_hint: f.fixHint ?? null,
      }))
    )
  }

  return run.id
}

export async function runBenchmark(options: BenchmarkOptions): Promise<{
  results: RepoResult[]
  stats: BenchmarkStats
}> {
  console.log(`\n  Discovering repos (topic: ${options.topic ?? 'lovable-dev'})...\n`)
  const repos = await discoverRepos(options.token, {
    topic: options.topic,
    maxResults: options.maxRepos ?? 10,
  })
  console.log(`  Found ${repos.length} repos\n`)

  const results: RepoResult[] = []
  const allFindingDetails: FindingDetail[] = []

  for (const candidate of repos) {
    const label = `${candidate.owner}/${candidate.repo}`
    process.stdout.write(`  Scanning ${label}...`)

    const result = await scanRepo(candidate, options.token)

    if ('error' in result) {
      console.log(` SKIP (${result.error}) [${result.durationMs}ms]`)
      results.push({
        owner: candidate.owner, repo: candidate.repo, url: candidate.url,
        score: 0, status: 'error', totalFindings: 0, criticalFindings: 0,
        fileCount: 0, scanDurationMs: result.durationMs, error: result.error,
      })
      continue
    }

    const { report, files, durationMs } = result

    // Persist to DB
    await persistRun(candidate, report, options.organizationId, options.triggeredBy)

    // Collect finding details for stats
    for (const c of report.categories) {
      for (const r of c.ruleResults) {
        for (const f of r.findings) {
          allFindingDetails.push({
            ruleId: r.ruleId,
            message: f.message,
            fixType: getFixType(r.ruleId),
            repo: `${candidate.owner}/${candidate.repo}`,
          })
        }
      }
    }

    const repoResult: RepoResult = {
      owner: candidate.owner, repo: candidate.repo, url: candidate.url,
      score: report.automatedPercentage,
      status: report.status,
      totalFindings: report.categories.reduce((s, c) =>
        s + c.ruleResults.reduce((rs, r) => rs + r.findings.length, 0), 0),
      criticalFindings: report.criticalFindings.length,
      fileCount: files.length,
      scanDurationMs: durationMs,
    }
    results.push(repoResult)

    console.log(` ${report.automatedPercentage.toFixed(1)}% ${report.status} (${repoResult.totalFindings} findings) [${durationMs}ms]`)
  }

  const stats = calculateStats(results, allFindingDetails)
  console.log(formatStats(stats))

  return { results, stats }
}
