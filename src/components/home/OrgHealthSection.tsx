'use client'

import { useEffect, useState } from 'react'
import { Users, ChatCircle, Sparkle, CurrencyEur } from '@phosphor-icons/react'

interface OrgStats {
  activeUsers: number
  chatCount: number
  artifactCount: number
  budgetUsedPercent: number | null
  budgetWarning: boolean
}

export function OrgHealthSection() {
  const [stats, setStats] = useState<OrgStats | null>(null)

  useEffect(() => {
    fetch('/api/home/org-stats')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setStats(d) })
  }, [])

  if (!stats) return null

  return (
    <div style={{ marginTop: 32 }}>
      <span style={{
        display: 'block',
        fontSize: 10, fontWeight: 600, letterSpacing: '0.08em',
        textTransform: 'uppercase', color: 'var(--text-tertiary)',
        marginBottom: 12,
      }}>
        Organisation diese Woche
      </span>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 10,
      }}>
        <Stat
          icon={<Users size={16} weight="fill" color="var(--accent)" aria-hidden="true" />}
          value={stats.activeUsers}
          label="aktive Mitglieder"
        />
        <Stat
          icon={<ChatCircle size={16} weight="fill" color="var(--accent)" aria-hidden="true" />}
          value={stats.chatCount}
          label="KI-Gespräche"
        />
        <Stat
          icon={<Sparkle size={16} weight="fill" color="var(--accent)" aria-hidden="true" />}
          value={stats.artifactCount}
          label="neue Artefakte"
        />
        <Stat
          icon={
            <CurrencyEur
              size={16}
              weight="fill"
              color={stats.budgetWarning ? 'var(--error)' : 'var(--accent)'}
              aria-hidden="true"
            />
          }
          value={stats.budgetUsedPercent !== null ? `${stats.budgetUsedPercent}%` : '—'}
          label="Budget genutzt"
        />
      </div>
    </div>
  )
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: number | string; label: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4,
      padding: '14px 16px',
      background: 'var(--bg-surface)', border: '1px solid var(--border)',
      borderRadius: 8,
    }}>
      {icon}
      <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
        {value}
      </span>
      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
        {label}
      </span>
    </div>
  )
}
