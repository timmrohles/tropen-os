import { describe, it, expect } from 'vitest'
import { composeConceptText, derivePivotsFromConcept } from '../concept'
import type { PreflightConcept } from '../concept-types'
import type { PreflightPivots } from '../types'

const C = (over: Partial<PreflightConcept> = {}): PreflightConcept => ({
  mode: 'form', wasFuerWen: 'Eine App für Hobbyköche', kernFunktionen: 'Rezepte teilen', nutzerDaten: 'Profile + Rezepte', verkauf: '', ...over,
})
const P = (over: Partial<PreflightPivots> = {}): PreflightPivots => ({
  buildTool: 'cursor', businessModel: 'b2c', audienceRegion: 'eu', hosting: 'eu', stack: '', platform: 'web', commercialModel: 'none', ...over,
} as PreflightPivots)

describe('composeConceptText', () => {
  it('fügt gefüllte Felder zu strukturiertem Text, lässt leere aus', () => {
    const t = composeConceptText(C({ verkauf: '' }))
    expect(t).toContain('Hobbyköche'); expect(t).toContain('Rezepte teilen')
    expect(t.toLowerCase()).not.toContain('verkauf / geschäftsmodell')
  })
})
describe('derivePivotsFromConcept', () => {
  it('Abo-Keyword → subscription', () => { expect(derivePivotsFromConcept(C({ verkauf: 'Monatliches Abo' }), P()).commercialModel).toBe('subscription') })
  it('Marktplatz-Keyword → marketplace', () => { expect(derivePivotsFromConcept(C({ verkauf: 'Marktplatz für Anbieter' }), P()).commercialModel).toBe('marketplace') })
  it('Shop-Keyword → shop', () => { expect(derivePivotsFromConcept(C({ verkauf: 'Wir verkaufen Produkte im Shop' }), P()).commercialModel).toBe('shop') })
  it('kein Keyword → bestehender Wert bleibt', () => { expect(derivePivotsFromConcept(C({ verkauf: 'noch unklar' }), P({ commercialModel: 'shop' })).commercialModel).toBe('shop') })
  it('lässt übrige Pivots unverändert', () => { expect(derivePivotsFromConcept(C(), P({ platform: 'native' })).platform).toBe('native') })
})
