import { redirect } from 'next/navigation'
import { ShieldCheck, ArrowLeft } from '@phosphor-icons/react/dist/ssr'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
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
import { getFixType } from '@/lib/audit/rule-registry'
import { computeQuickWins } from '@/lib/audit/quick-wins'
import { getPercentileRank } from '@/lib/audit/score-percentile'
import BetaFeedbackButton from './_components/BetaFeedbackButton'
import QuickWinsCard from './_components/QuickWinsCard'
import ScoreHero from './_components/ScoreHero'
import CategoryBreakdown from './_components/CategoryBreakdown'
import ScoreTrend from './_components/ScoreTrend'
import FindingsTable from './_components/FindingsTable'
import TaskList from './_components/TaskList'
import RunHistory from './_components/RunHistory'
import AuditActions from './_components/AuditActions'
import AuditTabs from './_components/AuditTabs'

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

  // ── Beta onboarding check ────────────────────────────────────────────────
  const { data: userPrefs } = await supabaseAdmin
    .from('user_preferences')
    .select('beta_onboarding_done')
    .eq('user_id', user.id)
    .maybeSingle()
  const isBetaUser = !!(userPrefs as { beta_onboarding_done?: boolean } | null)?.beta_onboarding_done

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

  // Enrich findings with fixType from rule registry (server-side only — rule-registry uses Node.js)
  const allFindings = (findings as Array<Record<string, unknown>>).map((f) => {
    (f as Record<string, unknown>).fix_type = getFixType(f.rule_id as string)
    return f
  })

  const openFindings = allFindings.filter((f) => f.status === 'open').length
  const criticalOpenFindings = allFindings.filter((f) => f.status === 'open' && f.severity === 'critical').length
  const highOpenFindings = allFindings.filter((f) => f.status === 'open' && f.severity === 'high').length
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

  // fixType stats for display
  const fixTypeStats = { 'code-fix': 0, 'code-gen': 0, refactoring: 0, manual: 0 }
  for (const f of allFindings) {
    const ft = getFixType(f.rule_id as string)
    fixTypeStats[ft]++
  }

  // Quick wins + percentile (server-side computation)
  const { quickWins } = computeQuickWins(allFindings as unknown as Parameters<typeof computeQuickWins>[0])
  const percentileRank = runDetail ? getPercentileRank(runDetail.percentage as number) : null

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

          {/* fixType stats + percentile */}
          {allFindings.length > 0 && (
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 0, marginTop: -8 }}>
              {t('fixTypeStats', {
                codeFix: fixTypeStats['code-fix'],
                codeGen: fixTypeStats['code-gen'],
                refactoring: fixTypeStats.refactoring,
                manual: fixTypeStats.manual,
              })}
              {percentileRank !== null && (
                <span style={{ marginLeft: 12 }}>
                  · {t('scorePercentile', { rank: percentileRank })}
                </span>
              )}
            </p>
          )}

          {/* Tab-based layout */}
          <AuditTabs
            findingsCount={allFindings.length}
            categoryCount={(categories as unknown[]).length}
            runCount={runList.length}
            findingsContent={
              <div>
                {quickWins.length > 0 && (
                  <QuickWinsCard quickWins={quickWins} />
                )}
                <FindingsTable
                  key={selectedRunId ?? 'none'}
                  findings={allFindings as unknown as Parameters<typeof FindingsTable>[0]['findings']}
                  runId={selectedRunId ?? undefined}
                  statusFilter={status}
                  severityFilter={severity}
                  agentFilter={agent}
                  initialTaskMap={initialTaskMap}
                  isExternalProject={activeScanProjectId !== null}
                />
              </div>
            }
            categoriesContent={
              <CategoryBreakdown
                categories={categories as Parameters<typeof CategoryBreakdown>[0]['categories']}
                findings={allFindings as unknown as Parameters<typeof CategoryBreakdown>[0]['findings']}
                isExternalProject={activeScanProjectId !== null}
              />
            }
            historyContent={
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <ScoreTrend runs={runList} />
                <RunHistory runs={runList} reviewRuns={reviewRunList} selectedRunId={selectedRunId ?? undefined} />
              </div>
            }
          />
        </>
      )}

      {/* ── Run selected but not found ───────────────────────────────────── */}
      {hasRuns && !runDetail && selectedRunId && (
        <div className="card" style={{ padding: 32, textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: 'var(--error)' }}>{t('runNotFound')}</p>
        </div>
      )}

      {/* ── Beta feedback button ─────────────────────────────────────────── */}
      {isBetaUser && (
        <BetaFeedbackButton
          runId={selectedRunId ?? undefined}
        />
      )}
    </div>
  )
}
