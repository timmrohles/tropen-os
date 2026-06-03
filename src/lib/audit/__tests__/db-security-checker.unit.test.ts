// src/lib/audit/__tests__/db-security-checker.unit.test.ts
import { describe, it, expect } from 'vitest'
import {
  checkSecurityDefinerViews,
  checkFunctionSearchPath,
  checkAnonKeyNoWriteWildcard,
} from '../checkers/db-security-checker'
import type { AuditContext } from '../types'

function makeCtx(migrationSql: string): AuditContext {
  return {
    rootPath: '/nonexistent-repo', // existsSync(false) → kein Disk-Zugriff, nur fileContents
    repoMap: {
      files: [], dependencies: [], rankedSymbols: [],
      stats: { totalFiles: 0, totalSymbols: 0, totalLines: 0, includedSymbols: 0, tokenBudget: 4096, estimatedTokens: 0 },
      generatedAt: '', rootPath: '/nonexistent-repo', version: '1.0.0', compressedMap: '',
    },
    packageJson: { name: 'tropen-os', version: '0.1.0', dependencies: {}, devDependencies: {} },
    tsConfig: { compilerOptions: { strict: true } },
    filePaths: [],
    gitInfo: { hasGitDir: true, recentCommits: [] },
    fileContents: new Map([['supabase/migrations/001_test.sql', migrationSql]]),
  }
}

describe('checkSecurityDefinerViews (sec-db-11)', () => {
  it('flags a view created without security_invoker (critical)', async () => {
    const r = await checkSecurityDefinerViews(makeCtx('CREATE VIEW public.projects_with_stats AS SELECT 1;'))
    expect(r.score).toBeLessThan(5)
    expect(r.findings).toHaveLength(1)
    expect(r.findings[0].severity).toBe('critical')
    expect(r.findings[0].message).toContain('projects_with_stats')
  })

  it('passes when security_invoker is set inline via WITH (...)', async () => {
    const r = await checkSecurityDefinerViews(makeCtx('CREATE VIEW public.v1 WITH (security_invoker = on) AS SELECT 1;'))
    expect(r.score).toBe(5)
    expect(r.findings).toHaveLength(0)
  })

  it('passes when security_invoker is set via a later ALTER VIEW', async () => {
    const sql = 'CREATE VIEW public.v3 AS SELECT 1;\nALTER VIEW public.v3 SET (security_invoker = on);'
    const r = await checkSecurityDefinerViews(makeCtx(sql))
    expect(r.score).toBe(5)
    expect(r.findings).toHaveLength(0)
  })

  it('passes when there are no migrations', async () => {
    const ctx = makeCtx('')
    ctx.fileContents = new Map()
    const r = await checkSecurityDefinerViews(ctx)
    expect(r.findings).toHaveLength(0)
  })
})

describe('checkFunctionSearchPath (sec-db-12)', () => {
  it('flags a function without SET search_path', async () => {
    const r = await checkFunctionSearchPath(makeCtx('CREATE FUNCTION public.bar() RETURNS void LANGUAGE sql AS $$ SELECT 1 $$;'))
    expect(r.score).toBeLessThan(5)
    expect(r.findings.some(f => f.message.includes('bar'))).toBe(true)
  })

  it('passes when search_path is set in the CREATE options', async () => {
    const sql = 'CREATE OR REPLACE FUNCTION public.foo() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN END; $$;'
    const r = await checkFunctionSearchPath(makeCtx(sql))
    expect(r.score).toBe(5)
    expect(r.findings).toHaveLength(0)
  })

  it('passes when search_path is set via a later ALTER FUNCTION', async () => {
    const sql = 'CREATE FUNCTION public.baz() RETURNS void LANGUAGE sql AS $$ SELECT 1 $$;\nALTER FUNCTION public.baz() SET search_path = public;'
    const r = await checkFunctionSearchPath(makeCtx(sql))
    expect(r.score).toBe(5)
    expect(r.findings).toHaveLength(0)
  })
})

describe('checkAnonKeyNoWriteWildcard (sec-db-03, generalisiert)', () => {
  it('flags an authenticated write policy with USING (true)', async () => {
    const sql = 'CREATE POLICY auth_update ON qa_compliance_checks FOR UPDATE TO authenticated USING (true);'
    const r = await checkAnonKeyNoWriteWildcard(makeCtx(sql))
    expect(r.score).toBeLessThan(5)
    expect(r.findings).toHaveLength(1)
    expect(r.findings[0].message).toContain('authenticated')
  })

  it('ignores service_role wildcard policies (intended)', async () => {
    const sql = 'CREATE POLICY srv ON t FOR ALL TO service_role USING (true) WITH CHECK (true);'
    const r = await checkAnonKeyNoWriteWildcard(makeCtx(sql))
    expect(r.score).toBe(5)
    expect(r.findings).toHaveLength(0)
  })

  it('passes when the write policy has a real condition', async () => {
    const sql = 'CREATE POLICY ok ON t FOR UPDATE TO authenticated USING (organization_id = get_my_organization_id());'
    const r = await checkAnonKeyNoWriteWildcard(makeCtx(sql))
    expect(r.score).toBe(5)
    expect(r.findings).toHaveLength(0)
  })
})
