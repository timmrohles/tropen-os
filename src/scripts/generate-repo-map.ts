/**
 * Dogfooding script: generate a Repo Map for the Tropen OS codebase itself.
 * Usage: npx tsx src/scripts/generate-repo-map.ts [--budget 4096]
 *
 * Output:
 *   docs/repo-map/tropen-os-map.json     — full JSON map
 *   docs/repo-map/tropen-os-map.txt      — compressed text (for LLM context)
 *   docs/repo-map/tropen-os-stats.json   — statistics only
 */
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { generateRepoMap } from '../lib/repo-map/index'
import { formatAsJson } from '../lib/repo-map/formatters/json-formatter'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const REPO_ROOT = path.resolve(__dirname, '../../')
const OUTPUT_DIR = path.resolve(__dirname, '../../docs/repo-map')

async function main() {
  // Parse --budget flag
  const budgetArg = process.argv.indexOf('--budget')
  const tokenBudget = budgetArg !== -1 ? parseInt(process.argv[budgetArg + 1], 10) : 4096

  console.log(`\n🗺  Generating Repo Map for Tropen OS`)
  console.log(`   Root:         ${REPO_ROOT}`)
  console.log(`   Token budget: ${tokenBudget}`)
  console.log(`   Scanning...\n`)

  const startTime = Date.now()

  const repoMap = await generateRepoMap({
    rootPath: REPO_ROOT,
    tokenBudget,
    ignorePatterns: [
      '**/*.test.ts',
      '**/*.unit.test.ts',
      '**/*.test.tsx',
      'src/lib/repo-map/fixtures/**',
      'scripts/**',
      'e2e/**',
      'coverage/**',
    ],
    languages: ['typescript', 'javascript'],
  })

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2)

  // Print stats
  console.log(`✅ Scan complete in ${elapsed}s\n`)
  console.log(`   Files scanned:    ${repoMap.stats.totalFiles}`)
  console.log(`   Symbols found:    ${repoMap.stats.totalSymbols}`)
  console.log(`   Total lines:      ${repoMap.stats.totalLines.toLocaleString()}`)
  console.log(`   Symbols included: ${repoMap.stats.includedSymbols} (of ${repoMap.stats.totalSymbols})`)
  console.log(`   Estimated tokens: ${repoMap.stats.estimatedTokens} / ${tokenBudget}`)
  console.log()

  // Top 10 symbols
  console.log('Top 10 symbols by rank:')
  repoMap.rankedSymbols.slice(0, 10).forEach((s, i) => {
    console.log(`  ${i + 1}. ${s.filePath}::${s.name} (rank: ${s.rankScore.toFixed(3)}, refs: ${s.referenceCount})`)
  })
  console.log()

  // Write outputs
  await mkdir(OUTPUT_DIR, { recursive: true })

  // Full JSON
  const jsonPath = path.join(OUTPUT_DIR, 'tropen-os-map.json')
  await writeFile(
    jsonPath,
    JSON.stringify(
      {
        generatedAt: repoMap.generatedAt,
        version: repoMap.version,
        stats: repoMap.stats,
        topSymbols: formatAsJson(repoMap.rankedSymbols.slice(0, 100)),
        dependencies: repoMap.dependencies.slice(0, 500),
        files: repoMap.files.map((f) => ({
          path: f.path,
          language: f.language,
          lineCount: f.lineCount,
          exportCount: f.exports.length,
          symbolCount: f.symbols.length,
        })),
      },
      null,
      2
    )
  )

  // Compressed text map
  const txtPath = path.join(OUTPUT_DIR, 'tropen-os-map.txt')
  await writeFile(txtPath, repoMap.compressedMap)

  // Stats only
  const statsPath = path.join(OUTPUT_DIR, 'tropen-os-stats.json')
  await writeFile(
    statsPath,
    JSON.stringify(
      {
        generatedAt: repoMap.generatedAt,
        version: repoMap.version,
        ...repoMap.stats,
        elapsedSeconds: parseFloat(elapsed),
      },
      null,
      2
    )
  )

  console.log(`Output written to:`)
  console.log(`  ${jsonPath}`)
  console.log(`  ${txtPath}`)
  console.log(`  ${statsPath}`)
  console.log()
}

main().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
