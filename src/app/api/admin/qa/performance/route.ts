import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import type { PerformanceResponse } from '@/types/qa'

export const revalidate = 300

async function isSuperadmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false
  const { data } = await supabase.from('users').select('role').eq('id', user.id).single()
  return data?.role === 'superadmin'
}

export async function GET() {
  try {
    if (!(await isSuperadmin())) {
      return NextResponse.json({ error: 'Keine Berechtigung', code: 'UNAUTHORIZED' }, { status: 403 })
    }

    const supabase = createServiceClient()
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const [lighthouseRes, latencyRes] = await Promise.all([
      supabase
        .from('qa_lighthouse_runs')
        .select('performance, accessibility, best_practices, seo, lcp_ms, inp_ms, cls_score, run_at')
        .order('run_at', { ascending: false })
        .limit(1)
        .maybeSingle(),

      supabase
        .from('qa_metrics')
        .select('model, metric_type, value')
        .in('metric_type', ['latency_p50', 'latency_p95'])
        .gte('measured_at', sevenDaysAgo),
    ])

    // Web Vitals — from latest lighthouse run
    const lhRow = lighthouseRes.data
    const webVitals =
      lhRow && lhRow.lcp_ms != null && lhRow.inp_ms != null && lhRow.cls_score != null
        ? { lcpMs: Number(lhRow.lcp_ms), inpMs: Number(lhRow.inp_ms), cls: Number(lhRow.cls_score) }
        : null

    // Latency by model
    const latencyData = latencyRes.data ?? []
    const models = [...new Set(latencyData.map(r => r.model))]
    const latencyByModel = models.map(model => {
      const p50 = latencyData.find(r => r.model === model && r.metric_type === 'latency_p50')
      const p95 = latencyData.find(r => r.model === model && r.metric_type === 'latency_p95')
      return {
        model,
        p50: p50 ? Math.round(Number(p50.value)) : 0,
        p95: p95 ? Math.round(Number(p95.value)) : 0,
      }
    })

    // Lighthouse
    const lighthouse = lhRow
      ? {
          performance: Number(lhRow.performance),
          accessibility: Number(lhRow.accessibility),
          bestPractices: Number(lhRow.best_practices),
          seo: Number(lhRow.seo),
          runAt: lhRow.run_at,
        }
      : null

    const response: PerformanceResponse = { lighthouse, webVitals, latencyByModel }
    return NextResponse.json(response)
  } catch (err) {
    console.error('[qa/performance]', err)
    return NextResponse.json(
      { error: 'Interner Fehler', code: 'QA_PERFORMANCE_ERROR' },
      { status: 500 }
    )
  }
}
