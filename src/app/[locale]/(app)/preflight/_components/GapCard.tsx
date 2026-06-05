'use client'

import { useState } from 'react'
import { ArrowRight, Check, CaretDown, CaretUp } from '@phosphor-icons/react'
import type { Gap, PreflightResult } from '@/lib/preflight/types'
import { AppSection } from '@/components/app-ui/AppSection'

// ─── Gap Card (compact by default, depth on demand) ───────────────────────────

export function GapCard({ gap }: { gap: Gap }) {
  const [done, setDone] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const isRed = gap.kosten === 'red'
  const recommendation = gap.action ?? gap.default

  // Expand shows plain + warum + default when there's depth beyond the one-liner
  const hasExpandableContent = !!(gap.plain || gap.warum)

  return (
    <div
      style={{
        // Use ONLY longhand border props — no shorthand border/borderLeft which causes React warning
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'var(--border)',
        borderLeftWidth: 3,
        borderLeftStyle: 'solid',
        borderLeftColor: done ? 'var(--border)' : isRed ? 'var(--error)' : 'var(--status-risky)',
        borderRadius: '0 6px 6px 0',
        background: done ? 'var(--surface-cool)' : 'var(--bg-surface)',
        marginBottom: 8,
        opacity: done ? 0.65 : 1,
        transition: 'opacity 200ms, background 200ms',
      }}
    >
      {/* ── Collapsed row: domain · frage · recommendation · badge ── */}
      <div style={{ padding: '10px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Domain label */}
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--text-tertiary)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}>
              {gap.domain}
            </span>

            {/* Question — the title */}
            <p style={{
              margin: '3px 0 6px',
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--text-primary)',
              lineHeight: 1.4,
              textDecoration: done ? 'line-through' : 'none',
            }}>
              {gap.frage}
            </p>

            {/* One-line recommendation */}
            {recommendation && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                <ArrowRight size={12} weight="bold" color="var(--teal)" style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  {recommendation}
                </span>
              </div>
            )}
          </div>

          {/* Badge */}
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

        {/* ── Action row: Erledigt + Mehr ─────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
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
              padding: '3px 10px',
            }}
            aria-pressed={done}
          >
            <Check size={12} weight="bold" aria-hidden="true" />
            {done ? 'Erledigt ✓' : 'Erledigt'}
          </button>

          {hasExpandableContent && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setExpanded(x => !x)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 12,
                padding: '3px 10px',
                color: 'var(--text-tertiary)',
              }}
              aria-expanded={expanded}
            >
              {expanded
                ? <CaretUp size={11} weight="bold" aria-hidden="true" />
                : <CaretDown size={11} weight="bold" aria-hidden="true" />}
              Mehr
            </button>
          )}
        </div>
      </div>

      {/* ── Expandable depth: plain + warum + default ──────────────── */}
      {expanded && hasExpandableContent && (
        <div
          style={{
            padding: '12px 14px',
            background: 'var(--surface-cool)',
            borderTopWidth: '1px',
            borderTopStyle: 'solid',
            borderTopColor: 'var(--border)',
            borderRadius: '0 0 6px 0',
          }}
        >
          {/* Was das heißt */}
          {gap.plain && (
            <div style={{ marginBottom: gap.warum ? 10 : 0 }}>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                display: 'block',
                marginBottom: 4,
              }}>
                Was das heißt
              </span>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                {gap.plain}
              </p>
            </div>
          )}

          {/* Warum wichtig */}
          {gap.warum && (
            <div style={{ marginBottom: gap.default ? 10 : 0 }}>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                display: 'block',
                marginBottom: 4,
              }}>
                Warum wichtig
              </span>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                {gap.warum}
              </p>
            </div>
          )}

          {/* Standard (default) */}
          {gap.default && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: gap.plain || gap.warum ? 0 : 0 }}>
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
          <div style={{ padding: '10px 14px' }}>
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
          <div style={{ padding: '10px 14px' }}>
            {yellow.map(gap => (
              <GapCard key={gap.id} gap={gap} />
            ))}
          </div>
        </AppSection>
      )}
    </div>
  )
}
