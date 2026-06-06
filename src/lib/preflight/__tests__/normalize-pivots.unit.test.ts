import { describe, it, expect } from 'vitest'
import { normalizePivots } from '../types'

describe('normalizePivots', () => {
  it('füllt platform/commercialModel-Defaults für alte Pivots', () => {
    const r = normalizePivots({ buildTool: 'cursor', businessModel: 'b2c', audienceRegion: 'eu', hosting: 'eu', stack: 'Next.js' })
    expect(r.platform).toBe('unsure')
    expect(r.commercialModel).toBe('none')
  })
  it('übernimmt vorhandene neue Felder', () => {
    const r = normalizePivots({ platform: 'native', commercialModel: 'subscription' })
    expect(r.platform).toBe('native')
    expect(r.commercialModel).toBe('subscription')
  })
  it('behandelt fehlenden stack als leeren String', () => {
    expect(normalizePivots({}).stack).toBe('')
  })
})
