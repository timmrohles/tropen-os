import { estimateTokens } from '@/lib/token-counter'
import { formatAsText } from './formatters/text-formatter'
import type { RepoSymbol } from './types'

export interface CompressResult {
  included: RepoSymbol[]
  compressedMap: string
  estimatedTokens: number
}

/**
 * Greedily selects highest-ranked symbols until the token budget is reached.
 * Returns the selected symbols and the Aider-style compressed text map.
 */
export function compressToTokenBudget(
  rankedSymbols: RepoSymbol[],
  tokenBudget: number
): CompressResult {
  // Sort by rankScore descending (symbols may arrive in any order)
  const sorted = [...rankedSymbols].sort((a, b) => b.rankScore - a.rankScore)

  const included: RepoSymbol[] = []
  const seenFiles = new Set<string>()
  let currentTokens = 0

  for (const sym of sorted) {
    const symText = formatSymbolLine(sym)
    let symTokens = estimateTokens(symText)

    // Account for per-file header overhead: "filePath:\n⋮...\n⋮...\n"
    if (!seenFiles.has(sym.filePath)) {
      symTokens += estimateTokens(`${sym.filePath}:\n⋮...\n⋮...\n`)
    }

    if (currentTokens + symTokens > tokenBudget) break

    if (!seenFiles.has(sym.filePath)) seenFiles.add(sym.filePath)
    included.push(sym)
    currentTokens += symTokens
  }

  const symbolsByFile = groupByFile(included)
  const compressedMap = formatAsText(symbolsByFile)
  const estimatedTokens = estimateTokens(compressedMap)

  return { included, compressedMap, estimatedTokens }
}

function formatSymbolLine(sym: RepoSymbol): string {
  const exportPrefix = sym.exported ? 'export ' : ''
  return `│${exportPrefix}${sym.signature}`
}

function groupByFile(symbols: RepoSymbol[]): Map<string, RepoSymbol[]> {
  const ordered: string[] = []
  const map = new Map<string, RepoSymbol[]>()

  for (const sym of symbols) {
    if (!map.has(sym.filePath)) {
      ordered.push(sym.filePath)
      map.set(sym.filePath, [])
    }
    map.get(sym.filePath)!.push(sym)
  }

  const result = new Map<string, RepoSymbol[]>()
  for (const fp of ordered) result.set(fp, map.get(fp)!)
  return result
}
