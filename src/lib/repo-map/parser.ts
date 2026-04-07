import ts from 'typescript'
import path from 'path'

export type ParsedFile = {
  sourceFile: ts.SourceFile
  content: string
}

/**
 * Parses a TypeScript/JavaScript source file using the TS Compiler API.
 * Returns the SourceFile AST and original content.
 */
export function parseSource(filePath: string, content: string): ParsedFile {
  const ext = path.extname(filePath)
  const scriptKind = getScriptKind(ext)

  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true,
    scriptKind
  )

  return { sourceFile, content }
}

function getScriptKind(ext: string): ts.ScriptKind {
  switch (ext) {
    case '.tsx': return ts.ScriptKind.TSX
    case '.jsx': return ts.ScriptKind.JSX
    case '.js':  return ts.ScriptKind.JS
    default:     return ts.ScriptKind.TS
  }
}

/**
 * Returns the 1-based line number for a given character position in the source.
 */
export function getLineNumber(sourceFile: ts.SourceFile, pos: number): number {
  return sourceFile.getLineAndCharacterOfPosition(pos).line + 1
}

/**
 * Extracts the first line of text, trimmed — useful for compact signatures.
 */
export function getFirstLine(text: string): string {
  return text.split('\n')[0].trim()
}
