'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChartBar } from '@phosphor-icons/react'
import {
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
} from '@/types/qa'
import { OverviewPanel } from '@/components/admin/qa/OverviewPanel'
import { QualityPanel } from '@/components/admin/qa/QualityPanel'
import { RoutingPanel } from '@/components/admin/qa/RoutingPanel'
import { PerformancePanel } from '@/components/admin/qa/PerformancePanel'
import { CompliancePanel } from '@/components/admin/qa/CompliancePanel'

// ── Styles ──────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  lastUpdatedLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: 'var(--text-muted)',
  },
  lastUpdatedValue: {
    fontSize: 14,
    color: 'var(--text-secondary)',
    marginTop: 2,
  },
}

// ── Tabs ─────────────────────────────────────────────────────────────────

const TABS = ['Ubersicht', 'LLM Qualitat', 'Routing Log', 'Performance', 'Compliance']

// ── Main component ──────────────────────────────────────────────────────

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

  // ── Fetchers ────────────────────────────────────────────────────────

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

  // ── Init ────────────────────────────────────────────────────────────

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

  // ── Run handler ─────────────────────────────────────────────────────

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

  // ── Render ──────────────────────────────────────────────────────────

  const now = lastUpdated
    ? lastUpdated.toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' })
    : '--'

  return (
    <div className="content-wide">
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-header-title">
            <ChartBar size={22} color="var(--text-primary)" weight="fill" />
            QA & Observability
          </h1>
          <p className="page-header-sub">Modell-Routing, Bias-Evaluierungen, Lighthouse & Compliance</p>
        </div>
        <div className="page-header-actions">
          <div style={{ textAlign: 'right' }}>
            <div style={s.lastUpdatedLabel}>Letzte Aktualisierung</div>
            <div style={s.lastUpdatedValue}>{now}</div>
          </div>
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
