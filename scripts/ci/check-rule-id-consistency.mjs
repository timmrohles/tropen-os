#!/usr/bin/env node
// Verifies that each checker function uses the rule ID in its pass()/fail() calls
// that matches its registry entry. Catches copy-paste bugs like P11 in checker-design-patterns.md.
//
// Usage: node scripts/ci/check-rule-id-consistency.mjs
// Exit 0 = clean, Exit 1 = mismatches found

import { readFileSync, readdirSync } from 'fs'
import { join, resolve, basename } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const ROOT = resolve(__dirname, '../..')
const REGISTRY_PATH = join(ROOT, 'src/lib/audit/rule-registry.ts')
const CHECKERS_DIR = join(ROOT, 'src/lib/audit/checkers')

// ── Step 1: Parse imports → Map<functionName, sourceFile> ────────────────────

function parseImports(src) {
  const map = new Map() // functionName → checker filename (basename, no path)
  // Match: import { fn1, fn2 } from './checkers/some-checker'
  const importRe = /import\s*\{([^}]+)\}\s*from\s*['"][^'"]*\/checkers\/([^'"]+)['"]/g
  let m
  while ((m = importRe.exec(src)) !== null) {
    const file = m[2] + '.ts'
    const names = m[1].split(',').map(n => n.trim().replace(/\s+.*/, '')) // strip aliases
    for (const name of names) {
      if (name) map.set(name, file)
    }
  }
  return map
}

// ── Step 2: Parse rule-registry → Map<functionName, expectedId> ──────────────

function parseRegistry(src) {
  const map = new Map() // functionName → expectedId
  const idPattern = /id:\s*'(cat-\d+-rule-\d+)'/g
  let idMatch
  while ((idMatch = idPattern.exec(src)) !== null) {
    const id = idMatch[1]
    const window = src.slice(idMatch.index, idMatch.index + 2000)
    // Match named check: references; skip inline arrow functions
    const checkRe = /\bcheck:\s*(?!async\s*\()(?!\(\s*ctx)([a-zA-Z_$][a-zA-Z0-9_$]*(?:\.[a-zA-Z_$][a-zA-Z0-9_$]*)?)/
    const checkMatch = window.match(checkRe)
    if (!checkMatch) continue
    const funcRef = checkMatch[1]
    if (['true', 'false', 'null', 'undefined'].includes(funcRef)) continue
    const funcName = funcRef.includes('.') ? funcRef.split('.').pop() : funcRef
    map.set(funcName, id)
  }
  return map
}

// ── Step 3: Parse a single checker file → Map<funcName, bodyText> ────────────

// Uses next-function-boundary: each function's body is the text from its opening {
// to just before the next function declaration. Avoids brace-counting issues with
// string/regex literals that contain unbalanced braces.
function extractFunctionBodies(src) {
  const bodies = new Map()
  const funcRe = /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(/g
  const matches = []
  let m
  while ((m = funcRe.exec(src)) !== null) {
    matches.push({ name: m[1], declStart: m.index, afterParen: m.index + m[0].length })
  }

  for (let idx = 0; idx < matches.length; idx++) {
    const { name, afterParen } = matches[idx]
    let i = afterParen
    // Skip past parameter list
    let parenDepth = 1
    while (i < src.length) {
      const ch = src[i]
      if (ch === '(') parenDepth++
      else if (ch === ')') { parenDepth--; if (parenDepth === 0) { i++; break } }
      i++
    }
    // Skip to opening '{' (past return type annotation)
    while (i < src.length && src[i] !== '{') i++
    if (i >= src.length) continue
    const bodyStart = i
    // Body ends just before the next function declaration (or EOF)
    const nextDeclStart = idx + 1 < matches.length ? matches[idx + 1].declStart : src.length
    bodies.set(name, src.slice(bodyStart, nextDeclStart))
  }
  return bodies
}

function extractUsedIds(body) {
  const re = /(?:pass|fail|nullResult)\(\s*'(cat-\d+-rule-\d+)'|ruleId:\s*'(cat-\d+-rule-\d+)'/g
  const ids = new Set()
  let m
  while ((m = re.exec(body)) !== null) ids.add(m[1] ?? m[2])
  return ids
}

// ── Step 4: Run comparison ────────────────────────────────────────────────────

function main() {
  const registrySrc = readFileSync(REGISTRY_PATH, 'utf-8')
  const importMap = parseImports(registrySrc)   // funcName → sourceFile
  const registryMap = parseRegistry(registrySrc) // funcName → expectedId

  // Build per-file body cache (only load files we actually need)
  const fileBodyCache = new Map() // filename → Map<funcName, body>
  const getFileBodies = (filename) => {
    if (fileBodyCache.has(filename)) return fileBodyCache.get(filename)
    const path = join(CHECKERS_DIR, filename)
    try {
      const bodies = extractFunctionBodies(readFileSync(path, 'utf-8'))
      fileBodyCache.set(filename, bodies)
      return bodies
    } catch { return new Map() }
  }

  // Fallback: scan all checker files (for functions without import info, e.g. cliChecks.*)
  const allCheckerFiles = readdirSync(CHECKERS_DIR).filter(f => f.endsWith('.ts'))

  let errors = 0, checked = 0, skipped = 0

  for (const [funcName, expectedId] of registryMap) {
    // Prefer the file we know this function was imported from
    const sourceFile = importMap.get(funcName)
    let body = sourceFile ? getFileBodies(sourceFile).get(funcName) : undefined

    // Fallback: search all checker files (for cliChecks.* and similar)
    if (!body) {
      for (const file of allCheckerFiles) {
        body = getFileBodies(file).get(funcName)
        if (body) break
      }
    }

    if (!body) { skipped++; continue }

    const usedIds = extractUsedIds(body)
    if (usedIds.size === 0) { skipped++; continue }

    checked++
    const wrongIds = [...usedIds].filter(id => id !== expectedId)
    if (wrongIds.length > 0) {
      const file = sourceFile ?? '?'
      console.error(`✗ MISMATCH  ${funcName}  (${file})`)
      console.error(`  registry expects: ${expectedId}`)
      console.error(`  function uses:    ${[...usedIds].join(', ')}`)
      errors++
    }
  }

  const total = registryMap.size
  console.log(`\nChecked ${checked} functions, skipped ${skipped} (inline/no-pass-fail) of ${total} registry entries`)

  if (errors > 0) {
    console.error(`\n✗ ${errors} rule-ID mismatch(es) — fix before merging`)
    process.exit(1)
  }

  console.log(`✓ All rule IDs consistent`)
}

main()
