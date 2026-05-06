import { redirect } from 'next/navigation'
import { ClipboardText } from '@phosphor-icons/react/dist/ssr'
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
import { getActiveScanProjectProfile } from '@/lib/audit/project-profiles'
import { getFixType } from '@/lib/audit/rule-registry'
import { findRecommendation } from '@/lib/audit/finding-recommendations'

import { shouldBeKiller, effortMinutesFromFixType } from '@/lib/audit/killer-rule-ids'
import { getDomainForRule } from '@/lib/audit/domain-filter'
import BetaFeedbackButton from './_components/BetaFeedbackButton'
import AuditActions from './_components/AuditActions'
import { IslandsRow } from './_components/IslandsRow'
import { AuditFindingsClient } from './_components/AuditFindingsClient'
import { calculateScoreTrend } from '@/lib/audit/trend'
export const metadata = { title: 'Audit' }

interface PageProps {
  searchParams: Promise<{
    runId?: string; status?: string; project?: string
  }>
}

export default async function AuditPage({
  searchParams }: PageProps) {
  const locale = await getLocale()
  const { runId: requestedRunId, status: statusParam, project: projectParam } = await searchParams
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
  const [runList] = orgId
    ? await Promise.all([
        fetchAuditRuns(orgId, activeScanProjectId),
      ])
    : [[]]

  const selectedRunId = requestedRunId ?? runList[0]?.id ?? null

  // ── Selected run details ──────────────────────────────────────────────────
  let runDetail: Record<string, unknown> | null = null
  let findings: unknown[] = []
  let delta: number | null = null
  let prevRun: { percentage: number; created_at: string } | null = null

  if (selectedRunId) {
    ;[runDetail, findings] = await Promise.all([
      fetchAuditRunDetail(selectedRunId),
      fetchAuditFindings(selectedRunId),
    ])

    if (runDetail && runList.length > 1) {
      const currentIdx = runList.findIndex((r) => r.id === selectedRunId)
      prevRun = currentIdx >= 0 ? runList[currentIdx + 1] ?? null : null
      if (prevRun) {
        delta = (runDetail.percentage as number) - prevRun.percentage
      }
    }
  }

  // Enrich findings server-side: fixType (Node.js only) + recommendation title/problem
  // _recTitle / _recProblem prevent finding-recommendations.ts from entering the client bundle.
  // Memoize per ruleId — most findings share the same ruleId, avoiding O(n×m) regex scans.
  const recCache = new Map<string, { title: string; problem: string; limitation?: string } | null>()
  const allFindings = (findings as Array<Record<string, unknown>>).map((f) => {
    f.fix_type = getFixType(f.rule_id as string)
    const ruleId = f.rule_id as string
    if (!recCache.has(ruleId)) {
      const rec = findRecommendation(ruleId, f.message as string)
      recCache.set(ruleId, rec ? { title: rec.title, problem: rec.problem, limitation: rec.limitation ?? undefined } : null)
    }
    const cached = recCache.get(ruleId)
    if (cached) {
      f._recTitle = cached.title
      f._recProblem = cached.problem
      if (cached.limitation) f._limitation = cached.limitation
    }
    return f
  })

  const isFirstRun = runList.length === 1
  const hasRuns = runList.length > 0

  const activeProject = activeScanProjectId
    ? scanProjects.find((p) => p.id === activeScanProjectId) ?? null
    : null
const initialLighthouseUrl = (activeProject as { live_url?: string | null } | null)?.live_url ?? null

  // Profile-Onboarding: prüfen ob ext. Scan-Projekt ein Profil hat
  let needsOnboarding = false
  let isExistingProject = false
  let scanProjectProfile: import('@/lib/audit/project-profiles').ScanProjectProfile | null = null
  if (activeScanProjectId) {
    scanProjectProfile = await getActiveScanProjectProfile(activeScanProjectId)
    needsOnboarding = scanProjectProfile === null
    isExistingProject = needsOnboarding && runList.length > 0
  }

  // Detect if the latest run has Lighthouse data (any finding with lighthouse-* agent_source)
  const hasLighthouseData = (findings as { agent_source?: string }[]).some(
    (f) => typeof f.agent_source === 'string' && f.agent_source.startsWith('lighthouse-')
  )

  // Sprint 6b₁ — Compliance-Daten laden (für Compliance-Blöcke)
  let complianceData: Record<string, unknown> = {}
  if (activeScanProjectId) {
    const { data: complianceRows } = await supabaseAdmin
      .from('project_compliance_data')
      .select('question_key, question_value')
      .eq('project_id', activeScanProjectId)
    if (complianceRows) {
      complianceData = Object.fromEntries(
        complianceRows.map(r => [r.question_key as string, r.question_value])
      )
    }
  }

  // Sprint 9a — DB-Werte bevorzugen, Heuristik als Fallback für alte Findings (NULL-Spalten)
  const enrichedFindings = allFindings.map(f => ({
    ...f,
    is_killer: (f as Record<string, unknown>).is_killer != null
      ? Boolean((f as Record<string, unknown>).is_killer)
      : shouldBeKiller(f.severity as string, f.rule_id as string),
    effort_minutes: (f as Record<string, unknown>).effort_minutes != null
      ? Number((f as Record<string, unknown>).effort_minutes)
      : effortMinutesFromFixType(f.fix_type as string | null),
    domain: getDomainForRule(f.rule_id as string),
  }))

  const killerCount = enrichedFindings.filter(f => {
    const status = (f as Record<string, unknown>).status as string | undefined
    return (status === 'open' || status === 'acknowledged') && f.is_killer
  }).length

  // Stale-Detection: Komitee-Findings veraltet wenn neuerer Auto-Audit existiert
  const hasCommitteeFindings = (runDetail?.review_type as string | null) === 'multi_model'
  const isCommitteeStale = hasCommitteeFindings && runList.length > 0 && runList[0]?.id !== selectedRunId
  const reviewRunAt = hasCommitteeFindings && runDetail?.created_at ? runDetail.created_at as string : null

  return (
    <div className="content-max">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-header-title">
            <ClipboardText size={30} color="var(--accent)" weight="fill" aria-hidden="true" />
            Audit
          </h1>
        </div>
        <div className="page-header-actions">
          <AuditActions
            runId={selectedRunId ?? undefined}
            reviewType={runDetail ? (runDetail.review_type as string | null) : null}
            criticalCount={runDetail ? (runDetail.critical_findings as number ?? 0) : 0}
            scanProjectId={activeScanProjectId}
            initialLighthouseUrl={initialLighthouseUrl}
            isVercelEnv={!!process.env.NEXT_PUBLIC_VERCEL_ENV}
            needsOnboarding={needsOnboarding}
            isExistingProject={isExistingProject}
          />
        </div>
      </div>

      {/* ── No runs yet ─────────────────────────────────────────────────── */}
      {!hasRuns && (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <ClipboardText size={40} color="var(--text-tertiary)" weight="fill" aria-hidden="true" />
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
          {/* ── Section-Label über den Inseln ───────────────────────── */}
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 12,
            fontFamily: 'var(--font-mono, monospace)', fontSize: 12,
            color: 'var(--accent)', marginBottom: 20, letterSpacing: '0.02em',
          }}>
            <span style={{ width: 28, height: 1, background: 'rgba(63,74,85,0.3)', flexShrink: 0 }} aria-hidden="true" />
            Audit für {runDetail.project_name as string}
          </span>

          {/* ── SECTION 2: Drei Inseln (BP-9-Polish-3-Inseln) ─────────── */}
          <IslandsRow
            killerCount={killerCount}
            polishScore={runDetail.percentage as number}
            trend={calculateScoreTrend(runDetail.percentage as number, prevRun, isFirstRun)}
            complianceData={activeScanProjectId ? complianceData : undefined}
            lighthouseUrl={initialLighthouseUrl}
            hasProject={!!activeScanProjectId}
            isMultiModelReview={(runDetail.review_type as string | null) === 'multi_model'}
          />

          {/* ── SECTION 3: Filter-Chips + Drei-Sektionen + Compliance-Blöcke ── */}
          <AuditFindingsClient
            allFindings={enrichedFindings as import('./_components/AuditFindingsClient').EnrichedFinding[]}
            runId={selectedRunId}
            projectId={activeScanProjectId}
            complianceData={complianceData}
            initialLighthouseUrl={initialLighthouseUrl}
            scanProjectId={activeScanProjectId}
            activeProfile={scanProjectProfile}
            isCommitteeStale={isCommitteeStale}
            reviewRunAt={reviewRunAt}
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
