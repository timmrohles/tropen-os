import { redirect } from 'next/navigation'
import { ShieldCheck, ArrowLeft } from '@phosphor-icons/react/dist/ssr'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getTranslations, getLocale } from 'next-intl/server'
import {
  fetchUserOrgId,
  fetchAuditRuns,
  fetchAuditRunDetail,
  fetchAuditFindings,
  fetchScanProjects,
} from '@/lib/audit/page-data'
import { Link } from '@/i18n/navigation'
import { getFixType } from '@/lib/audit/rule-registry'
import { computeQuickWins } from '@/lib/audit/quick-wins'
import { getDomainCounts, getFindingsByDomain, ALL_DOMAINS } from '@/lib/audit/domain-filter'
import type { AuditDomain } from '@/lib/audit/types'
import { DomainEmptyState } from './_components/DomainEmptyState'
import BetaFeedbackButton from './_components/BetaFeedbackButton'
import ScoreBar from './_components/ScoreBar'
import AuditActions from './_components/AuditActions'
import { AppTabs } from '@/components/app-ui/AppTabs'
import { AppSection } from '@/components/app-ui/AppSection'
import FindingsTableApp from './_components/FindingsTableApp'
import { DsgvoTab } from './_components/DsgvoTab'
import { KiActTab } from './_components/KiActTab'
export const metadata = { title: 'Code Audit — Tropen OS' }

interface PageProps {
  searchParams: Promise<{
    runId?: string; status?: string; severity?: string; agent?: string; project?: string
    tab?: string  // ← domain tab
  }>
}

export default async function AuditPage({
  searchParams }: PageProps) {
  const locale = await getLocale()
  const { runId: requestedRunId, status: statusParam, project: projectParam, tab: tabParam } = await searchParams
  const status = statusParam ?? 'open'
  const activeTab: AuditDomain = (ALL_DOMAINS as string[]).includes(tabParam ?? '')
    ? (tabParam as AuditDomain)
    : 'code-quality'

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
  const [runList] = orgId
    ? await Promise.all([
        fetchAuditRuns(orgId, activeScanProjectId === null ? undefined : activeScanProjectId),
      ])
    : [[]]

  const selectedRunId = requestedRunId ?? runList[0]?.id ?? null

  // ── Selected run details ──────────────────────────────────────────────────
  let runDetail: Record<string, unknown> | null = null
  let findings: unknown[] = []
  let delta: number | null = null

  if (selectedRunId) {
    ;[runDetail, findings] = await Promise.all([
      fetchAuditRunDetail(selectedRunId),
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
  // Quick wins (server-side computation)
  const codeFindings = getFindingsByDomain(allFindings, 'code-quality')
  const { quickWins } = computeQuickWins(codeFindings as unknown as Parameters<typeof computeQuickWins>[0])

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
        const domainCounts = getDomainCounts(allFindings)
        const activeFindings = getFindingsByDomain(allFindings, activeTab)
        const hasDsgvoDanger = domainCounts['dsgvo'] > 0
        const hasKiActDanger = domainCounts['ki-act'] > 0

        const domainLabel = (d: AuditDomain): string => ({
          'code-quality': 'Code-Qualität', 'performance': 'Performance',
          'security': 'Sicherheit', 'accessibility': 'Barrierefreiheit',
          'dsgvo': 'DSGVO', 'ki-act': 'KI-Act', 'documentation': 'Doku-Hygiene',
        }[d])

        const tabHref = (domain: AuditDomain): string => {
          const params = new URLSearchParams()
          params.set('tab', domain)
          if (selectedRunId) params.set('runId', selectedRunId)
          if (activeScanProjectId) params.set('project', activeScanProjectId)
          return `?${params.toString()}`
        }

        return (
          <>
            {/* Score-Block kompakt — Tabellen-Welt-Stil */}
            <div id="audit-score-hero" style={{ position: 'sticky', top: 0, zIndex: 21, background: 'var(--bg-base)' }}>
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

            {/* ── Sticky Domain-Tab-Bar (6 Domains, URL-Routing) ─────────── */}
            <AppTabs activeTabId={activeTab} tabs={[
              { id: 'code-quality',  label: 'Code-Qualität',  count: domainCounts['code-quality'],
                href: tabHref('code-quality') },
              { id: 'performance',   label: 'Performance',    count: domainCounts['performance'],
                href: tabHref('performance') },
              { id: 'security',      label: 'Sicherheit',     count: domainCounts['security'],
                href: tabHref('security') },
              { id: 'accessibility', label: 'Barrierefrei.',  count: domainCounts['accessibility'],
                href: tabHref('accessibility') },
              { id: 'dsgvo',         label: 'DSGVO',          count: domainCounts['dsgvo'],
                href: tabHref('dsgvo'), hasDanger: hasDsgvoDanger },
              { id: 'ki-act',        label: 'KI-Act',         count: domainCounts['ki-act'],
                href: tabHref('ki-act'), hasDanger: hasKiActDanger },
              { id: 'documentation', label: 'Doku',           count: domainCounts['documentation'],
                href: tabHref('documentation') },
            ]} />

            {/* ── Domain Content ──────────────────────────────────────────── */}
            <section id="domain-content" className="audit-tier-section">

              {/* Quick Wins only in code-quality tab */}
              {activeTab === 'code-quality' && quickWins.length > 0 && (
                <AppSection
                  header={`⚡ Quick Wins · ${quickWins.length} schnelle Fixes`}
                  accent
                  style={{ marginBottom: 16 }}
                >
                  <FindingsTableApp
                    findings={quickWins as unknown as Parameters<typeof FindingsTableApp>[0]['findings']}
                    statusFilter="open"
                  />
                </AppSection>
              )}

              {activeTab === 'dsgvo' ? (
                <DsgvoTab
                  findings={activeFindings as unknown as Parameters<typeof DsgvoTab>[0]['findings']}
                  projectId={activeScanProjectId}
                  statusFilter={status}
                />
              ) : activeTab === 'ki-act' ? (
                <KiActTab
                  findings={activeFindings as unknown as Parameters<typeof KiActTab>[0]['findings']}
                  projectId={activeScanProjectId}
                  statusFilter={status}
                />
              ) : activeFindings.length > 0 ? (
                <AppSection
                  header={`${domainLabel(activeTab)} · ${domainCounts[activeTab]} offen`}
                >
                  <FindingsTableApp
                    findings={activeFindings as unknown as Parameters<typeof FindingsTableApp>[0]['findings']}
                    statusFilter={status}
                  />
                </AppSection>
              ) : (
                <DomainEmptyState domain={activeTab} hasRun={hasRuns} />
              )}

              {activeFindings.filter(f => (f as Record<string, unknown>).status === 'fixed').length > 0 && (
                <AppSection
                  header={`Behoben · ${activeFindings.filter(f => (f as Record<string, unknown>).status === 'fixed').length}`}
                  style={{ marginTop: 16 }}
                >
                  <FindingsTableApp
                    findings={activeFindings as unknown as Parameters<typeof FindingsTableApp>[0]['findings']}
                    statusFilter="fixed"
                  />
                </AppSection>
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
