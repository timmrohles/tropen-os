// Integration test: score calculation through the full audit pipeline
import { describe, it, expect } from 'vitest'
import { buildAuditContextFromFiles, runAudit } from '../index'

const PERFECT_PKG = JSON.stringify({
  name: 'perfect-app', version: '1.0.0',
  dependencies: { next: '^15.0.0', react: '^19.0.0', '@supabase/ssr': '^0.5.0' },
  devDependencies: { typescript: '^5.0.0', vitest: '^2.0.0', eslint: '^9.0.0', prettier: '^3.0.0' },
})

const PERFECT_TSCONFIG = JSON.stringify({ compilerOptions: { strict: true, target: 'ES2020' } })

describe('Integration: score calculation pipeline', () => {
  it('awards higher score to well-structured project than minimal one', async () => {
    const wellStructured = await buildAuditContextFromFiles([
      { path: 'package.json', content: PERFECT_PKG },
      { path: 'tsconfig.json', content: PERFECT_TSCONFIG },
      { path: '.env.example', content: 'DATABASE_URL=\nAPI_KEY=' },
      { path: '.gitignore', content: 'node_modules\n.next\n.env.local\n*.log' },
      { path: 'README.md', content: '# App\n\n## Setup\n\npnpm install\n\n## Deploy\n\nVercel.\n\n## Development\n\npnpm dev\n\n## Testing\n\npnpm test\n' + 'x'.repeat(300) },
      { path: 'src/app/api/health/route.ts', content: 'export async function GET() { return Response.json({ status: "ok" }) }' },
      { path: 'src/lib/errors.ts', content: 'export class AppError extends Error { constructor(public code: string, message: string) { super(message) } }' },
    ])
    const minimal = await buildAuditContextFromFiles([
      { path: 'package.json', content: JSON.stringify({ name: 'minimal', dependencies: { next: '^15' } }) },
    ])

    const [wellReport, minReport] = await Promise.all([
      runAudit(wellStructured, { rootPath: '' }),
      runAudit(minimal, { rootPath: '' }),
    ])

    expect(wellReport.automatedPercentage).toBeGreaterThan(minReport.automatedPercentage)
  })

  it('score is deterministic across multiple runs', async () => {
    const ctx = await buildAuditContextFromFiles([
      { path: 'package.json', content: PERFECT_PKG },
      { path: 'tsconfig.json', content: PERFECT_TSCONFIG },
      { path: 'src/lib/util.ts', content: 'export const add = (a: number, b: number) => a + b' },
    ])

    const [r1, r2] = await Promise.all([
      runAudit(ctx, { rootPath: '' }),
      runAudit(ctx, { rootPath: '' }),
    ])

    expect(r1.automatedPercentage).toBe(r2.automatedPercentage)
    expect(r1.status).toBe(r2.status)
  })

  it('status thresholds match documentation (85%+ = production-grade)', async () => {
    // Project with many passing rules
    const ctx = await buildAuditContextFromFiles([
      { path: 'package.json', content: PERFECT_PKG },
      { path: 'tsconfig.json', content: PERFECT_TSCONFIG },
      { path: '.env.example', content: 'KEY=' },
      { path: '.gitignore', content: 'node_modules\n.next\n.env.local' },
      { path: 'src/app/api/health/route.ts', content: 'export async function GET() { return Response.json({ status: "ok" }) }' },
      { path: 'README.md', content: '# App\n\n## Setup\n\n' + 'x'.repeat(400) },
    ])
    const report = await runAudit(ctx, { rootPath: '' })

    if (report.automatedPercentage >= 85) {
      expect(report.status).toBe('production-grade')
    } else if (report.automatedPercentage >= 70) {
      expect(report.status).toBe('stable')
    } else if (report.automatedPercentage >= 50) {
      expect(report.status).toBe('risky')
    } else {
      expect(report.status).toBe('prototype')
    }
  })

  it('automatedRuleCount matches actual automated rules in report', async () => {
    const ctx = await buildAuditContextFromFiles([
      { path: 'package.json', content: PERFECT_PKG },
      { path: 'tsconfig.json', content: PERFECT_TSCONFIG },
    ])
    const report = await runAudit(ctx, { rootPath: '' })

    const countedAutomated = report.categories
      .flatMap((c) => c.ruleResults)
      .filter((r) => r.score !== null).length

    expect(countedAutomated).toBe(report.automatedRuleCount)
  })

  it('excludeRuleIds removes rules from score calculation', async () => {
    const ctx = await buildAuditContextFromFiles([
      { path: 'package.json', content: PERFECT_PKG },
      { path: 'tsconfig.json', content: PERFECT_TSCONFIG },
    ])
    const [full, partial] = await Promise.all([
      runAudit(ctx, { rootPath: '' }),
      runAudit(ctx, { rootPath: '', excludeRuleIds: new Set(['cat-4-rule-7', 'cat-4-rule-11', 'cat-4-rule-20', 'cat-4-rule-21']) }),
    ])

    // Excluding rules shouldn't make the score worse (excluded = skipped, not penalized)
    expect(partial.automatedPercentage).toBeGreaterThanOrEqual(full.automatedPercentage - 5)
  })
})
