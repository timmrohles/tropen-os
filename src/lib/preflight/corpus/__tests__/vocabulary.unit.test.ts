import { describe, it, expect } from 'vitest'
import { STACK_TAGS, OTHER_TAGS, ALL_TAGS, CONTENT_SECTIONS } from '../vocabulary'

describe('vocabulary', () => {
  it('Stack-Tags enthalten astro + die Kern-Frameworks', () => {
    expect(STACK_TAGS).toContain('stack:astro')
    expect(STACK_TAGS).toContain('stack:next')
    expect(STACK_TAGS).toContain('stack:react-native')
  })
  it('ALL_TAGS = STACK_TAGS ∪ OTHER_TAGS, eindeutig', () => {
    expect(ALL_TAGS.length).toBe(new Set(ALL_TAGS).size)
    expect(ALL_TAGS).toEqual(expect.arrayContaining([...STACK_TAGS, ...OTHER_TAGS]))
  })
  it('OTHER_TAGS enthält db/auth/platform/commerce', () => {
    expect(OTHER_TAGS).toEqual(expect.arrayContaining(['db:true', 'auth:true', 'platform:web', 'platform:native', 'commerce:true']))
  })
  it('CONTENT_SECTIONS enthält testing + git', () => {
    expect(CONTENT_SECTIONS).toContain('testing')
    expect(CONTENT_SECTIONS).toContain('git')
  })
})
