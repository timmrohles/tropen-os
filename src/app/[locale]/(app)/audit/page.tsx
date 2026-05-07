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

// ── Server-side helpers (no React, no client imports) ──────────────────────────

type RawFinding = Record<string, unknown>

interface RecCacheEntry {
  title: string
  problem: string
  limitation?: string
}

/** Attach fixType + recommendation fields to each finding (memoized per ruleId). */
function enrichFindingsWithRecommendations(findings: RawFinding[]): RawFinding[] {
  const recCache = new Map<string, RecCacheEntry | null>()
  return findings.map((f) => {
    f.fix_type = getFixType(f.rule_id as string)
    const ruleId = f.rule_id as string
    if (!recCache.has(ruleId)) {
      const rec = findRecommendation(ruleId, f.message as string)
      recCache.set(ruleId, rec
        ? { title: rec.title, problem: rec.problem, limitation: rec.limitation ?? undefined }
        : null,
      )
    }
    const cached = recCache.get(ruleId)
    if (!cached) return f
    f._recTitle = cached.title
    f._recProblem = cached.problem
    if (cached.limitation) f._limitation = cached.limitation
    return f
  })
}

/** Attach killer/effort/domain fields (DB values preferred, heuristic fallback). */
function enrichFindingsWithMeta(findings: RawFinding[]): RawFinding[] {
  return findings.map((f): RawFinding => ({
    ...f,
    is_killer: f.is_killer != null
      ? Boolean(f.is_killer)
      : shouldBeKiller(f.severity as string, f.rule_id as string),
    effort_minutes: f.effort_minutes != null
      ? Number(f.effort_minutes)
      : effortMinutesFromFixType(f.fix_type as string | null),
    domain: getDomainForRule(f.rule_id as string),
  }))
}

interface RunData {
  runDetail: Record<string, unknown> | null
  findings: unknown[]
  prevRun: { percentage: number; created_at: string } | null
}

/** Fetch run detail + findings + prev run for delta. */
async function fetchRunWithPrev(
  selectedRunId: string,
  runList: Array<{ id: string; percentage: number; created_at: string }>,
): Promise<RunData> {
  const [runDetail, findings] = await Promise.all([
    fetchAuditRunDetail(selectedRunId),
    fetchAuditFindings(selectedRunId),
  ])
  let prevRun: { percentage: number; created_at: string } | null = null
  if (runDetail && runList.length > 1) {
    const currentIdx = runList.findIndex((r) => r.id === selectedRunId)
    prevRun = currentIdx >= 0 ? runList[currentIdx + 1] ?? null : null
  }
  return { runDetail, findings, prevRun }
}

interface ProfileData {
  needsOnboarding: boolean
  isExistingProject: boolean
  scanProjectProfile: import('@/lib/audit/project-profiles').ScanProjectProfile | null
}

/** Fetch scan-project profile + determine onboarding state. */
async function fetchProjectProfile(
  activeScanProjectId: string,
  runCount: number,
): Promise<ProfileData> {
  const scanProjectProfile = await getActiveScanProjectProfile(activeScanProjectId)
  const needsOnboarding = scanProjectProfile === null
  const isExistingProject = needsOnboarding && runCount > 0
  return { needsOnboarding, isExistingProject, scanProjectProfile }
}

/** Fetch compliance answers for a scan project. */
async function fetchComplianceData(activeScanProjectId: string): Promise<Record<string, unknown>> {
  const { data: complianceRows } = await supabaseAdmin
    .from('project_compliance_data')
    .select('question_key, question_value')
    .eq('project_id', activeScanProjectId)
  if (!complianceRows) return {}
  return Object.fromEntries(
    complianceRows.map((r) => [r.question_key as string, r.question_value]),
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

interface PageProps {
  searchParams: Promise<{
    runId?: string; status?: string; project?: string
  }>
}

export default async function AuditPage({ searchParams }: PageProps) {
  const locale = await getLocale()
  const { runId: requestedRunId, project: projectParam } = await searchParams

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
    ? await Promise.all([fetchAuditRuns(orgId, activeScanProjectId)])
    : [[]]

  const selectedRunId = requestedRunId ?? runList[0]?.id ?? null
  const hasRuns = runList.length > 0
  const isFirstRun = runList.length === 1

  // ── Selected run details ──────────────────────────────────────────────────
  let runDetail: Record<string, unknown> | null = null
  let findings: unknown[] = []
  let prevRun: { percentage: number; created_at: string } | null = null

  if (selectedRunId) {
    ;({ runDetail, findings, prevRun } = await fetchRunWithPrev(
      selectedRunId,
      runList as Array<{ id: string; percentage: number; created_at: string }>,
    ))
  }

  // ── Enrich findings ───────────────────────────────────────────────────────
  const allFindings = enrichFindingsWithRecommendations(findings as RawFinding[])
  const enrichedFindings = enrichFindingsWithMeta(allFindings)

  const killerCount = enrichedFindings.filter((f) => {
    const fStatus = f.status as string | undefined
    return (fStatus === 'open' || fStatus === 'acknowledged') && f.is_killer
  }).length

  // ── Project profile ───────────────────────────────────────────────────────
  const activeProject = activeScanProjectId
    ? scanProjects.find((p) => p.id === activeScanProjectId) ?? null
    : null
  const initialLighthouseUrl = (activeProject as { live_url?: string | null } | null)?.live_url ?? null

  let profileData: ProfileData = { needsOnboarding: false, isExistingProject: false, scanProjectProfile: null }
  if (activeScanProjectId) {
    profileData = await fetchProjectProfile(activeScanProjectId, runList.length)
  }
  const { needsOnboarding, isExistingProject, scanProjectProfile } = profileData

  // ── Compliance data ───────────────────────────────────────────────────────
  const complianceData = activeScanProjectId
    ? await fetchComplianceData(activeScanProjectId)
    : {}

  // ── Stale-Detection ───────────────────────────────────────────────────────
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
