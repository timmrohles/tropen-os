import { describe, it, expect, beforeEach } from 'vitest'
import { hashContent, getCached, setCached, getCacheSize, clearCache } from './ast-cache'
import type { RepoSymbol } from './types'

function makeSymbol(overrides: Partial<RepoSymbol> = {}): RepoSymbol {
  return {
    id: 'file.ts::fn',
    name: 'fn',
    kind: 'function',
    filePath: 'file.ts',
    line: 1,
    lineEnd: 5,
    signature: 'function fn()',
    exported: true,
    referenceCount: 3,
    rankScore: 0.7,
    ...overrides,
  }
}

describe('ast-cache', () => {
  beforeEach(() => {
    clearCache()
  })

  describe('hashContent', () => {
    it('returns a hex string', () => {
      const h = hashContent('export function foo() {}')
      expect(h).toMatch(/^[a-f0-9]{64}$/)
    })

    it('same content → same hash', () => {
      const content = 'export const x = 1'
      expect(hashContent(content)).toBe(hashContent(content))
    })

    it('different content → different hash', () => {
      expect(hashContent('const a = 1')).not.toBe(hashContent('const b = 1'))
    })
  })

  describe('getCached / setCached', () => {
    it('returns undefined on cache miss', () => {
      expect(getCached('nonexistent-hash')).toBeUndefined()
    })

    it('returns symbols after setCached', () => {
      const content = 'export function foo() {}'
      const hash = hashContent(content)
      const symbols = [makeSymbol()]

      setCached(hash, symbols)
      const result = getCached(hash)

      expect(result).toBeDefined()
      expect(result!.length).toBe(1)
      expect(result![0].name).toBe('fn')
    })

    it('resets referenceCount and rankScore on cache hit', () => {
      const content = 'export function foo() {}'
      const hash = hashContent(content)
      // Store with dirty mutable state
      const symbols = [makeSymbol({ referenceCount: 99, rankScore: 0.99 })]
      setCached(hash, symbols)

      const result = getCached(hash)!
      expect(result[0].referenceCount).toBe(0)
      expect(result[0].rankScore).toBe(0)
    })

    it('returned symbols are independent copies — mutations do not affect cache', () => {
      const content = 'export function foo() {}'
      const hash = hashContent(content)
      setCached(hash, [makeSymbol()])

      const first = getCached(hash)!
      first[0].referenceCount = 42

      const second = getCached(hash)!
      expect(second[0].referenceCount).toBe(0)
    })

    it('preserves static fields (name, kind, signature, exported)', () => {
      const content = 'export class Foo {}'
      const hash = hashContent(content)
      const sym = makeSymbol({
        name: 'Foo',
        kind: 'class',
        signature: 'class Foo',
        exported: true,
        line: 1,
        lineEnd: 3,
      })
      setCached(hash, [sym])

      const result = getCached(hash)![0]
      expect(result.name).toBe('Foo')
      expect(result.kind).toBe('class')
      expect(result.signature).toBe('class Foo')
      expect(result.exported).toBe(true)
      expect(result.line).toBe(1)
      expect(result.lineEnd).toBe(3)
    })
  })

  describe('LRU eviction', () => {
    it('cache size grows with distinct entries', () => {
      expect(getCacheSize()).toBe(0)
      setCached('hash-1', [makeSymbol()])
      setCached('hash-2', [makeSymbol()])
      expect(getCacheSize()).toBe(2)
    })

    it('updating existing key does not grow the cache', () => {
      setCached('hash-1', [makeSymbol()])
      setCached('hash-1', [makeSymbol(), makeSymbol()])
      expect(getCacheSize()).toBe(1)
    })

    it('clearCache resets size to zero', () => {
      setCached('hash-1', [makeSymbol()])
      setCached('hash-2', [makeSymbol()])
      clearCache()
      expect(getCacheSize()).toBe(0)
      expect(getCached('hash-1')).toBeUndefined()
    })
  })
})
