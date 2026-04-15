import type { RepoFile, FileDependency, RepoSymbol } from './types'

const PAGERANK_ITERATIONS = 15
const DAMPING = 0.85

// Known entry-point function names that should rank higher regardless of import count
const ENTRY_POINT_NAMES = new Set([
  'generateText', 'streamText', 'runAudit',
  'generateRepoMap', 'createClient', 'buildAuditContext',
  'buildAuditContextFromFiles', 'generateRepoMapFromFiles',
])

function detectEntryPoint(sym: RepoSymbol, filePath: string): boolean {
  // API route handlers
  if (filePath.includes('/api/') && sym.kind === 'function' && sym.exported) return true
  // Known entry-point names
  return ENTRY_POINT_NAMES.has(sym.name) && sym.exported
}

// Relative importance per symbol kind (0–1 scale)
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
 *
 * Uses an additive scoring formula so each signal contributes a bounded
 * slice of the total score — prevents the multiplicative clustering
 * that bunches scores near 0.
 *
 * Min-Max normalization for a clean 0–1 output range.
 */
export function rankSymbols(files: RepoFile[], dependencies: FileDependency[]): RepoSymbol[] {
  const fileRanks = computeFilePageRank(files, dependencies)

  // Normalize file ranks to 0–1 before using them as a component
  const rankValues = fileRanks.size > 0 ? [...fileRanks.values()] : [1]
  const maxFileRank = Math.max(...rankValues, 1e-9)

  const allSymbols: RepoSymbol[] = []

  for (const file of files) {
    const fileRank = fileRanks.get(file.path) ?? (1 / Math.max(files.length, 1))
    const normalizedFileRank = fileRank / maxFileRank  // 0–1

    for (const sym of file.symbols) {
      // Additive formula — each component is bounded, no single signal dominates
      const baseScore   = normalizedFileRank * 0.4
      const exportBonus = sym.exported ? 0.3 : 0
      const kindBonus   = (KIND_WEIGHT[sym.kind] ?? 0.5) * 0.2
      // log1p dampens outliers: log1p(0)=0, log1p(1)≈0.69, log1p(10)≈2.4
      const refBonus    = Math.log1p(sym.referenceCount) * 0.1
      const entryBonus  = detectEntryPoint(sym, file.path) ? 0.2 : 0

      sym.rankScore = baseScore + exportBonus + kindBonus + refBonus + entryBonus
      allSymbols.push(sym)
    }
  }

  // Min-Max normalization: spreads scores across full 0–1 range
  if (allSymbols.length > 0) {
    const scores = allSymbols.map((s) => s.rankScore)
    const min = Math.min(...scores)
    const max = Math.max(...scores)
    const range = Math.max(max - min, 0.001)  // guard against all-equal edge case

    for (const sym of allSymbols) {
      sym.rankScore = (sym.rankScore - min) / range
    }
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
