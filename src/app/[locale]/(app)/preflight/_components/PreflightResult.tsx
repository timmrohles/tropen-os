'use client'

import { useMemo } from 'react'
import dynamic from 'next/dynamic'
import { Warning, CheckCircle, Info } from '@phosphor-icons/react'
import type { GapList, DecisionMap, DecisionChoice, ResultSummary, Startpaket } from '@/lib/preflight/types'
import { isMinStandardMet } from '@/lib/preflight/types'
import { GapsSection } from './GapCard'

const ArtifactBrowser = dynamic(() => import('./ArtifactBrowser').then(m => m.ArtifactBrowser), { ssr: false })

interface Props {
  summary: ResultSummary
  gaps: GapList
  decisions: DecisionMap
  startpaket: Startpaket | null
  onDecision: (nodeId: string, choice: DecisionChoice, value?: string) => void
  onGenerate: () => void
  generating: boolean
}

export function PreflightResult({ summary, gaps, decisions, startpaket, onDecision, onGenerate, generating }: Props) {
  const total = gaps.red.length
  const done = useMemo(() => gaps.red.filter(g => decisions[g.id] !== undefined).length, [gaps.red, decisions])
  const met = isMinStandardMet(gaps, decisions)
  const remaining = total - done
  const hasStartpaket = !!startpaket?.conventions

  return (
    <div style={{ marginTop: 8 }}>
      {summary.thin && (
        <div style={{ display: 'flex', gap: 10, padding: '14px 18px', marginBottom: 20, borderRadius: 8, background: 'rgba(229,160,0,0.10)', border: '1px solid var(--status-risky)' }}>
          <Warning size={18} weight="fill" color="var(--status-risky)" aria-hidden="true" />
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>Dein Konzept ist knapp — kläre die roten Punkte, dann wird das Startpaket konkret.</p>
        </div>
      )}

      {total > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 6 }}>
            <span>MINDESTSTANDARD</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: met ? 'var(--teal)' : 'var(--text-secondary)', fontWeight: met ? 600 : 400 }}>
              {met && <CheckCircle size={13} weight="fill" aria-hidden="true" />}
              {met ? 'alle geklärt' : `${done} / ${total} geklärt`}
            </span>
          </div>
          <div style={{ height: 6, borderRadius: 999, background: 'var(--accent-light)', overflow: 'hidden' }}>
            <div style={{ width: `${total ? (done / total) * 100 : 0}%`, height: '100%', background: 'var(--teal)', borderRadius: 999, transition: 'width 250ms ease-out' }} />
          </div>
        </div>
      )}

      <GapsSection gaps={gaps} decisions={decisions} onDecision={onDecision} />

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 8, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <button type="button" className="btn btn-primary" disabled={!met || generating} onClick={onGenerate}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          {generating ? 'Generiere …' : hasStartpaket ? 'Neu generieren' : 'Startpaket erstellen'}
        </button>
        {!met && <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>noch {remaining} rote {remaining === 1 ? 'Lücke' : 'Lücken'} offen</span>}
        {met && !hasStartpaket && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--teal)' }}><CheckCircle size={14} weight="fill" />Mindeststandard erreicht</span>}
      </div>

      {startpaket?.conventions && (
        <div style={{ marginTop: 20 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent)', marginBottom: 12 }}>
            <span style={{ width: 28, height: 1, background: 'rgba(45,122,80,0.3)' }} />Dein Startpaket
          </span>
          <ArtifactBrowser startpaket={startpaket} />
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 24, padding: '12px 16px', borderRadius: 8, background: 'var(--surface-cool)', border: '1px solid var(--border)' }}>
        <Info size={16} weight="bold" color="var(--text-tertiary)" style={{ flexShrink: 0 }} aria-hidden="true" />
        <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
          <b style={{ color: 'var(--text-secondary)' }}>Gut beurteilbar:</b> Architektur, Konventionen, Sicherheit &amp; rechtliche Trigger. <b style={{ color: 'var(--text-secondary)' }}>Grenzen:</b> keine Rechtsberatung, kein Markt-/Geschäftsmodell-Urteil, sieht nur was im Konzept steht.
        </p>
      </div>
    </div>
  )
}
