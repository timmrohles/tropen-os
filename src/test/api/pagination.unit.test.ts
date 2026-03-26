import { describe, it, expect } from 'vitest'
import { parsePaginationParams } from '@/lib/api/pagination'

describe('parsePaginationParams', () => {
  it('defaults to limit=100 offset=0', () => {
    expect(parsePaginationParams(new URLSearchParams())).toEqual({ limit: 100, offset: 0 })
  })
  it('parses valid params', () => {
    expect(parsePaginationParams(new URLSearchParams('limit=25&offset=50'))).toEqual({ limit: 25, offset: 50 })
  })
  it('caps limit at maxLimit', () => {
    expect(parsePaginationParams(new URLSearchParams('limit=9999'))).toEqual({ limit: 500, offset: 0 })
  })
  it('ignores negative offset', () => {
    expect(parsePaginationParams(new URLSearchParams('offset=-5'))).toEqual({ limit: 100, offset: 0 })
  })
  it('handles non-numeric gracefully', () => {
    expect(parsePaginationParams(new URLSearchParams('limit=abc'))).toEqual({ limit: 100, offset: 0 })
  })
})
