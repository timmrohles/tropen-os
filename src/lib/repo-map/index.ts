import { readFile } from 'fs/promises'
import path from 'path'
import { discoverFiles } from './file-discovery'
import { parseSource } from './parser'
import { extractSymbols } from './symbol-extractor'
import { analyzeReferences } from './reference-analyzer'
import { rankSymbols } from './graph-ranker'
import { compressToTokenBudget, resolveTokenBudget } from './map-compressor'
import type { RepoMap, RepoFile, RepoMapOptions } from './types'

export { generateRepoMap, getCompressedRepoMap, generateRepoMapFromFiles }
export type { RepoMap, RepoSymbol, RepoFile, FileDependency, RepoMapOptions } from './types'

const VERSION = '1.0.0'

async function generateRepoMap(options: RepoMapOptions): Promise<RepoMap> {
  const {
    rootPath,
    tokenBudget = 'auto',
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
      tokenBudget: resolveTokenBudget(tokenBudget, analyzedFiles.length),
      estimatedTokens,
    },
    files: analyzedFiles,
    rankedSymbols,
    dependencies,
    compressedMap,
  }
}

async function getCompressedRepoMap(rootPath: string, tokenBudget: RepoMapOptions['tokenBudget'] = 'auto'): Promise<string> {
  const map = await generateRepoMap({ rootPath, tokenBudget })
  return map.compressedMap
}

/**
 * Generates a RepoMap from in-memory file content (no disk access).
 * Used for external project scans via File System Access API.
 */
async function generateRepoMapFromFiles(
  files: Array<{ path: string; content: string }>,
  options: { tokenBudget?: number | 'auto' | 'small' | 'medium' | 'large' } = {},
): Promise<RepoMap> {
  const tokenBudget = options.tokenBudget ?? 'auto'

  const repoFiles: RepoFile[] = []

  for (const file of files) {
    const isCode = /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(file.path)
    const lineCount = file.content.split('\n').length
    const language =
      file.path.endsWith('.js') || file.path.endsWith('.jsx') || file.path.endsWith('.mjs')
        ? 'javascript'
        : 'typescript'

    if (!isCode) {
      repoFiles.push({ path: file.path, language: 'other', lineCount, symbols: [], imports: [], exports: [] })
      continue
    }

    try {
      const parsed = parseSource(file.path, file.content)
      const symbols = extractSymbols(parsed, file.path, file.content)
      repoFiles.push({
        path: file.path,
        language,
        lineCount,
        symbols,
        imports: [],
        exports: symbols.filter((s) => s.exported).map((s) => s.name),
      })
    } catch {
      repoFiles.push({ path: file.path, language, lineCount, symbols: [], imports: [], exports: [] })
    }
  }

  // No cross-file reference analysis (files are in-memory, no disk reads)
  const rankedSymbols = rankSymbols(repoFiles, [])
  const { included, compressedMap, estimatedTokens } = compressToTokenBudget(rankedSymbols, tokenBudget)

  const totalSymbols = repoFiles.reduce((n, f) => n + f.symbols.length, 0)
  const totalLines = repoFiles.reduce((n, f) => n + f.lineCount, 0)

  return {
    generatedAt: new Date().toISOString(),
    rootPath: '',
    version: VERSION,
    stats: {
      totalFiles: repoFiles.length,
      totalSymbols,
      totalLines,
      includedSymbols: included.length,
      tokenBudget: resolveTokenBudget(tokenBudget, repoFiles.length),
      estimatedTokens,
    },
    files: repoFiles,
    rankedSymbols,
    dependencies: [],
    compressedMap,
  }
}
