import { describe, it, expect } from 'vitest'
import { detectDbProvider, checkSchemaDrift } from '../schema-drift-check'
import type { AuditContext } from '../types'

function makeCtx(
  deps: Record<string, string> = {},
  filePaths: string[] = [],
): AuditContext {
  return {
    rootPath: '/project',
    packageJson: { dependencies: deps },
    tsConfig: {},
    filePaths,
    gitInfo: { hasGitDir: false, recentCommits: [] },
    repoMap: { generatedAt: '', rootPath: '', version: '', stats: { totalFiles: 0, totalSymbols: 0, totalLines: 0, includedSymbols: 0, tokenBudget: 0, estimatedTokens: 0 }, files: [], rankedSymbols: [], dependencies: [], compressedMap: '' },
  }
}

describe('detectDbProvider', () => {
  it('detects Supabase from @supabase/ssr', () => {
    expect(detectDbProvider(makeCtx({ '@supabase/ssr': '*' }))).toBe('supabase')
  })

  it('detects Supabase from @supabase/supabase-js', () => {
    expect(detectDbProvider(makeCtx({ '@supabase/supabase-js': '*' }))).toBe('supabase')
  })

  it('detects Neon from @neondatabase/serverless', () => {
    expect(detectDbProvider(makeCtx({ '@neondatabase/serverless': '*' }))).toBe('neon')
  })

  it('detects Prisma from @prisma/client', () => {
    expect(detectDbProvider(makeCtx({ '@prisma/client': '*' }))).toBe('prisma')
  })

  it('detects Drizzle from drizzle-orm', () => {
    expect(detectDbProvider(makeCtx({ 'drizzle-orm': '*' }))).toBe('drizzle')
  })

  it('detects Firebase from firebase', () => {
    expect(detectDbProvider(makeCtx({ firebase: '*' }))).toBe('firebase')
  })

  it('detects PlanetScale from @planetscale/database', () => {
    expect(detectDbProvider(makeCtx({ '@planetscale/database': '*' }))).toBe('planetscale')
  })

  it('returns none when no DB deps present', () => {
    expect(detectDbProvider(makeCtx({ react: '*' }))).toBe('none')
  })

  it('detects Supabase from migration folder path', () => {
    expect(detectDbProvider(makeCtx({}, ['supabase/migrations/001_init.sql']))).toBe('supabase')
  })
})

describe('checkSchemaDrift', () => {
  it('returns score 5 when no DB detected', async () => {
    const result = await checkSchemaDrift(makeCtx({}))
    expect(result.score).toBe(5)
    expect(result.findings).toHaveLength(0)
  })

  it('returns score 5 + info finding when Supabase detected', async () => {
    const result = await checkSchemaDrift(makeCtx({ '@supabase/ssr': '*' }))
    expect(result.score).toBe(5)
    expect(result.findings).toHaveLength(1)
    expect(result.findings[0].severity).toBe('info')
    expect(result.findings[0].message).toContain('Supabase')
  })

  it('includes SQL queries in suggestion for Postgres providers', async () => {
    const result = await checkSchemaDrift(makeCtx({ '@supabase/ssr': '*' }))
    expect(result.findings[0].suggestion).toContain('pg_tables')
    expect(result.findings[0].suggestion).toContain('pg_policies')
  })

  it('includes dashboard instructions for Firebase (no SQL)', async () => {
    const result = await checkSchemaDrift(makeCtx({ firebase: '*' }))
    expect(result.findings[0].suggestion).toContain('Firebase Console')
    expect(result.findings[0].suggestion).not.toContain('pg_tables')
  })

  it('sets agentSource to database', async () => {
    const result = await checkSchemaDrift(makeCtx({ 'drizzle-orm': '*' }))
    expect(result.findings[0].agentSource).toBe('database')
  })

  it('ruleId is cat-5-schema-drift', async () => {
    const result = await checkSchemaDrift(makeCtx({ '@supabase/ssr': '*' }))
    expect(result.ruleId).toBe('cat-5-schema-drift')
  })
})
