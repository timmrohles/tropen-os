export interface RepoSymbol {
  /** Eindeutiger Identifier: "src/lib/logger.ts::createLogger" */
  id: string
  name: string
  kind: 'class' | 'function' | 'interface' | 'type' | 'enum' | 'const' | 'variable' | 'method' | 'property'
  filePath: string
  line: number
  lineEnd: number
  /** Call Signature oder Type Signature (komprimiert) */
  signature: string
  exported: boolean
  parentId?: string
  referenceCount: number
  rankScore: number
}

export interface FileDependency {
  source: string
  target: string
  symbols: string[]
}

export interface RepoFile {
  path: string
  language: 'typescript' | 'javascript' | 'json' | 'other'
  lineCount: number
  symbols: RepoSymbol[]
  imports: FileDependency[]
  exports: string[]
}

export interface RepoMap {
  generatedAt: string
  rootPath: string
  version: string
  stats: {
    totalFiles: number
    totalSymbols: number
    totalLines: number
    includedSymbols: number
    tokenBudget: number
    estimatedTokens: number
  }
  files: RepoFile[]
  rankedSymbols: RepoSymbol[]
  dependencies: FileDependency[]
  /** Komprimiertes Text-Format für LLM-Context */
  compressedMap: string
}

export interface RepoMapOptions {
  rootPath: string
  /**
   * Token-Budget für die komprimierte Map.
   * - 'auto' (Default): dynamisch nach Projektgröße (~6-7 Tokens/Datei)
   * - 'small': 2048 | 'medium': 4096 | 'large': 8192
   * - Zahl: exaktes Budget
   */
  tokenBudget?: number | 'auto' | 'small' | 'medium' | 'large'
  ignorePatterns?: string[]
  includePatterns?: string[]
  languages?: ('typescript' | 'javascript')[]
}
