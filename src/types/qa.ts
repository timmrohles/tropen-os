// src/types/qa.ts
// Response-Typen für alle /api/admin/qa/* Endpoints

export type QaRunType =
  | 'functional' | 'integration' | 'regression'
  | 'bias' | 'hallucination' | 'routing' | 'security' | 'lighthouse'

export type QaRunStatus = 'running' | 'passed' | 'failed' | 'partial'
export type QaTriggeredBy = 'ci_cd' | 'manual' | 'scheduled'
export type QaMetricType =
  | 'quality_score' | 'hallucination_rate' | 'bias_score'
  | 'latency_p50' | 'latency_p95' | 'error_rate' | 'routing_accuracy'
export type QaComplianceStatus = 'pass' | 'warn' | 'fail'

// ── Overview ────────────────────────────────────────────────────────────────

export interface OverviewResponse {
  kpis: {
    avgQualityScore: number
    routingAccuracy: number
    avgLatencyP50: number
    errorRate: number
    routingDecisionsToday: number
  }
  qualityTrend: Array<{
    week: string
    'gpt-4o'?: number
    'claude-sonnet-4'?: number
    'gemini-1.5-pro'?: number
    'mistral-large'?: number
  }>
  errorRateWeek: Array<{ day: string; 'Error Rate': number }>
  complianceSnapshot: Array<{
    article: string
    label: string
    status: QaComplianceStatus
  }>
}

// ── Quality ─────────────────────────────────────────────────────────────────

export interface ModelScore {
  model: string
  qualityScore: number
  hallucinationRate: number
  strengths: string[]
}

export interface BiasScore {
  category: string
  score: number
  threshold: number
  pass: boolean
}

export interface QualityResponse {
  modelScores: ModelScore[]
  biasScores: BiasScore[]
  lastEvalRun: string | null
}

// ── Routing ─────────────────────────────────────────────────────────────────

export interface RoutingLogEntry {
  id: string
  time: string
  taskType: string
  model: string
  routingReason: string
  latencyMs: number | null
  status: 'success' | 'timeout' | 'error'
}

export interface RoutingResponse {
  stats: {
    decisionsToday: number
    accuracy: number
    avgOverheadMs: number
    modelDistribution: Array<{ name: string; value: number }>
  }
  log: RoutingLogEntry[]
}

// ── Performance ─────────────────────────────────────────────────────────────

export interface PerformanceResponse {
  lighthouse: {
    performance: number
    accessibility: number
    bestPractices: number
    seo: number
    runAt: string
  } | null
  webVitals: {
    lcpMs: number
    inpMs: number
    cls: number
  } | null
  latencyByModel: Array<{ model: string; p50: number; p95: number }>
  langsmith: {
    totalRuns: number
    p50LatencyMs: number
    p95LatencyMs: number
    totalTokens: number
    avgTokensPerRun: number
  } | null
}

// ── Compliance ───────────────────────────────────────────────────────────────

export interface ComplianceItem {
  id: string
  article: string
  label: string
  status: QaComplianceStatus
  notes: string | null
  lastCheckedAt: string
}

export interface ComplianceResponse {
  summary: { pass: number; warn: number; fail: number; total: number }
  items: ComplianceItem[]
  openActions: Array<{ article: string; action: string; deadline: string }>
}

// ── Runs ─────────────────────────────────────────────────────────────────────

export interface RunResponse {
  runId: string
  status: 'running'
  message: string
}

// ── Error ────────────────────────────────────────────────────────────────────

export interface QaErrorResponse {
  error: string
  code: string
  details?: unknown
}
