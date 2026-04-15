import { createHash } from 'crypto'
import type { RepoSymbol } from './types'

// Static symbol data without mutable ranking fields
interface CachedSymbol {
  id: string
  name: string
  kind: RepoSymbol['kind']
  filePath: string
  line: number
  lineEnd: number
  signature: string
  exported: boolean
  parentId?: string
}

/**
 * Simple LRU cache backed by an insertion-ordered Map.
 * On get: moves entry to end (most recently used).
 * On set: evicts the oldest entry when over capacity.
 */
class LruMap<K, V> {
  private readonly map = new Map<K, V>()

  constructor(private readonly maxSize: number) {}

  get(key: K): V | undefined {
    const v = this.map.get(key)
    if (v !== undefined) {
      this.map.delete(key)
      this.map.set(key, v)
    }
    return v
  }

  set(key: K, value: V): void {
    if (this.map.has(key)) this.map.delete(key)
    this.map.set(key, value)
    if (this.map.size > this.maxSize) {
      const firstKey = this.map.keys().next().value as K
      this.map.delete(firstKey)
    }
  }

  get size(): number {
    return this.map.size
  }

  clear(): void {
    this.map.clear()
  }
}

const DEFAULT_MAX_SIZE = 500

// Module-level cache — persists across calls in the same process
const symbolCache = new LruMap<string, CachedSymbol[]>(DEFAULT_MAX_SIZE)

/** SHA-256 hash of file content, used as cache key */
export function hashContent(content: string): string {
  return createHash('sha256').update(content).digest('hex')
}

/**
 * Returns fresh RepoSymbol copies from cache (referenceCount and rankScore
 * reset to 0 so each scan starts clean).
 * Returns undefined on cache miss.
 */
export function getCached(contentHash: string): RepoSymbol[] | undefined {
  const cached = symbolCache.get(contentHash)
  if (!cached) return undefined
  return cached.map((s) => ({ ...s, referenceCount: 0, rankScore: 0 }))
}

/**
 * Stores the static parts of the symbol list.
 * Strips referenceCount and rankScore — those are recomputed each scan.
 */
export function setCached(contentHash: string, symbols: RepoSymbol[]): void {
  const staticData: CachedSymbol[] = symbols.map((s) => ({
    id: s.id,
    name: s.name,
    kind: s.kind,
    filePath: s.filePath,
    line: s.line,
    lineEnd: s.lineEnd,
    signature: s.signature,
    exported: s.exported,
    parentId: s.parentId,
  }))
  symbolCache.set(contentHash, staticData)
}

/** Number of entries currently in cache */
export function getCacheSize(): number {
  return symbolCache.size
}

/** Evicts all entries — intended for testing */
export function clearCache(): void {
  symbolCache.clear()
}
