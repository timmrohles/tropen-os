import { redirect } from 'next/navigation'
import { ShieldCheck, ArrowLeft } from '@phosphor-icons/react/dist/ssr'
import { createClient } from '@/utils/supabase/server'
import { getTranslations, getLocale } from 'next-intl/server'
import {
  fetchUserOrgId,
  fetchAuditRuns,
  fetchAuditReviewRuns,
  fetchAuditRunDetail,
  fetchAuditCategoryScores,
  fetchAuditFindings,
  fetchScanProjects,
  fetchAuditTasks,
} from '@/lib/audit/page-data'
import { Link } from '@/i18n/navigation'
import ScoreHero from './_components/ScoreHero'
import CategoryBreakdown from './_components/CategoryBreakdown'
import ScoreTrend from './_components/ScoreTrend'
import FindingsTable from './_components/FindingsTable'
import TaskList from './_components/TaskList'
import DeepReviewFindings from './_components/DeepReviewFindings'
import RunHistory from './_components/RunHistory'
import AuditActions from './_components/AuditActions'
import Top5FindingsCards from './_components/Top5FindingsCards'

export const metadata = { title: 'Code Audit — Tropen OS' }

interface PageProps {
  searchParams: Promise<{ runId?: string; status?: string; severity?: string; agent?: string; project?: string }>
}

export default async function AuditPage({
  searchParams }: PageProps) {
  const locale = await getLocale()
  const { runId: requestedRunId, status: statusParam, severity, agent, project: projectParam } = await searchParams
  const status = statusParam ?? 'open'

  const t = await getTranslations('audit')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

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

  let auditTasks: unknown[] = []

  if (selectedRunId) {
    ;[runDetail, categories, findings] = await Promise.all([
      fetchAuditRunDetail(selectedRunId),
      fetchAuditCategoryScores(selectedRunId),
      fetchAuditFindings(selectedRunId),
    ])

    if (orgId) {
      auditTasks = await fetchAuditTasks(orgId, activeScanProjectId)
    }

    if (runDetail && runList.length > 1) {
      const currentIdx = runList.findIndex((r) => r.id === selectedRunId)
      const prevRun = currentIdx >= 0 ? runList[currentIdx + 1] : null
      if (prevRun) {
        delta = (runDetail.percentage as number) - prevRun.percentage
      }
    }
  }

  type RawTask = { id: string; finding_id: string | null; [key: string]: unknown }
  const initialTaskMap: Record<string, string> = {}
  ;(auditTasks as RawTask[]).forEach((t) => {
    if (t.finding_id) initialTaskMap[t.finding_id] = t.id
  })

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

  const activeProject = activeScanProjectId
    ? scanProjects.find((p) => p.id === activeScanProjectId) ?? null
    : null
  const activeProjectName = activeProject?.name ?? 'Tropen OS'
  const initialLighthouseUrl = (activeProject as { live_url?: string | null } | null)?.live_url ?? null

  // Detect if the latest run has Lighthouse data (any finding with lighthouse-* agent_source)
  const hasLighthouseData = (findings as { agent_source?: string }[]).some(
    (f) => typeof f.agent_source === 'string' && f.agent_source.startsWith('lighthouse-')
  )

  return (
    <div className="content-max">
      {/* ── Breadcrumb ──────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 8 }}>
        <Link
          href="/dashboard"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-tertiary)', textDecoration: 'none' }}
        >
          <ArrowLeft size={13} weight="bold" aria-hidden="true" />
          {t('backToDashboard')}
        </Link>
      </div>

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-header-title">
            <ShieldCheck size={22} color="var(--text-primary)" weight="fill" aria-hidden="true" />
            {activeProjectName}
          </h1>
          <p className="page-header-sub">{t('subtitle')}</p>
        </div>
        <div className="page-header-actions">
          <AuditActions
            runId={selectedRunId ?? undefined}
            reviewType={runDetail ? (runDetail.review_type as string | null) : null}
            criticalCount={runDetail ? (runDetail.critical_findings as number ?? 0) : 0}
            scanProjectId={activeScanProjectId}
            initialLighthouseUrl={initialLighthouseUrl}
          />
        </div>
      </div>

      {/* ── No runs yet ─────────────────────────────────────────────────── */}
      {!hasRuns && (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <ShieldCheck size={40} color="var(--text-tertiary)" weight="fill" aria-hidden="true" />
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginTop: 12, marginBottom: 4 }}>
            {activeScanProjectId ? t('noRunsYetProject') : t('noRunsYet')}
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
            {activeScanProjectId ? t('reconnectProject') : t('startFirstAudit')}
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

          {/* Lighthouse hint — shown when last run has no Lighthouse data */}
          {!hasLighthouseData && (
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 16, marginTop: -8 }}>
              {t('noLighthouseHint')}
            </p>
          )}

          {/* ── Separator ── */}
          <div style={{ borderTop: '1px solid var(--border)', margin: '0 0 32px' }} />

          {/* 2. Categories + Score-Verlauf/Runs nebeneinander */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
            gap: 0,
          }}>
            {/* Left column — Categories */}
            <div style={{
              borderRight: '1px solid var(--border)',
              paddingRight: 24,
              marginRight: 0,
            }}>
              <CategoryBreakdown
                categories={categories as Parameters<typeof CategoryBreakdown>[0]['categories']}
                findings={staticFindings as unknown as Parameters<typeof CategoryBreakdown>[0]['findings']}
                isExternalProject={activeScanProjectId !== null}
              />
            </div>
            {/* Right column — Trend + History */}
            <div style={{ paddingLeft: 24, display: 'flex', flexDirection: 'column' }}>
              <ScoreTrend runs={runList} />
              <RunHistory runs={runList} reviewRuns={reviewRunList} selectedRunId={selectedRunId ?? undefined} />
            </div>
          </div>

          {/* ── Separator ── */}
          <div style={{ borderTop: '1px solid var(--border)', margin: '0 0 32px' }} />

          {/* 3. Top-5-Findings (Default-Ansicht) */}
          {staticFindings.filter((f) => f.status === 'open').length > 0 && (
            <Top5FindingsCards
              findings={staticFindings as unknown as Parameters<typeof Top5FindingsCards>[0]['findings']}
              runId={selectedRunId ?? ''}
              scanProjectId={activeScanProjectId}
              initialTaskMap={initialTaskMap}
              totalCount={staticFindings.filter((f) => f.status === 'open').length}
            />
          )}

          {/* 4. Deep Review Findings */}
          <DeepReviewFindings
            findings={deepFindings as unknown as Parameters<typeof DeepReviewFindings>[0]['findings']}
            runId={selectedRunId ?? ''}
          />

          {/* ── Separator ── */}
          <div style={{ borderTop: '1px solid var(--border)', margin: '0 0 32px' }} />

          {/* 5. Static Findings (expandiert) */}
          <div id="findings-table">
            <FindingsTable
              key={selectedRunId ?? 'none'}
              findings={staticFindings as unknown as Parameters<typeof FindingsTable>[0]['findings']}
              runId={selectedRunId ?? undefined}
              statusFilter={status}
              severityFilter={severity}
              agentFilter={agent}
              initialTaskMap={initialTaskMap}
              isExternalProject={activeScanProjectId !== null}
            />
          </div>

          {/* 6. Task List */}
          <TaskList
            initialTasks={auditTasks as unknown as Parameters<typeof TaskList>[0]['initialTasks']}
          />
        </>
      )}

      {/* ── Run selected but not found ───────────────────────────────────── */}
      {hasRuns && !runDetail && selectedRunId && (
        <div className="card" style={{ padding: 32, textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: 'var(--error)' }}>{t('runNotFound')}</p>
        </div>
      )}
    </div>
  )
}
