// src/lib/fix-engine/risk-assessor.ts
// Heuristic risk assessment — NO LLM calls. Reads repo map from docs/repo-map/tropen-os-map.json.
import * as fs from 'node:fs'
import * as path from 'node:path'
import { createLogger } from '@/lib/logger'
import type { RepoMap } from '@/lib/repo-map/types'
import type { FixContext, RiskAssessment } from './types'

const log = createLogger('fix-engine:risk-assessor')

const REPO_MAP_PATH = path.join(process.cwd(), 'docs', 'repo-map', 'tropen-os-map.json')

export async function assessRisk(ctx: FixContext): Promise<RiskAssessment> {
  try {
    const filePath = ctx.finding.filePath

    // No file affected — trivially safe
    if (!filePath) {
      return {
        level: 'safe',
        score: 10,
        reasons: ['No file affected'],
        affectedFiles: [],
        importedByCount: 0,
      }
    }

    // Read repo map
    let repoMap: RepoMap
    try {
      const raw = fs.readFileSync(REPO_MAP_PATH, 'utf-8')
      repoMap = JSON.parse(raw) as RepoMap
    } catch {
      log.info('Repo map unavailable — returning moderate default', { filePath })
      return {
        level: 'moderate',
        score: 50,
        reasons: ['Risk assessment unavailable'],
        affectedFiles: [filePath],
        importedByCount: 0,
      }
    }

    // Count how many files import this file
    const importedByCount = repoMap.dependencies.filter(
      dep => dep.target === filePath || dep.target.endsWith(filePath)
    ).length

    const reasons: string[] = []
    let score = 20

    // Import fan-in
    if (importedByCount >= 10) {
      score += 30
      reasons.push(`Heavily imported by ${importedByCount} files`)
    } else if (importedByCount >= 5) {
      score += 20
      reasons.push(`Imported by ${importedByCount} files`)
    } else if (importedByCount >= 2) {
      score += 10
      reasons.push(`Imported by ${importedByCount} files`)
    }

    // Infrastructure path
    if (filePath.includes('src/lib/') || filePath.includes('src/app/api/')) {
      score += 20
      reasons.push('Infrastructure file (lib or API route)')
    }

    // Sensitive path keywords
    const sensitiveKeywords = ['auth', 'supabase', 'database', 'middleware']
    const matchedKeyword = sensitiveKeywords.find(kw => filePath.toLowerCase().includes(kw))
    if (matchedKeyword) {
      score += 15
      reasons.push(`Sensitive path keyword: ${matchedKeyword}`)
    }

    // Severity boosts
    if (ctx.finding.severity === 'critical') {
      score += 10
      reasons.push('Critical severity finding')
    } else if (ctx.finding.severity === 'high') {
      score += 5
      reasons.push('High severity finding')
    }

    // High-ranked exported symbol — Top 10% relative threshold
    const sortedSymbols = [...repoMap.rankedSymbols].sort((a, b) => b.rankScore - a.rankScore)
    const topIndex = Math.ceil(sortedSymbols.length * 0.1)
    const topThreshold = sortedSymbols[topIndex - 1]?.rankScore ?? 0
    const affectedSymbol = repoMap.rankedSymbols.find(
      (s) => s.filePath === filePath && s.exported
    )
    if (affectedSymbol && topThreshold > 0 && affectedSymbol.rankScore >= topThreshold) {
      score += 15
      reasons.push('High-ranked exported symbol (Top 10%)')
    }

    // Simple UI component discount
    if (filePath.includes('src/app/(pages)/') || /\/components\/.*\.tsx$/.test(filePath)) {
      score -= 10
      reasons.push('Simple UI component or page — lower blast radius')
    }

    // Cap score
    score = Math.min(100, Math.max(0, score))

    // Determine level
    const level =
      score < 35 ? 'safe' : score < 65 ? 'moderate' : 'critical'

    log.info('Risk assessed', { filePath, score, level, importedByCount })

    return {
      level,
      score,
      reasons,
      affectedFiles: [filePath],
      importedByCount,
    }
  } catch (err) {
    log.error('Risk assessment failed', { err })
    return {
      level: 'moderate',
      score: 50,
      reasons: ['Risk assessment unavailable'],
      affectedFiles: ctx.finding.filePath ? [ctx.finding.filePath] : [],
      importedByCount: 0,
    }
  }
}
