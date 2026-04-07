// src/scripts/run-audit.ts
import path from 'node:path'
import { writeFileSync, existsSync, readdirSync, readFileSync, mkdirSync } from 'node:fs'
import { buildAuditContext, runAudit, formatReportText, formatReportMarkdown } from '@/lib/audit'
import type { AuditReport, CheckMode } from '@/lib/audit/types'

const REPO_ROOT = path.resolve(process.cwd())
const REPORTS_DIR = path.join(REPO_ROOT, 'docs', 'audit-reports')

function parseArgs(): { skipModes: CheckMode[]; tokenBudget: number; compareOnly: boolean } {
  const args = process.argv.slice(2)
  const skipModes: CheckMode[] = []
  let tokenBudget = 8192
  let compareOnly = false

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--skip-cli') skipModes.push('cli')
    if (args[i] === '--skip-modes' && args[i + 1]) {
      skipModes.push(...(args[i + 1].split(',') as CheckMode[]))
      i++
    }
    if (args[i] === '--budget' && args[i + 1]) {
      const parsed = parseInt(args[i + 1], 10)
      if (!isNaN(parsed) && parsed >= 1024) tokenBudget = parsed
      i++
    }
    if (args[i] === '--compare-only') compareOnly = true
  }

  return { skipModes, tokenBudget, compareOnly }
}

function findPriorReport(): { date: string; percentage: number } | null {
  if (!existsSync(REPORTS_DIR)) return null
  const files = (readdirSync(REPORTS_DIR) as string[])
    .filter((f) => f.endsWith('-audit-report.json'))
    .sort()
    .reverse()

  if (files.length === 0) return null

  try {
    const prior = JSON.parse(readFileSync(path.join(REPORTS_DIR, files[0]), 'utf-8')) as AuditReport
    return { date: prior.date, percentage: prior.automatedPercentage }
  } catch {
    return null
  }
}

async function main(): Promise<void> {
  const { skipModes, tokenBudget, compareOnly } = parseArgs()

  if (compareOnly) {
    const prior = findPriorReport()
    if (!prior) {
      console.error('No prior audit report found in docs/audit-reports/')
      process.exit(1)
    }
    console.log(`Last automated audit (${prior.date}): ${prior.percentage}%`)
    return
  }

  console.log('Building audit context...')
  const ctx = await buildAuditContext(REPO_ROOT, undefined, tokenBudget)
  console.log(`   ${ctx.repoMap.stats.totalFiles} files, ${ctx.repoMap.stats.totalSymbols} symbols`)

  console.log('Running audit checks...')
  if (skipModes.length > 0) console.log(`   Skipping modes: ${skipModes.join(', ')}`)

  const report = await runAudit(ctx, { rootPath: REPO_ROOT, skipModes })

  // Add prior audit comparison
  const prior = findPriorReport()
  if (prior) {
    report.priorAudit = {
      date: prior.date,
      percentage: prior.percentage,
      delta: Math.round((report.automatedPercentage - prior.percentage) * 10) / 10,
    }
  }

  // Print summary
  console.log('\n' + formatReportText(report))

  // Write reports to docs/audit-reports/
  mkdirSync(REPORTS_DIR, { recursive: true })
  const datestamp = report.date
  const jsonPath = path.join(REPORTS_DIR, `${datestamp}-audit-report.json`)
  const mdPath = path.join(REPORTS_DIR, `${datestamp}-audit-report.md`)

  writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf-8')
  writeFileSync(mdPath, formatReportMarkdown(report), 'utf-8')

  console.log(`\nReports written:`)
  console.log(`   ${jsonPath}`)
  console.log(`   ${mdPath}`)

  // Exit with non-zero if score is 'prototype'
  if (report.status === 'prototype') {
    console.error('\nAudit score is Prototype - below acceptable threshold')
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('Audit script failed:', err)
  process.exit(1)
})
