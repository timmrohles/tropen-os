import { describe, it, expect } from 'vitest'
import path from 'path'
import { discoverFiles } from './file-discovery'

const FIXTURES_DIR = path.resolve(__dirname, 'fixtures')

describe('discoverFiles', () => {
  it('finds TypeScript files in fixtures directory', async () => {
    const files = await discoverFiles({
      rootPath: FIXTURES_DIR,
      languages: ['typescript'],
    })
    expect(files.length).toBeGreaterThan(0)
    expect(files.every((f) => f.endsWith('.ts') || f.endsWith('.tsx'))).toBe(true)
  })

  it('returns relative paths from rootPath', async () => {
    const files = await discoverFiles({
      rootPath: FIXTURES_DIR,
      languages: ['typescript'],
    })
    expect(files.every((f) => !path.isAbsolute(f))).toBe(true)
  })

  it('excludes node_modules by default', async () => {
    const files = await discoverFiles({
      rootPath: FIXTURES_DIR,
      languages: ['typescript'],
    })
    expect(files.some((f) => f.includes('node_modules'))).toBe(false)
  })

  it('respects ignorePatterns', async () => {
    const files = await discoverFiles({
      rootPath: FIXTURES_DIR,
      languages: ['typescript'],
      ignorePatterns: ['circular-*.ts'],
    })
    expect(files.some((f) => f.includes('circular'))).toBe(false)
  })

  it('finds specific fixtures by name', async () => {
    const files = await discoverFiles({
      rootPath: FIXTURES_DIR,
      languages: ['typescript'],
    })
    const names = files.map((f) => path.basename(f))
    expect(names).toContain('utility.ts')
    expect(names).toContain('simple-class.ts')
    expect(names).toContain('consumer.ts')
  })

  it('returns files sorted by path', async () => {
    const files = await discoverFiles({
      rootPath: FIXTURES_DIR,
      languages: ['typescript'],
    })
    const sorted = [...files].sort()
    expect(files).toEqual(sorted)
  })
})
