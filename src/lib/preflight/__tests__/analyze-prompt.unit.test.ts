import { describe, it, expect } from 'vitest'
import { buildSystemPrompt } from '../analyze'

const PIVOTS = { buildTool: 'cursor', businessModel: 'b2c', audienceRegion: 'eu', hosting: 'eu', stack: '', platform: 'native', commercialModel: 'subscription' } as const

describe('buildSystemPrompt v2', () => {
  const p = buildSystemPrompt(PIVOTS)
  it('nennt Plattform + Vertriebsmodell als Fakten', () => {
    expect(p).toContain('Plattform')
    expect(p).toContain('Vertriebsmodell')
  })
  it('enthält Ableitungsregeln für native/shop/subscription', () => {
    expect(p).toMatch(/native/)
    expect(p).toMatch(/fernabsatz|Fernabsatz/)
    expect(p).toMatch(/§312k|Kündigungsbutton|abo|Abo/)
  })
  it('weist bei leerem stack auf Default-Empfehlung hin', () => {
    expect(p).toMatch(/weiß nicht|Default-Stack|Default/)
  })
})
