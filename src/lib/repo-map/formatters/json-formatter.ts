import type { RepoSymbol } from '../types'

export interface JsonSymbolEntry {
  id: string
  name: string
  kind: RepoSymbol['kind']
  filePath: string
  line: number
  signature: string
  exported: boolean
  referenceCount: number
  rankScore: number
}

export function formatAsJson(symbols: RepoSymbol[]): JsonSymbolEntry[] {
  return symbols.map((s) => ({
    id: s.id,
    name: s.name,
    kind: s.kind,
    filePath: s.filePath,
    line: s.line,
    signature: s.signature,
    exported: s.exported,
    referenceCount: s.referenceCount,
    rankScore: Math.round(s.rankScore * 1000) / 1000,
  }))
}
