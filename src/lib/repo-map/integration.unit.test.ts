import { describe, it, expect } from 'vitest'
import path from 'path'
import { generateRepoMap, getCompressedRepoMap } from './index'

const FIXTURES_DIR = path.resolve(__dirname, 'fixtures')

describe('generateRepoMap — integration', () => {
  it('produces a valid RepoMap from fixtures directory', async () => {
    const map = await generateRepoMap({
      rootPath: FIXTURES_DIR,
      tokenBudget: 2048,
      languages: ['typescript'],
    })

    expect(map.stats.totalFiles).toBeGreaterThan(0)
    expect(map.stats.totalSymbols).toBeGreaterThan(0)
    expect(map.files.length).toBeGreaterThan(0)
    expect(map.rankedSymbols.length).toBeGreaterThan(0)
    expect(map.compressedMap.length).toBeGreaterThan(0)
    expect(map.version).toBe('1.0.0')
  })

  it('finds key symbols from fixtures', async () => {
    const map = await generateRepoMap({
      rootPath: FIXTURES_DIR,
      tokenBudget: 2048,
      languages: ['typescript'],
    })

    const allSymbols = map.files.flatMap((f) => f.symbols)
    const names = allSymbols.map((s) => s.name)

    expect(names).toContain('formatDate')
    expect(names).toContain('EventLogger')
    expect(names).toContain('createLogger')
    expect(names).toContain('MAX_RETRIES')
    expect(names).toContain('DateRange')
  })

  it('ranks utility symbols higher (imported by multiple files)', async () => {
    const map = await generateRepoMap({
      rootPath: FIXTURES_DIR,
      tokenBudget: 2048,
      languages: ['typescript'],
    })

    // formatDate is imported by simple-class AND consumer → should rank high
    const formatDate = map.rankedSymbols.find((s) => s.name === 'formatDate')
    const internalHelper = map.rankedSymbols.find((s) => s.name === 'internalHelper')

    expect(formatDate).toBeDefined()
    expect(internalHelper).toBeDefined()
    expect(formatDate!.rankScore).toBeGreaterThan(internalHelper!.rankScore)
  })

  it('compressedMap is within token budget', async () => {
    const budget = 500
    const map = await generateRepoMap({
      rootPath: FIXTURES_DIR,
      tokenBudget: budget,
      languages: ['typescript'],
    })

    // Allow 10% overshoot due to file headers
    expect(map.stats.estimatedTokens).toBeLessThanOrEqual(budget * 1.1)
  })

  it('getCompressedRepoMap returns string', async () => {
    const text = await getCompressedRepoMap(FIXTURES_DIR, 1024)
    expect(typeof text).toBe('string')
    expect(text.length).toBeGreaterThan(0)
    expect(text).toContain('⋮...')
  })

  it('excludes node_modules', async () => {
    const map = await generateRepoMap({
      rootPath: FIXTURES_DIR,
      tokenBudget: 2048,
    })

    expect(map.files.every((f) => !f.path.includes('node_modules'))).toBe(true)
  })

  it('stats.includedSymbols <= stats.totalSymbols', async () => {
    const map = await generateRepoMap({
      rootPath: FIXTURES_DIR,
      tokenBudget: 2048,
    })

    expect(map.stats.includedSymbols).toBeLessThanOrEqual(map.stats.totalSymbols)
  })
})
