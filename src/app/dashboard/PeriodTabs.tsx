'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const PERIODS = [
  { label: 'Heute', value: 'today' },
  { label: 'Diese Woche', value: 'week' },
  { label: 'Dieser Monat', value: 'month' },
]

export default function PeriodTabs() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const current = searchParams.get('period') ?? 'month'

  return (
    <div
      style={{
        display: 'flex',
        gap: 2,
        background: 'rgba(255,255,255,0.60)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.65)',
        borderRadius: 10,
        padding: 3,
      }}
    >
      {PERIODS.map((p) => {
        const active = p.value === current
        return (
          <button
            key={p.value}
            onClick={() => router.push(`/dashboard?period=${p.value}`)}
            style={{
              fontSize: 12,
              fontWeight: active ? 600 : 400,
              padding: '5px 14px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s',
              background: active ? 'var(--active-bg)' : 'transparent',
              color: active ? 'var(--active-text)' : 'var(--text-secondary)',
              boxShadow: active ? '0 2px 8px rgba(26,46,35,0.25)' : 'none',
              fontFamily: 'inherit',
            }}
          >
            {p.label}
          </button>
        )
      })}
    </div>
  )
}
