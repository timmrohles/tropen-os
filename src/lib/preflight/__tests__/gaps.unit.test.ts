// src/lib/preflight/__tests__/gaps.unit.test.ts
import { describe, it, expect } from 'vitest'
import { buildGapList } from '../gaps'
import type { NodeAnalysis } from '../types'

const analysis: NodeAnalysis[] = [
  { id: 'U1', status: 'open' },        // red
  { id: 'U3', status: 'open' },        // yellow
  { id: 'D1', status: 'decided', evidence: 'org_id auf allen Tabellen' },
  { id: 'F1', status: 'na' },
  { id: 'L1', status: 'open' },        // red
]

describe('buildGapList', () => {
  it('trennt offene 🔴 von 🟡', () => {
    const g = buildGapList(analysis)
    expect(g.red.map(x => x.id).sort()).toEqual(['L1', 'U1'])
    expect(g.yellow.map(x => x.id)).toEqual(['U3'])
  })
  it('zählt entschieden + n-a', () => {
    const g = buildGapList(analysis)
    expect(g.decidedCount).toBe(1)
    expect(g.naCount).toBe(1)
  })
  it('reichert Gaps mit Frage/Warum/Default aus dem Korsett an', () => {
    const g = buildGapList(analysis)
    const u1 = g.red.find(x => x.id === 'U1')!
    expect(u1.frage).toContain('Ziel & Scope')
    expect(u1.domain).toBe('Universell')
  })
  it('ignoriert unbekannte IDs robust', () => {
    const g = buildGapList([{ id: 'NICHT_EXISTENT', status: 'open' }])
    expect(g.red).toHaveLength(0)
    expect(g.yellow).toHaveLength(0)
  })
  it('kopiert plain + action vom Knoten auf den Gap', () => {
    const analysisWithPlain: NodeAnalysis[] = [
      {
        id: 'U1',
        status: 'open',
        plain: 'Du hast noch kein Projektziel festgelegt.',
        action: 'Schreibe in einem Satz was die App tun soll.',
      },
    ]
    const g = buildGapList(analysisWithPlain)
    const u1 = g.red.find(x => x.id === 'U1')!
    expect(u1.plain).toBe('Du hast noch kein Projektziel festgelegt.')
    expect(u1.action).toBe('Schreibe in einem Satz was die App tun soll.')
  })
  it('lässt plain/action weg wenn nicht vorhanden', () => {
    const g = buildGapList(analysis)
    const u1 = g.red.find(x => x.id === 'U1')!
    expect(u1.plain).toBeUndefined()
    expect(u1.action).toBeUndefined()
  })
})
