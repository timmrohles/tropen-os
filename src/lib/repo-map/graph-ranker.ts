import type { RepoFile, FileDependency, RepoSymbol } from './types'

const PAGERANK_ITERATIONS = 15
const DAMPING = 0.85
const KIND_WEIGHT: Record<RepoSymbol['kind'], number> = {
  class:     1.0,
  interface: 1.0,
  type:      0.9,
  enum:      0.9,
  function:  0.8,
  const:     0.7,
  variable:  0.5,
  method:    0.6,
  property:  0.4,
}

/**
 * Ranks all symbols using PageRank on file dependencies combined with
 * symbol-level signals (referenceCount, exported, kind).
 * Returns all symbols sorted by rankScore descending, scores normalized 0–1.
 */
export function rankSymbols(files: RepoFile[], dependencies: FileDependency[]): RepoSymbol[] {
  const fileRanks = computeFilePageRank(files, dependencies)

  const allSymbols: RepoSymbol[] = []

  for (const file of files) {
    const fileRank = fileRanks.get(file.path) ?? (1 / Math.max(files.length, 1))

    for (const sym of file.symbols) {
      const exportBonus = sym.exported ? 1.5 : 1.0
      const kindWeight = KIND_WEIGHT[sym.kind] ?? 0.5
      const refBonus = 1 + Math.log1p(sym.referenceCount)
      sym.rankScore = fileRank * exportBonus * kindWeight * refBonus
      allSymbols.push(sym)
    }
  }

  // Normalize to 0–1
  const maxScore = Math.max(...allSymbols.map((s) => s.rankScore), 1)
  for (const sym of allSymbols) {
    sym.rankScore = sym.rankScore / maxScore
  }

  allSymbols.sort((a, b) => b.rankScore - a.rankScore)
  return allSymbols
}

function computeFilePageRank(
  files: RepoFile[],
  dependencies: FileDependency[]
): Map<string, number> {
  const paths = files.map((f) => f.path)
  const n = paths.length

  if (n === 0) return new Map()

  // Build adjacency: target → [sources] (who links TO this file)
  const inLinks = new Map<string, string[]>()
  const outDegree = new Map<string, number>()

  for (const p of paths) {
    inLinks.set(p, [])
    outDegree.set(p, 0)
  }

  for (const dep of dependencies) {
    if (inLinks.has(dep.target) && inLinks.has(dep.source)) {
      inLinks.get(dep.target)!.push(dep.source)
      outDegree.set(dep.source, (outDegree.get(dep.source) ?? 0) + 1)
    }
  }

  // Initialize ranks
  let ranks = new Map<string, number>()
  for (const p of paths) ranks.set(p, 1 / n)

  // Iterate PageRank
  for (let iter = 0; iter < PAGERANK_ITERATIONS; iter++) {
    const newRanks = new Map<string, number>()
    for (const p of paths) {
      const sources = inLinks.get(p) ?? []
      const sum = sources.reduce((acc, src) => {
        const srcOut = outDegree.get(src) ?? 1
        return acc + (ranks.get(src) ?? 0) / Math.max(srcOut, 1)
      }, 0)
      newRanks.set(p, (1 - DAMPING) / n + DAMPING * sum)
    }
    ranks = newRanks
  }

  return ranks
}
