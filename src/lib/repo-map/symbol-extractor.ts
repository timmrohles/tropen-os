import ts from 'typescript'
import { getLineNumber, getFirstLine, type ParsedFile } from './parser'
import type { RepoSymbol } from './types'

export function extractSymbols(
  parsed: ParsedFile,
  filePath: string,
  content: string // reserved for future use (e.g. raw text fallback)
): RepoSymbol[] {
  void content
  const symbols: RepoSymbol[] = []
  const { sourceFile } = parsed

  function makeId(name: string): string {
    return `${filePath}::${name}`
  }

  function visit(node: ts.Node, parentId?: string): void {
    // Function declarations: function foo() {}
    if (ts.isFunctionDeclaration(node) && node.name) {
      const isExported = hasExportModifier(node)
      const name = node.name.text
      const sig = buildFunctionSignature(node, sourceFile)
      symbols.push(makeSymbol('function', name, filePath, sourceFile, node, sig, isExported, makeId(name)))
    }

    // Arrow functions / regular functions assigned to variable: const foo = () => {}
    else if (ts.isVariableStatement(node) && node.declarationList.declarations.length > 0) {
      const isExported = hasExportModifier(node)
      for (const decl of node.declarationList.declarations) {
        if (!ts.isIdentifier(decl.name)) continue
        const name = decl.name.text
        const isArrow = decl.initializer && (
          ts.isArrowFunction(decl.initializer) ||
          ts.isFunctionExpression(decl.initializer)
        )
        if (isArrow) {
          const sig = buildArrowSignature(name, decl.initializer as ts.ArrowFunction | ts.FunctionExpression, sourceFile)
          symbols.push(makeSymbol('function', name, filePath, sourceFile, node, sig, isExported, makeId(name)))
        } else {
          const isUpperOrAnnotated = name[0] === name[0].toUpperCase() || decl.type !== undefined
          const kind = isUpperOrAnnotated ? 'const' : 'variable'
          const sig = `${name}${decl.type ? ': ' + decl.type.getText(sourceFile) : ''}`
          symbols.push(makeSymbol(kind, name, filePath, sourceFile, node, sig, isExported, makeId(name)))
        }
      }
    }

    // Class declarations
    else if (ts.isClassDeclaration(node) && node.name) {
      const isExported = hasExportModifier(node)
      const name = node.name.text
      const id = makeId(name)
      const heritageParts: string[] = []
      if (node.heritageClauses) {
        for (const h of node.heritageClauses) {
          heritageParts.push(h.getText(sourceFile).trim())
        }
      }
      const sig = `class ${name}${heritageParts.length ? ' ' + heritageParts.join(' ') : ''}`
      symbols.push(makeSymbol('class', name, filePath, sourceFile, node, sig, isExported, id))

      for (const member of node.members) {
        if (ts.isMethodDeclaration(member) && ts.isIdentifier(member.name)) {
          const mName = member.name.text
          const mSig = buildMethodSignature(mName, member, sourceFile)
          const mIsPublic = !hasModifier(member, ts.SyntaxKind.PrivateKeyword) &&
                            !hasModifier(member, ts.SyntaxKind.ProtectedKeyword)
          symbols.push(makeSymbol('method', mName, filePath, sourceFile, member, mSig, mIsPublic, makeId(`${name}.${mName}`), id))
        } else if (ts.isPropertyDeclaration(member) && ts.isIdentifier(member.name)) {
          const pName = member.name.text
          const pSig = `${pName}${member.type ? ': ' + member.type.getText(sourceFile) : ''}`
          symbols.push(makeSymbol('property', pName, filePath, sourceFile, member, pSig, false, makeId(`${name}.${pName}`), id))
        }
      }
    }

    // Interface declarations
    else if (ts.isInterfaceDeclaration(node)) {
      const isExported = hasExportModifier(node)
      const name = node.name.text
      const sig = `interface ${name}${buildExtendsClause(node, sourceFile)}`
      symbols.push(makeSymbol('interface', name, filePath, sourceFile, node, sig, isExported, makeId(name)))
    }

    // Type alias declarations
    else if (ts.isTypeAliasDeclaration(node)) {
      const isExported = hasExportModifier(node)
      const name = node.name.text
      const firstLine = getFirstLine(node.getText(sourceFile))
      symbols.push(makeSymbol('type', name, filePath, sourceFile, node, firstLine, isExported, makeId(name)))
    }

    // Enum declarations
    else if (ts.isEnumDeclaration(node)) {
      const isExported = hasExportModifier(node)
      const name = node.name.text
      const memberNames = node.members
        .map((m) => (ts.isIdentifier(m.name) ? m.name.text : ''))
        .filter(Boolean)
        .join(' | ')
      const sig = `enum ${name} { ${memberNames} }`
      symbols.push(makeSymbol('enum', name, filePath, sourceFile, node, sig, isExported, makeId(name)))
    }

    // Recurse into non-class children (classes handle their own members above)
    else if (!ts.isClassDeclaration(node)) {
      ts.forEachChild(node, (child) => visit(child, parentId))
    }
  }

  ts.forEachChild(sourceFile, (node) => visit(node, undefined))

  return symbols
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeSymbol(
  kind: RepoSymbol['kind'],
  name: string,
  filePath: string,
  sourceFile: ts.SourceFile,
  node: ts.Node,
  signature: string,
  exported: boolean,
  id: string,
  parentId?: string
): RepoSymbol {
  return {
    id,
    name,
    kind,
    filePath,
    line: getLineNumber(sourceFile, node.getStart(sourceFile)),
    lineEnd: getLineNumber(sourceFile, node.getEnd()),
    signature: signature.slice(0, 200),
    exported,
    parentId,
    referenceCount: 0,
    rankScore: 0,
  }
}

function hasExportModifier(node: ts.Node): boolean {
  return (
    hasModifier(node, ts.SyntaxKind.ExportKeyword) ||
    hasModifier(node, ts.SyntaxKind.DefaultKeyword)
  )
}

function hasModifier(node: ts.Node, kind: ts.SyntaxKind): boolean {
  return ts.canHaveModifiers(node)
    ? (ts.getModifiers(node) ?? []).some((m) => m.kind === kind)
    : false
}

function buildFunctionSignature(node: ts.FunctionDeclaration, sourceFile: ts.SourceFile): string {
  const name = node.name?.text ?? 'anonymous'
  const params = node.parameters.map((p) => p.getText(sourceFile)).join(', ')
  const returnType = node.type ? ': ' + node.type.getText(sourceFile) : ''
  return `function ${name}(${params})${returnType}`
}

function buildArrowSignature(
  name: string,
  node: ts.ArrowFunction | ts.FunctionExpression,
  sourceFile: ts.SourceFile
): string {
  const params = node.parameters.map((p) => p.getText(sourceFile)).join(', ')
  const returnType = node.type ? ': ' + node.type.getText(sourceFile) : ''
  return `${name}(${params})${returnType}`
}

function buildMethodSignature(
  name: string,
  node: ts.MethodDeclaration,
  sourceFile: ts.SourceFile
): string {
  const params = node.parameters.map((p) => p.getText(sourceFile)).join(', ')
  const returnType = node.type ? ': ' + node.type.getText(sourceFile) : ''
  return `${name}(${params})${returnType}`
}

function buildExtendsClause(node: ts.InterfaceDeclaration, sourceFile: ts.SourceFile): string {
  if (!node.heritageClauses || node.heritageClauses.length === 0) return ''
  return ' ' + node.heritageClauses.map((h) => h.getText(sourceFile).trim()).join(' ')
}
