import { describe, it, expect } from 'vitest'
import { compressToTokenBudget } from './map-compressor'
import { estimateTokens } from '@/lib/token-counter'
import type { RepoSymbol } from './types'

function makeSymbol(overrides: Partial<RepoSymbol> = {}): RepoSymbol {
  return {
    id: 'file.ts::sym',
    name: 'sym',
    kind: 'function',
    filePath: 'file.ts',
    line: 1,
    lineEnd: 5,
    signature: 'function sym(a: string): void',
    exported: true,
    referenceCount: 5,
    rankScore: 0.9,
    ...overrides,
  }
}

describe('compressToTokenBudget', () => {
  it('includes all symbols when budget is large', () => {
    const symbols = [
      makeSymbol({ id: 'a.ts::fn', filePath: 'a.ts', rankScore: 0.9 }),
      makeSymbol({ id: 'b.ts::fn', filePath: 'b.ts', rankScore: 0.5 }),
      makeSymbol({ id: 'c.ts::fn', filePath: 'c.ts', rankScore: 0.1 }),
    ]
    const { included } = compressToTokenBudget(symbols, 10000)
    expect(included.length).toBe(3)
  })

  it('respects token budget', () => {
    const symbols = Array.from({ length: 100 }, (_, i) =>
      makeSymbol({
        id: `file.ts::sym${i}`,
        name: `symbol${i}`,
        filePath: `file${i}.ts`,
        signature: `function symbol${i}(param: string): void`,
        rankScore: (100 - i) / 100,
      })
    )

    const budget = 200
    const { included, compressedMap } = compressToTokenBudget(symbols, budget)

    expect(estimateTokens(compressedMap)).toBeLessThanOrEqual(budget + 50)
    expect(included.length).toBeLessThan(100)
  })

  it('prioritizes high-rank symbols', () => {
    const high = makeSymbol({ id: 'a.ts::high', name: 'highRank', filePath: 'a.ts', rankScore: 1.0, signature: 'function highRank()' })
    const low = makeSymbol({ id: 'b.ts::low', name: 'lowRank', filePath: 'b.ts', rankScore: 0.1, signature: 'function lowRank()' })
    const symbols = [low, high] // deliberately reversed

    const { included } = compressToTokenBudget(symbols, 50)
    const includedNames = included.map((s) => s.name)
    expect(includedNames).toContain('highRank')
  })

  it('generates compressedMap with Aider-style format', () => {
    const symbols = [
      makeSymbol({ id: 'src/lib/logger.ts::createLogger', name: 'createLogger', filePath: 'src/lib/logger.ts', signature: 'function createLogger(scope: string): Logger', exported: true }),
    ]
    const { compressedMap } = compressToTokenBudget(symbols, 2048)

    expect(compressedMap).toContain('src/lib/logger.ts')
    expect(compressedMap).toContain('createLogger')
    expect(compressedMap).toContain('│')
  })

  it('groups symbols by file in output', () => {
    const symbols = [
      makeSymbol({ id: 'a.ts::fn1', name: 'fn1', filePath: 'a.ts', rankScore: 0.9 }),
      makeSymbol({ id: 'b.ts::fn2', name: 'fn2', filePath: 'b.ts', rankScore: 0.8 }),
      makeSymbol({ id: 'a.ts::fn3', name: 'fn3', filePath: 'a.ts', rankScore: 0.7 }),
    ]
    const { compressedMap } = compressToTokenBudget(symbols, 2048)

    // a.ts should appear once as a header, not twice
    const aCount = (compressedMap.match(/a\.ts:/g) ?? []).length
    expect(aCount).toBe(1)
  })
})
