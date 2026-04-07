import { describe, it, expect } from 'vitest'
import { rankSymbols } from './graph-ranker'
import type { RepoFile, FileDependency, RepoSymbol } from './types'

function makeSymbol(overrides: Partial<RepoSymbol> = {}): RepoSymbol {
  return {
    id: `file.ts::sym`,
    name: 'sym',
    kind: 'function',
    filePath: 'file.ts',
    line: 1,
    lineEnd: 5,
    signature: 'function sym()',
    exported: true,
    referenceCount: 0,
    rankScore: 0,
    ...overrides,
  }
}

function makeFile(overrides: Partial<RepoFile> = {}): RepoFile {
  return {
    path: 'file.ts',
    language: 'typescript',
    lineCount: 10,
    symbols: [],
    imports: [],
    exports: [],
    ...overrides,
  }
}

describe('rankSymbols', () => {
  it('returns all symbols with rankScore set', () => {
    const files: RepoFile[] = [
      makeFile({ path: 'a.ts', symbols: [makeSymbol({ id: 'a.ts::fn', filePath: 'a.ts', referenceCount: 5 })] }),
      makeFile({ path: 'b.ts', symbols: [makeSymbol({ id: 'b.ts::fn', filePath: 'b.ts', referenceCount: 1 })] }),
    ]
    const deps: FileDependency[] = [{ source: 'b.ts', target: 'a.ts', symbols: ['fn'] }]

    const ranked = rankSymbols(files, deps)
    expect(ranked.every((s) => s.rankScore >= 0 && s.rankScore <= 1)).toBe(true)
  })

  it('ranks frequently imported file symbols higher', () => {
    const symA = makeSymbol({ id: 'a.ts::fn', filePath: 'a.ts', name: 'fn', exported: true, referenceCount: 10 })
    const symD = makeSymbol({ id: 'd.ts::fn', filePath: 'd.ts', name: 'fn', exported: true, referenceCount: 0 })

    const files: RepoFile[] = [
      makeFile({ path: 'a.ts', symbols: [symA] }),
      makeFile({ path: 'b.ts', symbols: [] }),
      makeFile({ path: 'c.ts', symbols: [] }),
      makeFile({ path: 'd.ts', symbols: [symD] }),
    ]
    const deps: FileDependency[] = [
      { source: 'b.ts', target: 'a.ts', symbols: ['fn'] },
      { source: 'c.ts', target: 'a.ts', symbols: ['fn'] },
    ]

    const ranked = rankSymbols(files, deps)
    const aScore = ranked.find((s) => s.id === 'a.ts::fn')!.rankScore
    const dScore = ranked.find((s) => s.id === 'd.ts::fn')!.rankScore

    expect(aScore).toBeGreaterThan(dScore)
  })

  it('exported symbols rank higher than non-exported', () => {
    const files: RepoFile[] = [
      makeFile({
        path: 'a.ts',
        symbols: [
          makeSymbol({ id: 'a.ts::pub', name: 'pub', exported: true, referenceCount: 0 }),
          makeSymbol({ id: 'a.ts::priv', name: 'priv', exported: false, referenceCount: 0 }),
        ],
      }),
    ]

    const ranked = rankSymbols(files, [])
    const pub = ranked.find((s) => s.id === 'a.ts::pub')!
    const priv = ranked.find((s) => s.id === 'a.ts::priv')!
    expect(pub.rankScore).toBeGreaterThan(priv.rankScore)
  })

  it('returns symbols sorted by rankScore descending', () => {
    const files: RepoFile[] = [
      makeFile({
        path: 'a.ts',
        symbols: [
          makeSymbol({ id: 'a.ts::high', referenceCount: 10 }),
          makeSymbol({ id: 'a.ts::low', referenceCount: 0 }),
        ],
      }),
    ]

    const ranked = rankSymbols(files, [])
    for (let i = 0; i < ranked.length - 1; i++) {
      expect(ranked[i].rankScore).toBeGreaterThanOrEqual(ranked[i + 1].rankScore)
    }
  })

  it('normalizes scores to 0-1 range', () => {
    const files: RepoFile[] = [
      makeFile({
        path: 'a.ts',
        symbols: [
          makeSymbol({ id: 'a.ts::s1', referenceCount: 100 }),
          makeSymbol({ id: 'a.ts::s2', referenceCount: 50 }),
          makeSymbol({ id: 'a.ts::s3', referenceCount: 0 }),
        ],
      }),
    ]

    const ranked = rankSymbols(files, [])
    expect(Math.max(...ranked.map((s) => s.rankScore))).toBeLessThanOrEqual(1)
    expect(Math.min(...ranked.map((s) => s.rankScore))).toBeGreaterThanOrEqual(0)
  })
})
