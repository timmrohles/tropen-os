import { describe, it, expect } from 'vitest'
import { preflightBody, renameProjectBody } from '../preflight'

describe('preflightBody', () => {
  const base = {
    input: 'Ein hinreichend langer Konzepttext.',
    pivots: { buildTool: 'cursor', businessModel: 'b2c', audienceRegion: 'eu', hosting: 'eu', stack: 'Next.js' },
  }

  it('akzeptiert optionalen name', () => {
    const r = preflightBody.safeParse({ ...base, name: 'Mein Projekt' })
    expect(r.success).toBe(true)
  })

  it('akzeptiert fehlenden name', () => {
    const r = preflightBody.safeParse(base)
    expect(r.success).toBe(true)
  })

  it('lehnt name > 120 Zeichen ab', () => {
    const r = preflightBody.safeParse({ ...base, name: 'x'.repeat(121) })
    expect(r.success).toBe(false)
  })

  it('akzeptiert platform + commercialModel', () => {
    const r = preflightBody.safeParse({ ...base, pivots: { ...base.pivots, platform: 'native', commercialModel: 'shop' } })
    expect(r.success).toBe(true)
  })

  it('setzt Defaults wenn platform/commercialModel fehlen', () => {
    const r = preflightBody.safeParse(base)
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.pivots.platform).toBe('unsure')
      expect(r.data.pivots.commercialModel).toBe('none')
    }
  })
})

describe('renameProjectBody', () => {
  it('akzeptiert nicht-leeren name', () => {
    expect(renameProjectBody.safeParse({ name: 'Neu' }).success).toBe(true)
  })
  it('lehnt leeren name ab', () => {
    expect(renameProjectBody.safeParse({ name: '   ' }).success).toBe(false)
  })
})
