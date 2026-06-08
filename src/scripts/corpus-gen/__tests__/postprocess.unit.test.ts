import { describe, it, expect } from 'vitest'
import { parseRules, validateAgainstVocab, dedupeRules } from '../postprocess'

const RAW = '```json\n[{"id":"test-1","section":"testing","rule":"Schreibe Tests fuer jede Funktion.","severity":"must","source":"agent:TESTING"}]\n```'

describe('parseRules', () => {
  it('parst JSON aus Markdown-Fences', () => {
    const r = parseRules(RAW)
    expect(r).toHaveLength(1); expect(r[0].id).toBe('test-1')
  })
  it('gibt [] bei Müll zurück (kein Throw)', () => {
    expect(parseRules('kein json')).toEqual([])
  })
})
describe('validateAgainstVocab', () => {
  it('verwirft Regeln mit ungültiger Section oder ungültigem Tag', () => {
    const rules = [
      { id:'a', section:'testing', rule:'Schreibe gute Tests.', severity:'must', source:'s' },
      { id:'b', section:'BOGUS', rule:'Irgendwas valides hier.', severity:'must', source:'s' },
      { id:'c', section:'db', rule:'Nutze Indizes hier.', appliesWhen:['stack:cobol'], severity:'must', source:'s' },
    ] as never[]
    const ok = validateAgainstVocab(rules)
    expect(ok.map(r => r.id)).toEqual(['a'])
  })
})
describe('dedupeRules', () => {
  it('entfernt IDs die schon im Seed sind + interne Doppel', () => {
    const rules = [
      { id:'seed-x', section:'db', rule:'a valid rule text', severity:'must', source:'s' },
      { id:'new-1', section:'db', rule:'b valid rule text', severity:'must', source:'s' },
      { id:'new-1', section:'db', rule:'b2 valid rule text', severity:'must', source:'s' },
    ] as never[]
    const out = dedupeRules(rules, new Set(['seed-x']))
    expect(out.map(r => r.id)).toEqual(['new-1'])
  })
})
