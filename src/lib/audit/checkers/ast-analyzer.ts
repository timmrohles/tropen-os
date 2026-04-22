// src/lib/audit/checkers/ast-analyzer.ts
// Central AST analysis engine. Parses each file once, caches results.
// All B-checks read from the same ASTAnalysis object.

import ts from 'typescript'
import { createHash } from 'crypto'

// ── Types ────────────────────────────────────────────────────────────────────

export interface FunctionAnalysis {
  name: string
  startLine: number
  endLine: number
  lineCount: number
  cognitiveComplexity: number
  maxNestingDepth: number
  paramCount: number
}

export interface CatchBlockAnalysis {
  line: number
  isEmpty: boolean
  hasOnlyConsoleLog: boolean
  hasRethrow: boolean
}

export interface ASTAnalysis {
  filePath: string
  lineCount: number
  exports: Array<{ name: string; kind: string; line: number }>
  imports: Array<{ source: string; specifiers: string[]; line: number }>
  functions: FunctionAnalysis[]
  hookCalls: Array<{ name: string; line: number }>
  stateHookCount: number
  catchBlocks: CatchBlockAnalysis[]
  anyUsages: Array<{ line: number; context: string }>
  stringLiterals: Array<{ value: string; line: number }>
  hasAwaitOutsideTry: boolean
  hasTryCatch: boolean
}

// ── Cache ────────────────────────────────────────────────────────────────────

const cache = new Map<string, ASTAnalysis>()
const MAX_CACHE = 800

function contentHash(content: string): string {
  return createHash('sha256').update(content).digest('hex')
}

export function clearASTCache(): void { cache.clear() }

// ── Public API ───────────────────────────────────────────────────────────────

export function analyzeFile(filePath: string, content: string): ASTAnalysis {
  const hash = contentHash(content)
  const cached = cache.get(hash)
  if (cached && cached.filePath === filePath) return cached

  const result = parseFile(filePath, content)

  if (cache.size >= MAX_CACHE) {
    const first = cache.keys().next().value
    if (first) cache.delete(first)
  }
  cache.set(hash, result)
  return result
}

// ── Parser ───────────────────────────────────────────────────────────────────

function parseFile(filePath: string, content: string): ASTAnalysis {
  const sf = ts.createSourceFile(
    filePath, content, ts.ScriptTarget.Latest, true,
    filePath.endsWith('.tsx') || filePath.endsWith('.jsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  )

  const result: ASTAnalysis = {
    filePath,
    lineCount: content.split('\n').length,
    exports: [],
    imports: [],
    functions: [],
    hookCalls: [],
    stateHookCount: 0,
    catchBlocks: [],
    anyUsages: [],
    stringLiterals: [],
    hasAwaitOutsideTry: false,
    hasTryCatch: false,
  }

  let insideTry = false

  function visit(node: ts.Node, depth: number): void {
    const line = sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1

    // Imports
    if (ts.isImportDeclaration(node)) {
      const src = (node.moduleSpecifier as ts.StringLiteral).text
      const specs: string[] = []
      const clause = node.importClause
      if (clause?.name) specs.push(clause.name.text)
      if (clause?.namedBindings && ts.isNamedImports(clause.namedBindings)) {
        for (const el of clause.namedBindings.elements) specs.push(el.name.text)
      }
      result.imports.push({ source: src, specifiers: specs, line })
    }

    // Exports
    if (ts.isFunctionDeclaration(node) && node.name && hasExportMod(node)) {
      result.exports.push({ name: node.name.text, kind: 'function', line })
    }
    if (ts.isVariableStatement(node) && hasExportMod(node)) {
      for (const decl of node.declarationList.declarations) {
        if (ts.isIdentifier(decl.name)) {
          result.exports.push({ name: decl.name.text, kind: 'variable', line })
        }
      }
    }

    // Functions — cognitive complexity
    if (isFunctionLike(node) && getFunctionName(node)) {
      const name = getFunctionName(node)!
      const startLine = sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1
      const endLine = sf.getLineAndCharacterOfPosition(node.getEnd()).line + 1
      const cc = computeCC(node, sf, 0)
      const maxDepth = computeMaxNesting(node, 0)
      const paramCount = (node as ts.FunctionLikeDeclaration).parameters?.length ?? 0
      result.functions.push({
        name, startLine, endLine,
        lineCount: endLine - startLine + 1,
        cognitiveComplexity: cc, maxNestingDepth: maxDepth, paramCount,
      })
    }

    // Hook calls (useState, useEffect, etc.)
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
      const name = node.expression.text
      if (/^use[A-Z]/.test(name)) {
        result.hookCalls.push({ name, line })
        if (name === 'useState' || name === 'useReducer') result.stateHookCount++
      }
    }

    // Catch blocks
    if (ts.isCatchClause(node)) {
      const body = node.block
      const stmts = body.statements
      // A catch with only an ignore comment (e.g. `catch { /* ignore */ }`) is intentional
      const bodyText = content.slice(body.pos, body.end)
      // Any comment in the catch body means the developer considered the empty catch intentional
      const hasIgnoreComment = /\/\*[\s\S]*?\*\/|\/\/[^\n]*/.test(bodyText)
      const isEmpty = stmts.length === 0 && !hasIgnoreComment
      const hasOnlyConsoleLog = stmts.length === 1 && isConsoleCall(stmts[0])
      const hasRethrow = stmts.some((s) => ts.isThrowStatement(s))
      result.catchBlocks.push({ line, isEmpty, hasOnlyConsoleLog, hasRethrow })
    }

    // Try-catch tracking
    if (ts.isTryStatement(node)) {
      result.hasTryCatch = true
      insideTry = true
      ts.forEachChild(node.tryBlock, (c) => visit(c, depth + 1))
      insideTry = false
      if (node.catchClause) visit(node.catchClause, depth + 1)
      if (node.finallyBlock) ts.forEachChild(node.finallyBlock, (c) => visit(c, depth + 1))
      return
    }

    // Await outside try
    if (ts.isAwaitExpression(node) && !insideTry) {
      result.hasAwaitOutsideTry = true
    }

    // any usage
    if (node.kind === ts.SyntaxKind.AnyKeyword) {
      const parent = node.parent
      const ctx = parent ? parent.getText(sf).slice(0, 60) : ''
      result.anyUsages.push({ line, context: ctx })
    }

    // String literals (for secret detection)
    if (ts.isStringLiteral(node) && node.text.length >= 10) {
      result.stringLiterals.push({ value: node.text, line })
    }

    ts.forEachChild(node, (c) => visit(c, depth + 1))
  }

  ts.forEachChild(sf, (c) => visit(c, 0))
  return result
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function hasExportMod(node: ts.Node): boolean {
  return ts.canHaveModifiers(node) &&
    (ts.getModifiers(node) ?? []).some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
}

function isFunctionLike(node: ts.Node): boolean {
  return ts.isFunctionDeclaration(node) || ts.isArrowFunction(node) ||
    ts.isFunctionExpression(node) || ts.isMethodDeclaration(node)
}

function getFunctionName(node: ts.Node): string | null {
  if (ts.isFunctionDeclaration(node) && node.name) return node.name.text
  if (ts.isMethodDeclaration(node) && ts.isIdentifier(node.name)) return node.name.text
  if ((ts.isArrowFunction(node) || ts.isFunctionExpression(node)) && node.parent) {
    if (ts.isVariableDeclaration(node.parent) && ts.isIdentifier(node.parent.name)) {
      return node.parent.name.text
    }
    if (ts.isPropertyAssignment(node.parent) && ts.isIdentifier(node.parent.name)) {
      return node.parent.name.text
    }
  }
  return null
}

function isConsoleCall(stmt: ts.Statement): boolean {
  if (!ts.isExpressionStatement(stmt)) return false
  const expr = stmt.expression
  if (!ts.isCallExpression(expr)) return false
  const callee = expr.expression
  if (!ts.isPropertyAccessExpression(callee)) return false
  return ts.isIdentifier(callee.expression) && callee.expression.text === 'console'
}

// ── Cognitive Complexity (SonarQube algorithm) ───────────────────────────────

function computeCC(node: ts.Node, sf: ts.SourceFile, nesting: number): number {
  let cc = 0
  ts.forEachChild(node, function walk(child) {
    // +1 for control flow
    if (ts.isIfStatement(child) || ts.isForStatement(child) || ts.isForInStatement(child) ||
        ts.isForOfStatement(child) || ts.isWhileStatement(child) || ts.isDoStatement(child) ||
        ts.isCatchClause(child) || ts.isConditionalExpression(child)) {
      cc += 1 + nesting
    }
    // +1 for switch cases
    if (ts.isCaseClause(child)) cc += 1
    // +1 for logical operators
    if (ts.isBinaryExpression(child) && (
      child.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken ||
      child.operatorToken.kind === ts.SyntaxKind.BarBarToken ||
      child.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken
    )) {
      cc += 1
    }
    // Increase nesting for blocks
    const isNesting = ts.isIfStatement(child) || ts.isForStatement(child) ||
      ts.isForInStatement(child) || ts.isForOfStatement(child) ||
      ts.isWhileStatement(child) || ts.isDoStatement(child) || ts.isCatchClause(child)
    if (isNesting) {
      ts.forEachChild(child, (gc) => { cc += computeCC(gc, sf, nesting + 1) })
    } else {
      ts.forEachChild(child, walk)
    }
  })
  return cc
}

function computeMaxNesting(node: ts.Node, depth: number): number {
  let max = depth
  ts.forEachChild(node, (child) => {
    const isBlock = ts.isIfStatement(child) || ts.isForStatement(child) ||
      ts.isWhileStatement(child) || ts.isDoStatement(child) || ts.isCatchClause(child)
    const childMax = computeMaxNesting(child, isBlock ? depth + 1 : depth)
    if (childMax > max) max = childMax
  })
  return max
}
