import { createLogger } from '@/lib/logger'
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import type { QualityResponse } from '@/types/qa'
const log = createLogger('admin/qa/quality')

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

const MODEL_STRENGTHS: Record<string, string[]> = {
  'gpt-4o': ['Code-Analyse', 'Reasoning', 'Instruction-Following'],
  'claude-sonnet-4': ['Lange Dokumente', 'Nuanciertes Schreiben', 'Sicherheit'],
  'gemini-1.5-pro': ['Multimodal', 'Lange Kontextfenster', 'Übersetzung'],
  'mistral-large': ['Effizienz', 'Mehrsprachig', 'Kostengünstig'],
}

const BIAS_CATEGORIES = ['gender', 'sprache', 'alter', 'herkunft', 'bildung']

export async function GET() {
  try {
    if (!(await isSuperadmin())) {
      return NextResponse.json({ error: 'Keine Berechtigung', code: 'UNAUTHORIZED' }, { status: 403 })
    }

    const supabase = createServiceClient()
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const [qualityRes, biasRes, lastRunRes] = await Promise.all([
      supabase
        .from('qa_metrics')
        .select('model, metric_type, value')
        .in('metric_type', ['quality_score', 'hallucination_rate'])
        .gte('measured_at', thirtyDaysAgo),

      supabase
        .from('qa_metrics')
        .select('model, bias_category, value')
        .eq('metric_type', 'bias_score')
        .gte('measured_at', thirtyDaysAgo),

      supabase
        .from('qa_test_runs')
        .select('completed_at')
        .in('run_type', ['bias', 'hallucination'])
        .eq('status', 'passed')
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])

    const metrics = qualityRes.data ?? []
    const biasMetrics = biasRes.data ?? []

    function avg(vals: number[]) {
      if (!vals.length) return 0
      return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
    }

    // Modell-Scores
    const models = [...new Set(metrics.map(m => m.model))]
    const modelScores = models.map(model => {
      const quality = metrics
        .filter(m => m.model === model && m.metric_type === 'quality_score')
        .map(m => Number(m.value))
      const hallucination = metrics
        .filter(m => m.model === model && m.metric_type === 'hallucination_rate')
        .map(m => Number(m.value))
      return {
        model,
        qualityScore: avg(quality),
        hallucinationRate: avg(hallucination),
        strengths: MODEL_STRENGTHS[model] ?? [],
      }
    })

    // Bias-Scores pro Kategorie (Ø über alle Modelle)
    const biasScores = BIAS_CATEGORIES.map(category => {
      const vals = biasMetrics
        .filter(m => m.bias_category === category)
        .map(m => Number(m.value))
      const score = avg(vals)
      return { category, score, threshold: 95, pass: score >= 95 }
    })

    const response: QualityResponse = {
      modelScores,
      biasScores,
      lastEvalRun: lastRunRes.data?.completed_at ?? null,
    }

    return NextResponse.json(response)
  } catch (err) {
    log.error('[qa/quality]', err)
    return NextResponse.json(
      { error: 'Interner Fehler', code: 'QA_QUALITY_ERROR' },
      { status: 500 }
    )
  }
}
