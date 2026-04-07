// src/lib/audit/checkers/documentation-checker.ts
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { AuditContext, RuleResult, Finding } from '../types'

function pass(ruleId: string, score: number, reason: string): RuleResult {
  return { ruleId, score, reason, findings: [], automated: true }
}

function fail(ruleId: string, score: number, reason: string, findings: Finding[] = []): RuleResult {
  return { ruleId, score, reason, findings, automated: true }
}

function readMigrations(rootPath: string): string {
  const dir = join(rootPath, 'supabase', 'migrations')
  if (!existsSync(dir)) return ''
  try {
    const files = readdirSync(dir) as string[]
    return files
      .filter((f) => f.endsWith('.sql'))
      .map((f) => { try { return readFileSync(join(dir, f), 'utf-8') } catch { return '' } })
      .join('\n')
  } catch {
    return ''
  }
}

export async function checkADRsPresent(ctx: AuditContext): Promise<RuleResult> {
  const adrDir = join(ctx.rootPath, 'docs', 'adr')
  if (!existsSync(adrDir)) {
    return fail('cat-1-rule-5', 0, 'docs/adr/ directory not found — no ADRs', [{
      severity: 'high',
      message: 'No Architecture Decision Records found',
      suggestion: 'Create docs/adr/ and document key technology decisions',
    }])
  }
  const files = (readdirSync(adrDir) as string[]).filter((f) => f.endsWith('.md'))
  if (files.length >= 10) return pass('cat-1-rule-5', 5, `${files.length} ADRs in docs/adr/ — excellent documentation`)
  if (files.length >= 5)  return pass('cat-1-rule-5', 5, `${files.length} ADRs in docs/adr/`)
  if (files.length >= 2)  return pass('cat-1-rule-5', 3, `${files.length} ADR(s) in docs/adr/ — more needed`)
  if (files.length === 1) return pass('cat-1-rule-5', 2, '1 ADR found — start for critical decisions')
  return fail('cat-1-rule-5', 0, 'docs/adr/ exists but has no .md files')
}

export async function checkReadmePresent(ctx: AuditContext): Promise<RuleResult> {
  const candidates = ['README.md', 'readme.md', 'README.rst']
  const found = candidates.find((f) => existsSync(join(ctx.rootPath, f)))
  if (!found) {
    return fail('cat-18-rule-1', 0, 'No README.md found', [{
      severity: 'medium', message: 'Missing README.md', suggestion: 'Create README.md with project overview, setup, and deployment',
    }])
  }
  try {
    const content = readFileSync(join(ctx.rootPath, found), 'utf-8')
    const lines = content.split('\n').length
    if (lines >= 100) return pass('cat-18-rule-1', 5, `README.md present with ${lines} lines — comprehensive`)
    if (lines >= 50)  return pass('cat-18-rule-1', 4, `README.md present with ${lines} lines`)
    if (lines >= 20)  return pass('cat-18-rule-1', 3, `README.md present but brief (${lines} lines)`)
    return fail('cat-18-rule-1', 2, `README.md present but very short (${lines} lines)`)
  } catch {
    return fail('cat-18-rule-1', 1, 'README.md found but could not be read')
  }
}

export async function checkRunbooksPresent(ctx: AuditContext): Promise<RuleResult> {
  const runbookDir = join(ctx.rootPath, 'docs', 'runbooks')
  if (!existsSync(runbookDir)) {
    return fail('cat-11-rule-3', 0, 'docs/runbooks/ not found — no rollback/DR runbooks', [{
      severity: 'high',
      message: 'Missing runbooks directory',
      suggestion: 'Create docs/runbooks/rollback.md and docs/runbooks/disaster-recovery.md',
    }])
  }
  const files = (readdirSync(runbookDir) as string[]).filter((f) => f.endsWith('.md'))
  const hasDR = files.some((f) => f.includes('disaster') || f.includes('dr'))
  const hasRollback = files.some((f) => f.includes('rollback'))
  if (hasDR && hasRollback) return pass('cat-11-rule-3', 5, 'Rollback and DR runbooks present in docs/runbooks/')
  if (files.length > 0) return pass('cat-11-rule-3', 3, `${files.length} runbook(s) in docs/runbooks/ — missing DR or rollback`)
  return fail('cat-11-rule-3', 1, 'docs/runbooks/ exists but has no .md files')
}

export async function checkConventionalCommits(ctx: AuditContext): Promise<RuleResult> {
  if (!ctx.gitInfo.hasGitDir) {
    return fail('cat-19-rule-2', 0, 'Not a git repository — cannot check commits')
  }
  const commits = ctx.gitInfo.recentCommits
  if (commits.length === 0) {
    return pass('cat-19-rule-2', 3, 'No recent commits to check')
  }
  const conventionalPattern = /^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert)(\(.+\))?!?:\s.+/i
  const conforming = commits.filter((c) => conventionalPattern.test(c))
  const ratio = conforming.length / commits.length

  if (ratio >= 0.9) return pass('cat-19-rule-2', 5, `${Math.round(ratio * 100)}% of commits follow Conventional Commits`)
  if (ratio >= 0.7) return pass('cat-19-rule-2', 4, `${Math.round(ratio * 100)}% of commits follow Conventional Commits`)
  if (ratio >= 0.5) return pass('cat-19-rule-2', 3, `${Math.round(ratio * 100)}% of commits follow Conventional Commits`)
  return fail('cat-19-rule-2', 2, `Only ${Math.round(ratio * 100)}% of commits follow Conventional Commits format`)
}

export async function checkFKConstraintsInMigrations(ctx: AuditContext): Promise<RuleResult> {
  const content = readMigrations(ctx.rootPath)
  if (!content) {
    return fail('cat-5-rule-1', 0, 'No migration files found — cannot verify FK constraints')
  }
  const hasForeignKey = /REFERENCES\s+\w+\s*\(/i.test(content)
    || /FOREIGN KEY/i.test(content)
    || /ON DELETE CASCADE/i.test(content)
  if (hasForeignKey) {
    return pass('cat-5-rule-1', 5, 'FK constraints found in migrations (REFERENCES + ON DELETE CASCADE)')
  }
  return fail('cat-5-rule-1', 1, 'No REFERENCES / FOREIGN KEY patterns found in migrations', [{
    severity: 'high',
    message: 'Migrations do not appear to define FK constraints',
    suggestion: 'Add REFERENCES constraints to enforce referential integrity',
  }])
}

export async function checkIndexStrategyInMigrations(ctx: AuditContext): Promise<RuleResult> {
  const content = readMigrations(ctx.rootPath)
  if (!content) {
    return fail('cat-5-rule-2', 0, 'No migration files found — cannot verify index strategy')
  }
  const indexCount = (content.match(/CREATE INDEX/gi) ?? []).length
  if (indexCount >= 10) return pass('cat-5-rule-2', 5, `${indexCount} indexes defined in migrations — strong index strategy`)
  if (indexCount >= 5)  return pass('cat-5-rule-2', 4, `${indexCount} indexes defined in migrations`)
  if (indexCount >= 2)  return pass('cat-5-rule-2', 3, `${indexCount} indexes defined in migrations — may need more`)
  if (indexCount >= 1)  return pass('cat-5-rule-2', 2, `Only ${indexCount} index found in migrations`)
  return fail('cat-5-rule-2', 0, 'No CREATE INDEX statements found in migrations', [{
    severity: 'medium',
    message: 'No database indexes defined in migrations',
    suggestion: 'Add indexes for frequently queried columns (organization_id, user_id)',
  }])
}

export async function checkAiActDocumentation(ctx: AuditContext): Promise<RuleResult> {
  const docsDir = join(ctx.rootPath, 'docs')
  if (!existsSync(docsDir)) {
    return fail('cat-4-rule-6', 0, 'No docs/ directory found')
  }
  const hasAiActDoc = existsSync(join(docsDir, 'AI Act Risk Navigator Hochrisiko.pdf'))
    || existsSync(join(docsDir, 'tuev-ai-matrix-mapping-tropen.docx'))
    || (readdirSync(docsDir) as string[]).some((f) =>
      f.toLowerCase().includes('ai act') || f.toLowerCase().includes('ai-act')
    )
  return hasAiActDoc
    ? pass('cat-4-rule-6', 5, 'AI Act classification documentation found in docs/')
    : fail('cat-4-rule-6', 0, 'No AI Act classification documentation found in docs/', [{
        severity: 'high',
        message: 'EU AI Act compliance documentation missing',
        suggestion: 'Document AI Act risk classification in docs/',
      }])
}
