import { createLogger } from '@/lib/logger'
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import type { RoutingResponse } from '@/types/qa'
const log = createLogger('admin/qa/routing')

export const dynamic = 'force-dynamic'

async function isSuperadmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false
  const { data } = await supabase.from('users').select('role').eq('id', user.id).single()
  return data?.role === 'superadmin'
}

export async function GET(request: NextRequest) {
  try {
    if (!(await isSuperadmin())) {
      return NextResponse.json({ error: 'Keine Berechtigung', code: 'UNAUTHORIZED' }, { status: 403 })
    }

    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100)
    const offset = parseInt(searchParams.get('offset') ?? '0')

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const [logRes, statsRes] = await Promise.all([
      supabase
        .from('qa_routing_log')
        .select('id, task_type, model_selected, routing_reason, latency_ms, status, created_at')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1),

      supabase
        .from('qa_routing_log')
        .select('model_selected, status, latency_ms, created_at')
        .gte('created_at', sevenDaysAgo),
    ])

    const allStats = statsRes.data ?? []
    const decisionsToday = allStats.filter(r => new Date(r.created_at) >= todayStart).length
    const successCount = allStats.filter(r => r.status === 'success').length
    const latencies = allStats.filter(r => r.latency_ms != null).map(r => r.latency_ms as number)
    const avgOverheadMs =
      latencies.length > 0
        ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
        : 0

    // Modell-Verteilung (als BarList-Format: name + value)
    const modelCounts: Record<string, number> = {}
    for (const r of allStats) {
      modelCounts[r.model_selected] = (modelCounts[r.model_selected] ?? 0) + 1
    }
    const total = allStats.length
    const modelDistribution = Object.entries(modelCounts)
      .map(([name, count]) => ({
        name,
        value: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.value - a.value)

    const response: RoutingResponse = {
      stats: {
        decisionsToday,
        accuracy: total > 0 ? Math.round((successCount / total) * 1000) / 10 : 0,
        avgOverheadMs,
        modelDistribution,
      },
      log: (logRes.data ?? []).map(r => ({
        id: r.id,
        time: new Date(r.created_at).toLocaleTimeString('de-DE', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        taskType: r.task_type,
        model: r.model_selected,
        routingReason: r.routing_reason,
        latencyMs: r.latency_ms,
        status: r.status as 'success' | 'timeout' | 'error',
      })),
    }

    return NextResponse.json(response)
  } catch (err) {
    log.error('[qa/routing]', err)
    return NextResponse.json(
      { error: 'Interner Fehler', code: 'QA_ROUTING_ERROR' },
      { status: 500 }
    )
  }
}
