import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('node:dns/promises', () => ({
  default: {
    resolve4: vi.fn(),
    resolve6: vi.fn(),
  },
}))

import dns from 'node:dns/promises'
import { isSafeUrl } from '@/lib/feeds/ssrf-guard'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockDns = dns as unknown as { resolve4: ReturnType<typeof vi.fn>; resolve6: ReturnType<typeof vi.fn> }

beforeEach(() => {
  mockDns.resolve4.mockResolvedValue(['1.2.3.4'])
  mockDns.resolve6.mockResolvedValue([])
})

describe('isSafeUrl', () => {
  it('allows public URLs', async () => {
    const result = await isSafeUrl('https://example.com/feed')
    expect(result.safe).toBe(true)
  })
  it('blocks file:// protocol', async () => {
    const result = await isSafeUrl('file:///etc/passwd')
    expect(result.safe).toBe(false)
    expect(result.reason).toContain('disallowed protocol')
  })
  it('blocks localhost directly', async () => {
    const result = await isSafeUrl('http://127.0.0.1/internal')
    expect(result.safe).toBe(false)
    expect(result.reason).toContain('private IP')
  })
  it('blocks 192.168.x.x directly', async () => {
    const result = await isSafeUrl('http://192.168.1.1/admin')
    expect(result.safe).toBe(false)
  })
  it('blocks DNS that resolves to private IP', async () => {
    mockDns.resolve4.mockResolvedValue(['10.0.0.1'])
    const result = await isSafeUrl('https://evil.example.com')
    expect(result.safe).toBe(false)
    expect(result.reason).toContain('private IP')
  })
  it('blocks invalid URL', async () => {
    const result = await isSafeUrl('not-a-url')
    expect(result.safe).toBe(false)
    expect(result.reason).toContain('invalid URL')
  })
})
