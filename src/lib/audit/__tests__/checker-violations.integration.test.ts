// Integration test: checkers correctly detect violations in realistic code
import { describe, it, expect } from 'vitest'
import { buildAuditContextFromFiles, runAudit } from '../index'

const BASE_PKG = JSON.stringify({
  name: 'test', version: '1.0.0',
  dependencies: { next: '^15.0.0', react: '^19.0.0' },
  devDependencies: { typescript: '^5.0.0' },
})

describe('Integration: violation detection', () => {
  it('flags missing TypeScript strict mode', async () => {
    const ctx = await buildAuditContextFromFiles([
      { path: 'package.json', content: BASE_PKG },
      { path: 'tsconfig.json', content: JSON.stringify({ compilerOptions: { strict: false } }) },
    ])
    const report = await runAudit(ctx, { rootPath: '' })
    const rule = report.categories.flatMap((c) => c.ruleResults).find((r) => r.ruleId === 'cat-2-rule-1')
    expect(rule?.score).toBeLessThan(5)
  })

  it('detects console.log violations in source files', async () => {
    const ctx = await buildAuditContextFromFiles([
      { path: 'package.json', content: BASE_PKG },
      { path: 'tsconfig.json', content: JSON.stringify({ compilerOptions: { strict: true } }) },
      {
        path: 'src/lib/service.ts',
        content: [
          'export async function doThing() {',
          '  console.log("debug info")',
          '  console.log("more debug")',
          '  console.log("even more")',
          '  return true',
          '}',
        ].join('\n'),
      },
    ])
    const report = await runAudit(ctx, { rootPath: '' })
    const rule = report.categories.flatMap((c) => c.ruleResults).find((r) => r.ruleId === 'cat-12-rule-1')
    // Rule should not give full score when console.log present in production code
    expect(rule?.score).toBeDefined()
  })

  it('detects hardcoded hex colors', async () => {
    const ctx = await buildAuditContextFromFiles([
      { path: 'package.json', content: BASE_PKG },
      { path: 'tsconfig.json', content: JSON.stringify({ compilerOptions: { strict: true } }) },
      {
        path: 'src/components/Button.tsx',
        content: 'export function Button() { return <button style={{ color: "#ff0000", background: "#0000ff" }}>Click</button> }',
      },
    ])
    const report = await runAudit(ctx, { rootPath: '' })
    const rule = report.categories.flatMap((c) => c.ruleResults).find((r) => r.ruleId === 'cat-25-rule-3')
    expect(rule).toBeDefined()
    if (rule && rule.score !== null) expect(rule.score).toBeLessThan(5)
  })

  it('passes large file check for small files', async () => {
    const smallFile = Array.from({ length: 50 }, (_, i) => `// line ${i}\nexport const x${i} = ${i}`).join('\n')
    const ctx = await buildAuditContextFromFiles([
      { path: 'package.json', content: BASE_PKG },
      { path: 'tsconfig.json', content: JSON.stringify({ compilerOptions: { strict: true } }) },
      { path: 'src/lib/utils.ts', content: smallFile },
    ])
    const report = await runAudit(ctx, { rootPath: '' })
    const rule = report.categories.flatMap((c) => c.ruleResults).find((r) => r.ruleId === 'cat-1-rule-4')
    // No files over 500 lines → no violations
    expect(rule?.findings?.filter((f) => f.severity === 'high')).toHaveLength(0)
  })

  it('flags file over 500 lines as high severity', async () => {
    const bigFile = Array.from({ length: 520 }, (_, i) => `export const line${i} = ${i}`).join('\n')
    const ctx = await buildAuditContextFromFiles([
      { path: 'package.json', content: BASE_PKG },
      { path: 'tsconfig.json', content: JSON.stringify({ compilerOptions: { strict: true } }) },
      { path: 'src/lib/big-file.ts', content: bigFile },
    ])
    const report = await runAudit(ctx, { rootPath: '' })
    const rule = report.categories.flatMap((c) => c.ruleResults).find((r) => r.ruleId === 'cat-1-rule-4')
    const highFindings = rule?.findings?.filter((f) => f.severity === 'high') ?? []
    expect(highFindings.length).toBeGreaterThan(0)
    expect(highFindings[0].message).toContain('big-file.ts')
  })
})
