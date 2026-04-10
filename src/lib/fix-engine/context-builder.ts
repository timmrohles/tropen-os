// src/lib/fix-engine/context-builder.ts
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { createLogger } from '@/lib/logger'
import type { FixContext } from './types'

const log = createLogger('fix-engine:context')

interface FindingRow {
  id: string
  rule_id: string
  category_id: number
  severity: string
  message: string
  file_path: string | null
  line: number | null
  suggestion: string | null
  agent_source: string | null
  enforcement: string | null
  affected_files?: string[] | null
  fix_hint?: string | null
}

function safeRead(absPath: string, maxLines?: number): string | null {
  if (!existsSync(absPath)) return null
  try {
    const content = readFileSync(absPath, 'utf-8')
    if (maxLines === undefined) return content
    return content.split('\n').slice(0, maxLines).join('\n')
  } catch {
    return null
  }
}

function buildProjectContext(rootPath: string): string | null {
  const parts: string[] = []

  // package.json — authoritative dependency list (prevents hallucinated imports)
  const pkg = safeRead(path.join(rootPath, 'package.json'))
  if (pkg) {
    try {
      const parsed = JSON.parse(pkg)
      parts.push('### package.json (name, scripts, dependencies)')
      parts.push('```json')
      parts.push(JSON.stringify({
        name: parsed.name,
        scripts: parsed.scripts,
        dependencies: parsed.dependencies,
        devDependencies: parsed.devDependencies,
      }, null, 2))
      parts.push('```')
    } catch { /* ignore */ }
  }

  // tsconfig.json — path aliases, strict mode, etc.
  const tsconfig = safeRead(path.join(rootPath, 'tsconfig.json'))
  if (tsconfig) {
    try {
      const parsed = JSON.parse(tsconfig)
      parts.push('### tsconfig.json (compilerOptions)')
      parts.push('```json')
      parts.push(JSON.stringify({ compilerOptions: parsed.compilerOptions }, null, 2))
      parts.push('```')
    } catch { /* ignore */ }
  }

  // CLAUDE.md — project conventions, code rules, design patterns
  const claudeMd = safeRead(path.join(rootPath, 'CLAUDE.md'), 80)
  if (claudeMd) {
    parts.push('### CLAUDE.md (project conventions, first 80 lines)')
    parts.push('```markdown')
    parts.push(claudeMd)
    parts.push('```')
  }

  // next.config — framework config, headers, rewrites
  const nextConfig = safeRead(path.join(rootPath, 'next.config.ts'))
    ?? safeRead(path.join(rootPath, 'next.config.js'))
    ?? safeRead(path.join(rootPath, 'next.config.mjs'))
  if (nextConfig) {
    parts.push('### next.config (first 60 lines)')
    parts.push('```typescript')
    parts.push(nextConfig.split('\n').slice(0, 60).join('\n'))
    parts.push('```')
  }

  return parts.length > 0 ? parts.join('\n') : null
}

export function buildFixContext(finding: FindingRow, rootPath: string): FixContext {
  // Lies die Datei, wenn file_path vorhanden
  let fileContent: string | null = null
  let surroundingLines: string | null = null
  let fileExists = false

  if (finding.file_path) {
    const absPath = path.join(rootPath, finding.file_path)
    fileExists = existsSync(absPath)
    if (fileExists) {
      try {
        fileContent = readFileSync(absPath, 'utf-8')

        // Surrounding context: ±30 Zeilen um die Fundstelle
        if (finding.line && fileContent) {
          const allLines = fileContent.split('\n')
          const targetLine = finding.line - 1 // 0-based
          const start = Math.max(0, targetLine - 30)
          const end = Math.min(allLines.length - 1, targetLine + 30)

          surroundingLines = allLines
            .slice(start, end + 1)
            .map((l, i) => {
              const lineNum = start + i + 1
              const marker = lineNum === finding.line ? '>>>' : '   '
              return `${marker} ${String(lineNum).padStart(4, ' ')} | ${l}`
            })
            .join('\n')
        }
      } catch (err) {
        log.warn('Could not read file for fix context', { path: absPath, error: String(err) })
      }
    }
  }

  // Always load project context — prevents hallucinated imports and ensures
  // the LLM uses actual project dependencies and code conventions
  const projectContext = buildProjectContext(rootPath)
  log.info('Building fix context', {
    ruleId: finding.rule_id,
    filePath: finding.file_path,
    fileExists,
    hasProjectContext: !!projectContext,
    affectedFilesCount: finding.affected_files?.length ?? 0,
  })

  // Load content of affected files for multi-file findings
  let affectedFilesContent: string | null = null
  if (finding.affected_files && finding.affected_files.length > 0 && finding.affected_files.length <= 8) {
    const contentParts: string[] = []
    for (const fp of finding.affected_files) {
      // Skip the primary file — already loaded above
      if (fp === finding.file_path) continue
      const content = safeRead(path.join(rootPath, fp), 80)
      if (content) {
        contentParts.push(`### ${fp} (first 80 lines)`)
        contentParts.push('```typescript')
        contentParts.push(content)
        contentParts.push('```')
      }
    }
    if (contentParts.length > 0) affectedFilesContent = contentParts.join('\n')
  }

  return {
    finding: {
      id: finding.id,
      ruleId: finding.rule_id,
      categoryId: finding.category_id,
      severity: finding.severity,
      message: finding.message,
      filePath: finding.file_path,
      line: finding.line,
      suggestion: finding.suggestion,
      agentSource: finding.agent_source,
      enforcement: finding.enforcement,
      affectedFiles: finding.affected_files ?? undefined,
      fixHint: finding.fix_hint ?? undefined,
    },
    fileContent,
    surroundingLines,
    projectContext,
    affectedFilesContent,
    rootPath,
  }
}
