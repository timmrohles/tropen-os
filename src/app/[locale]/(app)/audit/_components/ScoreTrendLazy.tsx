'use client'
import dynamic from 'next/dynamic'

// ssr:false muss in einem Client Component stehen (Next.js 15.5)
// Wrapping in a function component prevents RSC from mishandling the dynamic() result
// as a direct module export — exporting dynamic() directly breaks RSC module ID resolution.
const ScoreTrendDynamic = dynamic(() => import('./ScoreTrend'), { ssr: false })

interface RunSummary { id: string; percentage: number; status: string; created_at: string }

export default function ScoreTrendLazy({ runs }: { runs: RunSummary[] }) {
  return <ScoreTrendDynamic runs={runs} />
}
