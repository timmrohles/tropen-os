'use client'

import { useSearchParams } from 'next/navigation'
import { useRouter } from '@/i18n/navigation'

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
            className={active ? 'chip chip--active' : 'chip'}
            onClick={() => router.push(`/dashboard?period=${p.value}`)}
          >
            {p.label}
          </button>
        )
      })}
    </div>
  )
}
