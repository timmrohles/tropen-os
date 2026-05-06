'use client'

// KillerStatusBadge — Sprint 6b₂ + 9-Polish-1 (ADR-027)
// Drei Haupt-Stati: 🛑 Stopper | 🟡 Veröffentlichbar mit Polish-Bedarf | 🟢 Veröffentlichbar
// Plus: ⏱ Noch kein Audit (variant='empty')
// POLISH_THRESHOLD: < 70% = "mit Polish-Bedarf" (nur relevant bei 0 Stoppern)

import { CheckCircle, XCircle, Clock, Warning } from '@phosphor-icons/react'

type BadgeVariant = 'full' | 'compact' | 'empty'

const POLISH_THRESHOLD = 70

interface KillerStatusBadgeProps {
  count: number
  polishScore?: number  // Sprint 9-Polish-1: Hybrid-Badge
  variant?: BadgeVariant
}

export function KillerStatusBadge({ count, polishScore, variant = 'full' }: KillerStatusBadgeProps) {
  const isBlocked = count > 0
  const hasPolishConcern = !isBlocked && polishScore !== undefined && polishScore < POLISH_THRESHOLD

  if (variant === 'empty') {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        fontSize: 12, color: 'var(--text-tertiary)',
        padding: '3px 10px', borderRadius: 20,
        border: '1px solid var(--border)',
        background: 'var(--bg-surface)',
        whiteSpace: 'nowrap',
      }}>
        <Clock size={12} weight="bold" aria-hidden="true" />
        Noch kein Audit
      </span>
    )
  }

  if (variant === 'compact') {
    if (isBlocked) {
      return (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
          border: '1.5px solid var(--error)', background: 'rgba(200,85,61,0.08)',
          color: 'var(--error)', whiteSpace: 'nowrap',
        }}>
          <XCircle size={13} weight="fill" aria-hidden="true" />
          {count} Stopper
        </span>
      )
    }
    if (hasPolishConcern) {
      return (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
          border: '1.5px solid var(--status-risky)', background: 'rgba(229,160,0,0.08)',
          color: 'var(--text-primary)', whiteSpace: 'nowrap',
        }}>
          <Warning size={13} weight="fill" color="var(--status-risky)" aria-hidden="true" />
          Veröffentlichbar · Polish-Bedarf
        </span>
      )
    }
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
        border: '1.5px solid var(--teal)', background: 'rgba(30,112,112,0.08)',
        color: 'var(--teal)', whiteSpace: 'nowrap',
      }}>
        <CheckCircle size={13} weight="fill" aria-hidden="true" />
        Veröffentlichbar
      </span>
    )
  }

  // Full variant (Audit-Detail-Seite)
  if (isBlocked) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 18px', borderRadius: 8,
        background: 'rgba(200,85,61,0.08)', border: '1.5px solid var(--error)',
      }}>
        <XCircle size={22} weight="fill" color="var(--error)" aria-hidden="true" />
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.2, color: 'var(--error)' }}>
            {count} Stopper
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1 }}>
            Blockiert Veröffentlichung — Stopper unten beheben
          </div>
        </div>
      </div>
    )
  }

  if (hasPolishConcern) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 18px', borderRadius: 8,
        background: 'rgba(229,160,0,0.08)', border: '1.5px solid var(--status-risky)',
      }}>
        <Warning size={22} weight="fill" color="var(--status-risky)" aria-hidden="true" />
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.2, color: 'var(--text-primary)' }}>
            Veröffentlichbar mit Polish-Bedarf
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1 }}>
            0 Stopper · Polish-Score unter {POLISH_THRESHOLD}%
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 18px', borderRadius: 8,
      background: 'rgba(30,112,112,0.08)', border: '1.5px solid var(--teal)',
    }}>
      <CheckCircle size={22} weight="fill" color="var(--teal)" aria-hidden="true" />
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.2, color: 'var(--teal)' }}>
          Veröffentlichbar
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1 }}>
          0 Stopper gefunden
        </div>
      </div>
    </div>
  )
}
