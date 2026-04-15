'use client'

import { useTranslations } from 'next-intl'

interface FindingsGroupTabsProps {
  counts: { today: number; thisWeek: number; someday: number }
  activeGroup: 'today' | 'thisWeek' | 'someday'
  onGroupChange: (group: 'today' | 'thisWeek' | 'someday') => void
}

const GROUPS = ['today', 'thisWeek', 'someday'] as const

export default function FindingsGroupTabs({ counts, activeGroup, onGroupChange }: FindingsGroupTabsProps) {
  const t = useTranslations('audit')

  const labels: Record<typeof GROUPS[number], string> = {
    today: t('groupToday', { count: counts.today }),
    thisWeek: t('groupThisWeek', { count: counts.thisWeek }),
    someday: t('groupSomeday', { count: counts.someday }),
  }

  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {GROUPS.map((group) => (
        <button
          key={group}
          className={`chip${activeGroup === group ? ' chip--active' : ''}`}
          onClick={() => onGroupChange(group)}
        >
          {labels[group]}
        </button>
      ))}
    </div>
  )
}
