// src/lib/preflight/__tests__/korsett.unit.test.ts
import { describe, it, expect } from 'vitest'
import { KORSETT } from '../korsett'

describe('KORSETT', () => {
  it('hat eindeutige IDs', () => {
    const ids = KORSETT.map(n => n.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
  it('jeder Knoten hat gültige kosten', () => {
    for (const n of KORSETT) expect(['red', 'yellow']).toContain(n.kosten)
  })
  it('enthält die architektur-prägenden Kern-Knoten', () => {
    const ids = KORSETT.map(n => n.id)
    for (const id of ['U1', 'U4', 'D1', 'D3', 'D5', 'AI2', 'L1', 'B1']) {
      expect(ids).toContain(id)
    }
  })
})
