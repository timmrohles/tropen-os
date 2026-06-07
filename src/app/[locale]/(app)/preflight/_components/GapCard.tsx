'use client'

import { useState } from 'react'
import type { Gap, Decision, DecisionChoice, GapList } from '@/lib/preflight/types'

export function GapCard({ gap, decision, onDecision }: {
  gap: Gap
  decision?: Decision
  onDecision: (nodeId: string, choice: DecisionChoice, value?: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [editVal, setEditVal] = useState(gap.action ?? gap.default)
  const isRed = gap.kosten === 'red'
  const suggestion = gap.action ?? gap.default
  const resolved = decision !== undefined

  if (resolved && !editing) {
    const label = decision!.choice === 'parked' ? 'geparkt' : (decision!.value || suggestion)
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', marginBottom: 8,
        borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-cool)', opacity: 0.85 }}>
        <span style={{ color: decision!.choice === 'parked' ? 'var(--text-tertiary)' : 'var(--teal)', flexShrink: 0 }}>
          {decision!.choice === 'parked' ? '⏸' : '✓'}
        </span>
        <span style={{ flex: 1, minWidth: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
          <b style={{ color: 'var(--text-primary)' }}>{gap.frage}</b> — {label}
        </span>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setEditVal(decision!.value ?? suggestion); setEditing(true) }}>Ändern</button>
      </div>
    )
  }

  return (
    <div style={{ borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border)',
      borderLeftWidth: 3, borderLeftStyle: 'solid', borderLeftColor: isRed ? 'var(--error)' : 'var(--status-risky)',
      borderRadius: '0 8px 8px 0', background: 'var(--bg-surface)', marginBottom: 8, padding: '12px 14px' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {gap.domain} · {isRed ? '🔴 Blocker' : '🟡 Optional'}
      </div>
      <p style={{ margin: '3px 0 8px', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{gap.frage}</p>

      <div style={{ background: 'var(--surface-cool)', borderRadius: 6, padding: '8px 10px', marginBottom: 10 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--teal)' }}>KI-VORSCHLAG</span>
        {editing ? (
          <textarea autoFocus value={editVal} onChange={e => setEditVal(e.target.value)} rows={2}
            style={{ width: '100%', marginTop: 4, fontSize: 13, fontFamily: 'inherit', border: '1px solid var(--accent)', borderRadius: 4, padding: '4px 6px', resize: 'vertical' }} />
        ) : (
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{suggestion}</p>
        )}
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        {editing ? (
          <>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => { onDecision(gap.id, 'custom', editVal.trim()); setEditing(false) }}>Speichern</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>Abbrechen</button>
          </>
        ) : (
          <>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => onDecision(gap.id, 'default', suggestion)}>Übernehmen</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setEditVal(suggestion); setEditing(true) }}>Anpassen</button>
            <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--text-tertiary)' }} onClick={() => onDecision(gap.id, 'parked')}>Parken</button>
          </>
        )}
      </div>
    </div>
  )
}

export function GapsSection({ gaps, decisions, onDecision }: {
  gaps: GapList
  decisions: Record<string, Decision>
  onDecision: (nodeId: string, choice: DecisionChoice, value?: string) => void
}) {
  const items = [...gaps.red, ...gaps.yellow]
  if (items.length === 0) return <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Keine offenen Lücken.</p>
  return (
    <div style={{ marginBottom: 16 }}>
      {items.map(g => <GapCard key={g.id} gap={g} decision={decisions[g.id]} onDecision={onDecision} />)}
    </div>
  )
}
