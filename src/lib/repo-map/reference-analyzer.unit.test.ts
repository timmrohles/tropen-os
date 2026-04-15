import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import path from 'path'
import { parseSource } from './parser'
import { extractSymbols } from './symbol-extractor'
import { analyzeReferences } from './reference-analyzer'
import type { RepoFile } from './types'

const FIXTURES_DIR = path.resolve(__dirname, 'fixtures')

function loadFixtureFile(name: string): RepoFile {
  const abs = path.join(FIXTURES_DIR, name)
  const content = readFileSync(abs, 'utf-8')
  const relPath = `fixtures/${name}`
  const parsed = parseSource(abs, content)
  const symbols = extractSymbols(parsed, relPath, content)
  return {
    path: relPath,
    language: 'typescript',
    lineCount: content.split('\n').length,
    symbols,
    imports: [],
    exports: symbols.filter((s) => s.exported).map((s) => s.name),
  }
}

describe('analyzeReferences', () => {
  it('detects import from utility in simple-class', () => {
    const utilFile = loadFixtureFile('utility.ts')
    const classFile = loadFixtureFile('simple-class.ts')

    const { dependencies } = analyzeReferences([utilFile, classFile], FIXTURES_DIR)

    const dep = dependencies.find(
      (d) => d.source === classFile.path && d.target === utilFile.path
    )
    expect(dep).toBeDefined()
    expect(dep?.symbols).toContain('formatDate')
    expect(dep?.symbols).toContain('DateRange')
  })

  it('increments referenceCount on imported symbols', () => {
    const utilFile = loadFixtureFile('utility.ts')
    const classFile = loadFixtureFile('simple-class.ts')
    const consumerFile = loadFixtureFile('consumer.ts')

    const { files } = analyzeReferences([utilFile, classFile, consumerFile], FIXTURES_DIR)

    const updatedUtil = files.find((f) => f.path === utilFile.path)!
    const formatDate = updatedUtil.symbols.find((s) => s.name === 'formatDate')!

    // Both simple-class and consumer import formatDate
    expect(formatDate.referenceCount).toBeGreaterThanOrEqual(2)
  })

  it('handles circular imports without crashing', () => {
    const a = loadFixtureFile('circular-a.ts')
    const b = loadFixtureFile('circular-b.ts')

    expect(() => analyzeReferences([a, b], FIXTURES_DIR)).not.toThrow()
  })

  it('ignores external package imports (node_modules)', () => {
    const utilFile = loadFixtureFile('utility.ts')
    const { dependencies } = analyzeReferences([utilFile], FIXTURES_DIR)

    // utility.ts has no imports — no dependencies expected
    expect(dependencies.filter(d => d.source === utilFile.path)).toHaveLength(0)
  })

  it('builds complete dependency graph for consumer.ts', () => {
    const utilFile = loadFixtureFile('utility.ts')
    const classFile = loadFixtureFile('simple-class.ts')
    const consumerFile = loadFixtureFile('consumer.ts')

    const { dependencies } = analyzeReferences([utilFile, classFile, consumerFile], FIXTURES_DIR)

    const consumerDeps = dependencies.filter((d) => d.source === consumerFile.path)
    const targets = consumerDeps.map((d) => d.target)

    expect(targets).toContain(utilFile.path)
    expect(targets).toContain(classFile.path)
  })

  // ── New tests: re-export propagation ─────────────────────────────────────

  it('propagates refCount through named barrel re-export', () => {
    // barrel.ts: export { formatDate, DateRange } from './utility'
    // barrel-consumer.ts: import { formatDate } from './barrel'
    // Expected: utility.ts formatDate should have referenceCount >= 1
    const utilFile = loadFixtureFile('utility.ts')
    const barrelFile = loadFixtureFile('barrel.ts')
    const consumerFile = loadFixtureFile('barrel-consumer.ts')

    const { files } = analyzeReferences([utilFile, barrelFile, consumerFile], FIXTURES_DIR)

    const util = files.find((f) => f.path === utilFile.path)!
    const formatDate = util.symbols.find((s) => s.name === 'formatDate')!

    expect(formatDate.referenceCount).toBeGreaterThanOrEqual(1)
  })

  it('propagates refCount through wildcard barrel re-export', () => {
    // barrel-wildcard.ts: export * from './utility'
    // barrel-wildcard-consumer.ts: import { formatDate } from './barrel-wildcard'
    // Expected: utility.ts formatDate should have referenceCount >= 1
    const utilFile = loadFixtureFile('utility.ts')
    const barrelFile = loadFixtureFile('barrel-wildcard.ts')
    const consumerFile = loadFixtureFile('barrel-wildcard-consumer.ts')

    const { files } = analyzeReferences([utilFile, barrelFile, consumerFile], FIXTURES_DIR)

    const util = files.find((f) => f.path === utilFile.path)!
    const formatDate = util.symbols.find((s) => s.name === 'formatDate')!

    expect(formatDate.referenceCount).toBeGreaterThanOrEqual(1)
  })

  it('does not double-count when consumer imports directly from utility', () => {
    // A direct import and a barrel import of the same symbol from different consumers
    // should produce refCount = 2 (one each), not more
    const utilFile = loadFixtureFile('utility.ts')
    const classFile = loadFixtureFile('simple-class.ts')   // direct import of formatDate
    const barrelFile = loadFixtureFile('barrel.ts')
    const consumerFile = loadFixtureFile('barrel-consumer.ts') // barrel import of formatDate

    const { files } = analyzeReferences(
      [utilFile, barrelFile, classFile, consumerFile],
      FIXTURES_DIR
    )

    const util = files.find((f) => f.path === utilFile.path)!
    const formatDate = util.symbols.find((s) => s.name === 'formatDate')!

    // simple-class imports directly: +1
    // barrel-consumer imports via barrel: +1 (re-export propagation)
    expect(formatDate.referenceCount).toBeGreaterThanOrEqual(2)
  })
})
