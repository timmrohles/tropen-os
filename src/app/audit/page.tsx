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
} from '@/lib/audit/page-data'
import ScoreHero from './_components/ScoreHero'
import CategoryBreakdown from './_components/CategoryBreakdown'
import ScoreTrend from './_components/ScoreTrend'
import FindingsTable from './_components/FindingsTable'
import RunHistory from './_components/RunHistory'
import AuditActions from './_components/AuditActions'

export const metadata = { title: 'Code Audit — Tropen OS' }

interface PageProps {
  searchParams: Promise<{ runId?: string }>
}

export default async function AuditPage({ searchParams }: PageProps) {
  const { runId: requestedRunId } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const orgId = await fetchUserOrgId(user.id)

  // ── Runs list ─────────────────────────────────────────────────────────────
  const [runList, reviewRunList] = orgId
    ? await Promise.all([fetchAuditRuns(orgId), fetchAuditReviewRuns(orgId)])
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

    // Delta vs. previous run
    if (runDetail && runList.length > 1) {
      const currentIdx = runList.findIndex((r) => r.id === selectedRunId)
      const prevRun = currentIdx >= 0 ? runList[currentIdx + 1] : null
      if (prevRun) {
        delta = (runDetail.percentage as number) - prevRun.percentage
      }
    }
  }

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

      {/* ── No runs yet ─────────────────────────────────────────────────── */}
      {!hasRuns && (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <ShieldCheck size={40} color="var(--text-tertiary)" weight="duotone" aria-hidden="true" />
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginTop: 12, marginBottom: 4 }}>
            Noch kein Audit-Run vorhanden
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
            Klicke auf &ldquo;Audit starten&rdquo; um den ersten Run durchzuführen.
          </p>
        </div>
      )}

      {/* ── Run data ────────────────────────────────────────────────────── */}
      {hasRuns && runDetail && (
        <>
          <ScoreHero
            percentage={runDetail.percentage as number}
            status={runDetail.status as 'production_grade' | 'stable' | 'risky' | 'prototype'}
            delta={delta}
            lastRunAt={runDetail.created_at as string}
            projectName={runDetail.project_name as string}
            reviewType={runDetail.review_type as string | null ?? null}
            reviewCostEur={runDetail.review_cost_eur as number | null ?? null}
          />

          <RunHistory runs={runList} reviewRuns={reviewRunList} selectedRunId={selectedRunId ?? undefined} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 0 }}>
            <CategoryBreakdown categories={categories as Parameters<typeof CategoryBreakdown>[0]['categories']} />
            <ScoreTrend runs={runList} />
          </div>

          <FindingsTable
            key={selectedRunId ?? 'none'}
            findings={findings as Parameters<typeof FindingsTable>[0]['findings']}
            runId={selectedRunId ?? undefined}
          />
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
