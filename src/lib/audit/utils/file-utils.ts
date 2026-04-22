// src/lib/audit/utils/file-utils.ts
// Shared utility for checking non-TypeScript file existence in audit checkers.
// Canonical source: see docs/checker-design-patterns.md → P1, P9

import * as fs from 'fs'
import { join } from 'path'

/**
 * Returns true if the given file exists on disk.
 *
 * Use this when ctx.filePaths won't help — the repo map only indexes .ts/.tsx files.
 * Non-TS files (.env.example, CHANGELOG.md, manifest.json, etc.) are invisible
 * to path-based checks and must be verified via disk access.
 *
 * When NOT to use: for TypeScript/TSX source files, prefer ctx.filePaths.some()
 * which works in both disk-mode and in-memory benchmark mode (ctx.rootPath is undefined).
 *
 * @param rootPath - Absolute path to the project root (ctx.rootPath). Returns false when undefined.
 * @param relPath  - Path relative to rootPath (e.g. '.env.example', 'docs/backup.md')
 */
export function fileExists(rootPath: string | undefined, relPath: string): boolean {
  if (!rootPath) return false
  return fs.existsSync(join(rootPath, relPath))
}

/**
 * Returns true if any of the given relative paths exist on disk.
 *
 * Convenience wrapper for checking multiple candidate locations for the same asset.
 * Shares the same constraint as fileExists — only reliable for non-TS files.
 *
 * @param rootPath - Absolute path to the project root. Returns false when undefined.
 * @param relPaths - Array of relative paths to check (e.g. ['docs/runbooks', 'RUNBOOK.md'])
 */
export function fileExistsInAnyOf(rootPath: string | undefined, relPaths: string[]): boolean {
  if (!rootPath) return false
  return relPaths.some((p) => fs.existsSync(join(rootPath, p)))
}
