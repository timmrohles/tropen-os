// src/lib/preflight/gaps.ts
import { KORSETT } from './korsett'
import type { NodeAnalysis, Gap, GapList } from './types'

const BY_ID = new Map(KORSETT.map(n => [n.id, n]))

function toGap(id: string, node: NodeAnalysis): Gap | null {
  const n = BY_ID.get(id)
  if (!n) return null
  return {
    id: n.id,
    domain: n.domain,
    frage: n.frage,
    warum: n.warum,
    default: n.default,
    kosten: n.kosten,
    ...(node.plain === undefined ? {} : { plain: node.plain }),
    ...(node.action === undefined ? {} : { action: node.action }),
  }
}

export function buildGapList(analysis: NodeAnalysis[]): GapList {
  const red: Gap[] = []
  const yellow: Gap[] = []
  let decidedCount = 0
  let naCount = 0

  for (const a of analysis) {
    if (a.status === 'decided') { decidedCount++; continue }
    if (a.status === 'na') { naCount++; continue }
    const gap = toGap(a.id, a)
    if (!gap) continue
    if (gap.kosten === 'red') red.push(gap)
    else yellow.push(gap)
  }
  // stabile Sortierung nach Domäne, dann ID
  const byDomain = (a: Gap, b: Gap) => a.domain.localeCompare(b.domain) || a.id.localeCompare(b.id)
  red.sort(byDomain)
  yellow.sort(byDomain)
  return { red, yellow, decidedCount, naCount }
}
