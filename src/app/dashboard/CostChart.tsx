'use client'

import { AreaChart } from '@tremor/react'

type Point = { Datum: string; 'Kosten €': number }

export default function CostChart({ data }: { data: Point[] }) {
  return (
    <AreaChart
      data={data}
      index="Datum"
      categories={['Kosten €']}
      colors={['lime']}
      valueFormatter={(v) => `€${v.toFixed(4)}`}
      showAnimation
      showLegend={false}
      className="h-52"
    />
  )
}
