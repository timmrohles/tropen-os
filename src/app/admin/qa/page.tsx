'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AreaChart,
  BarChart,
  BarList,
  Badge,
  ProgressBar,
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
} from '@tremor/react'
import type {
  OverviewResponse,
  QualityResponse,
  RoutingResponse,
  PerformanceResponse,
  ComplianceResponse,
  QaRunType,
  QaComplianceStatus,
} from '@/types/qa'

// ── Skeleton ──────────────────────────────────────────────────────────────

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-white/10 ${className}`} />
}

// ── Helpers ───────────────────────────────────────────────────────────────

type StatusColor = 'emerald' | 'yellow' | 'red'

function StatusBadge({ status }: { status: QaComplianceStatus }) {
  const map: Record<QaComplianceStatus, { color: StatusColor; label: string }> = {
    pass: { color: 'emerald', label: '✓ OK' },
    warn: { color: 'yellow', label: '○ Offen' },
    fail: { color: 'red', label: '✕ Fehlt' },
  }
  const { color, label } = map[status]
  return <Badge color={color}>{label}</Badge>
}

const MODEL_COLORS: Record<string, string> = {
  'claude-sonnet-4': 'text-emerald-400',
  'gpt-4o': 'text-blue-400',
  'gemini-1.5-pro': 'text-yellow-400',
  'mistral-large': 'text-purple-400',
}

const MODEL_TREMOR_COLORS: Record<string, 'emerald' | 'blue' | 'yellow' | 'violet'> = {
  'claude-sonnet-4': 'emerald',
  'gpt-4o': 'blue',
  'gemini-1.5-pro': 'yellow',
  'mistral-large': 'violet',
}

function modelTextColor(model: string) {
  return MODEL_COLORS[model] ?? 'text-white/70'
}

function SectionCard({
  title,
  action,
  children,
}: {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="rounded-lg bg-white/5 border border-white/10 p-6">
      <div className="flex items-center justify-between mb-5">
        <span className="text-[10px] uppercase tracking-widest text-white/40">{title}</span>
        {action && <div>{action}</div>}
      </div>
      {children}
    </div>
  )
}

function KpiCard({
  label,
  value,
  sub,
  valueClass = 'text-emerald-400',
  loading = false,
}: {
  label: string
  value: string
  sub: string
  valueClass?: string
  loading?: boolean
}) {
  return (
    <div className="rounded-lg bg-white/5 border border-white/10 p-6">
      <div className="text-[10px] uppercase tracking-widest text-white/40 mb-2">{label}</div>
      {loading ? (
        <Skeleton className="h-8 w-24 mb-1" />
      ) : (
        <div className={`text-3xl font-semibold leading-none mb-1 ${valueClass}`}>{value}</div>
      )}
      <div className="text-xs text-white/30 mt-1">{sub}</div>
    </div>
  )
}

// ── Panels ────────────────────────────────────────────────────────────────

function OverviewPanel({ data, loading }: { data: OverviewResponse | null; loading: boolean }) {
  const pass = data?.complianceSnapshot.filter(c => c.status === 'pass').length ?? 0
  const total = data?.complianceSnapshot.length ?? 0

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-4 gap-3">
        <KpiCard
          label="Ø Output Quality"
          value={data ? `${data.kpis.avgQualityScore}%` : '—'}
          sub="alle Modelle · diese Woche"
          loading={loading}
        />
        <KpiCard
          label="Routing Accuracy"
          value={data ? `${data.kpis.routingAccuracy}%` : '—'}
          sub="korrekte Modellwahl"
          loading={loading}
        />
        <KpiCard
          label="Ø Latenz (p50)"
          value={data ? `${data.kpis.avgLatencyP50}ms` : '—'}
          sub="End-to-End inkl. Routing"
          valueClass="text-yellow-400"
          loading={loading}
        />
        <KpiCard
          label="Error Rate"
          value={data ? `${data.kpis.errorRate}%` : '—'}
          sub="letzte 7 Tage"
          valueClass={data && data.kpis.errorRate > 5 ? 'text-red-400' : 'text-emerald-400'}
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <SectionCard title="Output Quality · Verlauf">
          {loading ? (
            <Skeleton className="h-44 w-full" />
          ) : (
            <AreaChart
              className="h-44"
              data={data?.qualityTrend ?? []}
              index="week"
              categories={['claude-sonnet-4', 'gpt-4o', 'gemini-1.5-pro', 'mistral-large']}
              colors={['emerald', 'blue', 'yellow', 'violet']}
              yAxisWidth={32}
              minValue={75}
              showLegend={false}
              showGradient={false}
            />
          )}
        </SectionCard>

        <SectionCard
          title="Error Rate · letzte 7 Tage"
          action={
            data && !loading ? (
              <Badge color={data.kpis.errorRate <= 2 ? 'emerald' : data.kpis.errorRate <= 5 ? 'yellow' : 'red'}>
                {data.kpis.errorRate <= 2 ? 'Normal' : data.kpis.errorRate <= 5 ? 'Erhöht' : 'Kritisch'}
              </Badge>
            ) : null
          }
        >
          {loading ? (
            <Skeleton className="h-44 w-full" />
          ) : (
            <BarChart
              className="h-44"
              data={data?.errorRateWeek ?? []}
              index="day"
              categories={['Error Rate']}
              colors={['emerald']}
              yAxisWidth={32}
              showLegend={false}
            />
          )}
        </SectionCard>
      </div>

      <SectionCard
        title="EU AI Act · Schnellstatus"
        action={
          !loading && data ? (
            <span className="text-xs text-white/30">{pass}/{total} bestanden</span>
          ) : null
        }
      >
        {loading ? (
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-24" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {(data?.complianceSnapshot ?? []).map((c) => (
              <div key={c.article} className="flex items-center gap-2">
                <span
                  className={
                    c.status === 'pass'
                      ? 'text-emerald-400'
                      : c.status === 'warn'
                        ? 'text-yellow-400'
                        : 'text-red-400'
                  }
                >
                  {c.status === 'pass' ? '✓' : c.status === 'warn' ? '○' : '✕'}
                </span>
                <span className={`text-xs ${c.status === 'pass' ? 'text-white/50' : 'text-white'}`}>
                  {c.article}
                </span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  )
}

function QualityPanel({ data, loading }: { data: QualityResponse | null; loading: boolean }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-4 gap-3">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-lg bg-white/5 border border-white/10 p-6">
                <Skeleton className="h-3 w-28 mb-3" />
                <Skeleton className="h-10 w-16 mb-3" />
                <Skeleton className="h-2 w-full mb-3" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))
          : (data?.modelScores ?? []).map((m) => {
              const tColor = modelTextColor(m.model)
              const barColor = MODEL_TREMOR_COLORS[m.model] ?? 'emerald'
              return (
                <div key={m.model} className="rounded-lg bg-white/5 border border-white/10 p-6">
                  <div className="text-[10px] uppercase tracking-widest text-white/40 mb-3">{m.model}</div>
                  <div className={`text-4xl font-semibold leading-none mb-3 ${tColor}`}>
                    {m.qualityScore}
                  </div>
                  <ProgressBar value={m.qualityScore} color={barColor} className="mb-3" />
                  <div className="text-[10px] text-white/30 mb-1">Stärken</div>
                  <div className="text-xs text-white/60">{m.strengths.join(', ') || '—'}</div>
                </div>
              )
            })}
      </div>

      <SectionCard
        title="Bias & Fairness · Scores"
        action={
          data?.lastEvalRun ? (
            <span className="text-xs text-white/30">
              Letzte Prüfung:{' '}
              {new Date(data.lastEvalRun).toLocaleDateString('de-DE', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}
            </span>
          ) : (
            <span className="text-xs text-white/30">Schwelle: 95</span>
          )
        }
      >
        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr>
                {['Kategorie', 'Score', 'Schwelle', 'Status', 'Visualisierung'].map((h) => (
                  <th key={h} className="text-left text-[10px] uppercase tracking-widest text-white/30 pb-3 px-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data?.biasScores ?? []).map((b) => (
                <tr key={b.category} className="border-t border-white/5">
                  <td className="py-3 px-3 text-sm text-white/80 capitalize">{b.category}</td>
                  <td className={`py-3 px-3 text-sm font-semibold ${b.pass ? 'text-emerald-400' : 'text-red-400'}`}>
                    {b.score}
                  </td>
                  <td className="py-3 px-3 text-sm text-white/30">{b.threshold}</td>
                  <td className="py-3 px-3">
                    <Badge color={b.pass ? 'emerald' : 'red'}>{b.pass ? 'Pass' : 'Fail'}</Badge>
                  </td>
                  <td className="py-3 px-3 w-48">
                    <ProgressBar value={b.score} color={b.pass ? 'emerald' : 'red'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </SectionCard>

      <SectionCard title="Hallucination Rate · letzte Eval-Runde">
        {loading ? (
          <div className="grid grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-24" />)}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-6">
            {(data?.modelScores ?? []).map((m) => (
              <div key={m.model}>
                <div className="text-[10px] text-white/30 mb-1">{m.model}</div>
                <div className={`text-2xl font-semibold ${modelTextColor(m.model)}`}>
                  {m.hallucinationRate}%
                </div>
                <div className="text-[10px] text-white/30 mt-0.5">Hallucination Rate</div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  )
}

function RoutingPanel({
  data,
  loading,
  onRun,
  running,
}: {
  data: RoutingResponse | null
  loading: boolean
  onRun: (type: QaRunType) => void
  running: boolean
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-3">
        <KpiCard
          label="Routing Decisions heute"
          value={data ? data.stats.decisionsToday.toLocaleString('de-DE') : '—'}
          sub=""
          valueClass="text-white"
          loading={loading}
        />
        <KpiCard
          label="Accuracy"
          value={data ? `${data.stats.accuracy}%` : '—'}
          sub="korrekte Modellwahl"
          loading={loading}
        />
        <KpiCard
          label="Ø Routing Overhead"
          value={data ? `${data.stats.avgOverheadMs}ms` : '—'}
          sub="zusätzliche Latenz"
          loading={loading}
        />
      </div>

      <SectionCard
        title="Live Routing Log"
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={() => onRun('routing')}
              disabled={running}
              className="text-xs bg-white/10 hover:bg-white/20 border border-white/20 text-white/70 px-3 py-1 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {running ? '● Läuft…' : 'Test ausführen'}
            </button>
            <Badge color="emerald">● Live</Badge>
          </div>
        }
      >
        {loading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr>
                {['Zeit', 'Task-Typ', 'Modell', 'Routing-Grund', 'Latenz', 'Status'].map((h) => (
                  <th key={h} className="text-left text-[10px] uppercase tracking-widest text-white/30 pb-3 px-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data?.log ?? []).map((r) => (
                <tr key={r.id} className={`border-t border-white/5 ${r.status !== 'success' ? 'opacity-60' : ''}`}>
                  <td className="py-3 px-3 text-xs text-white/30 font-mono">{r.time}</td>
                  <td className="py-3 px-3 text-sm text-white/80">{r.taskType}</td>
                  <td className={`py-3 px-3 text-sm ${modelTextColor(r.model)}`}>{r.model}</td>
                  <td className="py-3 px-3">
                    <code className="text-xs bg-white/5 text-white/50 px-2 py-0.5 rounded">
                      {r.routingReason}
                    </code>
                  </td>
                  <td
                    className={`py-3 px-3 text-sm ${
                      r.status !== 'success'
                        ? 'text-red-400'
                        : r.latencyMs !== null && r.latencyMs < 400
                          ? 'text-emerald-400'
                          : 'text-yellow-400'
                    }`}
                  >
                    {r.status === 'success' && r.latencyMs !== null ? `${r.latencyMs}ms` : r.status}
                  </td>
                  <td className="py-3 px-3">
                    <Badge color={r.status === 'success' ? 'emerald' : r.status === 'timeout' ? 'yellow' : 'red'}>
                      {r.status === 'success' ? 'OK' : r.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </SectionCard>

      <SectionCard title="Modell-Verteilung · heute">
        {loading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
          </div>
        ) : (
          <BarList data={data?.stats.modelDistribution ?? []} className="mt-2" color="emerald" />
        )}
      </SectionCard>
    </div>
  )
}

function PerformancePanel({ data, loading }: { data: PerformanceResponse | null; loading: boolean }) {
  const lhScores = data?.lighthouse
    ? [
        { label: 'Performance', val: data.lighthouse.performance },
        { label: 'Accessibility', val: data.lighthouse.accessibility },
        { label: 'Best Practices', val: data.lighthouse.bestPractices },
        { label: 'SEO', val: data.lighthouse.seo },
      ]
    : []

  return (
    <div className="flex flex-col gap-3">
      <SectionCard
        title="Lighthouse Scores"
        action={
          data?.lighthouse ? (
            <span className="text-xs text-white/30">
              Letzter Run:{' '}
              {new Date(data.lighthouse.runAt).toLocaleString('de-DE', {
                dateStyle: 'short',
                timeStyle: 'short',
              })}
            </span>
          ) : null
        }
      >
        {loading ? (
          <div className="grid grid-cols-4 gap-6 mt-2">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
          </div>
        ) : data?.lighthouse ? (
          <div className="grid grid-cols-4 gap-6 mt-2">
            {lhScores.map((l) => {
              const color = l.val >= 90 ? 'emerald' : l.val >= 75 ? 'yellow' : 'red'
              const tColor = l.val >= 90 ? 'text-emerald-400' : l.val >= 75 ? 'text-yellow-400' : 'text-red-400'
              return (
                <div key={l.label}>
                  <div className="text-[10px] uppercase tracking-widest text-white/40 mb-2">{l.label}</div>
                  <div className={`text-4xl font-semibold mb-3 ${tColor}`}>{l.val}</div>
                  <ProgressBar value={l.val} color={color as 'emerald' | 'yellow' | 'red'} />
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-white/30">Noch kein Lighthouse-Run vorhanden.</p>
        )}
      </SectionCard>

      <div className="grid grid-cols-3 gap-3">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-lg bg-white/5 border border-white/10 p-6">
                <Skeleton className="h-3 w-28 mb-2" />
                <Skeleton className="h-10 w-20 mb-2" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))
          : data?.webVitals
            ? [
                {
                  desc: 'Largest Contentful Paint',
                  val: `${(data.webVitals.lcpMs / 1000).toFixed(1)}s`,
                  target: '<2.5s',
                  ok: data.webVitals.lcpMs <= 2500,
                },
                {
                  desc: 'Interaction to Next Paint',
                  val: `${data.webVitals.inpMs}ms`,
                  target: '<200ms',
                  ok: data.webVitals.inpMs <= 200,
                },
                {
                  desc: 'Cumulative Layout Shift',
                  val: data.webVitals.cls.toFixed(2),
                  target: '<0.1',
                  ok: data.webVitals.cls <= 0.1,
                },
              ].map((v) => (
                <div key={v.desc} className="rounded-lg bg-white/5 border border-white/10 p-6">
                  <div className="text-[10px] uppercase tracking-widest text-white/40 mb-2">{v.desc}</div>
                  <div className={`text-4xl font-semibold leading-none mb-2 ${v.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                    {v.val}
                  </div>
                  <div className="text-xs text-white/30">Ziel: {v.target}</div>
                </div>
              ))
            : (
              <div className="col-span-3 rounded-lg bg-white/5 border border-white/10 p-6">
                <p className="text-sm text-white/30">Noch keine Web-Vitals-Daten vorhanden.</p>
              </div>
            )}
      </div>

      <SectionCard title="API Latenz pro Modell (ms)">
        {loading ? (
          <Skeleton className="h-52 w-full" />
        ) : (
          <BarChart
            className="h-52 mt-2"
            data={data?.latencyByModel ?? []}
            index="model"
            categories={['p50', 'p95']}
            colors={['emerald', 'blue']}
            yAxisWidth={48}
            showLegend
          />
        )}
      </SectionCard>
    </div>
  )
}

function CompliancePanel({
  data,
  loading,
  onRun,
  running,
}: {
  data: ComplianceResponse | null
  loading: boolean
  onRun: (type: QaRunType) => void
  running: boolean
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-3">
        <KpiCard
          label="EU AI Act · Bestanden"
          value={data ? `${data.summary.pass} / ${data.summary.total}` : '—'}
          sub="Checks bestanden"
          loading={loading}
        />
        <KpiCard
          label="EU AI Act · Ausstehend"
          value={data ? String(data.summary.warn) : '—'}
          sub="Checks ausstehend"
          valueClass="text-yellow-400"
          loading={loading}
        />
        <KpiCard
          label="EU AI Act · Fehlend"
          value={data ? String(data.summary.fail) : '—'}
          sub="Checks fehlen"
          valueClass="text-red-400"
          loading={loading}
        />
      </div>

      <SectionCard
        title="Artikel-Checks"
        action={
          <button
            onClick={() => onRun('bias')}
            disabled={running}
            className="text-xs bg-white/10 hover:bg-white/20 border border-white/20 text-white/70 px-3 py-1 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {running ? '● Läuft…' : 'Test ausführen'}
          </button>
        }
      >
        {loading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr>
                {['Artikel', 'Anforderung', 'Status', 'Notizen'].map((h) => (
                  <th key={h} className="text-left text-[10px] uppercase tracking-widest text-white/30 pb-3 px-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data?.items ?? []).map((c) => (
                <tr key={c.id} className="border-t border-white/5">
                  <td className="py-3 px-3 text-xs text-white/40 font-mono">{c.article}</td>
                  <td className="py-3 px-3 text-sm text-white/80">{c.label}</td>
                  <td className="py-3 px-3">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="py-3 px-3 text-xs text-white/30">{c.notes ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </SectionCard>

      {!loading && (data?.openActions ?? []).length > 0 && (
        <div className="rounded-lg bg-yellow-400/5 border border-yellow-400/20 p-6">
          <div className="text-xs uppercase tracking-widest text-yellow-400 mb-4">⚠ Offene Punkte</div>
          <div className="flex flex-col gap-4">
            {(data?.openActions ?? []).map((o) => (
              <div key={o.article} className="flex gap-4 items-start">
                <span className="text-xs text-yellow-400 shrink-0 mt-0.5 font-mono">{o.article}</span>
                <span className="text-sm text-white/60 flex-1">{o.action}</span>
                <Badge color="yellow">{o.deadline}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────

const TABS = ['Übersicht', 'LLM Qualität', 'Routing Log', 'Performance', 'Compliance']

export default function QADashboard() {
  const [activeTab, setActiveTab] = useState(0)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const [overviewData, setOverviewData] = useState<OverviewResponse | null>(null)
  const [qualityData, setQualityData] = useState<QualityResponse | null>(null)
  const [routingData, setRoutingData] = useState<RoutingResponse | null>(null)
  const [performanceData, setPerformanceData] = useState<PerformanceResponse | null>(null)
  const [complianceData, setComplianceData] = useState<ComplianceResponse | null>(null)

  const [overviewLoading, setOverviewLoading] = useState(true)
  const [qualityLoading, setQualityLoading] = useState(true)
  const [routingLoading, setRoutingLoading] = useState(true)
  const [performanceLoading, setPerformanceLoading] = useState(true)
  const [complianceLoading, setComplianceLoading] = useState(true)

  const [runRunning, setRunRunning] = useState(false)
  const routingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchOverview = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/qa/overview')
      if (res.ok) setOverviewData(await res.json())
    } finally {
      setOverviewLoading(false)
    }
  }, [])

  const fetchQuality = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/qa/quality')
      if (res.ok) setQualityData(await res.json())
    } finally {
      setQualityLoading(false)
    }
  }, [])

  const fetchRouting = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/qa/routing?limit=20')
      if (res.ok) setRoutingData(await res.json())
    } finally {
      setRoutingLoading(false)
      setLastUpdated(new Date())
    }
  }, [])

  const fetchPerformance = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/qa/performance')
      if (res.ok) setPerformanceData(await res.json())
    } finally {
      setPerformanceLoading(false)
    }
  }, [])

  const fetchCompliance = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/qa/compliance')
      if (res.ok) setComplianceData(await res.json())
    } finally {
      setComplianceLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchOverview()
    void fetchQuality()
    void fetchRouting()
    void fetchPerformance()
    void fetchCompliance()

    routingIntervalRef.current = setInterval(fetchRouting, 30_000)
    return () => {
      if (routingIntervalRef.current) clearInterval(routingIntervalRef.current)
    }
  }, [fetchOverview, fetchQuality, fetchRouting, fetchPerformance, fetchCompliance])

  const handleRun = useCallback(async (runType: QaRunType) => {
    if (runRunning) return
    setRunRunning(true)
    try {
      await fetch('/api/admin/qa/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runType }),
      })
    } finally {
      setRunRunning(false)
      void fetchRouting()
    }
  }, [runRunning, fetchRouting])

  const now = lastUpdated
    ? lastUpdated.toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' })
    : '—'

  return (
    <div className="content-max dark pt-8 pb-12">
      <div className="flex items-end justify-between mb-8 pb-5 border-b border-white/10">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-white/30 mb-1">
            Admin · QA Dashboard
          </div>
          <h1 className="text-2xl font-semibold text-white">Quality &amp; Compliance</h1>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-widest text-white/30">
            Letzte Aktualisierung
          </div>
          <div className="text-sm text-white/50 mt-0.5">{now}</div>
        </div>
      </div>

      <TabGroup index={activeTab} onIndexChange={setActiveTab}>
        <TabList className="mb-6" variant="line">
          {TABS.map((t) => (
            <Tab key={t}>{t}</Tab>
          ))}
        </TabList>
        <TabPanels>
          <TabPanel>
            <OverviewPanel data={overviewData} loading={overviewLoading} />
          </TabPanel>
          <TabPanel>
            <QualityPanel data={qualityData} loading={qualityLoading} />
          </TabPanel>
          <TabPanel>
            <RoutingPanel
              data={routingData}
              loading={routingLoading}
              onRun={handleRun}
              running={runRunning}
            />
          </TabPanel>
          <TabPanel>
            <PerformancePanel data={performanceData} loading={performanceLoading} />
          </TabPanel>
          <TabPanel>
            <CompliancePanel
              data={complianceData}
              loading={complianceLoading}
              onRun={handleRun}
              running={runRunning}
            />
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  )
}
