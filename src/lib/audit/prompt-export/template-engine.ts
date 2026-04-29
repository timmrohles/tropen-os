// src/lib/audit/prompt-export/template-engine.ts
// Deterministic, rule-based fix prompt builder.
// No LLM calls. Generates structured prompts for Cursor, Claude Code, and Generic tools.

import { findRecommendation } from '@/lib/audit/finding-recommendations'
import { extractRepoContext } from './repo-context'
import type { PromptFinding, ToolTarget, GeneratedPrompt, RepoContextSnippet } from './types'
import type { RepoMap } from '@/lib/repo-map/types'

// ─── Tool introductions ──────────────────────────────────────────────────────

const TOOL_INTRO: Record<ToolTarget, string> = {
  cursor: 'Du bist ein erfahrener Software-Architekt. Ich zeige dir ein Audit-Finding aus einem Production Readiness Scan. Behebe das Problem in den genannten Dateien.',
  'claude-code': 'Du bist Claude Code und hilfst mir ein konkretes Code-Problem zu beheben, das ein automatischer Audit-Scan gefunden hat. Lies zuerst CLAUDE.md um den Projektkontext zu verstehen.',
  generic: 'Ich habe einen automatischen Audit-Scan durchgeführt. Folgend siehst du ein konkretes Problem das behoben werden muss, inklusive Kontext und Vorgehensweise.',
}

// ─── Severity labels ─────────────────────────────────────────────────────────

const SEV_LABEL: Record<string, string> = {
  critical: '🔴 KRITISCH',
  high:     '🟠 HOCH',
  medium:   '🟡 MITTEL',
  low:      '🟢 NIEDRIG',
  info:     'ℹ️ INFO',
}

// ─── File reference formatter ────────────────────────────────────────────────

function formatFileRef(filePath: string, tool: ToolTarget, line?: number | null): string {
  if (tool === 'cursor') {
    return line ? `@${filePath}:${line}` : `@${filePath}`
  }
  return line ? `${filePath}:${line}` : filePath
}

// ─── Section builders ────────────────────────────────────────────────────────

function buildProblemSection(finding: PromptFinding, rec: ReturnType<typeof findRecommendation>): string {
  const lines = ['## Problem']
  const sev = SEV_LABEL[finding.severity] ?? finding.severity.toUpperCase()
  lines.push(`**Severity:** ${sev}`)
  lines.push(`**Finding:** ${finding.message}`)
  if (rec?.problem) {
    lines.push('', rec.problem)
  }
  return lines.join('\n')
}

function buildWhereSection(finding: PromptFinding, tool: ToolTarget): string {
  const lines = ['## Wo']
  const allFiles: string[] = []

  if (finding.filePath) {
    allFiles.push(finding.filePath)
    lines.push(`**Primäre Datei:** ${formatFileRef(finding.filePath, tool, finding.line)}`)
  }
  if (finding.affectedFiles && finding.affectedFiles.length > 0) {
    const extras = finding.affectedFiles.filter((f) => f !== finding.filePath)
    if (extras.length > 0) {
      allFiles.push(...extras)
      lines.push('**Weitere betroffene Dateien:**')
      extras.forEach((f) => lines.push(`- ${formatFileRef(f, tool)}`))
    }
  }
  if (finding.fixHint) {
    lines.push('', `**Hinweis:** ${finding.fixHint}`)
  }
  if (allFiles.length === 0) {
    lines.push('_Kein spezifischer Dateipfad — gilt projektübergreifend._')
  }
  return lines.join('\n')
}

function buildWhySection(rec: ReturnType<typeof findRecommendation>): string | null {
  if (!rec?.impact) return null
  return `## Warum das wichtig ist\n${rec.impact}`
}

function buildFixSection(
  finding: PromptFinding,
  rec: ReturnType<typeof findRecommendation>,
  tool: ToolTarget,
  repoCtx: RepoContextSnippet | null,
): string {
  const lines = ['## Was zu tun ist']

  if (rec?.strategy) {
    lines.push('**Strategie:**', rec.strategy)
  }
  if (rec?.firstStep) {
    lines.push('', '**Erster Schritt:**', rec.firstStep)
  } else if (finding.suggestion) {
    lines.push('', '**Vorgehensweise:**', finding.suggestion)
  } else {
    lines.push('', 'Fixe das Problem.')
  }

  if (tool === 'claude-code' && finding.filePath) {
    lines.push('', `_Lies zuerst \`${finding.filePath}\` mit dem Read-Tool, dann bearbeite die Datei mit dem Edit-Tool._`)
  }

  if (repoCtx && repoCtx.symbolLines.length > 0) {
    lines.push('', '**Relevante Symbole in der betroffenen Datei:**')
    lines.push('```')
    repoCtx.symbolLines.forEach((l) => lines.push(l))
    lines.push('```')
  }
  if (repoCtx && repoCtx.importedBy.length > 0) {
    lines.push('', `**Wird importiert von:** ${repoCtx.importedBy.join(', ')}`)
    lines.push('_(Änderungen dort prüfen wenn du Interfaces änderst)_')
  }

  return lines.join('\n')
}

function buildValidationSection(finding: PromptFinding, rec: ReturnType<typeof findRecommendation>): string {
  const lines = ['## Validierung', 'Nach dem Fix prüfen:']
  const checks: string[] = []

  if (rec?.fixApproach === 'central-fix') {
    checks.push('[ ] Zentrale Lösung eingeführt (nicht Einzelfixes pro Datei)')
    checks.push('[ ] Alle betroffenen Stellen migriert')
  } else if (rec?.fixApproach === 'per-file') {
    checks.push('[ ] Jede betroffene Datei einzeln bearbeitet')
    checks.push('[ ] Keine neue Datei über 300 Zeilen')
  } else if (rec?.fixApproach === 'config-change') {
    checks.push('[ ] Konfiguration gespeichert und aktiv')
    checks.push('[ ] Kein Rollback-Risiko geprüft')
  }

  checks.push('[ ] TypeScript kompiliert ohne Fehler (`tsc --noEmit`)')

  if (finding.agentSource === 'security' || finding.agentSource === 'security-scan') {
    checks.push('[ ] Security-relevant: manuell im Browser / Postman verifizieren')
  }

  lines.push(...checks)
  return lines.join('\n')
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Builds a structured fix prompt for a single finding.
 *
 * @param finding  The finding to fix
 * @param tool     Target tool variant
 * @param repoMap  Optional: live repo map for context (gracefully omitted if null)
 */
export function buildFixPrompt(
  finding: PromptFinding,
  tool: ToolTarget,
  repoMap?: RepoMap | null,
): GeneratedPrompt {
  const rec = findRecommendation(finding.ruleId, finding.message)
  const fixType = finding.fixType ?? 'code-fix'

  const allFiles = [
    finding.filePath,
    ...(finding.affectedFiles ?? []),
  ].filter((f): f is string => typeof f === 'string' && f.length > 0)

  const title = rec?.title ?? finding.message.slice(0, 80)

  // ── Manual findings: no code prompt, return actionable checklist ──────────
  if (fixType === 'manual') {
    const sections: string[] = [
      `# ${title}`,
      '',
      `**Severity:** ${SEV_LABEL[finding.severity] ?? finding.severity}`,
      `**Typ:** Manuelle Aktion — kein automatischer Fix möglich`,
      '',
      `## Was zu tun ist`,
      rec?.strategy ?? finding.message,
      '',
      rec?.firstStep ? `## Erster Schritt\n${rec.firstStep}` : '',
      rec?.impact ? `## Warum\n${rec.impact}` : '',
    ].filter(Boolean)

    return { tool, title, content: sections.join('\n'), fileRefs: [] }
  }

  // ── Code prompts: code-fix, code-gen, refactoring ────────────────────────
  const repoCtx = extractRepoContext(allFiles, repoMap)

  const sections: string[] = [
    TOOL_INTRO[tool],
    '',
    buildProblemSection(finding, rec),
    '',
    buildWhereSection(finding, tool),
  ]

  // Refactoring warning
  if (fixType === 'refactoring') {
    sections.push('')
    sections.push('## Hinweis\n⚠️ Dieses Refactoring schrittweise durchführen — nach jedem Schritt `tsc --noEmit` prüfen.')
  }

  const why = buildWhySection(rec)
  if (why) { sections.push('', why) }

  sections.push('', buildFixSection(finding, rec, tool, repoCtx))
  sections.push('', buildValidationSection(finding, rec))

  return {
    tool,
    title,
    content: sections.join('\n'),
    fileRefs: allFiles,
  }
}

/**
 * Builds a group prompt for multiple findings of the same rule.
 * Used by FindingsTable for grouped-view copy.
 */
export function buildGroupFixPrompt(
  ruleId: string,
  baseMessage: string,
  affectedFiles: string[],
  tool: ToolTarget,
  repoMap?: RepoMap | null,
): GeneratedPrompt {
  const syntheticFinding: PromptFinding = {
    ruleId,
    severity: 'medium',
    message: baseMessage,
    affectedFiles,
  }
  return buildFixPrompt(syntheticFinding, tool, repoMap)
}
