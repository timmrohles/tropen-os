import ts from 'typescript'
import path from 'path'
import { existsSync, readFileSync } from 'fs'
import { parseSource } from './parser'
import type { RepoFile, FileDependency } from './types'

export interface ReferenceResult {
  files: RepoFile[]
  dependencies: FileDependency[]
}

/** A single re-export entry for one source file */
interface ReExportEntry {
  /** The file where the symbol is actually defined */
  sourceFile: string
  /** Exported names ('*' for wildcard re-exports) */
  symbols: string[]
}

/**
 * Analyzes imports and re-exports across all files, builds the dependency
 * graph, and updates referenceCount on all symbols.
 *
 * Two-pass approach:
 * 1. Direct imports: standard import { X } from '...' — increments refCount immediately
 * 2. Re-export propagation: export { X } from '...' — propagated after full graph is built
 */
export function analyzeReferences(files: RepoFile[], rootPath: string): ReferenceResult {
  // Build two lookup maps:
  // 1. normalized relative path (no ext) → RepoFile
  // 2. normalized absolute path (no ext) → RepoFile
  const relMap = new Map<string, RepoFile>()
  const absMap = new Map<string, RepoFile>()

  for (const f of files) {
    relMap.set(normalizePath(f.path), f)
    const absCandidate = path.resolve(rootPath, f.path)
    absMap.set(normalizePath(absCandidate), f)
  }

  const dependencies: FileDependency[] = []
  const reExportMap = new Map<string, ReExportEntry[]>()

  for (const file of files) {
    const absPath = path.resolve(rootPath, file.path)
    let content: string
    try {
      content = readFileSync(absPath, 'utf-8')
    } catch {
      const altPath = path.resolve(rootPath, '..', file.path)
      try {
        content = readFileSync(altPath, 'utf-8')
      } catch {
        continue
      }
    }

    const parsed = parseSource(absPath, content)

    // Collect direct imports
    const imports = extractImports(parsed.sourceFile, file.path, absPath, relMap, absMap)
    file.imports = imports
    dependencies.push(...imports)

    // Collect re-exports (export { X } from '...' / export * from '...')
    const reExports = extractReExports(parsed.sourceFile, file.path, absPath, relMap, absMap)
    if (reExports.length > 0) reExportMap.set(file.path, reExports)

    // Increment referenceCount for directly imported symbols
    for (const dep of imports) {
      const targetFile = relMap.get(normalizePath(dep.target))
      if (!targetFile) continue
      for (const sym of targetFile.symbols) {
        if (dep.symbols.includes(sym.name) || dep.symbols.includes('*')) {
          sym.referenceCount++
        }
      }
    }
  }

  // Second pass: propagate reference counts through re-export chains.
  // When file C imports X from barrel.ts and barrel.ts re-exports X from
  // utility.ts, utility.ts's X should also receive the reference count.
  propagateReExportRefs(files, reExportMap, relMap)

  return { files, dependencies }
}

/**
 * Propagates reference counts through one hop of re-export chains.
 * Single-level propagation covers the common barrel-file pattern.
 */
function propagateReExportRefs(
  files: RepoFile[],
  reExportMap: Map<string, ReExportEntry[]>,
  relMap: Map<string, RepoFile>,
): void {
  for (const file of files) {
    for (const dep of file.imports) {
      const reExports = reExportMap.get(dep.target) ?? []
      for (const reExp of reExports) {
        const srcFile = relMap.get(normalizePath(reExp.sourceFile))
        if (!srcFile) continue

        const reExpIsWild = reExp.symbols.includes('*')
        const importIsWild = dep.symbols.includes('*')

        for (const sym of srcFile.symbols) {
          const symIsReExported = reExpIsWild || reExp.symbols.includes(sym.name)
          const symIsImported = importIsWild || dep.symbols.includes(sym.name)

          if (symIsReExported && symIsImported) {
            sym.referenceCount++
          }
        }
      }
    }
  }
}

// ── Re-export extraction ──────────────────────────────────────────────────────

function extractReExports(
  sourceFile: ts.SourceFile,
  filePath: string,
  absFilePath: string,
  relMap: Map<string, RepoFile>,
  absMap: Map<string, RepoFile>,
): ReExportEntry[] {
  const entries: ReExportEntry[] = []

  ts.forEachChild(sourceFile, (node) => {
    // Only export declarations with a module specifier (re-exports)
    if (!ts.isExportDeclaration(node) || !node.moduleSpecifier) return

    const moduleSpecifier = (node.moduleSpecifier as ts.StringLiteral).text
    const isRelative = moduleSpecifier.startsWith('.')
    const isAlias = moduleSpecifier.startsWith('@/')
    if (!isRelative && !isAlias) return

    const resolvedTarget = resolveImportPath(
      moduleSpecifier, filePath, absFilePath, relMap, absMap,
    )
    if (!resolvedTarget) return

    if (!node.exportClause) {
      // export * from './module' — wildcard
      entries.push({ sourceFile: resolvedTarget, symbols: ['*'] })
    } else if (ts.isNamedExports(node.exportClause)) {
      // export { X, Y } from './module'
      // export { default as X } from './module' → propertyName is original name
      const symbols = node.exportClause.elements.map(
        (el) => el.propertyName?.text ?? el.name.text,
      )
      if (symbols.length > 0) {
        entries.push({ sourceFile: resolvedTarget, symbols })
      }
    }
  })

  return entries
}

// ── Import extraction (unchanged) ────────────────────────────────────────────

function extractImports(
  sourceFile: ts.SourceFile,
  filePath: string,
  absFilePath: string,
  relMap: Map<string, RepoFile>,
  absMap: Map<string, RepoFile>
): FileDependency[] {
  const deps: FileDependency[] = []

  ts.forEachChild(sourceFile, (node) => {
    if (!ts.isImportDeclaration(node)) return

    const moduleSpecifier = (node.moduleSpecifier as ts.StringLiteral).text

    // Skip external packages (not relative, not alias)
    const isRelative = moduleSpecifier.startsWith('.')
    const isAlias = moduleSpecifier.startsWith('@/')
    if (!isRelative && !isAlias) return

    const resolvedTarget = resolveImportPath(
      moduleSpecifier,
      filePath,
      absFilePath,
      relMap,
      absMap
    )
    if (!resolvedTarget) return

    const importedSymbols = extractImportedSymbols(node)

    deps.push({
      source: filePath,
      target: resolvedTarget,
      symbols: importedSymbols,
    })
  })

  return deps
}

function resolveImportPath(
  moduleSpecifier: string,
  importingRelPath: string,
  importingAbsPath: string,
  relMap: Map<string, RepoFile>,
  absMap: Map<string, RepoFile>
): string | null {
  const extensions = ['.ts', '.tsx', '.js', '.jsx']
  const indexSuffixes = ['/index.ts', '/index.tsx', '/index.js', '/index.jsx']

  let baseAbs: string

  if (moduleSpecifier.startsWith('@/')) {
    const srcIdx = importingAbsPath.indexOf(`${path.sep}src${path.sep}`)
    if (srcIdx === -1) return null
    const projectRoot = importingAbsPath.slice(0, srcIdx)
    baseAbs = path.join(projectRoot, 'src', moduleSpecifier.slice(2))
  } else {
    baseAbs = path.resolve(path.dirname(importingAbsPath), moduleSpecifier)
  }

  for (const ext of extensions) {
    const candidate = baseAbs + ext
    const normAbs = normalizePath(candidate)
    if (absMap.has(normAbs)) return absMap.get(normAbs)!.path
    if (existsSync(candidate)) {
      const matched = findByAbsPath(candidate, relMap)
      if (matched) return matched
    }
  }

  for (const suffix of indexSuffixes) {
    const candidate = baseAbs + suffix
    const normAbs = normalizePath(candidate)
    if (absMap.has(normAbs)) return absMap.get(normAbs)!.path
  }

  const normBase = normalizePath(baseAbs)
  if (absMap.has(normBase)) return absMap.get(normBase)!.path

  return null
}

function findByAbsPath(absCandidate: string, relMap: Map<string, RepoFile>): string | null {
  const normalizedCandidate = absCandidate.replace(/\\/g, '/')
  for (const [, file] of relMap) {
    const normalizedRel = file.path.replace(/\\/g, '/')
    if (normalizedCandidate.endsWith(normalizedRel)) return file.path
  }
  return null
}

function extractImportedSymbols(node: ts.ImportDeclaration): string[] {
  const clause = node.importClause
  if (!clause) return []

  const symbols: string[] = []

  if (clause.name) symbols.push(clause.name.text)

  if (clause.namedBindings) {
    if (ts.isNamedImports(clause.namedBindings)) {
      for (const el of clause.namedBindings.elements) {
        symbols.push(el.name.text)
      }
    } else if (ts.isNamespaceImport(clause.namedBindings)) {
      symbols.push('*')
    }
  }

  return symbols
}

function normalizePath(p: string): string {
  return p.replace(/\\/g, '/').replace(/\.(ts|tsx|js|jsx)$/, '')
}
