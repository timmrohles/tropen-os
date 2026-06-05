'use client'

import { useState } from 'react'
import { ArrowRight, Check, CaretDown, CaretUp } from '@phosphor-icons/react'
import type { Gap, PreflightResult } from '@/lib/preflight/types'
import { AppSection } from '@/components/app-ui/AppSection'

// ─── Gap Card (guided micro-decision) ────────────────────────────────────────

export function GapCard({ gap }: { gap: Gap }) {
  const [done, setDone] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const isRed = gap.kosten === 'red'

  // Plain + action present → use new layout; fallback → old terse layout
  const hasGuidedContent = !!(gap.plain || gap.action)

  return (
    <div
      style={{
        padding: '14px 16px',
        borderLeft: `3px solid ${done ? 'var(--border)' : isRed ? 'var(--error)' : 'var(--status-risky)'}`,
        background: done ? 'var(--surface-cool)' : 'var(--bg-surface)',
        border: `1px solid var(--border)`,
        borderLeftWidth: 3,
        borderRadius: '0 6px 6px 0',
        marginBottom: 10,
        opacity: done ? 0.65 : 1,
        transition: 'opacity 200ms, background 200ms',
      }}
    >
      {/* ── Header: domain + frage + badge ─────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: hasGuidedContent ? 10 : 6 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {gap.domain}
          </span>
          <p style={{
            margin: '4px 0 0',
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--text-primary)',
            textDecoration: done ? 'line-through' : 'none',
          }}>
            {gap.frage}
          </p>
        </div>
        <span
          style={{
            flexShrink: 0,
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: 4,
            background: isRed ? 'rgba(168,48,30,0.10)' : 'rgba(229,160,0,0.10)',
            color: isRed ? 'var(--error)' : 'var(--status-risky)',
          }}
        >
          {isRed ? 'Blocker' : 'Optional'}
        </span>
      </div>

      {/* ── Guided content (plain + action) ────────────────────── */}
      {hasGuidedContent && (
        <div style={{ marginBottom: 10 }}>
          {/* Was das heißt */}
          {gap.plain && (
            <div style={{ marginBottom: 8 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 4 }}>
                Was das heißt
              </span>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                {gap.plain}
              </p>
            </div>
          )}

          {/* Was du tun solltest */}
          {gap.action && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                padding: '9px 12px',
                background: 'var(--teal-light)',
                border: '1px solid rgba(30,112,112,0.15)',
                borderRadius: 6,
              }}
            >
              <ArrowRight size={14} weight="bold" color="var(--teal)" style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
              <div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 2 }}>
                  Was du tun solltest
                </span>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  {gap.action}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Fallback (no plain/action) ──────────────────────────── */}
      {!hasGuidedContent && (
        <>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 8px', lineHeight: 1.5 }}>
            {gap.warum}
          </p>
          {gap.default && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-tertiary)', flexShrink: 0, paddingTop: 1 }}>
                Standard:
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)', lineHeight: 1.5 }}>
                {gap.default}
              </span>
            </div>
          )}
        </>
      )}

      {/* ── Action row: Erledigt + Details ─────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => setDone(d => !d)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 12,
            color: done ? 'var(--teal)' : 'var(--text-secondary)',
            padding: '4px 10px',
          }}
          aria-pressed={done}
        >
          <Check size={12} weight="bold" aria-hidden="true" />
          {done ? 'Erledigt ✓' : 'Erledigt'}
        </button>

        {/* Details toggle — only shows if there's guided content to expand */}
        {hasGuidedContent && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setExpanded(x => !x)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 12,
              padding: '4px 10px',
              color: 'var(--text-tertiary)',
            }}
            aria-expanded={expanded}
          >
            {expanded
              ? <CaretUp size={11} weight="bold" aria-hidden="true" />
              : <CaretDown size={11} weight="bold" aria-hidden="true" />}
            Details
          </button>
        )}
      </div>

      {/* ── Expandable technical detail ─────────────────────────── */}
      {expanded && hasGuidedContent && (
        <div
          style={{
            marginTop: 10,
            padding: '12px 14px',
            background: 'var(--surface-cool)',
            border: '1px solid var(--border)',
            borderRadius: 6,
          }}
        >
          <p style={{ margin: '0 0 6px', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
            {gap.warum}
          </p>
          {gap.default && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 6 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-tertiary)', flexShrink: 0, paddingTop: 1 }}>
                Standard:
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)', lineHeight: 1.5 }}>
                {gap.default}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Gaps Section ─────────────────────────────────────────────────────────────

export function GapsSection({ gaps }: { gaps: PreflightResult['gaps'] }) {
  const { red, yellow } = gaps

  if (red.length === 0 && yellow.length === 0) {
    return (
      <AppSection header="LÜCKEN">
        <div style={{ padding: '20px 16px', fontSize: 13, color: 'var(--text-tertiary)' }}>
          Keine offenen Lücken — alle Entscheidungen getroffen.
        </div>
      </AppSection>
    )
  }

  return (
    <div style={{ marginBottom: 24 }}>
      {red.length > 0 && (
        <AppSection
          header={`ZUERST ENTSCHEIDEN · ${red.length}`}
          headerRight="Blocker"
          style={{ marginBottom: 12 }}
        >
          <div style={{ padding: '12px 16px' }}>
            {red.map(gap => (
              <GapCard key={gap.id} gap={gap} />
            ))}
          </div>
        </AppSection>
      )}

      {yellow.length > 0 && (
        <AppSection
          header={`KANN SPÄTER · ${yellow.length}`}
          headerRight="Geparkt"
        >
          <div style={{ padding: '12px 16px' }}>
            {yellow.map(gap => (
              <GapCard key={gap.id} gap={gap} />
            ))}
          </div>
        </AppSection>
      )}
    </div>
  )
}
