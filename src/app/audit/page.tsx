import { redirect } from 'next/navigation'
import { ShieldCheck } from '@phosphor-icons/react/dist/ssr'
import { createClient } from '@/utils/supabase/server'
import {
  fetchUserOrgId,
  fetchAuditRuns,
  fetchAuditReviewRuns,
  fetchAuditRunDetail,
  fetchAuditCategoryScores,
  fetchAuditFindings,
  fetchScanProjects,
} from '@/lib/audit/page-data'
import ScoreHero from './_components/ScoreHero'
import CategoryBreakdown from './_components/CategoryBreakdown'
import ScoreTrend from './_components/ScoreTrend'
import FindingsTable from './_components/FindingsTable'
import DeepReviewFindings from './_components/DeepReviewFindings'
import RunHistory from './_components/RunHistory'
import AuditActions from './_components/AuditActions'

export const metadata = { title: 'Code Audit — Tropen OS' }

interface PageProps {
  searchParams: Promise<{ runId?: string; status?: string; severity?: string; agent?: string; project?: string }>
}

export default async function AuditPage({ searchParams }: PageProps) {
  const { runId: requestedRunId, status: statusParam, severity, agent, project: projectParam } = await searchParams
  const status = statusParam ?? 'open'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const orgId = await fetchUserOrgId(user.id)

  // ── Project selector ──────────────────────────────────────────────────────
  const scanProjects = orgId ? await fetchScanProjects(orgId) : []
  const activeScanProjectId = projectParam ?? null

  // ── Runs list ─────────────────────────────────────────────────────────────
  const [runList, reviewRunList] = orgId
    ? await Promise.all([
        fetchAuditRuns(orgId, activeScanProjectId === null ? undefined : activeScanProjectId),
        fetchAuditReviewRuns(orgId),
      ])
    : [[], []]

  const selectedRunId = requestedRunId ?? runList[0]?.id ?? null

  // ── Selected run details ──────────────────────────────────────────────────
  let runDetail: Record<string, unknown> | null = null
  let categories: unknown[] = []
  let findings: unknown[] = []
  let delta: number | null = null

  if (selectedRunId) {
    ;[runDetail, categories, findings] = await Promise.all([
      fetchAuditRunDetail(selectedRunId),
      fetchAuditCategoryScores(selectedRunId),
      fetchAuditFindings(selectedRunId),
    ])

    if (runDetail && runList.length > 1) {
      const currentIdx = runList.findIndex((r) => r.id === selectedRunId)
      const prevRun = currentIdx >= 0 ? runList[currentIdx + 1] : null
      if (prevRun) {
        delta = (runDetail.percentage as number) - prevRun.percentage
      }
    }
  }

  type RawFinding = Record<string, unknown>
  function isDeepReviewFinding(f: RawFinding): boolean {
    const mf = f.models_flagged as string[] | null | undefined
    return (mf != null && mf.length > 0) || f.consensus_level != null
  }
  const allFindings = findings as RawFinding[]
  const deepFindings = allFindings.filter(isDeepReviewFinding)
  const staticFindings = allFindings.filter((f) => !isDeepReviewFinding(f))

  const openFindings = staticFindings.filter((f) => f.status === 'open').length
  const criticalOpenFindings = staticFindings.filter((f) => f.status === 'open' && f.severity === 'critical').length
  const highOpenFindings = staticFindings.filter((f) => f.status === 'open' && f.severity === 'high').length
  const isFirstRun = runList.length === 1
  const hasRuns = runList.length > 0

  return (
    <div className="content-max">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-header-title">
            <ShieldCheck size={22} color="var(--text-primary)" weight="fill" aria-hidden="true" />
            Code Audit
          </h1>
          <p className="page-header-sub">Automatisierte Qualitätsprüfung — 25 Kategorien</p>
        </div>
        <div className="page-header-actions">
          <AuditActions
            runId={selectedRunId ?? undefined}
            reviewType={runDetail ? (runDetail.review_type as string | null) : null}
            criticalCount={runDetail ? (runDetail.critical_findings as number ?? 0) : 0}
          />
        </div>
      </div>

      {/* ── Project selector ─────────────────────────────────────────────── */}
      {scanProjects.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
          <a href="/audit" className={`chip${!activeScanProjectId ? ' chip--active' : ''}`}>
            Tropen OS (intern)
          </a>
          {scanProjects.map((p) => (
            <a
              key={p.id}
              href={`/audit?project=${p.id}`}
              className={`chip${activeScanProjectId === p.id ? ' chip--active' : ''}`}
            >
              {p.name}
            </a>
          ))}
          <a href="/audit/scan" className="chip chip--active" style={{ color: '#ffffff' }}>
            + Neues Projekt
          </a>
        </div>
      )}

      {/* ── No runs yet ─────────────────────────────────────────────────── */}
      {!hasRuns && (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <ShieldCheck size={40} color="var(--text-tertiary)" weight="fill" aria-hidden="true" />
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginTop: 12, marginBottom: 4 }}>
            {activeScanProjectId ? 'Noch kein Audit-Run für dieses Projekt' : 'Noch kein Audit-Run vorhanden'}
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
            {activeScanProjectId
              ? 'Verbinde das Projekt erneut über die Scan-Seite.'
              : 'Klicke auf „Audit starten" um den ersten Run durchzuführen.'}
          </p>
        </div>
      )}

      {/* ── Run data ────────────────────────────────────────────────────── */}
      {hasRuns && runDetail && (
        <>
          {/* 1. Score Hero — compact */}
          <ScoreHero
            percentage={runDetail.percentage as number}
            status={runDetail.status as 'production_grade' | 'stable' | 'risky' | 'prototype'}
            delta={delta}
            lastRunAt={runDetail.created_at as string}
            projectName={runDetail.project_name as string}
            reviewType={runDetail.review_type as string | null ?? null}
            reviewCostEur={runDetail.review_cost_eur as number | null ?? null}
            openFindings={openFindings}
            highOpenFindings={highOpenFindings}
            criticalOpenFindings={criticalOpenFindings}
            isFirstRun={isFirstRun}
          />

          {/* 2. Categories + Score-Verlauf/Runs nebeneinander */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
            gap: 16,
            marginTop: 0,
          }}>
            <CategoryBreakdown
              categories={categories as Parameters<typeof CategoryBreakdown>[0]['categories']}
              findings={staticFindings as unknown as Parameters<typeof CategoryBreakdown>[0]['findings']}
              isExternalProject={activeScanProjectId !== null}
            />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <ScoreTrend runs={runList} />
              <RunHistory runs={runList} reviewRuns={reviewRunList} selectedRunId={selectedRunId ?? undefined} />
            </div>
          </div>

          {/* 3. Deep Review Findings */}
          <DeepReviewFindings
            findings={deepFindings as unknown as Parameters<typeof DeepReviewFindings>[0]['findings']}
            runId={selectedRunId ?? ''}
          />

          {/* 4. Static Findings */}
          <div id="findings-table">
            <FindingsTable
              key={selectedRunId ?? 'none'}
              findings={staticFindings as unknown as Parameters<typeof FindingsTable>[0]['findings']}
              runId={selectedRunId ?? undefined}
              statusFilter={status}
              severityFilter={severity}
              agentFilter={agent}
            />
          </div>
        </>
      )}

      {/* ── Run selected but not found ───────────────────────────────────── */}
      {hasRuns && !runDetail && selectedRunId && (
        <div className="card" style={{ padding: 32, textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: 'var(--error)' }}>Run nicht gefunden.</p>
        </div>
      )}
    </div>
  )
}
