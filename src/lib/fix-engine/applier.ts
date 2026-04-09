// src/lib/fix-engine/applier.ts
// Applies generated diffs to the local filesystem.
// IMPORTANT: Always show a preview to the user before calling applyDiffs.
//
// Safety protocol:
//  1. Write backup (.pre-fix-<timestamp>) before patching
//  2. Apply diff via CONTENT-BASED matching (not line numbers)
//  3. Run `tsc --noEmit <file>` to validate TypeScript
//  4. If match not found or tsc fails: restore backup, report error
//  5. If ok: delete backup, report success
//
// Content-based matching rationale:
//  LLM-generated diffs frequently have off-by-N line numbers because the
//  model miscounts lines. Trusting @@ line numbers blindly inserts code at
//  the wrong position and corrupts files. Instead we search for the exact
//  text of context+minus lines and replace it with context+plus lines.

import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'node:fs'
import { execSync } from 'node:child_process'
import path from 'node:path'
import { createLogger } from '@/lib/logger'
import type { FileDiff, DiffHunk } from './types'

const log = createLogger('fix-engine:applier')

export interface ApplyResult {
  filePath: string
  success: boolean
  error?: string
  backupPath?: string  // set on failure when backup exists
  tsErrors?: string    // set when TypeScript validation failed
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Apply a list of file diffs to disk with backup + TypeScript validation.
 * Each diff is applied independently — partial success is possible.
 */
export async function applyDiffs(diffs: FileDiff[], rootPath: string): Promise<ApplyResult[]> {
  const results: ApplyResult[] = []

  for (const diff of diffs) {
    const absPath = path.join(rootPath, diff.filePath)
    const timestamp = Date.now()
    const backupPath = `${absPath}.pre-fix-${timestamp}`

    try {
      if (!existsSync(absPath)) {
        results.push({ filePath: diff.filePath, success: false, error: 'File not found' })
        continue
      }

      // 1. Read original + write backup
      const original = readFileSync(absPath, 'utf-8')
      writeFileSync(backupPath, original, 'utf-8')
      log.info('Backup created', { backupPath })

      // 2. Apply diff via content-based matching
      const applyResult = applyFileDiff(original, diff)
      if (!applyResult.success) {
        try { unlinkSync(backupPath) } catch { /* ignore */ }
        log.error('Content-based match failed — not applied', {
          filePath: diff.filePath,
          errors: applyResult.errors,
        })
        results.push({
          filePath: diff.filePath,
          success: false,
          error: applyResult.errors.join(' | '),
        })
        continue
      }

      writeFileSync(absPath, applyResult.newContent, 'utf-8')
      log.info('Diff applied (content-based)', { filePath: diff.filePath, hunks: diff.hunks.length })

      // 3. TypeScript validation (only for .ts / .tsx files)
      if (/\.(ts|tsx)$/.test(absPath)) {
        const tsResult = validateTypeScript(absPath, rootPath)
        if (!tsResult.ok) {
          // 4. Restore backup
          writeFileSync(absPath, original, 'utf-8')
          try { unlinkSync(backupPath) } catch { /* ignore */ }
          log.error('TypeScript validation failed — backup restored', {
            filePath: diff.filePath,
            tsErrors: tsResult.output.slice(0, 500),
          })
          results.push({
            filePath: diff.filePath,
            success: false,
            error: 'TypeScript validation failed — Fix konnte nicht sauber angewendet werden',
            tsErrors: tsResult.output,
          })
          continue
        }
      }

      // 5. Success — delete backup
      try { unlinkSync(backupPath) } catch { /* ignore */ }
      log.info('Fix applied and validated', { filePath: diff.filePath })
      results.push({ filePath: diff.filePath, success: true })

    } catch (err) {
      // Restore backup if it exists
      if (existsSync(backupPath)) {
        try {
          const backup = readFileSync(backupPath, 'utf-8')
          writeFileSync(absPath, backup, 'utf-8')
          unlinkSync(backupPath)
          log.info('Backup restored after unexpected error', { filePath: diff.filePath })
        } catch { /* ignore restore errors */ }
      }
      log.error('Failed to apply diff', { filePath: diff.filePath, error: String(err) })
      results.push({ filePath: diff.filePath, success: false, error: String(err) })
    }
  }

  return results
}

// ---------------------------------------------------------------------------
// Content-based diff application
// ---------------------------------------------------------------------------

interface HunkResult {
  success: boolean
  newContent: string
  error?: string
}

interface DiffResult {
  success: boolean
  newContent: string
  errors: string[]
}

/**
 * Apply all hunks in a FileDiff using content-based matching.
 * Hunks are applied bottom-to-top so upper line positions stay valid.
 * If ANY hunk fails, the entire file is left unchanged.
 */
function applyFileDiff(fileContent: string, diff: FileDiff): DiffResult {
  // Sort hunks bottom-to-top by oldStart line number
  const reversedHunks = [...diff.hunks].sort((a, b) => b.oldStart - a.oldStart)

  let content = fileContent
  const errors: string[] = []

  for (let i = 0; i < reversedHunks.length; i++) {
    const hunk = reversedHunks[i]
    const hunkLabel = `Hunk ${diff.hunks.length - i}/${diff.hunks.length}`
    const result = applyHunkContentBased(content, hunk, hunkLabel)

    if (!result.success) {
      errors.push(result.error!)
      // Abort — return unmodified original so no partial state is written
      return { success: false, newContent: fileContent, errors }
    }

    content = result.newContent
  }

  return { success: true, newContent: content, errors: [] }
}

/**
 * Apply a single hunk using content-based search.
 *
 * Strategy:
 *  1. Build search block  = context lines + minus lines (what must be in the file)
 *  2. Build replace block = context lines + plus  lines (what to put back)
 *  3. Exact string search in file content
 *  4. If not found: fuzzy search (normalize trailing whitespace + CRLF)
 *  5. If still not found: reject
 *  6. If multiple matches: use @@ line number as tiebreaker; reject if ambiguous
 */
function applyHunkContentBased(
  fileContent: string,
  hunk: DiffHunk,
  hunkLabel: string,
): HunkResult {
  // Build the search block (text that must exist in the file)
  const searchLines = hunk.lines
    .filter((l) => l.startsWith(' ') || l.startsWith('-'))
    .map((l) => l.slice(1))  // strip prefix char

  // Build the replace block (text to write back)
  const replaceLines = hunk.lines
    .filter((l) => l.startsWith(' ') || l.startsWith('+'))
    .map((l) => l.slice(1))

  // If there's nothing to search for (e.g. pure-addition hunk at EOF),
  // fall back to line-number insertion at oldStart.
  if (searchLines.length === 0) {
    const fileLines = fileContent.split('\n')
    const insertAt = Math.max(0, Math.min(hunk.oldStart - 1, fileLines.length))
    const addedLines = hunk.lines
      .filter((l) => l.startsWith('+'))
      .map((l) => l.slice(1))
    fileLines.splice(insertAt, 0, ...addedLines)
    return { success: true, newContent: fileLines.join('\n') }
  }

  const searchBlock = searchLines.join('\n')
  const replaceBlock = replaceLines.join('\n')

  // --- Exact match ---
  const exactIndex = fileContent.indexOf(searchBlock)
  if (exactIndex !== -1) {
    const secondExact = fileContent.indexOf(searchBlock, exactIndex + 1)
    if (secondExact !== -1) {
      return resolveAmbiguous(fileContent, searchBlock, replaceBlock, hunk.oldStart, hunkLabel)
    }
    return {
      success: true,
      newContent:
        fileContent.slice(0, exactIndex) +
        replaceBlock +
        fileContent.slice(exactIndex + searchBlock.length),
    }
  }

  // --- Fuzzy match (normalize trailing whitespace + CRLF) ---
  const normalizedSearch = normalizeWhitespace(searchBlock)
  const normalizedFile   = normalizeWhitespace(fileContent)

  const fuzzyIndex = normalizedFile.indexOf(normalizedSearch)
  if (fuzzyIndex === -1) {
    return {
      success: false,
      newContent: fileContent,
      error: `${hunkLabel}: Kontext nicht in Datei gefunden. Erwarteter Block:\n${searchBlock.slice(0, 300)}`,
    }
  }

  // Map fuzzy index back to the original file
  const originalIndex = mapNormalizedIndexToOriginal(fileContent, normalizedFile, fuzzyIndex)
  if (originalIndex === -1) {
    return {
      success: false,
      newContent: fileContent,
      error: `${hunkLabel}: Fuzzy-Match gefunden aber Position im Original nicht rekonstruierbar.`,
    }
  }

  // Check for a second fuzzy match
  const secondFuzzy = normalizedFile.indexOf(normalizedSearch, fuzzyIndex + 1)
  if (secondFuzzy !== -1) {
    // Use original file for ambiguity resolution (non-normalized paths)
    return resolveAmbiguous(fileContent, searchBlock, replaceBlock, hunk.oldStart, hunkLabel)
  }

  // Find the original search block extent: from originalIndex, scan forward
  // until we've consumed all searchLines in the original content.
  const originalEnd = findOriginalBlockEnd(fileContent, originalIndex, searchLines)
  if (originalEnd === -1) {
    return {
      success: false,
      newContent: fileContent,
      error: `${hunkLabel}: Fuzzy-Match gefunden aber Original-Blockende nicht bestimmbar.`,
    }
  }

  log.warn('Applied hunk via fuzzy match (whitespace normalization)', {
    hunkLabel,
    oldStart: hunk.oldStart,
  })

  return {
    success: true,
    newContent:
      fileContent.slice(0, originalIndex) +
      replaceBlock +
      fileContent.slice(originalEnd),
  }
}

/**
 * Multiple matches found — use @@ line number as tiebreaker.
 * If the closest match is within TIEBREAKER_TOLERANCE lines: use it.
 * Otherwise reject.
 */
const TIEBREAKER_TOLERANCE = 20  // lines

function resolveAmbiguous(
  fileContent: string,
  searchBlock: string,
  replaceBlock: string,
  hintLine: number,
  hunkLabel: string,
): HunkResult {
  // Collect all match positions
  const matches: number[] = []
  let pos = 0
  while (true) {
    const idx = fileContent.indexOf(searchBlock, pos)
    if (idx === -1) break
    matches.push(idx)
    pos = idx + 1
  }

  if (matches.length === 0) {
    return {
      success: false,
      newContent: fileContent,
      error: `${hunkLabel}: Kein Match gefunden (unerwartet bei ambiguous-Pfad).`,
    }
  }

  // Find which match is closest to the hint line
  const lineOf = (charIndex: number) =>
    fileContent.slice(0, charIndex).split('\n').length

  let bestMatch = matches[0]
  let bestDist = Math.abs(lineOf(matches[0]) - hintLine)

  for (const m of matches.slice(1)) {
    const dist = Math.abs(lineOf(m) - hintLine)
    if (dist < bestDist) {
      bestDist = dist
      bestMatch = m
    }
  }

  if (bestDist > TIEBREAKER_TOLERANCE) {
    return {
      success: false,
      newContent: fileContent,
      error:
        `${hunkLabel}: ${matches.length} ambige Matches, nächster ist ${bestDist} Zeilen von ` +
        `Zeilennummer ${hintLine} entfernt (Toleranz: ${TIEBREAKER_TOLERANCE}). Ablehnen.`,
    }
  }

  log.warn('Applied hunk via tiebreaker (ambiguous match)', {
    hunkLabel,
    hintLine,
    bestDist,
    totalMatches: matches.length,
  })

  return {
    success: true,
    newContent:
      fileContent.slice(0, bestMatch) +
      replaceBlock +
      fileContent.slice(bestMatch + searchBlock.length),
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Normalize trailing whitespace and CRLF for fuzzy matching. */
function normalizeWhitespace(str: string): string {
  return str
    .replace(/\r\n/g, '\n')          // Windows line endings
    .split('\n')
    .map((line) => line.trimEnd())    // trailing whitespace only (leading = indentation)
    .join('\n')
}

/**
 * Given a character index in the normalized string, find the corresponding
 * character index in the original string by counting newlines up to that point.
 * Returns -1 if reconstruction fails.
 */
function mapNormalizedIndexToOriginal(
  original: string,
  normalized: string,
  normalizedIndex: number,
): number {
  // Count how many newlines appear before normalizedIndex in the normalized string
  const linesBefore = normalized.slice(0, normalizedIndex).split('\n').length - 1
  // Find the start of that line in the original
  const originalLines = original.split('\n')
  if (linesBefore >= originalLines.length) return -1

  let charPos = 0
  for (let i = 0; i < linesBefore; i++) {
    charPos += originalLines[i].length + 1  // +1 for '\n'
  }
  return charPos
}

/**
 * Starting from `startIndex` in `fileContent`, advance past all `searchLines`
 * (matching loosely: trimEnd on both sides). Returns the character index
 * immediately after the last matched line, or -1 on failure.
 */
function findOriginalBlockEnd(
  fileContent: string,
  startIndex: number,
  searchLines: string[],
): number {
  let pos = startIndex
  for (const expectedLine of searchLines) {
    const nextNewline = fileContent.indexOf('\n', pos)
    const actualLine = nextNewline === -1
      ? fileContent.slice(pos)
      : fileContent.slice(pos, nextNewline)

    if (actualLine.trimEnd() !== expectedLine.trimEnd()) {
      return -1  // mismatch
    }
    pos = nextNewline === -1 ? fileContent.length : nextNewline + 1
  }
  return pos
}

/** Run tsc --noEmit on a single file. Returns ok=true if no errors. */
function validateTypeScript(absFilePath: string, rootPath: string): { ok: boolean; output: string } {
  try {
    execSync(
      `pnpm exec tsc --noEmit --skipLibCheck --allowJs false "${absFilePath}"`,
      { cwd: rootPath, timeout: 30_000, stdio: 'pipe' }
    )
    return { ok: true, output: '' }
  } catch (err: unknown) {
    const output = err instanceof Error && 'stdout' in err
      ? String((err as NodeJS.ErrnoException & { stdout?: Buffer }).stdout ?? '')
      : String(err)
    return { ok: false, output }
  }
}
