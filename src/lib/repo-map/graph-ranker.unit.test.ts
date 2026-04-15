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

  // ── New tests for additive formula + min-max distribution ────────────────

  it('score distribution is not clustered at extremes', () => {
    // With the additive formula + min-max normalization, scores should be
    // spread across the range — not bunched at 0 or 1
    const symbols = Array.from({ length: 20 }, (_, i) =>
      makeSymbol({
        id: `a.ts::sym${i}`,
        name: `sym${i}`,
        filePath: 'a.ts',
        exported: i % 2 === 0,
        referenceCount: i * 3,
        kind: i % 3 === 0 ? 'class' : i % 3 === 1 ? 'function' : 'variable',
      })
    )

    const files: RepoFile[] = [makeFile({ path: 'a.ts', symbols })]
    const ranked = rankSymbols(files, [])

    // At least one symbol should be in the mid-range (not just 0 and 1)
    const midRange = ranked.filter((s) => s.rankScore > 0.1 && s.rankScore < 0.9)
    expect(midRange.length).toBeGreaterThan(0)
  })

  it('min-max normalization: lowest score is 0 and highest is 1', () => {
    const files: RepoFile[] = [
      makeFile({
        path: 'a.ts',
        symbols: [
          makeSymbol({ id: 'a.ts::s1', exported: true,  referenceCount: 50, kind: 'class' }),
          makeSymbol({ id: 'a.ts::s2', exported: true,  referenceCount: 5,  kind: 'function' }),
          makeSymbol({ id: 'a.ts::s3', exported: false, referenceCount: 0,  kind: 'variable' }),
        ],
      }),
    ]

    const ranked = rankSymbols(files, [])
    expect(Math.max(...ranked.map((s) => s.rankScore))).toBeCloseTo(1.0, 5)
    expect(Math.min(...ranked.map((s) => s.rankScore))).toBeCloseTo(0.0, 5)
  })

  it('handles single symbol (no division by zero)', () => {
    const files: RepoFile[] = [
      makeFile({ path: 'a.ts', symbols: [makeSymbol({ id: 'a.ts::only' })] }),
    ]
    const ranked = rankSymbols(files, [])
    expect(ranked).toHaveLength(1)
    expect(ranked[0].rankScore).toBeGreaterThanOrEqual(0)
    expect(ranked[0].rankScore).toBeLessThanOrEqual(1)
  })

  it('log1p dampens extreme reference counts — high refs do not dominate infinitely', () => {
    // With three symbols, min-max normalization is anchored by the base symbol.
    // The gap between 1000-refs and 10-refs should be < 0.5 (bounded by log1p).
    const files: RepoFile[] = [
      makeFile({
        path: 'a.ts',
        symbols: [
          makeSymbol({ id: 'a.ts::many', exported: true,  kind: 'function', referenceCount: 1000 }),
          makeSymbol({ id: 'a.ts::few',  exported: true,  kind: 'function', referenceCount: 10 }),
          // anchor: low-signal symbol keeps min-max from collapsing to a 2-point range
          makeSymbol({ id: 'a.ts::base', exported: false, kind: 'variable', referenceCount: 0 }),
        ],
      }),
    ]
    const ranked = rankSymbols(files, [])
    const many = ranked.find((s) => s.id === 'a.ts::many')!
    const few  = ranked.find((s) => s.id === 'a.ts::few')!

    expect(many.rankScore).toBeGreaterThan(few.rankScore)
    // The gap should be < 0.5 (not a massive cliff), since log1p dampens
    expect(many.rankScore - few.rankScore).toBeLessThan(0.5)
  })
})
