// src/lib/audit/prompt-export/repo-context.ts
// Extracts relevant symbols and dependencies for given file paths from a RepoMap.
// Stays within a token budget to keep prompts focused.

import type { RepoMap } from '@/lib/repo-map/types'
import type { RepoContextSnippet } from './types'

const MAX_TOKENS = 2000
// Rough estimate: 1 token ≈ 4 characters
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

/**
 * Extracts a focused context snippet from the RepoMap for the given file paths.
 * Returns null if no RepoMap is provided or no relevant data found.
 */
export function extractRepoContext(
  filePaths: string[],
  repoMap?: RepoMap | null,
): RepoContextSnippet | null {
  if (!repoMap || filePaths.length === 0) return null

  const normalizedPaths = filePaths.map((p) => p.replace(/\\/g, '/'))
  const symbolLines: string[] = []
  const importedBySet = new Set<string>()
  const importsSet = new Set<string>()

  for (const file of repoMap.files ?? []) {
    const filePath = file.path.replace(/\\/g, '/')
    if (!normalizedPaths.some((p) => filePath.endsWith(p) || p.endsWith(filePath))) continue

    // Collect top symbols from this file (ranked by score)
    const topSymbols = (file.symbols ?? [])
      .filter((s: { exported: boolean; rankScore: number }) => s.exported || s.rankScore > 0.3)
      .slice(0, 8)

    for (const sym of topSymbols as Array<{ kind: string; name: string; signature: string; line: number }>) {
      symbolLines.push(`  ${sym.kind} ${sym.name}${sym.signature ? `: ${sym.signature}` : ''} (${filePath}:${sym.line})`)
    }
  }

  // Dependencies from the full dep list
  for (const dep of repoMap.dependencies ?? []) {
    const src = dep.source.replace(/\\/g, '/')
    const tgt = dep.target.replace(/\\/g, '/')
    if (normalizedPaths.some((p) => tgt.endsWith(p) || p.endsWith(tgt))) importedBySet.add(dep.source)
    if (normalizedPaths.some((p) => src.endsWith(p) || p.endsWith(src))) importsSet.add(dep.target)
  }

  if (symbolLines.length === 0 && importedBySet.size === 0) return null

  const snippet: RepoContextSnippet = {
    symbolLines: symbolLines.slice(0, 20),
    importedBy: [...importedBySet].slice(0, 8),
    imports: [...importsSet].slice(0, 8),
    estimatedTokens: 0,
  }

  const tokenCount = estimateTokens(
    snippet.symbolLines.join('\n') +
    snippet.importedBy.join('\n') +
    snippet.imports.join('\n'),
  )
  snippet.estimatedTokens = tokenCount

  return tokenCount > MAX_TOKENS ? trimToTokenBudget(snippet) : snippet
}

function trimToTokenBudget(snippet: RepoContextSnippet): RepoContextSnippet {
  const budget = MAX_TOKENS
  let used = 0
  const trimmedSymbols: string[] = []

  for (const line of snippet.symbolLines) {
    const cost = estimateTokens(line)
    if (used + cost > budget * 0.6) break
    trimmedSymbols.push(line)
    used += cost
  }

  return {
    ...snippet,
    symbolLines: trimmedSymbols,
    importedBy: snippet.importedBy.slice(0, 4),
    imports: snippet.imports.slice(0, 4),
    estimatedTokens: used,
  }
}
