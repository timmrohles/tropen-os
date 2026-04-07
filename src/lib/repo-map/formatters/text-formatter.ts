import type { RepoSymbol } from '../types'

/**
 * Formats symbols in Aider-style text format:
 *
 * src/lib/logger.ts:
 * ⋮...
 * │export function createLogger(scope: string): Logger
 * ⋮...
 */
export function formatAsText(symbolsByFile: Map<string, RepoSymbol[]>): string {
  const lines: string[] = []

  for (const [filePath, symbols] of symbolsByFile) {
    lines.push(`${filePath}:`)
    lines.push('⋮...')

    for (const sym of symbols) {
      const exportPrefix = sym.exported ? 'export ' : ''
      lines.push(`│${exportPrefix}${sym.signature}`)
    }

    lines.push('⋮...')
    lines.push('')
  }

  return lines.join('\n').trimEnd()
}
