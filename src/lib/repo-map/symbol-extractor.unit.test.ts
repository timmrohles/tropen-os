import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import path from 'path'
import { parseSource } from './parser'
import { extractSymbols } from './symbol-extractor'

function loadFixture(name: string) {
  const filePath = path.resolve(__dirname, 'fixtures', name)
  const content = readFileSync(filePath, 'utf-8')
  return { filePath: `fixtures/${name}`, content, parsed: parseSource(filePath, content) }
}

describe('extractSymbols — utility.ts', () => {
  it('extracts exported const', () => {
    const { filePath, content, parsed } = loadFixture('utility.ts')
    const symbols = extractSymbols(parsed, filePath, content)
    const maxRetries = symbols.find((s) => s.name === 'MAX_RETRIES')
    expect(maxRetries).toBeDefined()
    expect(maxRetries?.kind).toBe('const')
    expect(maxRetries?.exported).toBe(true)
  })

  it('extracts exported function with correct signature', () => {
    const { filePath, content, parsed } = loadFixture('utility.ts')
    const symbols = extractSymbols(parsed, filePath, content)
    const fn = symbols.find((s) => s.name === 'formatDate')
    expect(fn).toBeDefined()
    expect(fn?.kind).toBe('function')
    expect(fn?.exported).toBe(true)
    expect(fn?.signature).toContain('formatDate')
  })

  it('extracts exported interface', () => {
    const { filePath, content, parsed } = loadFixture('utility.ts')
    const symbols = extractSymbols(parsed, filePath, content)
    const iface = symbols.find((s) => s.name === 'DateRange')
    expect(iface).toBeDefined()
    expect(iface?.kind).toBe('interface')
    expect(iface?.exported).toBe(true)
  })
})

describe('extractSymbols — simple-class.ts', () => {
  it('extracts class definition', () => {
    const { filePath, content, parsed } = loadFixture('simple-class.ts')
    const symbols = extractSymbols(parsed, filePath, content)
    const cls = symbols.find((s) => s.name === 'EventLogger')
    expect(cls).toBeDefined()
    expect(cls?.kind).toBe('class')
    expect(cls?.exported).toBe(true)
  })

  it('extracts class methods with parentId', () => {
    const { filePath, content, parsed } = loadFixture('simple-class.ts')
    const symbols = extractSymbols(parsed, filePath, content)
    const cls = symbols.find((s) => s.name === 'EventLogger')!
    const logMethod = symbols.find((s) => s.name === 'log' && s.parentId === cls.id)
    expect(logMethod).toBeDefined()
    expect(logMethod?.kind).toBe('method')
  })

  it('marks non-exported function correctly', () => {
    const { filePath, content, parsed } = loadFixture('simple-class.ts')
    const symbols = extractSymbols(parsed, filePath, content)
    const helper = symbols.find((s) => s.name === 'internalHelper')
    expect(helper).toBeDefined()
    expect(helper?.exported).toBe(false)
  })

  it('sets correct line numbers', () => {
    const { filePath, content, parsed } = loadFixture('simple-class.ts')
    const symbols = extractSymbols(parsed, filePath, content)
    const cls = symbols.find((s) => s.name === 'EventLogger')!
    expect(cls.line).toBeGreaterThan(0)
    expect(cls.lineEnd).toBeGreaterThanOrEqual(cls.line)
  })

  it('generates unique ids with file path prefix', () => {
    const { filePath, content, parsed } = loadFixture('simple-class.ts')
    const symbols = extractSymbols(parsed, filePath, content)
    for (const s of symbols) {
      expect(s.id).toContain(filePath)
      expect(s.id).toContain(s.name)
    }
  })
})
