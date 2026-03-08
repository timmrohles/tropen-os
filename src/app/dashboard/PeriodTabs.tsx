'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Tab, TabGroup, TabList } from '@tremor/react'

const PERIODS = [
  { label: 'Heute', value: 'today' },
  { label: 'Diese Woche', value: 'week' },
  { label: 'Dieser Monat', value: 'month' }
]

export default function PeriodTabs() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const current = searchParams.get('period') ?? 'month'
  const index = Math.max(0, PERIODS.findIndex((p) => p.value === current))

  return (
    <TabGroup
      index={index}
      onIndexChange={(i) => router.push(`/dashboard?period=${PERIODS[i].value}`)}
    >
      <TabList variant="solid">
        {PERIODS.map((p) => (
          <Tab key={p.value}>{p.label}</Tab>
        ))}
      </TabList>
    </TabGroup>
  )
}
