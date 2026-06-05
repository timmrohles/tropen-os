// src/lib/preflight/migration-audit.ts
// Self-audit of generated migration SQL via the project's existing sec-db checkers.
// Feeds the SQL through the in-memory AuditContext path (no disk access).

import type { AuditContext } from '@/lib/audit/types'
import {
  checkSecurityDefinerViews,
  checkFunctionSearchPath,
  checkRlsOnUserTables,
  checkAnonKeyNoWriteWildcard,
  checkStorageBucketPolicies,
} from '@/lib/audit/checkers/db-security-checker'

const MIGRATION_PATH = 'supabase/migrations/000_preflight_draft.sql'

/**
 * Build a minimal in-memory AuditContext sufficient for the sec-db checkers.
 * The checkers read migration content from `ctx.fileContents` (keyed by a
 * `supabase/migrations/…` path) and ignore `rootPath` when fileContents is set.
 */
function buildInMemoryCtx(sql: string): AuditContext {
  return {
    rootPath: '/nonexistent', // never hits disk — fileContents takes precedence
    repoMap: {
      files: [],
      dependencies: [],
      rankedSymbols: [],
      stats: {
        totalFiles: 0,
        totalSymbols: 0,
        totalLines: 0,
        includedSymbols: 0,
        tokenBudget: 4096,
        estimatedTokens: 0,
      },
      generatedAt: '',
      rootPath: '/nonexistent',
      version: '1.0.0',
      compressedMap: '',
    },
    packageJson: {},
    tsConfig: {},
    filePaths: [MIGRATION_PATH],
    gitInfo: { hasGitDir: false, recentCommits: [] },
    fileContents: new Map([[MIGRATION_PATH, sql]]),
  }
}

/**
 * Run the project's sec-db checkers against `sql` in memory.
 * Returns the finding messages from any checker that raises an issue.
 * Returns an empty array when the SQL is clean.
 */
export async function auditMigrationSql(sql: string): Promise<string[]> {
  const ctx = buildInMemoryCtx(sql)

  const results = await Promise.all([
    checkSecurityDefinerViews(ctx),
    checkFunctionSearchPath(ctx),
    checkRlsOnUserTables(ctx),
    checkAnonKeyNoWriteWildcard(ctx),
    checkStorageBucketPolicies(ctx),
  ])

  const messages: string[] = []
  for (const result of results) {
    for (const finding of result.findings) {
      messages.push(finding.message)
    }
  }
  return messages
}
