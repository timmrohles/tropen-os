'use client'

import React from 'react'
import type { AuditDomain } from '@/lib/audit/types'
import { DOMAIN_LABELS } from './audit-findings-utils'

// ── FilterChipsRow ─────────────────────────────────────────────────────────────

export function FilterChipsRow({
  available, active, counts, onToggle, onReset,
}: {
  available: AuditDomain[]
  active: AuditDomain[]
  counts: Partial<Record<AuditDomain, number>>
  onToggle: (d: AuditDomain) => void
  onReset: () => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', paddingBottom: 4 }}>
      {available.map(cat => {
        const isActive = active.includes(cat)
        const count = counts[cat] ?? 0
        const isDone = count === 0

        if (isDone) {
          return (
            <span
              key={cat}
              title={`${DOMAIN_LABELS[cat]}: keine offenen Findings`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '4px 10px', borderRadius: 20,
                fontSize: 12, fontWeight: 400,
                border: '1px solid var(--border)',
                background: 'var(--bg-surface)',
                color: 'var(--text-tertiary)',
                userSelect: 'none',
              }}
            >
              {DOMAIN_LABELS[cat]}
              <span style={{ fontSize: 9, color: 'var(--teal)', fontWeight: 700 }}>✓</span>
            </span>
          )
        }

        return (
          <button
            key={cat}
            onClick={() => onToggle(cat)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '4px 11px', borderRadius: 20, cursor: 'pointer',
              fontSize: 12, fontWeight: isActive ? 600 : 500,
              border: isActive ? '1.5px solid rgba(255,255,255,0.4)' : '1px solid transparent',
              background: isActive ? 'var(--teal)' : 'var(--teal-hover)',
              color: '#ffffff',
              transition: 'border-color 120ms, background 120ms',
            }}
          >
            {DOMAIN_LABELS[cat]}
            <span style={{
              fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 600,
              padding: '1px 5px', borderRadius: 8,
              background: 'rgba(255,255,255,0.20)',
              color: '#ffffff',
            }}>
              {count}
            </span>
          </button>
        )
      })}
      {active.length > 0 && (
        <button
          onClick={onReset}
          style={{
            fontSize: 11, color: 'var(--text-tertiary)', background: 'none', border: 'none',
            cursor: 'pointer', padding: '4px 4px', textDecoration: 'underline', textUnderlineOffset: 2,
          }}
        >
          Alle anzeigen
        </button>
      )}
    </div>
  )
}
