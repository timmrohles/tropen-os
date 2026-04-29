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
} from '@/lib/audit/page-data'
import { Link } from '@/i18n/navigation'
import { getFixType } from '@/lib/audit/rule-registry'
import { computeQuickWins } from '@/lib/audit/quick-wins'
import { getPercentileRank } from '@/lib/audit/score-percentile'
import { getTierCounts, getFindingsByTier } from '@/lib/audit/tier-filter'
import { complianceFrameworks, getFrameworkScore } from '@/lib/audit/compliance-mapping'
import BetaFeedbackButton from './_components/BetaFeedbackButton'
import QuickWinsCard from './_components/QuickWinsCard'
import ScoreHero from './_components/ScoreHero'
import ScoreBar from './_components/ScoreBar'
import CategoryBreakdown from './_components/CategoryBreakdown'
import ScoreTrend from './_components/ScoreTrendLazy'
import FindingsTable from './_components/FindingsTable'
import RunHistory from './_components/RunHistory'
import AuditActions from './_components/AuditActions'
import AuditTabs from './_components/AuditTabs'
import AuditTierTabs from './_components/AuditTierTabs'
import { AppTabs } from '@/components/app-ui/AppTabs'
import { AppSection } from '@/components/app-ui/AppSection'
import FindingsTableApp from './_components/FindingsTableApp'
import ComplianceStatus from './_components/ComplianceStatus'

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

  // Enrich findings with fixType from rule registry (server-side only — rule-registry uses Node.js)
  const allFindings = (findings as Array<Record<string, unknown>>).map((f) => {
    (f as Record<string, unknown>).fix_type = getFixType(f.rule_id as string)
    return f
  })

  // Compute deep review badge info server-side — consensus_level does not survive React flight serialization.
  // When the selected run is a plain automated scan, fall back to the most recent multi_model run so
  // badges remain visible after a fresh automated re-scan.
  const deepReviewBadges: Record<string, { level: string; count: number }> = {}
  function collectBadges(src: Array<Record<string, unknown>>) {
    for (const f of src) {
      if (f.consensus_level) {
        const key = `${(f.rule_id as string) || 'unknown'}::${(f.agent_source as string) ?? 'core'}`
        if (!deepReviewBadges[key]) {
          deepReviewBadges[key] = {
            level: f.consensus_level as string,
            count: ((f.models_flagged as string[]) ?? []).length,
          }
        }
      }
    }
  }
  collectBadges(findings as Array<Record<string, unknown>>)

  // Fallback: if current run has no deep review findings, pull badges from the latest multi_model run
  if (Object.keys(deepReviewBadges).length === 0 && selectedRunId) {
    const latestReviewRun = runList.find(
      (r) => (r as { id: string; review_type?: string | null }).review_type === 'multi_model' && r.id !== selectedRunId
    )
    if (latestReviewRun) {
      const reviewFindings = await fetchAuditFindings(latestReviewRun.id)
      collectBadges(reviewFindings as Array<Record<string, unknown>>)
    }
  }

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
  const codeFindings = getFindingsByTier(allFindings, 'code')
  const { quickWins } = computeQuickWins(codeFindings as unknown as Parameters<typeof computeQuickWins>[0])
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
            isVercelEnv={!!process.env.NEXT_PUBLIC_VERCEL_ENV}
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
      {hasRuns && runDetail && (() => {
        const tierCounts = getTierCounts(allFindings)
        const complianceHasDanger = complianceFrameworks.some(fw =>
          getFrameworkScore(fw, allFindings).hasOpen
        )
        const complianceFindings = getFindingsByTier(allFindings, 'compliance')
        const metricFindings = getFindingsByTier(allFindings, 'metric')

        return (
          <>
            {/* Score-Block kompakt — Tabellen-Welt-Stil */}
            <div id="audit-score-hero">
              <ScoreBar
                percentage={runDetail.percentage as number}
                status={runDetail.status as 'production_grade' | 'stable' | 'risky' | 'prototype'}
                delta={delta}
                lastRunAt={runDetail.created_at as string}
                projectName={runDetail.project_name as string}
                isFirstRun={isFirstRun}
                hasExternalTools={hasLighthouseData}
              />
            </div>

            {/* ── Sticky Tier-Tab-Bar (App-Welt-Stil) ────────────────────── */}
            <AppTabs tabs={[
              { id: 'findings',   label: 'Findings',   count: tierCounts.code,       sectionId: 'findings' },
              { id: 'metrics',    label: 'Metriken',   count: tierCounts.metric,     sectionId: 'metrics' },
              { id: 'compliance', label: 'Compliance', count: tierCounts.compliance, sectionId: 'compliance', hasDanger: complianceHasDanger },
            ]} />

            {/* ── TIER 1: FINDINGS ───────────────────────────────────────── */}
            <section id="findings" className="audit-tier-section">

              {/* Quick Wins — Limette-Tint-Header */}
              {quickWins.length > 0 && (
                <AppSection
                  header={`⚡ Quick Wins · ${quickWins.length} schnelle Fixes`}
                  accent
                  style={{ marginBottom: 16 }}
                >
                  <FindingsTableApp
                    findings={quickWins as unknown as Parameters<typeof FindingsTableApp>[0]['findings']}
                    statusFilter="open"
                    isQuickWins
                  />
                </AppSection>
              )}

              {/* Alle Findings — Tabellen-Welt */}
              <AppSection
                header={`Findings · ${tierCounts.code} offen`}
              >
                <FindingsTableApp
                  findings={codeFindings as unknown as Parameters<typeof FindingsTableApp>[0]['findings']}
                  statusFilter={status}
                />
              </AppSection>

              {/* Kategorien + Verlauf als Sekundär-Akkordeon */}
              <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
                <details style={{ flex: '1 1 400px' }}>
                  <summary style={{
                    padding: '10px 16px', background: 'var(--surface-warm)',
                    border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer',
                    fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
                    fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', color: 'var(--accent)',
                  }}>
                    Kategorien ({(categories as unknown[]).length})
                  </summary>
                  <div style={{ border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 4px 4px', background: '#fff' }}>
                    <CategoryBreakdown
                      categories={categories as Parameters<typeof CategoryBreakdown>[0]['categories']}
                      findings={allFindings as unknown as Parameters<typeof CategoryBreakdown>[0]['findings']}
                      isExternalProject={activeScanProjectId !== null}
                      hasExternalTools={hasLighthouseData}
                    />
                  </div>
                </details>

                <details style={{ flex: '1 1 400px' }}>
                  <summary style={{
                    padding: '10px 16px', background: 'var(--surface-warm)',
                    border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer',
                    fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
                    fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', color: 'var(--accent)',
                  }}>
                    Verlauf ({runList.length} Runs)
                  </summary>
                  <div style={{ border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 4px 4px', background: '#fff', padding: 16 }}>
                    <ScoreTrend runs={runList} />
                    <RunHistory runs={runList} reviewRuns={reviewRunList} selectedRunId={selectedRunId ?? undefined} />
                  </div>
                </details>
              </div>
            </section>

            {/* ── TIER 2: METRIKEN ───────────────────────────────────────── */}
            <section id="metrics" className="audit-tier-section">

              <AppSection header={`Metriken · ${tierCounts.metric} offen`}>
                {metricFindings.length > 0 ? (
                  <FindingsTableApp
                    findings={metricFindings as unknown as Parameters<typeof FindingsTableApp>[0]['findings']}
                    statusFilter={status}
                  />
                ) : (
                  <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4 }}>
                      Noch keine Metrik-Findings.
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                      Lighthouse-URL eintragen um Ladezeit + Core Web Vitals zu messen.
                    </p>
                  </div>
                )}
              </AppSection>

            </section>

            {/* ── TIER 3: COMPLIANCE ─────────────────────────────────────── */}
            <section id="compliance" className="audit-tier-section">
              <h2 className="audit-tier-heading">Was Pflicht ist</h2>

              {complianceFindings.length > 0 || complianceHasDanger ? (
                <ComplianceStatus findings={allFindings} />
              ) : (
                <div className="card" style={{ padding: '32px 24px', textAlign: 'center' }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--status-success)', marginBottom: 4 }}>
                    Alle Pflichten erfüllt.
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
                    Nichts zu tun.
                  </p>
                </div>
              )}
            </section>
          </>
        )
      })()}

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
