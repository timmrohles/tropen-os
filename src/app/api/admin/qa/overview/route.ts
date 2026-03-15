import { createLogger } from '@/lib/logger'
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import type { OverviewResponse } from '@/types/qa'
const log = createLogger('admin/qa/overview')

export const dynamic = 'force-dynamic'

async function isSuperadmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false
  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  return data?.role === 'superadmin'
}

function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7)
}

function avg(values: number[]): number {
  if (!values.length) return 0
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
}

export async function GET() {
  try {
    if (!(await isSuperadmin())) {
      return NextResponse.json({ error: 'Keine Berechtigung', code: 'UNAUTHORIZED' }, { status: 403 })
    }

    const supabase = createServiceClient()
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const fiveWeeksAgo = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString()
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const [metricsRes, routingRes, qualityTrendRes, complianceRes] = await Promise.all([
      supabase
        .from('qa_metrics')
        .select('model, metric_type, value, measured_at')
        .in('metric_type', ['quality_score', 'latency_p50', 'error_rate'])
        .gte('measured_at', sevenDaysAgo),

      supabase
        .from('qa_routing_log')
        .select('status, latency_ms, created_at')
        .gte('created_at', sevenDaysAgo),

      supabase
        .from('qa_metrics')
        .select('model, value, measured_at')
        .eq('metric_type', 'quality_score')
        .gte('measured_at', fiveWeeksAgo)
        .order('measured_at', { ascending: true }),

      supabase
        .from('qa_compliance_checks')
        .select('article, label, status')
        .order('article'),
    ])

    const metrics = metricsRes.data ?? []
    const routing = routingRes.data ?? []

    // KPIs
    const qualityVals = metrics.filter(m => m.metric_type === 'quality_score').map(m => Number(m.value))
    const latencyVals = metrics.filter(m => m.metric_type === 'latency_p50').map(m => Number(m.value))

    const totalRouting = routing.length
    const successRouting = routing.filter(r => r.status === 'success').length
    const errorRouting = routing.filter(r => r.status === 'error').length
    const routingDecisionsToday = routing.filter(r => new Date(r.created_at) >= todayStart).length

    // Quality-Trend: group by ISO week + model
    type WeekEntry = Record<string, number[]>
    const trendMap = new Map<string, WeekEntry>()

    for (const row of qualityTrendRes.data ?? []) {
      const week = `KW ${getISOWeek(new Date(row.measured_at))}`
      if (!trendMap.has(week)) trendMap.set(week, {})
      const entry = trendMap.get(week)!
      const model = row.model as string
      if (!entry[model]) entry[model] = []
      entry[model].push(Number(row.value))
    }

    const qualityTrend = Array.from(trendMap.entries())
      .slice(-5)
      .map(([week, data]) => ({
        week,
        ...Object.fromEntries(
          Object.entries(data).map(([model, vals]) => [model, avg(vals)])
        ),
      }))

    // Fehlerrate pro Wochentag (letzten 7 Tage)
    const dayNames = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
    const errorRateWeek = Array.from({ length: 7 }, (_, i) => {
      const dayStart = new Date(todayStart)
      dayStart.setDate(todayStart.getDate() - (6 - i))
      const dayEnd = new Date(dayStart)
      dayEnd.setDate(dayStart.getDate() + 1)
      const dayRows = routing.filter(r => {
        const d = new Date(r.created_at)
        return d >= dayStart && d < dayEnd
      })
      const dayErrors = dayRows.filter(r => r.status === 'error').length
      const rate =
        dayRows.length > 0 ? Math.round((dayErrors / dayRows.length) * 1000) / 10 : 0
      const jsDay = dayStart.getDay() // 0=So, 1=Mo...
      const label = dayNames[jsDay === 0 ? 6 : jsDay - 1]
      return { day: label, 'Error Rate': rate }
    })

    const response: OverviewResponse = {
      kpis: {
        avgQualityScore: avg(qualityVals),
        routingAccuracy:
          totalRouting > 0
            ? Math.round((successRouting / totalRouting) * 1000) / 10
            : 0,
        avgLatencyP50: latencyVals.length > 0 ? Math.round(avg(latencyVals)) : 0,
        errorRate:
          totalRouting > 0
            ? Math.round((errorRouting / totalRouting) * 1000) / 10
            : 0,
        routingDecisionsToday,
      },
      qualityTrend,
      errorRateWeek,
      complianceSnapshot: (complianceRes.data ?? []).slice(0, 8).map(c => ({
        article: c.article,
        label: c.label,
        status: c.status as 'pass' | 'warn' | 'fail',
      })),
    }

    return NextResponse.json(response)
  } catch (err) {
    log.error('[qa/overview]', err)
    return NextResponse.json(
      { error: 'Interner Fehler', code: 'QA_OVERVIEW_ERROR' },
      { status: 500 }
    )
  }
}
