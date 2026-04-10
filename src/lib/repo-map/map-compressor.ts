import { estimateTokens } from '@/lib/token-counter'
import { formatAsText } from './formatters/text-formatter'
import type { RepoSymbol } from './types'

export interface CompressResult {
  included: RepoSymbol[]
  compressedMap: string
  estimatedTokens: number
}

/**
 * Resolves a budget preset or 'auto' to a concrete number of tokens.
 * Auto-mode: ~6-7 tokens per file, capped at 8192 (4 models × 4K context limit).
 */
export function resolveTokenBudget(
  budget: number | 'auto' | 'small' | 'medium' | 'large' | undefined,
  totalFiles: number,
): number {
  if (typeof budget === 'number') return budget
  switch (budget) {
    case 'small':  return 2048
    case 'medium': return 4096
    case 'large':  return 8192
    case 'auto':
    default:
      if (totalFiles < 100) return 2048
      if (totalFiles < 300) return 4096
      if (totalFiles < 600) return 6144
      return 8192
  }
}

/**
 * Greedily selects highest-ranked symbols until the token budget is reached.
 * Returns the selected symbols and the Aider-style compressed text map.
 */
export function compressToTokenBudget(
  rankedSymbols: RepoSymbol[],
  tokenBudget: number | 'auto' | 'small' | 'medium' | 'large' = 'auto',
): CompressResult {
  const totalFiles = new Set(rankedSymbols.map((s) => s.filePath)).size
  const actualBudget = resolveTokenBudget(tokenBudget, totalFiles)
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

    if (currentTokens + symTokens > actualBudget) break

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
