import { readFile } from 'fs/promises'
import path from 'path'
import { discoverFiles } from './file-discovery'
import { parseSource } from './parser'
import { extractSymbols } from './symbol-extractor'
import { analyzeReferences } from './reference-analyzer'
import { rankSymbols } from './graph-ranker'
import { compressToTokenBudget } from './map-compressor'
import type { RepoMap, RepoFile, RepoMapOptions } from './types'

export { generateRepoMap, getCompressedRepoMap }
export type { RepoMap, RepoSymbol, RepoFile, FileDependency, RepoMapOptions } from './types'

const VERSION = '1.0.0'
const DEFAULT_TOKEN_BUDGET = 2048

async function generateRepoMap(options: RepoMapOptions): Promise<RepoMap> {
  const {
    rootPath,
    tokenBudget = DEFAULT_TOKEN_BUDGET,
    ignorePatterns,
    includePatterns,
    languages = ['typescript', 'javascript'],
  } = options

  // 1. File Discovery
  const filePaths = await discoverFiles({ rootPath, ignorePatterns, includePatterns, languages })

  // 2. Parse + Extract Symbols
  const repoFiles: RepoFile[] = []

  for (const filePath of filePaths) {
    const absPath = path.join(rootPath, filePath)
    let content: string
    try {
      content = await readFile(absPath, 'utf-8')
    } catch {
      continue
    }

    const parsed = parseSource(absPath, content)
    const symbols = extractSymbols(parsed, filePath, content)
    const lineCount = content.split('\n').length
    const language = filePath.endsWith('.js') || filePath.endsWith('.jsx') ? 'javascript' : 'typescript'

    repoFiles.push({
      path: filePath,
      language,
      lineCount,
      symbols,
      imports: [],
      exports: symbols.filter((s) => s.exported).map((s) => s.name),
    })
  }

  // 3. Reference Analysis
  const { files: analyzedFiles, dependencies } = analyzeReferences(repoFiles, rootPath)

  // 4. Graph Ranking
  const rankedSymbols = rankSymbols(analyzedFiles, dependencies)

  // 5. Map Compression
  const { included, compressedMap, estimatedTokens } = compressToTokenBudget(rankedSymbols, tokenBudget)

  // 6. Build RepoMap
  const totalSymbols = analyzedFiles.reduce((n, f) => n + f.symbols.length, 0)
  const totalLines = analyzedFiles.reduce((n, f) => n + f.lineCount, 0)

  return {
    generatedAt: new Date().toISOString(),
    rootPath,
    version: VERSION,
    stats: {
      totalFiles: analyzedFiles.length,
      totalSymbols,
      totalLines,
      includedSymbols: included.length,
      tokenBudget,
      estimatedTokens,
    },
    files: analyzedFiles,
    rankedSymbols,
    dependencies,
    compressedMap,
  }
}

async function getCompressedRepoMap(rootPath: string, tokenBudget = DEFAULT_TOKEN_BUDGET): Promise<string> {
  const map = await generateRepoMap({ rootPath, tokenBudget })
  return map.compressedMap
}
