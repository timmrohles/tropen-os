// src/lib/audit/scoring/score-formatter.ts
import type { AuditReport, CategoryScore } from '../types'

const STATUS_LABELS: Record<AuditReport['status'], string> = {
  'production-grade': 'Production Grade',
  stable:             'Stable',
  risky:              'Risky',
  prototype:          'Prototype',
}

function padRight(str: string, len: number): string {
  return str.length >= len ? str.slice(0, len) : str + ' '.repeat(len - str.length)
}

function formatCategoryRow(cat: CategoryScore): string {
  const name = padRight(cat.name, 30)
  const pct = cat.automatedPercentage === null
    ? 'manual'
    : `${cat.automatedPercentage.toFixed(1)}%`
  const pctPad = padRight(pct, 8)
  const automated = `${cat.automatedRuleCount} auto / ${cat.manualRuleCount} manual`
  return `  ${name} ${pctPad} [${automated}]`
}

export function formatReportText(report: AuditReport): string {
  const lines: string[] = [
    '='.repeat(68),
    `  AUDIT REPORT - ${report.project}`,
    `  Date: ${report.date}  |  Root: ${report.rootPath}`,
    '='.repeat(68),
    '',
    `  AUTOMATED SCORE: ${report.automatedPercentage}%`,
    `  STATUS: ${STATUS_LABELS[report.status]}`,
    `  Rules: ${report.automatedRuleCount} automated, ${report.manualRuleCount} manual (excluded from score)`,
  ]

  if (report.priorAudit) {
    const delta = report.priorAudit.delta >= 0 ? `+${report.priorAudit.delta.toFixed(1)}` : report.priorAudit.delta.toFixed(1)
    lines.push(`  vs. prior audit (${report.priorAudit.date}): ${report.priorAudit.percentage}%  Delta ${delta}`)
  }

  lines.push('', '-'.repeat(68), '  CATEGORIES', '-'.repeat(68))

  for (const cat of report.categories) {
    lines.push(formatCategoryRow(cat))
  }

  if (report.criticalFindings.length > 0) {
    lines.push('', '-'.repeat(68), '  CRITICAL FINDINGS', '-'.repeat(68))
    for (const f of report.criticalFindings) {
      lines.push(`  CRITICAL: ${f.message}`)
      if (f.filePath) lines.push(`     File: ${f.filePath}`)
      if (f.suggestion) lines.push(`     Fix:  ${f.suggestion}`)
    }
  }

  lines.push('', '='.repeat(68))
  return lines.join('\n')
}

export function formatReportMarkdown(report: AuditReport): string {
  const statusLabel = STATUS_LABELS[report.status]
  const lines: string[] = [
    `# Audit Report`,
    `## ${report.project}`,
    '',
    `**Date:** ${report.date}  `,
    `**Automated Score:** ${report.automatedPercentage}% - ${statusLabel}  `,
    `**Rules evaluated:** ${report.automatedRuleCount} automated, ${report.manualRuleCount} manual (not scored)  `,
  ]

  if (report.priorAudit) {
    const delta = report.priorAudit.delta >= 0 ? `+${report.priorAudit.delta.toFixed(1)}` : report.priorAudit.delta.toFixed(1)
    lines.push(`**vs. ${report.priorAudit.date}:** ${report.priorAudit.percentage}% (Delta ${delta})  `)
  }

  lines.push('', '## Category Results', '', '| Category | Automated % | Auto Rules | Manual Rules |', '|----------|-------------|------------|--------------|')

  for (const cat of report.categories) {
    const pct = cat.automatedPercentage === null ? '-' : `${cat.automatedPercentage.toFixed(1)}%`
    lines.push(`| ${cat.name} | ${pct} | ${cat.automatedRuleCount} | ${cat.manualRuleCount} |`)
  }

  if (report.criticalFindings.length > 0) {
    lines.push('', '## Critical Findings', '')
    for (const f of report.criticalFindings) {
      lines.push(`- **CRITICAL: ${f.message}**`)
      if (f.filePath) lines.push(`  - File: \`${f.filePath}\``)
      if (f.suggestion) lines.push(`  - Fix: ${f.suggestion}`)
    }
  }

  return lines.join('\n')
}
