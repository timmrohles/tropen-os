// src/lib/benchmark/stats.ts
// Aggregated statistics from benchmark scan results.

export interface RepoResult {
  owner: string
  repo: string
  url: string
  score: number
  status: string
  totalFindings: number
  criticalFindings: number
  fileCount: number
  scanDurationMs: number
  error?: string
}

export interface BenchmarkStats {
  totalRepos: number
  successfulScans: number
  failedScans: number
  avgScore: number
  medianScore: number
  scoreDistribution: {
    prototype: number
    risky: number
    stable: number
    production: number
  }
  topFindings: Array<{
    ruleId: string
    message: string
    count: number
    percentage: number
  }>
  findingsByFixType: Record<string, number>
  totalFindings: number
  avgFindingsPerRepo: number
}

export function calculateStats(
  results: RepoResult[],
  findingDetails: Array<{ ruleId: string; message: string; fixType: string; repo?: string }>,
): BenchmarkStats {
  const successful = results.filter((r) => !r.error)
  const scores = successful.map((r) => r.score).sort((a, b) => a - b)

  const median = scores.length === 0 ? 0
    : scores.length % 2 === 0
      ? (scores[scores.length / 2 - 1] + scores[scores.length / 2]) / 2
      : scores[Math.floor(scores.length / 2)]

  // Score distribution
  const dist = { prototype: 0, risky: 0, stable: 0, production: 0 }
  for (const s of scores) {
    if (s >= 90) dist.production++
    else if (s >= 80) dist.stable++
    else if (s >= 60) dist.risky++
    else dist.prototype++
  }

  // Top findings by frequency — count total occurrences AND unique repos affected
  const ruleCount = new Map<string, { msg: string; count: number; repos: Set<string> }>()
  for (const f of findingDetails) {
    const existing = ruleCount.get(f.ruleId)
    if (existing) { existing.count++; existing.repos.add(f.repo ?? '') }
    else ruleCount.set(f.ruleId, { msg: f.message, count: 1, repos: new Set([f.repo ?? '']) })
  }
  const topFindings = [...ruleCount.entries()]
    .sort((a, b) => b[1].repos.size - a[1].repos.size || b[1].count - a[1].count)
    .slice(0, 20)
    .map(([ruleId, { msg, count, repos }]) => ({
      ruleId,
      message: msg.slice(0, 80),
      count,
      percentage: Math.round((repos.size / Math.max(successful.length, 1)) * 100),
    }))

  // Findings by fixType
  const byFixType: Record<string, number> = {}
  for (const f of findingDetails) {
    byFixType[f.fixType] = (byFixType[f.fixType] ?? 0) + 1
  }

  const totalFindings = successful.reduce((s, r) => s + r.totalFindings, 0)

  return {
    totalRepos: results.length,
    successfulScans: successful.length,
    failedScans: results.length - successful.length,
    avgScore: scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0,
    medianScore: Math.round(median * 10) / 10,
    scoreDistribution: dist,
    topFindings,
    findingsByFixType: byFixType,
    totalFindings,
    avgFindingsPerRepo: successful.length ? Math.round(totalFindings / successful.length) : 0,
  }
}

export function formatStats(stats: BenchmarkStats): string {
  const lines: string[] = [
    '',
    '═══════════════════════════════════════════════════════',
    ' BENCHMARK RESULTS',
    '═══════════════════════════════════════════════════════',
    '',
    `Repos scanned:    ${stats.successfulScans} / ${stats.totalRepos}`,
    `Failed:           ${stats.failedScans}`,
    '',
    `Average score:    ${stats.avgScore}%`,
    `Median score:     ${stats.medianScore}%`,
    '',
    'Score distribution:',
    `  Production (90+): ${stats.scoreDistribution.production}`,
    `  Stable (80-89):   ${stats.scoreDistribution.stable}`,
    `  Risky (60-79):    ${stats.scoreDistribution.risky}`,
    `  Prototype (<60):  ${stats.scoreDistribution.prototype}`,
    '',
    `Total findings:   ${stats.totalFindings}`,
    `Avg per repo:     ${stats.avgFindingsPerRepo}`,
    '',
    'Top 10 findings:',
    ...stats.topFindings.slice(0, 10).map((f, i) =>
      `  ${i + 1}. ${f.ruleId} — ${f.percentage}% of repos (${f.count}×)`
    ),
    '',
    'By fix type:',
    ...Object.entries(stats.findingsByFixType)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => `  ${type}: ${count}`),
    '',
    '═══════════════════════════════════════════════════════',
  ]
  return lines.join('\n')
}
