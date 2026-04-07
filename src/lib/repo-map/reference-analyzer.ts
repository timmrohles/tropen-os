import ts from 'typescript'
import path from 'path'
import { existsSync } from 'fs'
import { readFileSync } from 'fs'
import { parseSource } from './parser'
import type { RepoFile, FileDependency } from './types'

export interface ReferenceResult {
  files: RepoFile[]
  dependencies: FileDependency[]
}

/**
 * Analyzes imports across all files, builds the dependency graph,
 * and updates referenceCount on all symbols.
 */
export function analyzeReferences(files: RepoFile[], rootPath: string): ReferenceResult {
  // Build two lookup maps:
  // 1. normalized relative path (no ext) → RepoFile
  // 2. normalized absolute path (no ext) → RepoFile
  const relMap = new Map<string, RepoFile>()
  const absMap = new Map<string, RepoFile>()

  for (const f of files) {
    relMap.set(normalizePath(f.path), f)
    // We need the actual absolute path. Attempt both rootPath-relative
    // and direct concatenation, since rootPath may already contain part of the path.
    const absCandidate = path.resolve(rootPath, f.path)
    absMap.set(normalizePath(absCandidate), f)
  }

  const dependencies: FileDependency[] = []

  for (const file of files) {
    // Try to find the actual file on disk by resolving against rootPath
    const absPath = path.resolve(rootPath, file.path)
    let content: string
    try {
      content = readFileSync(absPath, 'utf-8')
    } catch {
      // If that fails, try treating rootPath as a parent and walking up
      // (handles the case where file.path already contains rootPath segments)
      const altPath = path.resolve(rootPath, '..', file.path)
      try {
        content = readFileSync(altPath, 'utf-8')
      } catch {
        continue
      }
    }

    const parsed = parseSource(absPath, content)
    const imports = extractImports(parsed.sourceFile, file.path, absPath, relMap, absMap)

    file.imports = imports
    dependencies.push(...imports)

    // Increment referenceCount for all imported symbols
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

  return { files, dependencies }
}

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
    // @/ → src/ relative to project root
    // We derive project root from absFilePath by looking for src/ in the path
    const srcIdx = importingAbsPath.indexOf(`${path.sep}src${path.sep}`)
    if (srcIdx === -1) return null
    const projectRoot = importingAbsPath.slice(0, srcIdx)
    baseAbs = path.join(projectRoot, 'src', moduleSpecifier.slice(2))
  } else {
    // Relative import: resolve from the importing file's directory
    baseAbs = path.resolve(path.dirname(importingAbsPath), moduleSpecifier)
  }

  // Try each extension candidate
  for (const ext of extensions) {
    const candidate = baseAbs + ext
    const normAbs = normalizePath(candidate)
    if (absMap.has(normAbs)) {
      return absMap.get(normAbs)!.path
    }
    if (existsSync(candidate)) {
      // File exists on disk but not in our map — still try to match via relMap
      // by checking if any relMap entry corresponds to this abs path
      const matched = findByAbsPath(candidate, relMap)
      if (matched) return matched
    }
  }

  // Try index file candidates
  for (const suffix of indexSuffixes) {
    const candidate = baseAbs + suffix
    const normAbs = normalizePath(candidate)
    if (absMap.has(normAbs)) {
      return absMap.get(normAbs)!.path
    }
  }

  // Try exact match without extension (already has extension)
  const normBase = normalizePath(baseAbs)
  if (absMap.has(normBase)) {
    return absMap.get(normBase)!.path
  }

  return null
}

/**
 * Attempt to find a RepoFile by checking if the abs candidate path
 * ends with any of the relative paths in relMap.
 */
function findByAbsPath(absCandidate: string, relMap: Map<string, RepoFile>): string | null {
  const normalizedCandidate = absCandidate.replace(/\\/g, '/')
  for (const [, file] of relMap) {
    const normalizedRel = file.path.replace(/\\/g, '/')
    if (normalizedCandidate.endsWith(normalizedRel)) {
      return file.path
    }
  }
  return null
}

function extractImportedSymbols(node: ts.ImportDeclaration): string[] {
  const clause = node.importClause
  if (!clause) return []

  const symbols: string[] = []

  // Default import: import Foo from '...'
  if (clause.name) symbols.push(clause.name.text)

  if (clause.namedBindings) {
    if (ts.isNamedImports(clause.namedBindings)) {
      // Named imports: import { Foo, Bar } from '...'
      for (const el of clause.namedBindings.elements) {
        symbols.push(el.name.text)
      }
    } else if (ts.isNamespaceImport(clause.namedBindings)) {
      // Namespace: import * as Foo from '...'
      symbols.push('*')
    }
  }

  return symbols
}

function normalizePath(p: string): string {
  return p.replace(/\\/g, '/').replace(/\.(ts|tsx|js|jsx)$/, '')
}
