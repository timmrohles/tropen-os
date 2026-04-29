// Integration test: full audit pipeline via buildAuditContextFromFiles (no disk/DB)
import { describe, it, expect } from 'vitest'
import { buildAuditContextFromFiles, runAudit } from '../index'

const MINIMAL_NEXTJS = [
  {
    path: 'package.json',
    content: JSON.stringify({
      name: 'test-app', version: '1.0.0',
      dependencies: { next: '^15.0.0', react: '^19.0.0' },
      devDependencies: { typescript: '^5.0.0', vitest: '^2.0.0', eslint: '^9.0.0' },
    }),
  },
  {
    path: 'tsconfig.json',
    content: JSON.stringify({ compilerOptions: { strict: true, target: 'ES2020' } }),
  },
  { path: 'src/lib/errors.ts', content: 'export class AppError extends Error {}' },
  { path: 'src/app/api/health/route.ts', content: 'export async function GET() { return Response.json({ status: "ok" }) }' },
  { path: '.env.example', content: 'DATABASE_URL=\nNEXT_PUBLIC_URL=' },
  { path: '.gitignore', content: 'node_modules\n.next\n.env.local' },
  { path: 'README.md', content: '# Test App\n\n## Setup\n\npnpm install\n\n## Deploy\n\nVercel auto-deploy on push to main.\n\n## Development\n\npnpm dev\n\n## API\n\nREST API at /api/*\n' + 'x'.repeat(200) },
]

describe('Integration: audit pipeline (buildAuditContextFromFiles)', () => {
  it('builds context from in-memory files without disk access', async () => {
    const ctx = await buildAuditContextFromFiles(MINIMAL_NEXTJS)
    expect(ctx.rootPath).toBe('')
    expect(ctx.packageJson.name).toBe('test-app')
    expect(ctx.tsConfig.compilerOptions?.strict).toBe(true)
    expect(ctx.filePaths).toContain('src/lib/errors.ts')
    expect(ctx.fileContents?.get('src/lib/errors.ts')).toBeTruthy()
  })

  it('runs full audit and returns 26 categories', async () => {
    const ctx = await buildAuditContextFromFiles(MINIMAL_NEXTJS)
    const report = await runAudit(ctx, { rootPath: '', excludeRuleIds: new Set() })
    expect(report.categories).toHaveLength(26)
    expect(typeof report.automatedPercentage).toBe('number')
    expect(report.automatedPercentage).toBeGreaterThanOrEqual(0)
    expect(report.automatedPercentage).toBeLessThanOrEqual(100)
  })

  it('detects TypeScript strict mode from tsconfig', async () => {
    const ctx = await buildAuditContextFromFiles(MINIMAL_NEXTJS)
    const report = await runAudit(ctx, { rootPath: '' })
    const cat2 = report.categories.find((c) => c.categoryId === 2)
    const tsRule = cat2?.ruleResults.find((r) => r.ruleId === 'cat-2-rule-1')
    expect(tsRule?.score).toBe(5)
  })

  it('detects health endpoint in filePaths', async () => {
    const ctx = await buildAuditContextFromFiles(MINIMAL_NEXTJS)
    const report = await runAudit(ctx, { rootPath: '' })
    const cat23 = report.categories.find((c) => c.categoryId === 23)
    const healthRule = cat23?.ruleResults.find((r) => r.ruleId === 'cat-23-rule-2')
    expect(healthRule?.score).toBe(5)
  })

  it('returns lower score for project missing .env.example', async () => {
    const filesWithoutEnvExample = MINIMAL_NEXTJS.filter((f) => f.path !== '.env.example')
    const ctx = await buildAuditContextFromFiles(filesWithoutEnvExample)
    const report = await runAudit(ctx, { rootPath: '' })
    const envRule = report.categories
      .flatMap((c) => c.ruleResults)
      .find((r) => r.ruleId === 'cat-6-rule-1')
    expect(envRule?.score).toBeLessThan(5)
  })
})
